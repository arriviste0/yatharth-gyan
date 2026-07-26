import { useState, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from 'recharts';
import {
  ChevronLeft, ChevronRight, Check, Sparkles, Droplets, Dumbbell, Activity, Calendar, LayoutGrid, Award, Plus
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { dateKey } from '../utils/dateUtils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MOODS = [
  { emoji: '😁', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🧘', label: 'Calm' },
  { emoji: '😔', label: 'Low' },
  { emoji: '🔥', label: 'Energetic' },
];

const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

export default function MonthlyTracker() {
  const { state, logTarget, logMetric } = useStorage();
  const pillars = state.pillars || [];
  const logs = state.logs || {};
  const metrics = state.metrics || {};

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'weekly'
  const [selectedWeek, setSelectedWeek] = useState(Math.floor((now.getDate() - 1) / 7));
  const [customHabits, setCustomHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);

  const nDays = daysInMonth(year, month);
  const daysArray = useMemo(() => Array.from({ length: nDays }, (_, i) => i + 1), [nDays]);

  // Flatten all targets from pillars + custom habits
  const allTargets = useMemo(() => {
    const pTargets = pillars.flatMap((p) =>
      p.targets.map((t) => ({
        id: t.id,
        name: t.name,
        pillarName: p.english,
        pillarColor: p.color || '#E8843C',
      }))
    );
    const cTargets = customHabits.map((h) => ({
      id: h.id,
      name: h.name,
      pillarName: 'Custom',
      pillarColor: '#C9A961',
    }));
    return [...pTargets, ...cTargets];
  }, [pillars, customHabits]);

  // Navigation helpers
  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  // Date key builder for specific year, month, day
  const getDayKey = useCallback((d) => {
    const dateObj = new Date(year, month, d);
    return dateKey(dateObj);
  }, [year, month]);

  // Toggle habit check for target & day
  const toggleHabit = (targetId, day) => {
    const dKey = getDayKey(day);
    const current = logs[dKey]?.[targetId]?.done || false;
    logTarget(dKey, targetId, { done: !current, timestamp: Date.now() });
  };

  // Add custom habit
  const handleAddCustomHabit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    setCustomHabits((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, name: newHabitName.trim() },
    ]);
    setNewHabitName('');
    setShowAddHabit(false);
  };

  // Compute daily completion rates for chart & heat line
  const dailyStats = useMemo(() => {
    return daysArray.map((d) => {
      const dKey = getDayKey(d);
      const dayLog = logs[dKey] || {};
      let completedCount = 0;
      allTargets.forEach((t) => {
        if (dayLog[t.id]?.done) completedCount++;
      });
      const pct = allTargets.length > 0 ? Math.round((completedCount / allTargets.length) * 100) : 0;
      return {
        day: d,
        completed: completedCount,
        total: allTargets.length,
        pct,
      };
    });
  }, [daysArray, getDayKey, logs, allTargets]);

  const monthAveragePct = useMemo(() => {
    if (!dailyStats.length) return 0;
    const sum = dailyStats.reduce((acc, curr) => acc + curr.pct, 0);
    return Math.round(sum / dailyStats.length);
  }, [dailyStats]);

  // Health metric logs for today or selected day
  const todayStr = dateKey(new Date());
  const todayMetrics = metrics[todayStr] || { water: 0, protein: 0, mood: '' };

  const handleWaterAdd = (amount) => {
    const current = todayMetrics.water || 0;
    const nextVal = Math.max(0, Math.round((current + amount) * 10) / 10);
    logMetric(todayStr, 'water', nextVal);
  };

  const handleProteinAdd = (amount) => {
    const current = todayMetrics.protein || 0;
    const nextVal = Math.max(0, current + amount);
    logMetric(todayStr, 'protein', nextVal);
  };

  const handleMoodSelect = (emoji) => {
    logMetric(todayStr, 'mood', emoji);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* ── Top Header Controls ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f1428]/95 border border-white/10 p-5 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg text-white"
            style={{ background: 'var(--color-accent)' }}>
            <Calendar size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-wide">
                {MONTHS[month]} {year}
              </h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold shadow-sm"
                style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-border)' }}>
                {monthAveragePct}% avg completion
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">Interactive Monthly Habit Matrix & Wellness Log</p>
          </div>
        </div>

        {/* View mode toggle & month buttons */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-[#E8843C] to-[#C9A961] text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LayoutGrid size={14} /> Matrix Grid
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-gradient-to-r from-[#E8843C] to-[#C9A961] text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Activity size={14} /> Weekly Focus
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-stone-300 transition-all border border-white/10 active:scale-95"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-stone-300 transition-all border border-white/10 active:scale-95"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Monthly Completion Trend Line Chart ───────────────────────────── */}
      <div className="bg-[#0f1428]/90 border border-white/10 p-5 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#E8843C]" />
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Daily Momentum Trend</span>
          </div>
          <span className="text-xs font-semibold text-stone-400">
            {nDays} days in {MONTHS[month]}
          </span>
        </div>
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyStats} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8843C" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#E8843C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#161b36] border border-white/15 rounded-xl px-3 py-2 shadow-2xl text-xs">
                      <div className="font-extrabold text-[#E8843C]">Day {d.day}: {d.pct}%</div>
                      <div className="text-[10px] text-stone-300">{d.completed} of {d.total} completed</div>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="pct" stroke="#E8843C" strokeWidth={3} fillOpacity={1} fill="url(#colorPct)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── View Mode: Weekly Focus ──────────────────────────────────────────── */}
      {viewMode === 'weekly' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0f1428]/80 p-3.5 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-stone-400">Select Active Week</span>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((wIdx) => (
                <button
                  key={wIdx}
                  onClick={() => setSelectedWeek(wIdx)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedWeek === wIdx
                      ? 'bg-gradient-to-r from-[#E8843C] to-[#C9A961] text-white shadow-lg scale-105'
                      : 'bg-white/5 text-stone-300 hover:bg-white/10'
                  }`}
                >
                  Week {wIdx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTargets.map((target) => {
              const weekDays = daysArray.slice(selectedWeek * 7, Math.min(nDays, (selectedWeek + 1) * 7));
              const doneWeekCount = weekDays.filter((d) => logs[getDayKey(d)]?.[target.id]?.done).length;

              return (
                <div
                  key={target.id}
                  className="bg-[#0f1428]/90 border border-white/10 p-4 rounded-2xl shadow-lg hover:border-[#E8843C]/50 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: target.pillarColor }} />
                      <h4 className="font-bold text-sm text-white">{target.name}</h4>
                    </div>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-[#C9A961]">
                      {doneWeekCount}/{weekDays.length} days
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((d) => {
                      const dKey = getDayKey(d);
                      const isDone = logs[dKey]?.[target.id]?.done || false;
                      const dateObj = new Date(year, month, d);
                      const dayName = WEEKDAYS[dateObj.getDay()];

                      return (
                        <button
                          key={d}
                          onClick={() => toggleHabit(target.id, d)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 active:scale-85 ${
                            isDone
                              ? 'bg-gradient-to-br from-[#E8843C] to-[#C9A961] text-white border-transparent shadow-lg scale-100'
                              : 'bg-white/5 border-white/10 text-stone-400 hover:border-[#E8843C]/50 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-[10px] font-semibold opacity-75">{dayName}</span>
                          <span className="text-xs font-bold mt-0.5">{d}</span>
                          <div className="mt-1">
                            {isDone ? <Check size={13} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-stone-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── View Mode: Matrix Grid ───────────────────────────────────────── */
        <div className="bg-[#0f1428]/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Monthly Habit Matrix</span>
            <button
              onClick={() => setShowAddHabit(!showAddHabit)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E8843C]/20 text-[#E8843C] hover:bg-[#E8843C]/30 border border-[#E8843C]/40 transition-all active:scale-95"
            >
              <Plus size={15} /> Add Habit Target
            </button>
          </div>

          {showAddHabit && (
            <form onSubmit={handleAddCustomHabit} className="mb-4 flex items-center gap-2 bg-white/5 p-3 rounded-2xl border border-white/10">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Enter new custom habit target..."
                className="flex-1 bg-[#151a33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#E8843C]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-[#E8843C] to-[#C9A961] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
              >
                Add
              </button>
            </form>
          )}

          {/* Responsive Scrollable Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-[#0f1428] z-20 text-left p-3 text-xs font-extrabold text-stone-300 min-w-[200px] border-b border-white/10">
                    Habit Target
                  </th>
                  {daysArray.map((d) => {
                    const dateObj = new Date(year, month, d);
                    const dayName = WEEKDAYS[dateObj.getDay()][0];
                    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                    return (
                      <th
                        key={d}
                        className={`p-1.5 text-center text-[10px] font-bold border-b border-white/10 min-w-[34px] ${
                          isWeekend ? 'text-[#E8843C]' : 'text-stone-400'
                        }`}
                      >
                        <div>{dayName}</div>
                        <div className="font-extrabold text-xs text-white mt-0.5">{d}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {allTargets.map((target) => (
                  <tr key={target.id} className="hover:bg-white/[0.04] transition-colors border-b border-white/5">
                    <td className="sticky left-0 bg-[#0f1428] z-10 p-3 text-xs font-semibold text-white flex items-center justify-between min-w-[200px]">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: target.pillarColor }} />
                        <span className="truncate font-medium">{target.name}</span>
                      </div>
                    </td>

                    {daysArray.map((d) => {
                      const dKey = getDayKey(d);
                      const isDone = logs[dKey]?.[target.id]?.done || false;

                      return (
                        <td key={d} className="p-1 text-center align-middle">
                          <button
                            onClick={() => toggleHabit(target.id, d)}
                            className={`w-7 h-7 rounded-xl mx-auto flex items-center justify-center transition-all duration-150 active:scale-75 ${
                              isDone
                                ? 'bg-gradient-to-br from-[#E8843C] to-[#C9A961] text-white shadow-md scale-100'
                                : 'bg-white/5 text-transparent hover:bg-white/10 hover:border hover:border-white/20'
                            }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Health & Daily Metric Counter Widgets ──────────────────────────── */}
      <div className="bg-[#0f1428]/95 border border-white/10 p-5 rounded-3xl shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-[#E8843C]" />
            <h3 className="font-extrabold text-base text-white">Daily Health & Wellness Dashboard</h3>
          </div>
          <span className="text-xs text-stone-400 font-semibold">Today ({todayStr})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Water Tracker Widget */}
          <div className="bg-white/5 border border-white/10 p-4.5 rounded-2xl space-y-3 hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Droplets size={19} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Water Intake</h4>
                  <p className="text-[10px] text-stone-400">Target: 3.0 L</p>
                </div>
              </div>
              <span className="text-xl font-black text-blue-400">{todayMetrics.water || 0} L</span>
            </div>

            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300 shadow-lg"
                style={{ width: `${Math.min(100, ((todayMetrics.water || 0) / 3.0) * 100)}%` }}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleWaterAdd(0.25)}
                className="flex-1 py-1.5 rounded-xl bg-blue-500/15 text-xs font-bold text-blue-300 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all active:scale-95"
              >
                +250 ml
              </button>
              <button
                onClick={() => handleWaterAdd(0.5)}
                className="flex-1 py-1.5 rounded-xl bg-blue-500/15 text-xs font-bold text-blue-300 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all active:scale-95"
              >
                +500 ml
              </button>
              <button
                onClick={() => handleWaterAdd(-0.25)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-stone-400 hover:bg-red-500/80 hover:text-white transition-all active:scale-95"
              >
                -250
              </button>
            </div>
          </div>

          {/* Protein Tracker Widget */}
          <div className="bg-white/5 border border-white/10 p-4.5 rounded-2xl space-y-3 hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Dumbbell size={19} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Protein Intake</h4>
                  <p className="text-[10px] text-stone-400">Target: 80 g</p>
                </div>
              </div>
              <span className="text-xl font-black text-amber-400">{todayMetrics.protein || 0} g</span>
            </div>

            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-300 shadow-lg"
                style={{ width: `${Math.min(100, ((todayMetrics.protein || 0) / 80) * 100)}%` }}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleProteinAdd(10)}
                className="flex-1 py-1.5 rounded-xl bg-amber-500/15 text-xs font-bold text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all active:scale-95"
              >
                +10 g
              </button>
              <button
                onClick={() => handleProteinAdd(25)}
                className="flex-1 py-1.5 rounded-xl bg-amber-500/15 text-xs font-bold text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all active:scale-95"
              >
                +25 g
              </button>
              <button
                onClick={() => handleProteinAdd(-10)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-stone-400 hover:bg-red-500/80 hover:text-white transition-all active:scale-95"
              >
                -10
              </button>
            </div>
          </div>

          {/* Mood & Energy Widget */}
          <div className="bg-white/5 border border-white/10 p-4.5 rounded-2xl space-y-3 hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Today's Mood & State</h4>
              <span className="text-xl">{todayMetrics.mood || '✨'}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {MOODS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => handleMoodSelect(emoji)}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition-all active:scale-90 ${
                    todayMetrics.mood === emoji
                      ? 'bg-gradient-to-r from-[#E8843C] to-[#C9A961] text-white border-transparent shadow-lg'
                      : 'bg-white/5 border-white/10 text-stone-300 hover:border-[#E8843C]/50 hover:bg-white/10'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
