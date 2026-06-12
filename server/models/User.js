const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true, maxlength: 60 },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    googleId:     { type: String, default: null, index: true, sparse: true },
    avatarColor:  { type: String, default: '#E8843C' },
    avatarPhoto:  { type: String, default: null },
    bio:          { type: String, default: '', maxlength: 200 },
    streak:       { type: Number, default: 0 },
    joinedAt:     { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash) throw new Error('No password set — use Google sign-in for this account');
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
