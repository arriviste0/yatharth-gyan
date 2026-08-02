const router      = require('express').Router();
const Quest       = require('../models/Quest');
const requireAuth = require('../middleware/auth');
const levelEngine = require('../services/levelEngine');

/* GET /api/quests — list all quests for logged-in user */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, frequency } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (frequency) filter.frequency = frequency;

    const quests = await Quest.find(filter).sort({ createdAt: -1 });
    res.json({ quests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/quests — create a new quest */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, statKey, xpReward, statPoints, frequency, targetValue, unit, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Quest title is required' });
    }

    const quest = await Quest.create({
      userId: req.user._id,
      title: title.trim(),
      description: description || '',
      statKey: statKey || 'mind',
      xpReward: parseInt(xpReward, 10) || 250,
      statPoints: parseInt(statPoints, 10) || 1,
      frequency: frequency || 'daily',
      targetValue: parseFloat(targetValue) || 1,
      unit: unit || '',
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    res.status(201).json({ quest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* PUT /api/quests/:id/complete — mark quest complete and process XP */
router.put('/:id/complete', requireAuth, async (req, res) => {
  try {
    const result = await levelEngine.processQuestCompletion(req.user._id, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* PUT /api/quests/:id — update quest fields */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const quest = await Quest.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    res.json({ quest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE /api/quests/:id — delete quest */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const quest = await Quest.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
