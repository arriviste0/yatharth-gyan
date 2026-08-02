const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const levelEngine = require('../services/levelEngine');

/* GET /api/system — get full System state (Stats, Rank, Titles, Penalties, Quests) */
router.get('/', requireAuth, async (req, res) => {
  try {
    const systemState = await levelEngine.getUserSystemState(req.user._id);
    res.json(systemState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
