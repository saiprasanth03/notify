const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true, default: 'General Website' },
  description: { type: String, default: '' },
  identifier: { type: String, default: '' },
  frequency: { type: Number, required: true, default: 5 }, // in minutes
  notificationMethods: {
    telegram: { type: Boolean, default: false },
    email: { type: Boolean, default: true }
  },
  status: { type: String, enum: ['ACTIVE', 'PAUSED', 'TRIGGERED', 'ERROR'], default: 'ACTIVE' },
  lastCheckedAt: { type: Date, default: null },
  nextCheckAt: { type: Date, default: null },
  lastContentHash: { type: String, default: null },
  lastRelevantContent: { type: String, default: null },
  lastChangeDetectedAt: { type: Date, default: null },
  triggeredAt: { type: Date, default: null },
  errorCount: { type: Number, default: 0 },
  lastError: { type: String, default: null },
  allotmentResults: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Monitor', monitorSchema);
