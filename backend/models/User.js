const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  identifier: { type: String, required: true, unique: true },
  telegramChatId: { type: String, default: null },
  telegramUsername: { type: String, default: null },
  telegramConnected: { type: Boolean, default: false },
  telegramConnectedAt: { type: Date, default: null },
  telegramConnectionToken: { type: String, default: null },
  telegramConnectionTokenExpiresAt: { type: Date, default: null },
  emailNotificationsEnabled: { type: Boolean, default: true },
  telegramNotificationsEnabled: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
