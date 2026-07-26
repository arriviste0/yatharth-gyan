import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Flame, Sparkles, CheckCircle2, Calendar as CalendarIcon, Award, Layers } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { getTodayCompletedCount, getCurrentStreak } from '../utils/streakUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function PracticeCalendarModal({ onClose }) {
  const { state } = useStorage();
  const pillars = state.pillars || DEFAULT_PILLARS;
  const logs = state.logs || {};

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'yearly'

  const streak = getCurrentStreak(logs, pillars);

  // Calculate day completion rate for a specific date
  const getDayStats = (y, m, d) => {
    const monthStr = String(m + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateKeyStr = `${y}-${monthStr}-${dayStr}`;
    
    const dayLog = logs[dateKeyStr] || {};
    const totalTargets = pillars.flatMap(p => p.targets).length;
    let doneCount = 0;

    pillars.forEach(p => {
      p.targets.forEach(t => {
        if (dayLog[t.id]?.done) doneCount++;
      });
    });

    const pct = totalTargets > 0 ? Math.round((doneCount / totalTargets) * 100) : 0;
    return { done: doneCount, total: totalTargets, pct, dateKeyStr };
  };

  // Monthly days array
  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const startDay = getFirstDayOfWeek(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const selectedStats = useMemo(() => {
    return getDayStats(currentYear, currentMonth, selectedDay);
  }, [currentYear, currentMonth, selectedDay, logs, pillars]);

  // Determine badge color intensity based on completion percentage
  const getIntensityStyle = (pct, isDone) => {
    if (pct >= 80) {
      return 'bg-[#F05A36] text-white shadow-sm shadow-[#F05A36]/40 font-extrabold';
    } else if (pct >= 50) {
      return 'bg-[#E6A04E]/90 text-white font-bold';
    } else if (pct > 0) {
      return 'bg-[#14B8A6]/90 text-white font-bold';
    }
    return 'bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-400 font-medium';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-3xl z-10 overflow-y-auto max-h-[92svh] no-scrollbar bg-white dark:bg-[#181926] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F05A36]/15 border border-[#F05A36]/30 flex items-center justify-center text-[#F05A36]">
              <Flame size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#18191E] dark:text-white flex items-center gap-2">
                Practice & Streak Calendar
              </h3>
              <p className="text-xs font-semibold text-[#F05A36] flex items-center gap-1">
                <Sparkles size={12} /> {streak} Days Continuous Streak
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 text-stone-400 hover:text-[#18191E] dark:hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* View mode toggle (Monthly vs Yearly) */}
        <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/8">
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'monthly' ? 'bg-[#F05A36] text-white shadow-sm' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <CalendarIcon size={14} /> Monthly View
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'yearly' ? 'bg-[#F05A36] text-white shadow-sm' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Layers size={14} /> Yearly Heatmap
          </button>
        </div>

        {/* Intensity Legend (Reference UI) */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 py-2 px-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-[10px] sm:text-xs font-bold text-stone-600 dark:text-stone-300 flex-wrap">
          <span className="text-stone-400 uppercase tracking-widest text-[9px]">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F05A36]" /> High (80%+)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E6A04E]" /> Avg (50%+)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]" /> Low (&lt;50%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700" /> Rest
          </span>
        </div>

        {/* ── Monthly Calendar View ──────────────────────────────── */}
        {viewMode === 'monthly' && (
          <div className="space-y-4">
            {/* Month & Year Navigation */}
            <div className="flex items-center justify-between px-2">
              <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:border-[#F05A36] transition-all">
                <ChevronLeft size={16} />
              </button>
              <h4 className="text-sm font-extrabold text-[#18191E] dark:text-white tracking-wide">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h4>
              <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:border-[#F05A36] transition-all">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-extrabold text-stone-400">
              {WEEKDAYS.map((wd, i) => (
                <div key={i} className="py-1">{wd}</div>
              ))}
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty padding for month start */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days of month */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const stats = getDayStats(currentYear, currentMonth, day);
                const isSelected = selectedDay === day;
                const isToday = now.getFullYear() === currentYear && now.getMonth() === currentMonth && now.getDate() === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative text-xs transition-all ${getIntensityStyle(
                      stats.pct,
                      stats.done > 0
                    )} ${isSelected ? 'ring-2 ring-offset-2 ring-[#F05A36] dark:ring-offset-[#181926] scale-105 z-10' : ''}`}
                  >
                    <span>{day}</span>
                    {isToday && (
                      <span className="w-1 h-1 rounded-full bg-white absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Stats Panel */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/8 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#18191E] dark:text-white">
                  {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#F05A36]/15 text-[#F05A36]">
                  {selectedStats.pct}% Completed
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-300 pt-1">
                <span>Targets Completed:</span>
                <span className="font-extrabold text-[#18191E] dark:text-white">{selectedStats.done} of {selectedStats.total}</span>
              </div>

              <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden mt-1">
                <div
                  className="h-full rounded-full bg-[#F05A36] transition-all duration-500"
                  style={{ width: `${selectedStats.pct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Yearly Heatmap View ─────────────────────────────────── */}
        {viewMode === 'yearly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-stone-400 uppercase tracking-widest">Year {currentYear} Progress Overview</span>
              <span className="text-xs font-extrabold text-[#F05A36]">{streak} Days Active</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {MONTH_NAMES.map((mName, mIdx) => {
                const nD = getDaysInMonth(currentYear, mIdx);
                let totalPct = 0;
                for (let d = 1; d <= nD; d++) {
                  totalPct += getDayStats(currentYear, mIdx, d).pct;
                }
                const avgPct = Math.round(totalPct / nD);

                return (
                  <button
                    key={mName}
                    onClick={() => {
                      setCurrentMonth(mIdx);
                      setViewMode('monthly');
                    }}
                    className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/8 hover:border-[#F05A36] text-left transition-all group"
                  >
                    <div className="text-xs font-extrabold text-[#18191E] dark:text-white group-hover:text-[#F05A36]">{mName.slice(0, 3)}</div>
                    <div className="text-[10px] text-stone-400 mt-1">{avgPct}% avg</div>
                    <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden mt-1.5">
                      <div className="h-full rounded-full bg-[#F05A36]" style={{ width: `${avgPct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
