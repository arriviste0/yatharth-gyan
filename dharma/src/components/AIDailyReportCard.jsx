import { useState, useMemo } from 'react';
import { Sparkles, CheckCircle2, Zap, RefreshCw, Trophy, AlertCircle, ArrowRight, BarChart2, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { todayKey, formatDateDisplay, dateKey } from '../utils/dateUtils';
import { getDailyReportAI } from '../api/ai';

const CHART_COLORS = ['#F05A36', '#14B8A6', '#E6A04E', '#8B5CF6', '#3B82F6', '#EC4899', '#10B981'];

function TimeFilterControl({ timeFilter, setTimeFilter, customDays, setCustomDays, isOverlay = false }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className={`flex items-center p-1 rounded-2xl border text-xs font-extrabold flex-wrap gap-0.5 ${
        isOverlay ? 'bg-white/10 border-white/20' : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10'
      }`}>
        {[
          { id: 'today', label: 'Today' },
          { id: '7day', label: '7D' },
          { id: '30day', label: '30D' },
          { id: '90day', label: '90D' },
          { id: 'allTime', label: 'All-Time' },
          { id: 'custom', label: 'Custom' },
        ].map((tf) => (
          <button
            key={tf.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setTimeFilter(tf.id);
            }}
            className={`px-2.5 py-1 rounded-xl transition-all ${
              timeFilter === tf.id
                ? 'bg-accent text-white shadow-sm'
                : isOverlay
                  ? 'text-white/70 hover:text-white'
                  : 'text-stone-500 dark:text-stone-400 hover:text-[#18191E] dark:hover:text-white'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {timeFilter === 'custom' && (
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-extrabold shrink-0 ${
          isOverlay ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-[#18191E] dark:text-white'
        }`}>
          <input
            type="number"
            min="1"
            max="365"
            value={customDays}
            onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-10 bg-transparent text-center outline-none border-b border-accent font-extrabold"
          />
          <span className="text-[10px] opacity-70">days</span>
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

    // 1. Water
    const waterData = getMetricValForDays(
      (t) => (t.name || '').toLowerCase().includes('water') || (t.name || '').toLowerCase().includes('jal') || (t.unit || '').toLowerCase() === 'l' || (t.unit || '').toLowerCase() === 'ml',
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
      (t) => (t.name || '').toLowerCase().includes('protein') || (t.name || '').toLowerCase().includes('prot'),
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
      (t) => (t.unit || '').toLowerCase() === 'hr' || (t.unit || '').toLowerCase() === 'hours' || (t.name || '').toLowerCase().includes('sleep'),
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
      (t) => (t.unit || '').toLowerCase() === 'min' || (t.name || '').toLowerCase().includes('workout') || (t.name || '').toLowerCase().includes('gym') || (t.name || '').toLowerCase().includes('exercise'),
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
    };
  }, [pillars, dayLog, dayMetrics, logs, metrics, today, timeFilter]);

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
      } else if (currentMode === 'tomorrow') {
        if (cleaned) tomorrowTips.push(cleaned);
      } else if (currentMode === 'category') {
        if (cleaned) categoryItems.push(cleaned);
      } else if (!summary) {
        summary = cleaned;
      }
    });

    return { summary, categoryItems, bestWin, worthAttention, tomorrowTips };
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
            Select a time period to analyze your protein, hydration, sleep & practice KPIs
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
            className="btn-coral px-8 py-3 text-xs font-extrabold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
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
                High-level {dailyPayload.periodLabel.toLowerCase()} protein, hydration, sleep & practice KPIs
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
                className="btn-coral flex items-center gap-2 text-xs font-extrabold px-3.5 py-2 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
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
