const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    episodeNum: { type: Number, required: true },
    title:      { type: String, required: true },
    summary:    { type: String, default: '' },
    xpGained:   { type: Number, default: 0 },
    questsDone: { type: Number, default: 0 },
    loggedAt:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Episode', episodeSchema);
