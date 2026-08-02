const mongoose = require('mongoose');

const questSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:        { type: String, required: true, trim: true },
    description:  { type: String, default: '' },
    statKey:      { type: String, default: 'mind' },
    xpReward:     { type: Number, default: 250 },
    statPoints:   { type: Number, default: 1 },
    frequency:    { type: String, enum: ['daily', 'weekly', 'one-time'], default: 'daily' },
    status:       { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
    targetValue:  { type: Number, default: 1 },
    currentValue: { type: Number, default: 0 },
    unit:         { type: String, default: '' },
    dueDate:      { type: Date, default: null },
    completedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quest', questSchema);
