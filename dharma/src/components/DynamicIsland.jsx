import { useState } from 'react';
import { Flame, Timer, X, Droplets, Sparkles, ChevronDown } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { getTodayCompletedCount, getCurrentStreak } from '../utils/streakUtils';
import { todayKey } from '../utils/dateUtils';

export default function DynamicIsland({ onOpenFocus }) {
  const [expanded, setExpanded] = useState(false);
  const { state, logMetric } = useStorage();

  const pillars = state.pillars || DEFAULT_PILLARS;
  const logs = state.logs || {};
  const metrics = state.metrics || {};
  const today = todayKey();

  const { done, total } = getTodayCompletedCount(logs, pillars);
  const streak = getCurrentStreak(logs, pillars);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const waterLog = metrics[today]?.water || 0;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-w-[95vw] sm:max-w-md w-full px-2">
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          boxShadow: expanded
            ? '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(240,90,54,0.25)'
            : '0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(240,90,54,0.15)',
        }}
        className={`relative overflow-hidden cursor-pointer select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-2xl border ${
          expanded
            ? 'rounded-[2rem] p-5 bg-[#181926]/95 border-[#F05A36]/40 text-white ring-1 ring-[#F05A36]/30'
            : 'rounded-full px-4 sm:px-5 py-2.5 bg-[#181926]/90 hover:bg-[#202334] border-[#F05A36]/30 text-white hover:border-[#F05A36]/60'
        }`}
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#F05A36] to-transparent opacity-75" />

        {/* Collapsed Pill View */}
        <div
          className={`transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            expanded
              ? 'opacity-0 scale-95 pointer-events-none absolute inset-0 px-5 py-2.5 flex items-center justify-between'
              : 'opacity-100 scale-100 flex items-center justify-between gap-2 sm:gap-4 text-[11px] sm:text-xs font-extrabold text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[#F05A36] shrink-0">
            <Flame size={14} className="animate-pulse" />
            <span>{streak}d Streak</span>
          </div>

          <div className="w-px h-3.5 bg-white/15 shrink-0" />

          <div className="flex items-center gap-2 text-white/90 min-w-0">
            <span className="tabular-nums shrink-0">{done}/{total}</span>
            <div className="w-10 sm:w-14 h-1.5 rounded-full bg-white/15 overflow-hidden shrink-0">
              <div
                className="h-full rounded-full bg-[#F05A36] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[#F05A36] shrink-0 font-extrabold">{pct}%</span>
          </div>

          <div className="w-px h-3.5 bg-white/15 shrink-0" />

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenFocus) onOpenFocus();
              }}
              className="flex items-center gap-1 text-[10px] sm:text-[11px] text-white bg-[#F05A36] px-3 py-1 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md font-bold"
            >
              <Timer size={11} /> Focus
            </button>
            <ChevronDown size={12} className="text-white/40 ml-0.5" />
          </div>
        </div>

        {/* Expanded Island Dashboard Card */}
        <div
          className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            expanded
              ? 'opacity-100 scale-100 space-y-4 text-white'
              : 'opacity-0 scale-95 pointer-events-none absolute inset-0 p-5'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#F05A36]/20 border border-[#F05A36]/30 flex items-center justify-center text-[#F05A36]">
                <Flame size={18} className="animate-bounce" />
              </div>
              <div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#F05A36] flex items-center gap-1">
                  <Sparkles size={11} /> Dynamic Practice Island
                </h4>
                <p className="text-xs sm:text-sm font-extrabold text-white">{streak} Days Continuous Practice</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Stats Grid inside Dynamic Island */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-[9px] text-stone-400 uppercase font-extrabold tracking-wider">Today's Progress</div>
              <div className="text-sm font-extrabold text-white">{done} of {total} targets</div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#F05A36] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div className="text-[9px] text-stone-400 uppercase font-extrabold tracking-wider">Hydration Tracker</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-extrabold text-teal-400 tabular-nums">{waterLog} ml</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    logMetric(today, 'water', waterLog + 250);
                  }}
                  className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-xl text-[10px] font-extrabold transition-all border border-teal-500/30"
                >
                  +250ml 💧
                </button>
              </div>
            </div>
          </div>

          {/* Action button inside island */}
          <div className="pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
                if (onOpenFocus) onOpenFocus();
              }}
              className="w-full py-2.5 rounded-2xl bg-[#F05A36] text-white text-xs font-extrabold shadow-lg hover:bg-[#d94a28] active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <Timer size={14} /> Start 25m Focus Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
