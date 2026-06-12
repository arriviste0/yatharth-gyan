const mongoose = require('mongoose');

/* Stores the entire Dharma app state as a JSON blob per user.
   One document per user — we replace on each sync. */
const progressSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    data:      { type: mongoose.Schema.Types.Mixed, default: {} },
    syncedAt:  { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);
