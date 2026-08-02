const router      = require('express').Router();
const Stat        = require('../models/Stat');
const Title       = require('../models/Title');
const requireAuth = require('../middleware/auth');
const levelEngine = require('../services/levelEngine');

/* GET /api/stats — read-only fetch of user Stats, Level, Rank, & Titles */
router.get('/', requireAuth, async (req, res) => {
  try {
    const stats = await levelEngine.ensureUserStats(req.user._id);
    const overallLevel = levelEngine.calculateOverallLevel(stats);
    const rank = levelEngine.deriveRank(overallLevel);
    const titles = await Title.find({ userId: req.user._id });

    // Format stats with calculated XP to next level
    const formattedStats = stats.map((s) => {
      const xpNeeded = levelEngine.calculateXpNeeded(s.level + 1);
      const currentLevelXp = s.xp % (xpNeeded || 1);
      const pct = Math.min(100, Math.round((currentLevelXp / (xpNeeded || 1)) * 100));
      return {
        ...s.toObject(),
        xpNeeded,
        currentLevelXp,
        progressPct: pct,
      };
    });

    res.json({
      stats: formattedStats,
      overallLevel,
      rank,
      titles,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/stats/custom — add dynamic user custom stat (e.g. Wealth, Fitness, Creative) */
router.post('/custom', requireAuth, async (req, res) => {
  try {
    const { key, name, nameDevanagari, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Stat name is required' });
    }

    const statKey = (key || name).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existing = await Stat.findOne({ userId: req.user._id, key: statKey });
    if (existing) {
      return res.status(400).json({ error: 'Stat category already exists' });
    }

    const stat = await Stat.create({
      userId: req.user._id,
      key: statKey,
      name: name.trim(),
      nameDevanagari: nameDevanagari || '',
      color: color || '#00F0FF',
      isCustom: true,
      level: 1,
      xp: 0,
    });

    res.status(201).json({ stat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
