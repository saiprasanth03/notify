const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendTelegramTestMessage } = require('../services/notifications/telegramService');

// @route   GET /api/telegram/token
// @desc    Generate a one-time connection token for Telegram
router.get('/token', protect, async (req, res) => {
  try {
    const token = 'WM-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // Expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60000);
    
    await User.findByIdAndUpdate(req.user._id, {
      telegramConnectionToken: token,
      telegramConnectionTokenExpiresAt: expiresAt
    });
    
    res.json({ token, expiresAt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating token' });
  }
});

// @route   POST /api/telegram/test
// @desc    Send a test notification
router.post('/test', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.telegramConnected || !user.telegramChatId) {
      return res.status(400).json({ message: 'Telegram is not connected' });
    }
    
    const success = await sendTelegramTestMessage(user.telegramChatId);
    
    if (success) {
      res.json({ message: 'Test notification sent successfully' });
    } else {
      res.status(500).json({ message: 'Unable to send Telegram notification. Please reconnect your Telegram account.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error sending test message' });
  }
});

// @route   POST /api/telegram/disconnect
// @desc    Disconnect Telegram account
router.post('/disconnect', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      telegramChatId: null,
      telegramUsername: null,
      telegramConnected: false,
      telegramConnectedAt: null,
      telegramConnectionToken: null,
      telegramConnectionTokenExpiresAt: null
    });
    
    // We should ideally also disable Telegram notifications on existing monitors
    // const Monitor = require('../models/Monitor');
    // await Monitor.updateMany({ userId: req.user._id }, { 'notificationMethods.telegram': false });
    
    res.json({ message: 'Telegram disconnected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error disconnecting Telegram' });
  }
});

module.exports = router;
