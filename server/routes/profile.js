const router      = require('express').Router();
const User        = require('../models/User');
const requireAuth = require('../middleware/auth');

/* GET /api/profile */
router.get('/', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/* PUT /api/profile */
router.put('/', requireAuth, async (req, res) => {
  try {
    const { name, bio, avatarColor } = req.body;
    const updates = {};
    if (name        !== undefined) updates.name        = String(name).trim().slice(0, 60);
    if (bio         !== undefined) updates.bio         = String(bio).trim().slice(0, 200);
    if (avatarColor !== undefined) updates.avatarColor = String(avatarColor).slice(0, 20);

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* PUT /api/profile/password */
const bcrypt = require('bcryptjs');
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
