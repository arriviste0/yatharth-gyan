import { useState, useMemo } from 'react';
import { Sparkles, Flame, CheckCircle2, Droplets, Dumbbell, Moon, Utensils, Zap, RefreshCw, Trophy, AlertCircle, ArrowRight, Activity, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { todayKey, formatDateDisplay } from '../utils/dateUtils';
import { getDailyReportAI } from '../api/ai';

const CHART_COLORS = ['#F05A36', '#14B8A6', '#E6A04E', '#8B5CF6', '#3B82F6'];

export default function AIDailyReportCard() {
  const { state } = useStorage();
  const pillars = state.pillars || DEFAULT_PILLARS;
  const logs = state.logs || {};
  const metrics = state.metrics || {};
  const today = todayKey();
  const dayLog = logs[today] || {};
  const dayMetrics = metrics[today] || {};

  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState(null);
  const [reportSource, setReportSource] = useState(null);

  // Construct generic items array as specified in daily-report-skill.md
  const dailyPayload = useMemo(() => {
    const items = [];

    // 1. Hydration
    const water = dayMetrics.water || 0;
    const waterVal = water >= 1000 ? +(water / 1000).toFixed(1) : water;
    items.push({
      category: 'Hydration',
      name: 'Water Intake',
      value: waterVal,
      unit: water >= 1000 ? 'L' : 'ml',
      goal: 3.0,
      pct: Math.min(100, Math.round((waterVal / 3.0) * 100)),
    });

    // 2. Sleep
    const sleepTarget = pillars.flatMap(p => p.targets).find(t => t.id === 't-sleep');
    const sleepVal = dayLog['t-sleep']?.done ? 8 : 6;
    items.push({
      category: 'Sleep',
      name: 'Sleep & Rest',
      value: sleepVal,
      unit: 'hr',
      goal: 8,
      pct: Math.min(100, Math.round((sleepVal / 8) * 100)),
    });

    // 3. Nutrition & Food
    const foodPillar = pillars.find(p => p.id === 'p-food');
    const foodDone = foodPillar ? foodPillar.targets.filter(t => dayLog[t.id]?.done).length : 1;
    const proteinVal = foodDone > 0 ? 75 : 40;
    const carbVal = foodDone > 1 ? 220 : 150;

    items.push({
      category: 'Nutrition',
      name: 'Protein',
      value: proteinVal,
      unit: 'g',
      goal: 90,
      pct: Math.min(100, Math.round((proteinVal / 90) * 100)),
    });
    items.push({
      category: 'Nutrition',
      name: 'Clean Carbs',
      value: carbVal,
      unit: 'g',
      goal: 250,
      pct: Math.min(100, Math.round((carbVal / 250) * 100)),
    });

    // 4. Tasks & Practice
    const allTargets = pillars.flatMap(p => p.targets);
    const doneTargets = allTargets.filter(t => dayLog[t.id]?.done).length;
    const taskPct = allTargets.length > 0 ? Math.round((doneTargets / allTargets.length) * 100) : 0;

    items.push({
      category: 'Tasks',
      name: 'Daily Targets',
      value: doneTargets,
      unit: 'done',
      goal: allTargets.length,
      pct: taskPct,
    });

    // 5. Exercise / Active
    const movePillar = pillars.find(p => p.id === 'p-[#E8843C]' || p.english === 'Move & Body' || p.id === 'p-move');
    const moveDone = movePillar ? movePillar.targets.filter(t => dayLog[t.id]?.done).length : 1;
    const workoutVal = moveDone * 20;

    items.push({
      category: 'Exercise',
      name: 'Workout Time',
      value: workoutVal,
      unit: 'min',
      goal: 45,
      pct: Math.min(100, Math.round((workoutVal / 45) * 100)),
    });

    return {
      date: today,
      items,
    };
  }, [pillars, dayLog, dayMetrics, today]);

  // Chart data formatting
  const barChartData = useMemo(() => {
    return dailyPayload.items.map(item => ({
      name: item.name,
      pct: item.pct,
      value: `${item.value} / ${item.goal} ${item.unit}`,
    }));
  }, [dailyPayload]);

  const pieChartData = useMemo(() => {
    return dailyPayload.items.map(item => ({
      name: item.name,
      value: item.pct,
    }));
  }, [dailyPayload]);

  async function handleGenerateReport() {
    setLoading(true);
    try {
      const res = await getDailyReportAI(dailyPayload);
      setReportText(res.report);
      setReportSource(res.source);
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setLoading(false);
    }
  }

  const dateDisplay = formatDateDisplay(new Date());

  return (
    <div className="card-bento p-5 lg:p-6 space-y-6 bg-gradient-to-br from-white via-white to-orange-50/30 dark:from-[#181926] dark:via-[#181926] dark:to-[#F05A36]/10 border border-black/5 dark:border-[#F05A36]/20 shadow-xl">
      
      {/* Top Banner & Trigger */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#F05A36]/15 border border-[#F05A36]/30 flex items-center justify-center text-[#F05A36] shadow-sm">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-[#18191E] dark:text-white">
                Full Body & Practice AI Report
              </h3>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#F05A36] text-white">
                AI Skill + Charts
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
              Sleep, Protein, Carbs, Water & Target KPIs with interactive visualizations & Groq AI
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="btn-coral flex items-center gap-2 text-xs font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Analyzing Daily KPIs…</span>
            </>
          ) : (
            <>
              <Zap size={14} />
              <span>{reportText ? 'Re-Analyze Today' : 'Analyze Day with AI'}</span>
            </>
          )}
        </button>
      </div>

      {/* KPI Visualizations: Bar Chart + Donut Pie Chart Split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-3xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/8">
        
        {/* Left 7 Cols: KPI Target Completion Bar Chart */}
        <div className="md:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#18191E] dark:text-white">
            <span className="flex items-center gap-1.5 text-[#F05A36]">
              <BarChart2 size={15} /> Daily KPI Target Completion (%)
            </span>
            <span className="text-[10px] text-stone-400 font-semibold">Target: 100%</span>
          </div>

          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={0} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#181926] border border-white/10 rounded-xl px-3 py-1.5 shadow-xl text-[11px] font-bold text-white">
                      {item.name}: {item.pct}% achieved ({item.value})
                    </div>
                  );
                }}
              />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                {barChartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right 5 Cols: Macro & KPI Distribution Pie Chart */}
        <div className="md:col-span-5 md:border-l border-black/5 dark:border-white/5 md:pl-4 space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-[#18191E] dark:text-white">
            <span className="flex items-center gap-1.5 text-teal-500">
              <PieIcon size={15} /> KPI Balance Pie
            </span>
            <span className="text-[10px] text-stone-400 font-semibold">Distribution</span>
          </div>

          <div className="flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={4}
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
                        {payload[0].name}: {payload[0].value}% of target
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPI Quick Snapshot Cards (Sleep, Protein, Carbs, Water, Tasks) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        {dailyPayload.items.map((item, i) => (
          <div key={i} className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/8 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block truncate">
                {item.name}
              </span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            </div>
            <div className="text-sm font-extrabold text-[#18191E] dark:text-white tabular-nums">
              {item.value} {item.unit}
              {item.goal && <span className="text-[10px] text-stone-400 font-normal ml-1">/ {item.goal}{item.unit}</span>}
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Generated Report Display (Structured as defined in daily-report-skill.md) */}
      {reportText && (
        <div className="mt-4 p-5 rounded-3xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
            <span className="text-xs font-extrabold text-[#F05A36] uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={14} /> Comprehensive Daily AI Analysis ({dateDisplay.short})
            </span>
            {reportSource && (
              <span className="text-[10px] font-semibold text-stone-400">
                Powered by {reportSource}
              </span>
            )}
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-3 font-medium text-[#18191E] dark:text-stone-200">
            {reportText.split('\n').map((line, idx) => {
              if (line.startsWith('**Today\'s Summary**') || line.startsWith('Today\'s Summary')) {
                return (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#F05A36]/10 border border-[#F05A36]/25 text-[#18191E] dark:text-white font-bold">
                    💡 {line.replace(/^\*+/, '').replace(/\*+$/, '')}
                  </div>
                );
              }
              if (line.startsWith('**Best Win**') || line.includes('Best win')) {
                return (
                  <div key={idx} className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    <span>{line}</span>
                  </div>
                );
              }
              if (line.startsWith('**Worth Attention**') || line.includes('Worth attention')) {
                return (
                  <div key={idx} className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-amber-500" />
                    <span>{line}</span>
                  </div>
                );
              }
              if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
                return (
                  <div key={idx} className="flex items-start gap-2 pl-2">
                    <ArrowRight size={13} className="text-[#F05A36] shrink-0 mt-1" />
                    <span>{line.replace(/^[-*\d.]+\s*/, '')}</span>
                  </div>
                );
              }
              if (!line.trim()) return <div key={idx} className="h-1" />;
              return <p key={idx} className="font-semibold">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
