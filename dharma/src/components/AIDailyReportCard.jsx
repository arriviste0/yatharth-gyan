import { useState, useMemo } from 'react';
import { Sparkles, CheckCircle2, Zap, RefreshCw, Trophy, AlertCircle, ArrowRight, BarChart2, PieChart as PieIcon, Activity } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { todayKey, formatDateDisplay } from '../utils/dateUtils';
import { getDailyReportAI } from '../api/ai';

const CHART_COLORS = ['#F05A36', '#14B8A6', '#E6A04E', '#8B5CF6', '#3B82F6', '#EC4899'];

export default function AIDailyReportCard() {
  const { state } = useStorage();
  const pillars = state.pillars || DEFAULT_PILLARS;
  const logs = state.logs || {};
  const metrics = state.metrics || {};
  const today = todayKey();
  const dayLog = logs[today] || {};
  const dayMetrics = metrics[today] || {};

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState(null);

  // Dynamic payload derived from actual performed user tasks
  const dailyPayload = useMemo(() => {
    const items = [];

    // 1. Water Intake
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

    // 2. Performed tasks per pillar
    pillars.forEach((p) => {
      const doneCount = p.targets.filter(t => dayLog[t.id]?.done).length;
      const totalCount = p.targets.length;
      const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

      items.push({
        category: p.english || p.name,
        name: p.english || p.name,
        value: doneCount,
        unit: 'tasks',
        goal: totalCount,
        pct: pct,
      });
    });

    // 3. Overall Practice Targets
    const allTargets = pillars.flatMap(p => p.targets);
    const totalDone = allTargets.filter(t => dayLog[t.id]?.done).length;
    const totalPct = allTargets.length > 0 ? Math.round((totalDone / allTargets.length) * 100) : 0;

    items.push({
      category: 'Practice',
      name: 'Overall Targets',
      value: totalDone,
      unit: 'completed',
      goal: allTargets.length,
      pct: totalPct,
    });

    return {
      date: today,
      items,
    };
  }, [pillars, dayLog, dayMetrics, today]);

  // Recharts Data
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
      // Remove raw markdown symbols, leading digits like 1. 2. 3. 4., leading asterisks
      const cleaned = line
        .replace(/^[\d#*-\s]+/, '')
        .replace(/\*\*/g, '')
        .replace(/Powered by Groq AI/gi, '')
        .trim();

      const lower = line.toLowerCase();

      if (lower.includes('today\'s summary') || lower.includes('summary:')) {
        summary = cleaned.replace(/^today's summary:?/i, '').replace(/^\d+\.\s*/, '').trim();
        currentMode = 'summary';
      } else if (lower.includes('best win')) {
        bestWin = cleaned.replace(/^best win:?/i, '').replace(/^\d+\.\s*/, '').trim();
        currentMode = 'bestWin';
      } else if (lower.includes('worth attention')) {
        worthAttention = cleaned.replace(/^worth attention:?/i, '').replace(/^\d+\.\s*/, '').trim();
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
          <div className="w-13 h-13 rounded-2xl bg-[#F05A36] text-white flex items-center justify-center shadow-xl shadow-[#F05A36]/40 mb-3.5 animate-pulse">
            <Sparkles size={26} />
          </div>
          <h4 className="text-base sm:text-lg font-extrabold text-white mb-1 tracking-tight">
            Full Body & Practice AI Analysis
          </h4>
          <p className="text-xs text-stone-200 font-medium mb-5 text-center max-w-sm">
            Analyze your daily tasks, nutrition, hydration & practice KPIs with Groq AI
          </p>
          <button
            onClick={handleUnlockAndAnalyze}
            disabled={loading}
            className="btn-coral px-8 py-3 text-xs font-extrabold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            <span>{loading ? 'Analyzing Your Tasks…' : 'Analyze Day with AI'}</span>
          </button>
        </div>
      )}

      {/* Main Card Content (Blurred if locked) */}
      <div className={`space-y-6 transition-all duration-500 ${!isUnlocked ? 'filter blur-md pointer-events-none select-none opacity-40' : ''}`}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F05A36]/15 border border-[#F05A36]/30 flex items-center justify-center text-[#F05A36] shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#18191E] dark:text-white">
                Practice & Body AI Analysis
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Live performance metrics from your performed daily tasks
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

        {/* Dynamic Metric Snapshot Cards with progress bars */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {dailyPayload.items.map((item, i) => (
            <div key={i} className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/8 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block truncate">
                  {item.name}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              </div>
              <div className="text-xs font-extrabold text-[#18191E] dark:text-white tabular-nums">
                {item.value} {item.unit}
                <span className="text-[10px] text-stone-400 font-normal ml-1">/ {item.goal}</span>
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
              <span className="flex items-center gap-1.5 text-[#F05A36]">
                <BarChart2 size={14} /> Task Completion Rates (%)
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
                <PieIcon size={14} /> Practice Distribution
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
              <span className="text-xs font-extrabold text-[#F05A36] uppercase tracking-wider flex items-center gap-1.5">
                <Trophy size={14} /> Comprehensive Daily AI Analysis ({dateDisplay.short})
              </span>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm font-medium leading-relaxed">
              
              {/* Summary Pill */}
              {parsedSections.summary && (
                <div className="p-3.5 rounded-2xl bg-[#F05A36]/10 border border-[#F05A36]/25 text-[#18191E] dark:text-white font-bold flex items-center gap-2.5">
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
                        <ArrowRight size={14} className="text-[#F05A36] shrink-0 mt-0.5" />
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
