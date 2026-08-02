const mongoose = require('mongoose');

const statSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key:            { type: String, required: true, trim: true },
    name:           { type: String, required: true, trim: true },
    nameDevanagari: { type: String, default: '' },
    level:          { type: Number, default: 1, min: 1 },
    xp:             { type: Number, default: 0, min: 0 },
    points:         { type: Number, default: 0, min: 0 },
    color:          { type: String, default: '#00F0FF' },
    isCustom:       { type: Boolean, default: false },
  },
  { timestamps: true }
);

statSchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Stat', statSchema);
