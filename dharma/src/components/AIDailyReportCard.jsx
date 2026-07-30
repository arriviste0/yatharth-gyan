import { useState, useMemo } from 'react';
import { Sparkles, CheckCircle2, Zap, RefreshCw, Trophy, AlertCircle, ArrowRight, BarChart2, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { todayKey, formatDateDisplay, dateKey } from '../utils/dateUtils';
import { getDailyReportAI } from '../api/ai';

const CHART_COLORS = ['#F05A36', '#14B8A6', '#E6A04E', '#8B5CF6', '#3B82F6', '#EC4899', '#10B981'];

function TimeFilterControl({ timeFilter, setTimeFilter, customDays, setCustomDays, isOverlay = false }) {
  const baseClasses = isOverlay
    ? 'bg-white/10 border-white/20'
    : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10';
  const activeClasses = 'bg-accent text-white shadow-sm';
  const inactiveClasses = isOverlay
    ? 'text-white/70 hover:text-white'
    : 'text-stone-500 dark:text-stone-400 hover:text-[#18191E] dark:hover:text-white';

  const presets = [
    { id: 'today', label: 'Today' },
    { id: '7day', label: '7D' },
    { id: '30day', label: '30D' },
    { id: '90day', label: '90D' },
    { id: 'allTime', label: 'All' },
  ];

  return (
    <div className={`inline-flex items-center p-1 rounded-2xl border text-[11px] font-extrabold flex-wrap gap-0.5 ${baseClasses}`}>
      {presets.map((tf) => (
        <button
          key={tf.id}
          type="button"
          onClick={(e) => { e.stopPropagation(); setTimeFilter(tf.id); }}
          className={`px-2.5 py-1 rounded-xl transition-all ${timeFilter === tf.id ? activeClasses : inactiveClasses}`}
        >
          {tf.label}
        </button>
      ))}

      {/* Custom toggle + inline stepper */}
      {timeFilter !== 'custom' ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setTimeFilter('custom'); }}
          className={`px-2.5 py-1 rounded-xl transition-all ${inactiveClasses}`}
        >
          Custom
        </button>
      ) : (
        <div className="flex items-center gap-0 bg-accent rounded-xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCustomDays(Math.max(1, customDays - 1)); }}
            className="px-1.5 py-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors font-bold"
          >
            −
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={customDays}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v) && v >= 1 && v <= 365) setCustomDays(v);
              else if (e.target.value === '') setCustomDays(1);
            }}
            className="w-7 bg-transparent text-white text-center outline-none font-extrabold text-[11px] py-1 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-white/60 text-[9px] pr-1 font-bold">d</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCustomDays(Math.min(365, customDays + 1)); }}
            className="px-1.5 py-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors font-bold"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default function AIDailyReportCard() {
  const { state } = useStorage();
  const pillars = state.pillars || [];
  const logs = state.logs || {};
  const metrics = state.metrics || {};
  const goals = state.goals || [];
  const today = todayKey();
  const dayLog = logs[today] || {};
  const dayMetrics = metrics[today] || {};

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState(null);
  const [timeFilter, setTimeFilter] = useState('today'); // 'today' | '7day' | '30day' | '90day' | 'allTime' | 'custom'
  const [customDays, setCustomDays] = useState(14);

  const allLogKeys = useMemo(() => {
    const keys = new Set([...Object.keys(logs), ...Object.keys(metrics)]);
    return Array.from(keys);
  }, [logs, metrics]);

  const totalAllTimeDays = useMemo(() => {
    if (allLogKeys.length === 0) return 1;
    const timestamps = allLogKeys.map(k => new Date(k).getTime()).filter(t => !isNaN(t));
    if (timestamps.length === 0) return 1;
    const minTime = Math.min(...timestamps);
    const nowTime = new Date().getTime();
    const diffDays = Math.max(1, Math.ceil((nowTime - minTime) / (1000 * 60 * 60 * 24)));
    return diffDays;
  }, [allLogKeys]);

  // Dynamic payload focusing on high-level KPIs for Today, 7D, 30D, 90D, All-Time, or Custom Days
  const dailyPayload = useMemo(() => {
    const items = [];
    const d = new Date();
    const daysRange = timeFilter === 'today' ? 1
      : timeFilter === '7day' ? 7
      : timeFilter === '30day' ? 30
      : timeFilter === '90day' ? 90
      : timeFilter === 'allTime' ? totalAllTimeDays
      : Math.max(1, parseInt(customDays) || 14);

    const periodLabel = timeFilter === 'today' ? 'Today'
      : timeFilter === '7day' ? '7-Day Average'
      : timeFilter === '30day' ? '30-Day Average'
      : timeFilter === '90day' ? '90-Day Average'
      : timeFilter === 'allTime' ? `All-Time (${daysRange}d Avg)`
      : `${daysRange}-Day Average`;

    // Helper: Safely parse numbers
    const safeParseNumber = (val) => {
      if (val === null || val === undefined || typeof val === 'boolean') return NaN;
      if (typeof val === 'string' && val.includes(':')) return NaN;
      const num = parseFloat(val);
      return isNaN(num) ? NaN : num;
    };

    // Helper to get average/sum for a target over N days
    const getMetricValForDays = (targetMatcher, metricKey, goalDefault, isMl = false) => {
      let goal = goalDefault;
      let targetObj = null;

      for (const p of pillars) {
        for (const t of p.targets) {
          if (targetMatcher(t, p)) {
            targetObj = t;
            break;
          }
        }
        if (targetObj) break;
      }

      if (targetObj) {
        const tv = safeParseNumber(targetObj.targetValue);
        if (!isNaN(tv) && tv > 0) {
          goal = (isMl || targetObj.unit === 'ml' || tv > 20) ? +(tv / 1000).toFixed(1) : tv;
        }
      }

      let totalSum = 0;
      let activeDaysCount = 0;

      for (let i = 0; i < daysRange; i++) {
        const dd = new Date(d);
        dd.setDate(d.getDate() - i);
        const key = dateKey(dd);
        const pastLog = logs[key] || {};
        const pastMetric = metrics[key] || {};
        let dayVal = null;

        let subSum = 0;
        Object.values(pastLog).forEach(entry => {
          if (entry?.subValues) {
            Object.entries(entry.subValues).forEach(([k, v]) => {
              if (targetMatcher({ name: k, unit: '' }, {})) {
                const num = safeParseNumber(v);
                if (!isNaN(num)) subSum += num;
              }
            });
          }
        });

        if (subSum > 0) {
          dayVal = subSum;
        } else if (targetObj && pastLog[targetObj.id]?.value != null) {
          const v = safeParseNumber(pastLog[targetObj.id].value);
          if (!isNaN(v)) {
            dayVal = (isMl || targetObj.unit === 'ml' || v > 20) ? v / 1000 : v;
          } else if (pastLog[targetObj.id]?.done) {
            dayVal = goal;
          }
        } else if (metricKey && pastMetric[metricKey]) {
          const m = safeParseNumber(pastMetric[metricKey]);
          if (!isNaN(m)) dayVal = (isMl && m >= 1000) ? m / 1000 : m;
        } else if (targetObj && pastLog[targetObj.id]?.done) {
          dayVal = goal;
        }

        if (dayVal !== null && !isNaN(dayVal)) {
          totalSum += dayVal;
          activeDaysCount++;
        }
      }

      const calculatedVal = daysRange === 1
        ? totalSum
        : (activeDaysCount > 0 ? totalSum / activeDaysCount : 0);

      return {
        value: typeof calculatedVal === 'number' && calculatedVal % 1 !== 0 ? +calculatedVal.toFixed(1) : Math.round(calculatedVal),
        goal,
        activeDays: activeDaysCount,
      };
    };

    // Helper: match by aiCategory first, then fall back to name/unit keywords
    const matchCat = (t, catId, nameKeywords = [], unitKeywords = []) =>
      (t.aiCategory && t.aiCategory === catId) ||
      nameKeywords.some(kw => (t.name || '').toLowerCase().includes(kw)) ||
      unitKeywords.some(kw => (t.unit || '').toLowerCase() === kw);

    // 1. Water / Hydration
    const waterData = getMetricValForDays(
      (t) => matchCat(t, 'water', ['water', 'jal', 'hydration', 'paani'], ['l', 'ml']),
      'water', 3.0, true
    );
    items.push({
      category: 'Hydration',
      name: timeFilter === 'today' ? 'Water Intake' : 'Avg Water',
      value: waterData.value,
      unit: daysRange > 1 ? 'L/day' : 'L',
      goal: waterData.goal,
      pct: waterData.goal > 0 ? Math.min(100, Math.round((waterData.value / waterData.goal) * 100)) : 0,
    });

    // 2. Protein
    const proteinData = getMetricValForDays(
      (t) => matchCat(t, 'protein', ['protein', 'prot', 'प्रोटीन'], []),
      'protein', 90, false
    );
    items.push({
      category: 'Nutrition',
      name: timeFilter === 'today' ? 'Protein Intake' : 'Avg Protein',
      value: proteinData.value,
      unit: daysRange > 1 ? 'g/day' : 'g',
      goal: proteinData.goal,
      pct: proteinData.goal > 0 ? Math.min(100, Math.round((proteinData.value / proteinData.goal) * 100)) : 0,
    });

    // 3. Sleep & Rest
    const sleepData = getMetricValForDays(
      (t) => matchCat(t, 'sleep', ['sleep', 'नींद', 'nidra', 'rest', 'सोना'], ['hr', 'hours', 'hrs']),
      'sleep', 8.0, false
    );
    items.push({
      category: 'Sleep',
      name: timeFilter === 'today' ? 'Sleep & Rest' : 'Avg Sleep',
      value: sleepData.value,
      unit: daysRange > 1 ? 'hr/day' : 'hr',
      goal: sleepData.goal,
      pct: sleepData.goal > 0 ? Math.min(100, Math.round((sleepData.value / sleepData.goal) * 100)) : 0,
    });

    // 4. Workout / Exercise
    const workoutData = getMetricValForDays(
      (t) => matchCat(t, 'workout', ['workout', 'gym', 'exercise', 'vyayama', 'व्यायाम', 'train'], ['min', 'mins', 'minutes']),
      'workout', 45, false
    );
    items.push({
      category: 'Exercise',
      name: timeFilter === 'today' ? 'Workout Time' : 'Avg Workout',
      value: workoutData.value,
      unit: daysRange > 1 ? 'min/day' : 'min',
      goal: workoutData.goal,
      pct: workoutData.goal > 0 ? Math.min(100, Math.round((workoutData.value / workoutData.goal) * 100)) : 0,
    });

    // 5. Tasks Completed
    const allDailyTargets = pillars.flatMap((p) => p.targets.filter((t) => t.frequency === 'daily' || !t.frequency));
    const totalGoal = allDailyTargets.length;
    let tasksSum = 0;
    let periodRatesSum = 0;

    for (let i = 0; i < daysRange; i++) {
      const dd = new Date(d);
      dd.setDate(d.getDate() - i);
      const key = dateKey(dd);
      const pastLog = logs[key] || {};
      const doneC = allDailyTargets.filter(t => pastLog[t.id]?.done).length;
      tasksSum += doneC;
      if (totalGoal > 0) periodRatesSum += (doneC / totalGoal);
    }

    const avgTasksPerDay = daysRange > 1 ? +(tasksSum / daysRange).toFixed(1) : tasksSum;
    const avgCompletionPct = daysRange > 1
      ? Math.round((periodRatesSum / daysRange) * 100)
      : (totalGoal > 0 ? Math.round((tasksSum / totalGoal) * 100) : 0);

    items.push({
      category: 'Practice',
      name: timeFilter === 'today' ? 'Tasks Done' : 'Avg Tasks/Day',
      value: avgTasksPerDay,
      unit: 'tasks',
      goal: totalGoal,
      pct: totalGoal > 0 ? Math.min(100, Math.round((avgTasksPerDay / totalGoal) * 100)) : 0,
    });

    // 6. Completion Rate %
    items.push({
      category: 'Practice',
      name: 'Completion Rate',
      value: `${avgCompletionPct}%`,
      unit: '%',
      goal: 100,
      pct: avgCompletionPct,
    });

    // 7. Active Logging Days
    const loggedDays = Math.max(1, waterData.activeDays || (daysRange === 1 ? (totalGoal > 0 ? 1 : 0) : Math.min(daysRange, Math.round(daysRange * (avgCompletionPct / 100 || 0.8)))));
    items.push({
      category: 'Consistency',
      name: 'Active Days',
      value: `${loggedDays}/${daysRange}`,
      unit: 'days',
      goal: daysRange,
      pct: Math.round((loggedDays / daysRange) * 100),
    });

    return {
      date: today,
      period: timeFilter,
      periodLabel,
      items,
      goals: goals.map(g => ({
        name: g.name,
        value: g.value,
        unit: g.unit,
        direction: g.direction,
        deadline: g.deadline,
        notes: g.notes,
      })),
      // expose raw daily series for insight engine
      _rawDailySeries: (() => {
        const series = [];
        for (let i = 0; i < daysRange; i++) {
          const dd = new Date(d);
          dd.setDate(d.getDate() - i);
          const key = dateKey(dd);
          const pl = logs[key] || {};
          const pm = metrics[key] || {};
          const allT = pillars.flatMap(p => p.targets.filter(t => t.frequency === 'daily' || !t.frequency));
          const doneCount = allT.filter(t => pl[t.id]?.done).length;
          series.push({ key, doneCount, totalTargets: allT.length, log: pl, metric: pm });
        }
        return series;
      })(),
    };
  }, [pillars, dayLog, dayMetrics, logs, metrics, goals, today, timeFilter, totalAllTimeDays, customDays]);

  // ═══════════════════════════════════════════════════════════════
  // 🎯 GOAL PROGRESS — compute logged progress vs user-set goals
  // ═══════════════════════════════════════════════════════════════
  const goalProgress = useMemo(() => {
    if (!goals || goals.length === 0) return [];
    const allTargets = pillars.flatMap(p => p.targets);
    const d = new Date();
    const daysRange = timeFilter === 'today' ? 1
      : timeFilter === '7day' ? 7
      : timeFilter === '30day' ? 30
      : timeFilter === '90day' ? 90
      : timeFilter === 'allTime' ? totalAllTimeDays
      : Math.max(1, parseInt(customDays) || 14);

    return goals.map(goal => {
      // Find linked pillar target
      const linkedTarget = goal.pillarTargetId ? allTargets.find(t => t.id === goal.pillarTargetId) : null;

      let loggedValue = null;

      if (linkedTarget) {
        // Sum/avg logged values over period
        let totalSum = 0;
        let activeDays = 0;
        for (let i = 0; i < daysRange; i++) {
          const dd = new Date(d);
          dd.setDate(d.getDate() - i);
          const key = dateKey(dd);
          const pastLog = logs[key] || {};
          const entry = pastLog[linkedTarget.id];
          if (entry?.value != null) {
            const n = parseFloat(entry.value);
            if (!isNaN(n)) { totalSum += n; activeDays++; }
          } else if (entry?.done) {
            totalSum += goal.value; // treat as full if done with no value
            activeDays++;
          }
        }
        if (activeDays > 0) {
          loggedValue = daysRange === 1 ? +totalSum.toFixed(1) : +(totalSum / activeDays).toFixed(1);
        }
      }

      // Compute progress %
      let pct = 0;
      if (loggedValue !== null && goal.value > 0) {
        if (goal.direction === 'lte') {
          // Lower is better — 100% if at or below goal, scales down above
          pct = loggedValue <= goal.value ? 100 : Math.round((goal.value / loggedValue) * 100);
        } else if (goal.direction === 'eq') {
          const diff = Math.abs(loggedValue - goal.value);
          pct = Math.round(Math.max(0, 100 - (diff / goal.value) * 100));
        } else {
          // gte — more is better
          pct = Math.min(100, Math.round((loggedValue / goal.value) * 100));
        }
      }

      const status = pct >= 100 ? 'achieved' : pct >= 75 ? 'close' : pct >= 40 ? 'progress' : 'start';
      const statusColor = status === 'achieved' ? '#10B981' : status === 'close' ? '#3B82F6' : status === 'progress' ? '#E6A04E' : '#F05A36';

      const daysLeft = goal.deadline
        ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000)
        : null;

      return {
        ...goal,
        loggedValue,
        pct,
        status,
        statusColor,
        daysLeft,
        linkedTarget,
      };
    });
  }, [goals, pillars, logs, timeFilter, totalAllTimeDays, customDays]);

  // ═══════════════════════════════════════════════════════════════
  // 🧬 DHARMA SCORE™ — Holistic 0-100 composite wellness score
  // ═══════════════════════════════════════════════════════════════
  const dharmaScore = useMemo(() => {
    const kpiItems = dailyPayload.items.filter(i => typeof i.pct === 'number');
    if (kpiItems.length === 0) return { score: 0, grade: 'F', color: '#EF4444', label: 'No Data' };

    // Weighted categories
    const weights = { Sleep: 22, Practice: 20, Hydration: 18, Nutrition: 18, Exercise: 15, Consistency: 7 };
    let weightedSum = 0;
    let totalWeight = 0;

    kpiItems.forEach(item => {
      const w = weights[item.category] || 10;
      weightedSum += item.pct * w;
      totalWeight += w;
    });

    // Balance bonus: reward well-rounded performance (low variance across KPIs)
    const avgPct = kpiItems.reduce((s, i) => s + i.pct, 0) / kpiItems.length;
    const variance = kpiItems.reduce((s, i) => s + Math.pow(i.pct - avgPct, 2), 0) / kpiItems.length;
    const balanceBonus = Math.max(0, 5 - Math.round(Math.sqrt(variance) / 5));

    const raw = totalWeight > 0 ? Math.round(weightedSum / totalWeight) + balanceBonus : 0;
    const score = Math.min(100, Math.max(0, raw));

    const grade = score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
    const color = score >= 90 ? '#10B981' : score >= 80 ? '#14B8A6' : score >= 70 ? '#3B82F6' : score >= 55 ? '#E6A04E' : score >= 40 ? '#F05A36' : '#EF4444';
    const label = score >= 90 ? 'Exceptional' : score >= 80 ? 'Excellent' : score >= 70 ? 'Strong' : score >= 55 ? 'Developing' : score >= 40 ? 'Needs Focus' : 'Getting Started';

    return { score, grade, color, label };
  }, [dailyPayload]);

  // ═══════════════════════════════════════════════════════════════
  // 🔗 HIDDEN PATTERN CORRELATIONS — Cross-metric discovery
  // ═══════════════════════════════════════════════════════════════
  const patternInsights = useMemo(() => {
    const series = dailyPayload._rawDailySeries || [];
    if (series.length < 3) return [];

    const insights = [];
    const safeNum = (val) => {
      if (val === null || val === undefined || typeof val === 'boolean') return null;
      if (typeof val === 'string' && val.includes(':')) return null;
      const n = parseFloat(val);
      return isNaN(n) ? null : n;
    };

    // Build daily metric vectors
    const dailyVectors = series.map(day => {
      const vec = { completion: day.totalTargets > 0 ? Math.round((day.doneCount / day.totalTargets) * 100) : 0 };

      // Extract numeric values from log entries
      Object.entries(day.log).forEach(([tid, entry]) => {
        if (!entry || typeof entry !== 'object') return;
        const target = pillars.flatMap(p => p.targets).find(t => t.id === tid);
        if (!target) return;
        const name = (target.name || '').toLowerCase();
        if (name.includes('water') || name.includes('jal')) {
          const v = safeNum(entry.value);
          if (v !== null) vec.water = v;
          else if (entry.done) vec.water = 1;
        } else if (name.includes('sleep')) {
          const v = safeNum(entry.value);
          if (v !== null && v <= 16) vec.sleep = v;
          else if (entry.done) vec.sleep = 1;
        } else if (name.includes('protein') || name.includes('prot')) {
          const v = safeNum(entry.value);
          if (v !== null) vec.protein = v;
        } else if (name.includes('workout') || name.includes('exercise') || name.includes('gym')) {
          const v = safeNum(entry.value);
          if (v !== null) vec.workout = v;
          else if (entry.done) vec.workout = 1;
        }
      });

      // Day of week (0=Sun, 6=Sat)
      const dt = new Date(day.key);
      vec.isWeekend = dt.getDay() === 0 || dt.getDay() === 6;

      return vec;
    });

    // Correlation: Sleep → Task Completion
    const withSleep = dailyVectors.filter(v => v.sleep !== undefined);
    if (withSleep.length >= 3) {
      const median = withSleep.map(v => v.sleep).sort((a, b) => a - b)[Math.floor(withSleep.length / 2)];
      const highSleep = withSleep.filter(v => v.sleep >= median);
      const lowSleep = withSleep.filter(v => v.sleep < median);
      if (highSleep.length > 0 && lowSleep.length > 0) {
        const avgHigh = Math.round(highSleep.reduce((s, v) => s + v.completion, 0) / highSleep.length);
        const avgLow = Math.round(lowSleep.reduce((s, v) => s + v.completion, 0) / lowSleep.length);
        if (Math.abs(avgHigh - avgLow) >= 8) {
          insights.push({
            emoji: '😴',
            icon: 'sleep',
            title: 'Sleep ↔ Productivity',
            text: `When you sleep ${median}+ hrs, task completion is ${avgHigh}% vs ${avgLow}% on lighter sleep nights`,
            impact: avgHigh > avgLow ? 'positive' : 'warning',
          });
        }
      }
    }

    // Correlation: Water → Workout
    const withWater = dailyVectors.filter(v => v.water !== undefined && v.workout !== undefined);
    if (withWater.length >= 3) {
      const medianW = withWater.map(v => v.water).sort((a, b) => a - b)[Math.floor(withWater.length / 2)];
      const highW = withWater.filter(v => v.water >= medianW);
      const lowW = withWater.filter(v => v.water < medianW);
      if (highW.length > 0 && lowW.length > 0) {
        const avgHighWk = Math.round(highW.reduce((s, v) => s + (v.workout || 0), 0) / highW.length);
        const avgLowWk = Math.round(lowW.reduce((s, v) => s + (v.workout || 0), 0) / lowW.length);
        if (Math.abs(avgHighWk - avgLowWk) >= 5) {
          insights.push({
            emoji: '💧',
            icon: 'water',
            title: 'Hydration ↔ Exercise',
            text: `Days with higher water intake correlate with ${avgHighWk > avgLowWk ? 'longer' : 'shorter'} workouts (${avgHighWk} vs ${avgLowWk} min)`,
            impact: avgHighWk > avgLowWk ? 'positive' : 'neutral',
          });
        }
      }
    }

    // Weekend vs Weekday pattern
    const weekdays = dailyVectors.filter(v => !v.isWeekend);
    const weekends = dailyVectors.filter(v => v.isWeekend);
    if (weekdays.length >= 2 && weekends.length >= 1) {
      const avgWd = Math.round(weekdays.reduce((s, v) => s + v.completion, 0) / weekdays.length);
      const avgWe = Math.round(weekends.reduce((s, v) => s + v.completion, 0) / weekends.length);
      if (Math.abs(avgWd - avgWe) >= 10) {
        insights.push({
          emoji: '📅',
          icon: 'calendar',
          title: 'Weekday vs Weekend',
          text: avgWd > avgWe
            ? `Your completion rate drops ${avgWd - avgWe}% on weekends (${avgWe}%) vs weekdays (${avgWd}%)`
            : `You're actually ${avgWe - avgWd}% more productive on weekends (${avgWe}%) than weekdays (${avgWd}%)`,
          impact: avgWd > avgWe ? 'warning' : 'positive',
        });
      }
    }

    // Streak analysis
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    for (const day of series) {
      const rate = day.totalTargets > 0 ? day.doneCount / day.totalTargets : 0;
      if (rate >= 0.5) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        if (currentStreak === 0 || tempStreak === currentStreak + 1) currentStreak = tempStreak;
      } else {
        if (currentStreak > 0 && tempStreak < currentStreak) { /* streak already broken */ }
        tempStreak = 0;
      }
    }
    // Re-calculate current streak from today backwards
    currentStreak = 0;
    for (const day of series) {
      if (day.totalTargets > 0 && day.doneCount / day.totalTargets >= 0.5) currentStreak++;
      else break;
    }
    if (longestStreak >= 2 || currentStreak >= 2) {
      insights.push({
        emoji: '🔥',
        icon: 'streak',
        title: 'Consistency Streak',
        text: currentStreak >= 2
          ? `You're on a ${currentStreak}-day streak! Longest: ${longestStreak} days in this period`
          : `Best streak: ${longestStreak} consecutive days of 50%+ completion`,
        impact: currentStreak >= 3 ? 'positive' : 'neutral',
      });
    }

    return insights.slice(0, 4);
  }, [dailyPayload, pillars]);

  // ═══════════════════════════════════════════════════════════════
  // 🔮 TOMORROW'S PREDICTION — Trend-based forecasting
  // ═══════════════════════════════════════════════════════════════
  const predictions = useMemo(() => {
    const series = dailyPayload._rawDailySeries || [];
    if (series.length < 3) return null;

    // Use last 5 days (or available) for trend
    const trendDays = Math.min(5, series.length);
    const recentSeries = series.slice(0, trendDays);

    // Completion rate trend
    const completionRates = recentSeries.map(d => d.totalTargets > 0 ? Math.round((d.doneCount / d.totalTargets) * 100) : 0);
    const avgCompletion = Math.round(completionRates.reduce((s, v) => s + v, 0) / completionRates.length);

    // Simple linear trend: compare first half vs second half
    const firstHalf = completionRates.slice(Math.floor(completionRates.length / 2));
    const secondHalf = completionRates.slice(0, Math.floor(completionRates.length / 2));
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length : 0;

    const trend = secondAvg - firstAvg; // positive = improving
    const predictedCompletion = Math.min(100, Math.max(0, Math.round(avgCompletion + trend * 0.5)));

    // Confidence based on variance
    const variance = completionRates.reduce((s, v) => s + Math.pow(v - avgCompletion, 2), 0) / completionRates.length;
    const stdDev = Math.sqrt(variance);
    const confidence = stdDev < 10 ? 'High' : stdDev < 25 ? 'Medium' : 'Low';
    const confidenceColor = confidence === 'High' ? '#10B981' : confidence === 'Medium' ? '#E6A04E' : '#EF4444';

    const trendDirection = trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'steady';
    const trendEmoji = trend > 5 ? '📈' : trend < -5 ? '📉' : '➡️';

    return {
      predictedCompletion,
      confidence,
      confidenceColor,
      trendDirection,
      trendEmoji,
      avgRecent: avgCompletion,
    };
  }, [dailyPayload]);

  // Recharts Data
  const barChartData = useMemo(() => {
    return dailyPayload.items.map(item => ({
      name: item.name,
      pct: item.pct,
      value: `${item.value} ${item.unit} (Target: ${item.goal})`,
    }));
  }, [dailyPayload]);

  const pieChartData = useMemo(() => {
    return dailyPayload.items.map(item => ({
      name: item.name,
      value: item.pct || 5,
    }));
  }, [dailyPayload]);

  // Clean structured parser for report text
  const parsedSections = useMemo(() => {
    if (!reportText) return null;

    const rawLines = reportText.split('\n').map(l => l.trim()).filter(Boolean);
    let summary = null;
    let categoryItems = [];
    let goalProgressLines = [];
    let bestWin = null;
    let worthAttention = null;
    let tomorrowTips = [];

    let currentMode = null;

    rawLines.forEach((line) => {
      // Remove raw markdown symbols, leading digits with dots like 1. 2. 3., leading asterisks, hyphens & stray periods
      const cleaned = line
        .replace(/^[\d#*-\.\s]+/, '')
        .replace(/\*\*/g, '')
        .replace(/Powered by Groq AI/gi, '')
        .replace(/Groq/gi, '')
        .replace(/Llama[-\s]?3(\s?70b)?/gi, '')
        .trim();

      const lower = line.toLowerCase();

      if (lower.includes('today\'s summary') || lower.includes('summary:')) {
        summary = cleaned.replace(/^today's summary:?/i, '').replace(/^[\d\.\s]+/, '').trim();
        currentMode = 'summary';
      } else if (lower.includes('best win')) {
        bestWin = cleaned.replace(/^best win:?/i, '').replace(/^[\d\.\s]+/, '').trim();
        currentMode = 'bestWin';
      } else if (lower.includes('worth attention')) {
        worthAttention = cleaned.replace(/^worth attention:?/i, '').replace(/^[\d\.\s]+/, '').trim();
        currentMode = 'worthAttention';
      } else if (lower.includes('for tomorrow') || lower.includes('suggestions for tomorrow')) {
        currentMode = 'tomorrow';
      } else if (lower.includes('category breakdown') || lower.includes('breakdown:')) {
        currentMode = 'category';
      } else if (lower.includes('goal progress') || lower.includes('🎯')) {
        currentMode = 'goalProgress';
      } else if (currentMode === 'tomorrow') {
        if (cleaned) tomorrowTips.push(cleaned);
      } else if (currentMode === 'category') {
        if (cleaned) categoryItems.push(cleaned);
      } else if (currentMode === 'goalProgress') {
        if (cleaned) goalProgressLines.push(cleaned);
      } else if (!summary) {
        summary = cleaned;
      }
    });

    return { summary, categoryItems, goalProgressLines, bestWin, worthAttention, tomorrowTips };
  }, [reportText]);

  async function handleUnlockAndAnalyze() {
    setIsUnlocked(true);
    setLoading(true);
    try {
      const res = await getDailyReportAI(dailyPayload);
      setReportText(res.report);
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setLoading(false);
    }
  }

  const dateDisplay = formatDateDisplay(new Date());

  return (
    <div className="relative rounded-[28px] p-5 lg:p-6 bg-gradient-to-br from-white via-white to-orange-50/30 dark:from-[#181926] dark:via-[#181926] dark:to-[#F05A36]/10 border border-black/5 dark:border-[#F05A36]/20 shadow-xl overflow-hidden min-h-[320px]">
      
      {/* Glassmorphism Blur Overlay when locked */}
      {!isUnlocked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/25 dark:bg-black/65 backdrop-blur-lg rounded-[28px] transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center shadow-xl shadow-accent mb-3 animate-pulse">
            <Sparkles size={24} />
          </div>
          <h4 className="text-base sm:text-lg font-extrabold text-white mb-1 tracking-tight">
            Full Body & Practice AI Analysis
          </h4>
          <p className="text-xs text-stone-200 font-medium mb-3 text-center max-w-sm">
            Select a time period to analyze your tracked pillars, goals & custom metrics with AI
          </p>

          {/* Time Filter Control in Overlay */}
          <div className="mb-5">
            <TimeFilterControl
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
              customDays={customDays}
              setCustomDays={setCustomDays}
              isOverlay={true}
            />
          </div>

          <button
            onClick={handleUnlockAndAnalyze}
            disabled={loading}
            className="btn-coral px-8 py-3 text-xs font-extrabold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            <span>{loading ? 'Analyzing Your KPIs…' : `Analyze ${dailyPayload.periodLabel} with AI`}</span>
          </button>
        </div>
      )}

      {/* Main Card Content (Blurred if locked) */}
      <div className={`space-y-6 transition-all duration-500 ${!isUnlocked ? 'filter blur-md pointer-events-none select-none opacity-40' : ''}`}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-border)', color: 'var(--color-accent)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#18191E] dark:text-white">
                Practice & Body AI Analysis
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {dailyPayload.periodLabel} AI analysis across all your tracked pillars & goals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Time Filter Control */}
            <TimeFilterControl
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
              customDays={customDays}
              setCustomDays={setCustomDays}
              isOverlay={false}
            />

            {isUnlocked && (
              <button
                onClick={handleUnlockAndAnalyze}
                disabled={loading}
                className="btn-coral flex items-center gap-2 text-xs font-extrabold px-3.5 py-2 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {loading ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                <span>Re-Analyze ({dailyPayload.periodLabel})</span>
              </button>
            )}
          </div>
        </div>

        {/* Core KPI Snapshot Cards with progress bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {dailyPayload.items.map((item, i) => (
            <div key={i} className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/8 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block truncate">
                  {item.name}
                </span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              </div>
              <div className="text-xs font-extrabold text-[#18191E] dark:text-white tabular-nums">
                {item.value} <span className="text-[10px] text-accent font-extrabold">{item.unit}</span>
                <span className="text-[9px] text-stone-400 font-normal block mt-0.5">Target: {item.goal}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 🎯 Goal Progress Cards — shows user-set goals vs logged data */}
        {goalProgress.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#18191E] dark:text-white flex items-center gap-1.5">
                <span>🎯</span> Your Goals — {dailyPayload.periodLabel} Progress
              </span>
              {goalProgress.some(g => g.status === 'achieved') && (
                <span className="text-[10px] font-bold text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10">
                  {goalProgress.filter(g => g.status === 'achieved').length} achieved 🎉
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {goalProgress.map((goal, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-extrabold text-[#18191E] dark:text-white truncate">{goal.name}</h5>
                      <p className="text-[10px] text-stone-400 font-medium mt-0.5">
                        {goal.direction === 'lte' ? '≤ At most' : goal.direction === 'eq' ? '= Exactly' : '≥ At least'} {goal.value} {goal.unit}
                        {goal.linkedTarget && <span className="ml-1 text-accent">· via {goal.linkedTarget.name}</span>}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className="text-[11px] font-extrabold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: goal.statusColor }}
                      >
                        {goal.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${goal.pct}%`, backgroundColor: goal.statusColor }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                      {goal.loggedValue !== null
                        ? `Logged: ${goal.loggedValue} ${goal.unit}`
                        : goal.linkedTarget ? 'Not logged yet' : 'No tracker linked'}
                    </span>
                    {goal.daysLeft !== null && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        goal.daysLeft < 0 ? 'bg-red-500/10 text-red-500' :
                        goal.daysLeft <= 7 ? 'bg-amber-500/10 text-amber-600' :
                        'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {goal.daysLeft < 0 ? `${Math.abs(goal.daysLeft)}d overdue` : `${goal.daysLeft}d left`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Split View: Bar Chart + Donut Pie Chart */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-3xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/8">
          
          {/* Left 7 Cols: Bar Chart */}
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#18191E] dark:text-white">
              <span className="flex items-center gap-1.5 text-accent font-extrabold">
                <BarChart2 size={14} /> Core KPI Performance (%)
              </span>
              <span className="text-[10px] text-stone-400 font-semibold">100% Target</span>
            </div>

            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#181926] border border-white/10 rounded-xl px-3 py-1.5 shadow-xl text-[11px] font-bold text-white">
                        {item.name}: {item.pct}% ({item.value})
                      </div>
                    );
                  }}
                />
                <Bar dataKey="pct" radius={[5, 5, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Right 5 Cols: Donut Pie Chart */}
          <div className="md:col-span-5 md:border-l border-black/5 dark:border-white/5 md:pl-4 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-[#18191E] dark:text-white">
              <span className="flex items-center gap-1.5 text-teal-500">
                <PieIcon size={14} /> Core Distribution
              </span>
            </div>

            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`pie-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-[#181926] border border-white/10 rounded-xl px-3 py-1.5 shadow-xl text-[11px] font-bold text-white">
                          {payload[0].name}: {payload[0].value}% completion
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Unique AI Feature 1: Holistic Dharma Score™ & Tomorrow Prediction */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-accent/10 via-amber-500/10 to-teal-500/10 border border-accent/20 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold text-white shadow-lg shrink-0"
              style={{ backgroundColor: dharmaScore.color }}
            >
              <span className="text-xl leading-none">{dharmaScore.score}</span>
              <span className="text-[9px] opacity-80 uppercase tracking-tighter">Grade {dharmaScore.grade}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-[#18191E] dark:text-white">Dharma Score™</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-xs" style={{ backgroundColor: dharmaScore.color }}>
                  {dharmaScore.label}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                Holistic composite score across hydration, nutrition, sleep, practice & consistency
              </p>
            </div>
          </div>

          {predictions && (
            <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-3.5 py-2 rounded-2xl border border-black/5 dark:border-white/10 text-xs font-extrabold text-[#18191E] dark:text-white">
              <span>{predictions.trendEmoji} Tomorrow Forecast:</span>
              <span className="text-accent font-black">{predictions.predictedCompletion}% Completion</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: predictions.confidenceColor }}>
                {predictions.confidence} Conf.
              </span>
            </div>
          )}
        </div>

        {/* Unique AI Feature 2: Hidden Pattern Correlations */}
        {patternInsights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#18191E] dark:text-white">
              <span className="flex items-center gap-1.5 text-accent">
                <Sparkles size={14} /> AI-Discovered Pattern Correlations ({dailyPayload.periodLabel})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {patternInsights.map((insight, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/8 flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">{insight.emoji}</span>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-extrabold text-[#18191E] dark:text-white">{insight.title}</h5>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium leading-snug">{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scannable Clean AI Report Content */}
        {parsedSections && (
          <div className="mt-4 p-5 rounded-3xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <span className="text-xs font-extrabold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <Trophy size={14} /> Comprehensive Daily AI Analysis ({dateDisplay.short})
              </span>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm font-medium leading-relaxed">
              
              {/* Summary Pill */}
              {parsedSections.summary && (
                <div className="p-3.5 rounded-2xl text-[#18191E] dark:text-white font-bold flex items-center gap-2.5"
                  style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-border)' }}>
                  <span className="text-base">💡</span>
                  <span>{parsedSections.summary}</span>
                </div>
              )}

              {/* Best Win */}
              {parsedSections.bestWin && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                  <span>Best Win: {parsedSections.bestWin}</span>
                </div>
              )}

              {/* Goal Progress from AI */}
              {parsedSections.goalProgressLines && parsedSections.goalProgressLines.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-[#18191E] dark:text-white uppercase tracking-wider block flex items-center gap-1.5">
                    🎯 AI Goal Progress Analysis
                  </span>
                  <div className="space-y-1.5">
                    {parsedSections.goalProgressLines.map((line, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-accent/5 border border-accent/15 text-[#18191E] dark:text-white flex items-start gap-2.5">
                        <span className="text-accent shrink-0 font-bold mt-0.5">→</span>
                        <span className="text-xs font-medium leading-snug">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Worth Attention */}
              {parsedSections.worthAttention && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-2.5">
                  <AlertCircle size={18} className="shrink-0 text-amber-500" />
                  <span>Worth Attention: {parsedSections.worthAttention}</span>
                </div>
              )}

              {/* Tomorrow Action Tips */}
              {parsedSections.tomorrowTips.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    Action Steps for Tomorrow:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {parsedSections.tomorrowTips.map((tip, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/8 flex items-start gap-2.5 text-stone-700 dark:text-stone-200">
                        <ArrowRight size={14} className="text-accent shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
