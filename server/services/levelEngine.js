const Stat       = require('../models/Stat');
const Quest      = require('../models/Quest');
const PenaltyLog = require('../models/PenaltyLog');
const Title      = require('../models/Title');

/* Default Stat Categories */
const DEFAULT_STATS = [
  { key: 'mind',   name: 'Mind / Wisdom',     nameDevanagari: 'ज्ञान (ज्ञान)', color: '#A855F7' },
  { key: 'health', name: 'Health / Fitness',   nameDevanagari: 'साधना (स्वास्थ्य)', color: '#10B981' },
  { key: 'wealth', name: 'Wealth / Mastery',   nameDevanagari: 'धर्म (समृद्धि)', color: '#F59E0B' },
];

/* Rank Threshold Definitions */
const RANK_THRESHOLDS = [
  { rank: 'S', minLevel: 60, name: 'S-Rank', title: 'Monarch of Mind', titleDev: 'सत्य सम्राट', color: '#F59E0B' },
  { rank: 'A', minLevel: 40, name: 'A-Rank', title: 'Shadow Master', titleDev: 'तपोनिष्ठ ज्ञानी', color: '#A855F7' },
  { rank: 'B', minLevel: 25, name: 'B-Rank', title: 'Dharma Knight', titleDev: 'धर्म योद्धा', color: '#3B82F6' },
  { rank: 'C', minLevel: 12, name: 'C-Rank', title: 'Truth Collector', titleDev: 'सत्य अन्वेषक', color: '#06B6D4' },
  { rank: 'D', minLevel: 5,  name: 'D-Rank', title: 'Disciplined Seeker', titleDev: 'नियमनिष्ठ साधक', color: '#10B981' },
  { rank: 'E', minLevel: 1,  name: 'E-Rank', title: 'Awakened Initiate', titleDev: 'आरंभिक साधक', color: '#94A3B8' },
];

/**
 * XP Curve Function: Calculates total cumulative XP needed for level N
 * Formula: Math.floor(base * N^exponent)
 */
function calculateXpNeeded(level, base = 500, exponent = 1.5) {
  if (level <= 1) return 0;
  return Math.floor(base * Math.pow(level, exponent));
}

/**
 * Derive Rank based on overall level
 */
function deriveRank(level) {
  for (const tier of RANK_THRESHOLDS) {
    if (level >= tier.minLevel) {
      return tier;
    }
  }
  return RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
}

/**
 * Overall Player Level Tradeoff Rationale:
 * We calculate Overall Level as the Average of the player's core Stat Levels rounded down.
 * Tradeoff: Averaging enforces balanced real-life growth (Mind + Health + Wealth).
 * Maxing out one stat alone won't trigger high rank promotions unless other core stats are elevated.
 */
function calculateOverallLevel(statsList) {
  if (!statsList || statsList.length === 0) return 1;
  const totalLevels = statsList.reduce((sum, s) => sum + (s.level || 1), 0);
  return Math.max(1, Math.floor(totalLevels / statsList.length));
}

/**
 * Ensure default stats exist for a user
 */
async function ensureUserStats(userId) {
  const existing = await Stat.find({ userId });
  if (existing.length === 0) {
    const created = await Promise.all(
      DEFAULT_STATS.map((ds) =>
        Stat.create({
          userId,
          key: ds.key,
          name: ds.name,
          nameDevanagari: ds.nameDevanagari,
          color: ds.color,
          level: 1,
          xp: 0,
        })
      )
    );
    return created;
  }
  return existing;
}

/**
 * Award Quest XP and handle stat / overall level ups
 */
async function processQuestCompletion(userId, questId) {
  const quest = await Quest.findOne({ _id: questId, userId });
  if (!quest) throw new Error('Quest not found');
  if (quest.status === 'completed') return { quest, leveledUp: false };

  quest.status = 'completed';
  quest.completedAt = new Date();
  await quest.save();

  // Find or create linked stat
  let stat = await Stat.findOne({ userId, key: quest.statKey });
  if (!stat) {
    stat = await Stat.create({
      userId,
      key: quest.statKey,
      name: quest.statKey.toUpperCase(),
      level: 1,
      xp: 0,
    });
  }

  const oldStatLevel = stat.level;
  stat.xp += quest.xpReward;
  stat.points += quest.statPoints || 1;

  // Check stat level up
  let xpNext = calculateXpNeeded(stat.level + 1);
  let leveledUp = false;
  while (stat.xp >= xpNext && xpNext > 0) {
    stat.level += 1;
    leveledUp = true;
    xpNext = calculateXpNeeded(stat.level + 1);
  }
  await stat.save();

  // Recalculate overall player level & rank
  const allStats = await Stat.find({ userId });
  const overallLevel = calculateOverallLevel(allStats);
  const currentRank = deriveRank(overallLevel);

  // Sync title
  await Title.findOneAndUpdate(
    { userId, titleKey: currentRank.rank },
    {
      userId,
      titleKey: currentRank.rank,
      name: currentRank.title,
      nameDevanagari: currentRank.titleDev,
      rankRequired: currentRank.rank,
      isEquipped: true,
    },
    { upsert: true }
  );

  return {
    quest,
    stat,
    statLeveledUp: stat.level > oldStatLevel,
    overallLevel,
    rank: currentRank,
  };
}

/**
 * Scan for missed quests past due date and log penalties
 */
async function checkMissedQuests(userId) {
  const now = new Date();
  const missed = await Quest.find({
    userId,
    status: 'active',
    dueDate: { $ne: null, $lt: now },
  });

  const penaltyLogs = [];
  for (const q of missed) {
    q.status = 'failed';
    await q.save();

    const log = await PenaltyLog.create({
      userId,
      questId: q._id,
      reason: `Missed Quest Deadline: "${q.title}"`,
      penaltyType: 'MANA_DEDUCTION',
      xpDeducted: 100,
    });
    penaltyLogs.push(log);
  }

  return penaltyLogs;
}

/**
 * Get complete System State for User (Stats, Overall Level, Rank, Titles, Penalties)
 */
async function getUserSystemState(userId) {
  const stats = await ensureUserStats(userId);
  await checkMissedQuests(userId);

  const overallLevel = calculateOverallLevel(stats);
  const currentRank = deriveRank(overallLevel);
  const titles = await Title.find({ userId });
  const penalties = await PenaltyLog.find({ userId }).sort({ loggedAt: -1 }).limit(10);
  const quests = await Quest.find({ userId }).sort({ createdAt: -1 });

  return {
    stats,
    overallLevel,
    rank: currentRank,
    titles,
    penalties,
    quests,
  };
}

module.exports = {
  calculateXpNeeded,
  calculateOverallLevel,
  deriveRank,
  ensureUserStats,
  processQuestCompletion,
  checkMissedQuests,
  getUserSystemState,
  RANK_THRESHOLDS,
};
