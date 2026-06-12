import { todayKey, dateKey, daysBetween } from './dateUtils';

// A day is "complete" if ≥ 80% of daily targets are logged
export function isDayComplete(logs, pillars, dateStr) {
  const dayLog = logs[dateStr] || {};
  const dailyTargets = pillars.flatMap((p) =>
    p.targets.filter((t) => t.frequency === 'daily' || !t.frequency)
  );
  if (dailyTargets.length === 0) return false;
  let done = 0;
  for (const t of dailyTargets) {
    const entry = dayLog[t.id];
    if (entry && entry.done) done++;
  }
  return done / dailyTargets.length >= 0.8;
}

export function getDayCompletionRate(logs, pillars, dateStr) {
  const dayLog = logs[dateStr] || {};
  const dailyTargets = pillars.flatMap((p) =>
    p.targets.filter((t) => t.frequency === 'daily' || !t.frequency)
  );
  if (dailyTargets.length === 0) return 0;
  let done = 0;
  for (const t of dailyTargets) {
    const entry = dayLog[t.id];
    if (entry && entry.done) done++;
  }
  return done / dailyTargets.length;
}

export function getCurrentStreak(logs, pillars) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    if (isDayComplete(logs, pillars, key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getBestStreak(logs, pillars) {
  const sortedDays = Object.keys(logs).sort();
  if (!sortedDays.length) return 0;
  let best = 0;
  let current = 0;
  let prevKey = null;
  for (const key of sortedDays) {
    if (isDayComplete(logs, pillars, key)) {
      if (prevKey && daysBetween(prevKey, key) === 1) {
        current++;
      } else {
        current = 1;
      }
      if (current > best) best = current;
    } else {
      current = 0;
    }
    prevKey = key;
  }
  return best;
}

export function getPillarStreak(logs, pillar) {
  let streak = 0;
  const today = new Date();
  const targets = pillar.targets.filter((t) => t.frequency === 'daily' || !t.frequency);
  if (!targets.length) return 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const dayLog = logs[key] || {};
    let done = 0;
    for (const t of targets) {
      if (dayLog[t.id]?.done) done++;
    }
    if (done / targets.length >= 0.8) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getTodayCompletedCount(logs, pillars) {
  const today = todayKey();
  const dayLog = logs[today] || {};
  const dailyTargets = pillars.flatMap((p) =>
    p.targets.filter((t) => t.frequency === 'daily' || !t.frequency)
  );
  let done = 0;
  for (const t of dailyTargets) {
    if (dayLog[t.id]?.done) done++;
  }
  return { done, total: dailyTargets.length };
}

export function getTargetSuccessRate(logs, targetId, days = 30) {
  let successes = 0;
  let attempts = 0;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const entry = logs[key]?.[targetId];
    if (entry !== undefined) {
      attempts++;
      if (entry.done) successes++;
    }
  }
  return attempts > 0 ? successes / attempts : 0;
}

export function getMilestoneReached(streak) {
  const milestones = [30, 90, 180, 365];
  return milestones.includes(streak) ? streak : null;
}

export function getPhilosophicalInsight(pillar, currentRate, prevRate) {
  const diff = currentRate - prevRate;
  const pct = Math.round(currentRate * 100);
  const prevPct = Math.round(prevRate * 100);
  if (diff > 0) {
    return `You honoured ${pillar.sanskrit} ${pct}% this week. Last week it was ${prevPct}%. The body is learning. यतो धर्मस्ततो जयः — where there is dharma, there is victory.`;
  } else if (diff < 0) {
    return `You honoured ${pillar.sanskrit} ${pct}% this week. The river bends, but flows on. अभ्यासेन — continue tomorrow.`;
  }
  return `${pillar.sanskrit} holds steady at ${pct}%. Steadiness is its own kind of progress.`;
}
