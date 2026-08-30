const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { readData, writeData } = require('../store');
const { getBot } = require('../services/notifications/telegramService');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '30d' });
};

// @route   POST /api/auth/request-otp
// @desc    User enters phone/username. If linked, send OTP via Telegram. Else prompt to link.
router.post('/request-otp', async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ message: 'Identifier required' });

  let data = readData();
  
  // Clean up old OTPs
  data.otps = data.otps.filter(o => o.expiresAt > Date.now());

  const user = data.users.find(u => u.identifier === identifier);
  
  if (user && user.telegramChatId) {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    data.otps.push({
      identifier,
      otp,
      expiresAt: Date.now() + 10 * 60000 // 10 minutes
    });
    writeData(data);

    // Send OTP directly via bot
    const bot = getBot();
    if (bot) {
      bot.sendMessage(user.telegramChatId, `🔑 Your Login OTP is: *${otp}*`, { parse_mode: 'Markdown' });
      return res.json({ message: 'OTP sent to your Telegram app!' });
    }
  }

  // If new user or not linked, save a dummy OTP record so the bot can find the exact identifier they typed
  data.otps.push({
    identifier,
    otp: 'PENDING', // Dummy OTP
    expiresAt: Date.now() + 15 * 60000 // 15 minutes
  });
  writeData(data);

  // If new user or not linked, tell them to use the bot command
  res.json({ 
    message: `Please open the Telegram bot and send /login to verify your phone number.`,
    action: 'NEW_USER',
    botUsername: 'WatchMyWebNotifierBot' // Provide bot username
  });
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  const { identifier, otp } = req.body;
  let data = readData();

  const otpRecordIndex = data.otps.findIndex(o => o.identifier === identifier && o.otp === otp && o.expiresAt > Date.now());
  
  if (otpRecordIndex === -1) {
    return res.status(401).json({ message: 'Invalid or expired OTP' });
  }

  // OTP valid, remove it
  data.otps.splice(otpRecordIndex, 1);

  // Find or create user
  let user = data.users.find(u => u.identifier === identifier);
  if (!user) {
    user = {
      _id: crypto.randomUUID(),
      identifier,
      name: identifier, // default to identifier
      telegramChatId: null, // Will be linked when they use the bot
      createdAt: new Date().toISOString()
    };
    data.users.push(user);
  }

  writeData(data);

  res.json({
    _id: user._id,
    name: user.name,
    identifier: user.identifier,
    token: generateToken(user._id)
  });
});

// @route   GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

// @route   POST /api/auth/telegram/test
router.post('/telegram/test', protect, (req, res) => {
  const bot = getBot();
  if (bot && req.user.telegramChatId) {
    bot.sendMessage(req.user.telegramChatId, '🔔 *Test Notification*\n\nThis is a test notification from WatchMyWeb. Your Telegram connection is working perfectly!', { parse_mode: 'Markdown' });
    res.json({ message: 'Test notification sent' });
  } else {
    res.status(400).json({ message: 'Telegram not connected' });
  }
});

module.exports = router;
