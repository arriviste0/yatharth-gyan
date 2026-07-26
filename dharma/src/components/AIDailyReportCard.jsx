import { useState, useMemo } from 'react';
import { Sparkles, Flame, CheckCircle2, Droplets, Dumbbell, Moon, Utensils, Zap, RefreshCw, Trophy, AlertCircle, ArrowRight, Activity } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { todayKey, formatDateDisplay } from '../utils/dateUtils';
import { getDailyReportAI } from '../api/ai';

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
    items.push({
      category: 'Hydration',
      name: 'Water Intake',
      value: water >= 1000 ? +(water / 1000).toFixed(1) : water,
      unit: water >= 1000 ? 'L' : 'ml',
      goal: 3.0,
    });

    // 2. Sleep
    const sleepTarget = pillars.flatMap(p => p.targets).find(t => t.id === 't-sleep');
    if (sleepTarget) {
      items.push({
        category: 'Sleep',
        name: 'Sleep & Rest',
        value: dayLog['t-sleep']?.done ? 8 : 6,
        unit: 'hr',
        goal: 8,
      });
    }

    // 3. Nutrition & Food
    const foodPillar = pillars.find(p => p.id === 'p-food');
    if (foodPillar) {
      const foodDone = foodPillar.targets.filter(t => dayLog[t.id]?.done).length;
      items.push({
        category: 'Nutrition',
        name: 'Protein & Healthy Meals',
        value: foodDone > 0 ? 75 : 40,
        unit: 'g',
        goal: 90,
      });
      items.push({
        category: 'Nutrition',
        name: 'Clean Carbs',
        value: foodDone > 1 ? 220 : 150,
        unit: 'g',
        goal: 250,
      });
    }

    // 4. Tasks & Practice
    const allTargets = pillars.flatMap(p => p.targets);
    const doneTargets = allTargets.filter(t => dayLog[t.id]?.done).length;
    items.push({
      category: 'Tasks',
      name: 'Daily Targets Completed',
      value: doneTargets,
      unit: 'targets',
      goal: allTargets.length,
    });

    // 5. Exercise / Physical Active
    const movePillar = pillars.find(p => p.id === 'p-[#E8843C]' || p.english === 'Move & Body' || p.id === 'p-move');
    if (movePillar) {
      const moveDone = movePillar.targets.filter(t => dayLog[t.id]?.done).length;
      items.push({
        category: 'Exercise',
        name: 'Physical Activity & Workout',
        value: moveDone * 20,
        unit: 'min',
        goal: 45,
      });
    }

    return {
      date: today,
      items,
    };
  }, [pillars, dayLog, dayMetrics, today]);

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
    <div className="card-bento p-5 lg:p-6 space-y-5 bg-gradient-to-br from-white via-white to-orange-50/30 dark:from-[#181926] dark:via-[#181926] dark:to-[#F05A36]/10 border border-black/5 dark:border-[#F05A36]/20 shadow-xl">
      
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
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F05A36] text-white">
                AI Skill
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
              Analyze sleep, nutrition (protein/carbs), hydration & daily tasks with Groq AI
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

      {/* KPI Quick Snapshot Cards (Sleep, Protein, Carbs, Water, Tasks) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        {dailyPayload.items.map((item, i) => (
          <div key={i} className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/8 space-y-1">
            <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block truncate">
              {item.name}
            </span>
            <div className="text-sm font-extrabold text-[#18191E] dark:text-white tabular-nums">
              {item.value} {item.unit}
              {item.goal && <span className="text-[10px] text-stone-400 font-normal ml-1">/ {item.goal}{item.unit}</span>}
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
