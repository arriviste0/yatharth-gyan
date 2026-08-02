const mongoose = require('mongoose');

const penaltyLogSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Quest', default: null },
    reason:      { type: String, required: true },
    penaltyType: { type: String, default: 'MANA_DEDUCTION' },
    xpDeducted:  { type: Number, default: 100 },
    loggedAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PenaltyLog', penaltyLogSchema);
