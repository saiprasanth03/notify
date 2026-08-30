const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
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

  try {
    const user = await User.findOne({ identifier });
    
    if (user && user.telegramChatId) {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      await Otp.create({
        identifier,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60000) // 10 minutes
      });

      // Send OTP directly via bot
      const bot = getBot();
      if (bot) {
        bot.sendMessage(user.telegramChatId, `🔑 Your Login OTP is: *${otp}*`, { parse_mode: 'Markdown' });
        return res.json({ message: 'OTP sent to your Telegram app!' });
      }
    }

    // If new user or not linked, save a dummy OTP record so the bot can find the exact identifier they typed
    await Otp.create({
      identifier,
      otp: 'PENDING', // Dummy OTP
      expiresAt: new Date(Date.now() + 15 * 60000) // 15 minutes
    });

    // If new user or not linked, tell them to use the bot command
    res.json({ 
      message: `Please open the Telegram bot and send /login to verify your phone number.`,
      action: 'NEW_USER',
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'NotifierWebsite_bot' // Provide bot username
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  const { identifier, otp } = req.body;
  
  try {
    const otpRecord = await Otp.findOne({ 
      identifier, 
      otp,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otpRecord) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // OTP valid, remove it
    await Otp.deleteOne({ _id: otpRecord._id });

    // Find or create user
    let user = await User.findOne({ identifier });
    if (!user) {
      user = await User.create({
        identifier,
        name: identifier
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      identifier: user.identifier,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
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
