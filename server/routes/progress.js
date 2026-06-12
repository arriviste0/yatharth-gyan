const router      = require('express').Router();
const Progress    = require('../models/Progress');
const requireAuth = require('../middleware/auth');

/* GET /api/progress — load cloud data */
router.get('/', requireAuth, async (req, res) => {
  try {
    const doc = await Progress.findOne({ userId: req.user._id });
    res.json({ data: doc ? doc.data : null, syncedAt: doc?.syncedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* PUT /api/progress — save / replace cloud data */
router.put('/', requireAuth, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'data object is required' });
    }
    const doc = await Progress.findOneAndUpdate(
      { userId: req.user._id },
      { data, syncedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ syncedAt: doc.syncedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE /api/progress — wipe cloud data */
router.delete('/', requireAuth, async (req, res) => {
  try {
    await Progress.deleteOne({ userId: req.user._id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
