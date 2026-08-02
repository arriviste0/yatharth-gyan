const mongoose = require('mongoose');

const titleSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    titleKey:       { type: String, required: true },
    name:           { type: String, required: true },
    nameDevanagari: { type: String, default: '' },
    rankRequired:   { type: String, enum: ['E', 'D', 'C', 'B', 'A', 'S'], default: 'E' },
    isEquipped:     { type: Boolean, default: false },
    unlockedAt:     { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Title', titleSchema);
