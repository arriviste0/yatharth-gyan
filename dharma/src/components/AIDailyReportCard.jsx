import { useState, useMemo } from 'react';
import { Sparkles, CheckCircle2, Zap, RefreshCw, Trophy, AlertCircle, ArrowRight, BarChart2, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { todayKey, formatDateDisplay, dateKey } from '../utils/dateUtils';
import { getDailyReportAI } from '../api/ai';

const CHART_COLORS = ['#F05A36', '#14B8A6', '#E6A04E', '#8B5CF6', '#3B82F6', '#EC4899', '#10B981'];

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

  // Dynamic payload focusing strictly on high-level Daily & 7-Day Average KPIs derived from Daily Practice Targets
  const dailyPayload = useMemo(() => {
    const items = [];
    const d = new Date();

    // All active daily targets across all pillars
    const allDailyTargets = pillars.flatMap((p) =>
      p.targets.filter((t) => t.frequency === 'daily' || !t.frequency)
    );

    // Helper: Safely parse numbers (ignoring booleans, objects, and clock time strings like '23:00')
    const safeParseNumber = (val) => {
      if (val === null || val === undefined || typeof val === 'boolean') return NaN;
      if (typeof val === 'string' && val.includes(':')) return NaN; // skip clock time strings
      const num = parseFloat(val);
      return isNaN(num) ? NaN : num;
    };

    // --- 1. WATER INTAKE & 7-DAY AVG WATER ---
    let waterTarget = null;
    for (const p of pillars) {
      for (const t of p.targets) {
        const name = (t.name || '').toLowerCase();
        const unit = (t.unit || '').toLowerCase();
        if (name.includes('water') || name.includes('jal') || unit === 'l' || unit === 'ml' || t.id.includes('water')) {
          waterTarget = t;
          break;
        }
      }
      if (waterTarget) break;
    }

    let waterGoal = 3.0;
    if (waterTarget) {
      const tv = safeParseNumber(waterTarget.targetValue);
      if (!isNaN(tv) && tv > 0) {
        waterGoal = (waterTarget.unit === 'ml' || tv > 20) ? +(tv / 1000).toFixed(1) : tv;
      }
    }

    let waterToday = 0;
    if (waterTarget && dayLog[waterTarget.id]?.value != null) {
      const v = safeParseNumber(dayLog[waterTarget.id].value);
      if (!isNaN(v)) {
        waterToday = (waterTarget.unit === 'ml' || v > 20) ? +(v / 1000).toFixed(1) : v;
      } else if (dayLog[waterTarget.id]?.done) {
        waterToday = waterGoal;
      }
    } else if (dayMetrics.water) {
      const w = safeParseNumber(dayMetrics.water);
      if (!isNaN(w)) {
        waterToday = w >= 1000 ? +(w / 1000).toFixed(1) : w;
      }
    } else if (waterTarget && dayLog[waterTarget.id]?.done) {
      waterToday = waterGoal;
    }
    if (isNaN(waterToday)) waterToday = 0;

    let water7Sum = 0;
    let waterDaysCount = 0;
    for (let i = 0; i < 7; i++) {
      const dd = new Date(d);
      dd.setDate(d.getDate() - i);
      const key = dateKey(dd);
      const pastLog = logs[key] || {};
      const pastMetric = metrics[key] || {};
      let dayVal = null;

      if (waterTarget && pastLog[waterTarget.id]?.value != null) {
        const v = safeParseNumber(pastLog[waterTarget.id].value);
        if (!isNaN(v)) {
          dayVal = (waterTarget.unit === 'ml' || v > 20) ? v / 1000 : v;
        } else if (pastLog[waterTarget.id]?.done) {
          dayVal = waterGoal;
        }
      } else if (pastMetric.water) {
        const w = safeParseNumber(pastMetric.water);
        if (!isNaN(w)) dayVal = w >= 1000 ? w / 1000 : w;
      } else if (waterTarget && pastLog[waterTarget.id]?.done) {
        dayVal = waterGoal;
      }

      if (dayVal !== null && !isNaN(dayVal)) {
        water7Sum += dayVal;
        waterDaysCount++;
      }
    }
    const avgWater = waterDaysCount > 0 ? +(water7Sum / waterDaysCount).toFixed(1) : waterToday;

    items.push({
      category: 'Hydration',
      name: 'Water Intake',
      value: waterToday,
      unit: 'L',
      goal: waterGoal,
      pct: waterGoal > 0 ? Math.min(100, Math.round((waterToday / waterGoal) * 100)) : 0,
    });

    items.push({
      category: 'Hydration',
      name: 'Avg Daily Water',
      value: avgWater,
      unit: 'L/day',
      goal: waterGoal,
      pct: waterGoal > 0 ? Math.min(100, Math.round((avgWater / waterGoal) * 100)) : 0,
    });

    // --- 2. PROTEIN INTAKE & 7-DAY AVG PROTEIN ---
    let proteinTarget = null;
    for (const p of pillars) {
      for (const t of p.targets) {
        const name = (t.name || '').toLowerCase();
        const unit = (t.unit || '').toLowerCase();
        if (name.includes('protein') || (unit === 'g' && name.includes('prot')) || t.id.includes('protein')) {
          proteinTarget = t;
          break;
        }
      }
      if (proteinTarget) break;
    }

    let proteinGoal = 90;
    if (proteinTarget) {
      const tv = safeParseNumber(proteinTarget.targetValue);
      if (!isNaN(tv) && tv > 0) proteinGoal = tv;
    } else {
      const foodPillar = pillars.find(p => p.id === 'ahara' || p.english.toLowerCase().includes('food') || p.english.toLowerCase().includes('diet'));
      if (foodPillar) {
        const numTarget = foodPillar.targets.find(t => (t.type === 'NUMBER' || t.type === 'DURATION') && safeParseNumber(t.targetValue) > 10);
        if (numTarget) {
          const tv = safeParseNumber(numTarget.targetValue);
          if (!isNaN(tv)) proteinGoal = tv;
        }
      }
    }

    let proteinToday = 0;
    if (proteinTarget && dayLog[proteinTarget.id]?.value != null) {
      const v = safeParseNumber(dayLog[proteinTarget.id].value);
      if (!isNaN(v)) proteinToday = v;
      else if (dayLog[proteinTarget.id]?.done) proteinToday = proteinGoal;
    } else if (dayMetrics.protein) {
      const v = safeParseNumber(dayMetrics.protein);
      if (!isNaN(v)) proteinToday = v;
    } else if (proteinTarget && dayLog[proteinTarget.id]?.done) {
      proteinToday = proteinGoal;
    } else {
      const foodPillar = pillars.find(p => p.id === 'ahara' || p.english.toLowerCase().includes('food') || p.english.toLowerCase().includes('diet'));
      if (foodPillar && foodPillar.targets.length > 0) {
        const foodDone = foodPillar.targets.filter(t => dayLog[t.id]?.done).length;
        proteinToday = foodDone > 0 ? Math.round((foodDone / foodPillar.targets.length) * proteinGoal) : 0;
      }
    }
    if (isNaN(proteinToday)) proteinToday = 0;

    let protein7Sum = 0;
    let proteinDaysCount = 0;
    for (let i = 0; i < 7; i++) {
      const dd = new Date(d);
      dd.setDate(d.getDate() - i);
      const key = dateKey(dd);
      const pastLog = logs[key] || {};
      const pastMetric = metrics[key] || {};
      let dayVal = null;

      if (proteinTarget && pastLog[proteinTarget.id]?.value != null) {
        const v = safeParseNumber(pastLog[proteinTarget.id].value);
        if (!isNaN(v)) dayVal = v;
        else if (pastLog[proteinTarget.id]?.done) dayVal = proteinGoal;
      } else if (pastMetric.protein) {
        const v = safeParseNumber(pastMetric.protein);
        if (!isNaN(v)) dayVal = v;
      } else if (proteinTarget && pastLog[proteinTarget.id]?.done) {
        dayVal = proteinGoal;
      } else {
        const foodPillar = pillars.find(p => p.id === 'ahara' || p.english.toLowerCase().includes('food') || p.english.toLowerCase().includes('diet'));
        if (foodPillar && foodPillar.targets.length > 0) {
          const foodDone = foodPillar.targets.filter(t => pastLog[t.id]?.done).length;
          if (foodDone > 0) dayVal = Math.round((foodDone / foodPillar.targets.length) * proteinGoal);
        }
      }

      if (dayVal !== null && !isNaN(dayVal)) {
        protein7Sum += dayVal;
        proteinDaysCount++;
      }
    }
    const avgProtein = proteinDaysCount > 0 ? Math.round(protein7Sum / proteinDaysCount) : proteinToday;

    items.push({
      category: 'Nutrition',
      name: 'Avg Daily Protein',
      value: avgProtein,
      unit: 'g/day',
      goal: proteinGoal,
      pct: proteinGoal > 0 ? Math.min(100, Math.round((avgProtein / proteinGoal) * 100)) : 0,
    });

    // --- 3. SLEEP & REST ---
    let sleepTarget = null;
    for (const p of pillars) {
      for (const t of p.targets) {
        const name = (t.name || '').toLowerCase();
        const unit = (t.unit || '').toLowerCase();
        if (unit === 'hr' || unit === 'hours' || (t.type === 'NUMBER' && name.includes('sleep')) || (t.type === 'DURATION' && name.includes('sleep'))) {
          sleepTarget = t;
          break;
        }
      }
      if (sleepTarget) break;
    }

    let sleepGoal = 8.0;
    if (sleepTarget) {
      const tv = safeParseNumber(sleepTarget.targetValue);
      if (!isNaN(tv) && tv > 0 && tv <= 16) sleepGoal = tv;
    }

    let sleepToday = 0;
    if (sleepTarget && dayLog[sleepTarget.id]?.value != null) {
      const v = safeParseNumber(dayLog[sleepTarget.id].value);
      if (!isNaN(v) && v <= 16) sleepToday = v;
      else if (dayLog[sleepTarget.id]?.done) sleepToday = sleepGoal;
    } else {
      const sleepPillar = pillars.find(p => p.id === 'nidra' || p.english.toLowerCase().includes('sleep'));
      if (sleepPillar && sleepPillar.targets.length > 0) {
        const sleepDone = sleepPillar.targets.filter(t => dayLog[t.id]?.done).length;
        if (sleepDone > 0) {
          sleepToday = +( (sleepDone / sleepPillar.targets.length) * sleepGoal ).toFixed(1);
        }
      }
    }
    if (isNaN(sleepToday)) sleepToday = 0;

    items.push({
      category: 'Sleep',
      name: 'Sleep & Rest',
      value: sleepToday,
      unit: 'hr',
      goal: sleepGoal,
      pct: sleepGoal > 0 ? Math.min(100, Math.round((sleepToday / sleepGoal) * 100)) : 0,
    });

    // --- 4. WORKOUT / EXERCISE TIME ---
    let workoutTarget = null;
    for (const p of pillars) {
      for (const t of p.targets) {
        const name = (t.name || '').toLowerCase();
        const unit = (t.unit || '').toLowerCase();
        if ((t.type === 'NUMBER' || t.type === 'DURATION') && (unit === 'min' || name.includes('duration') || name.includes('workout') || name.includes('exercise'))) {
          workoutTarget = t;
          break;
        }
      }
      if (workoutTarget) break;
    }

    let workoutGoal = 45;
    if (workoutTarget) {
      const tv = safeParseNumber(workoutTarget.targetValue);
      if (!isNaN(tv) && tv > 0) workoutGoal = tv;
    }

    let workoutToday = 0;
    if (workoutTarget && dayLog[workoutTarget.id]?.value != null) {
      const v = safeParseNumber(dayLog[workoutTarget.id].value);
      if (!isNaN(v)) workoutToday = v;
      else if (dayLog[workoutTarget.id]?.done) workoutToday = workoutGoal;
    } else {
      const movePillar = pillars.find(p => p.id === 'vyayama' || p.english.toLowerCase().includes('gym') || p.english.toLowerCase().includes('move') || p.english.toLowerCase().includes('workout'));
      if (movePillar && movePillar.targets.length > 0) {
        const moveDone = movePillar.targets.filter(t => dayLog[t.id]?.done).length;
        workoutToday = moveDone > 0 ? Math.round((moveDone / movePillar.targets.length) * workoutGoal) : 0;
      }
    }
    if (isNaN(workoutToday)) workoutToday = 0;

    items.push({
      category: 'Exercise',
      name: 'Workout Time',
      value: workoutToday,
      unit: 'min',
      goal: workoutGoal,
      pct: workoutGoal > 0 ? Math.min(100, Math.round((workoutToday / workoutGoal) * 100)) : 0,
    });

    // --- 5. TASKS COMPLETED (PRACTICE) ---
    const totalDone = allDailyTargets.filter(t => dayLog[t.id]?.done).length;
    const totalGoal = allDailyTargets.length;
    const totalPct = totalGoal > 0 ? Math.round((totalDone / totalGoal) * 100) : 0;

    items.push({
      category: 'Practice',
      name: 'Tasks Completed',
      value: totalDone,
      unit: 'tasks',
      goal: totalGoal,
      pct: totalPct,
    });

    return {
      date: today,
      items,
    };
  }, [pillars, dayLog, dayMetrics, logs, metrics, today]);

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
      
      {/* Glassmorphism Blur Overlay when locked - matching rounded-[28px] */}
      {!isUnlocked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/20 dark:bg-black/60 backdrop-blur-lg rounded-[28px] transition-all duration-500">
          <div className="w-13 h-13 rounded-2xl bg-accent text-white flex items-center justify-center shadow-xl shadow-accent mb-3.5 animate-pulse">
            <Sparkles size={26} />
          </div>
          <h4 className="text-base sm:text-lg font-extrabold text-white mb-1 tracking-tight">
            Full Body & Practice AI Analysis
          </h4>
          <p className="text-xs text-stone-200 font-medium mb-5 text-center max-w-sm">
            Analyze your daily & 7-day average protein, water intake, sleep & practice KPIs
          </p>
          <button
            onClick={handleUnlockAndAnalyze}
            disabled={loading}
            className="btn-coral px-8 py-3 text-xs font-extrabold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            <span>{loading ? 'Analyzing Your KPIs…' : 'Analyze Day with AI'}</span>
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
                High-level daily & 7-day average protein, hydration & rest KPIs
              </p>
            </div>
          </div>

          {isUnlocked && (
            <button
              onClick={handleUnlockAndAnalyze}
              disabled={loading}
              className="btn-coral flex items-center gap-2 text-xs font-extrabold px-3.5 py-1.5 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
              <span>Re-Analyze</span>
            </button>
          )}
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
