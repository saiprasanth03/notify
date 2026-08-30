const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  monitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Monitor', required: true },
  type: { type: String, required: true }, // e.g., 'Email', 'Telegram', 'Email+Telegram'
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['SENT', 'FAILED'], default: 'SENT' },
  error: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
