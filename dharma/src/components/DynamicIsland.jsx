import { useState, useMemo } from 'react';
import { Flame, Timer, X, Check, Droplets } from 'lucide-react';
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
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] sm:max-w-md w-full px-2 pointer-events-auto">
      <div
        onClick={() => setExpanded(!expanded)}
        className={`cursor-pointer transition-all duration-300 ease-out select-none border border-[#EF5A34]/35 shadow-2xl backdrop-blur-xl ${
          expanded
            ? 'rounded-3xl p-4 sm:p-5 w-full bg-[#181925]/95 border-[#EF5A34]/50 ring-1 ring-[#EF5A34]/20 shadow-orange-950/40'
            : 'rounded-full px-4 sm:px-5 py-2 bg-[#181925]/90 hover:bg-[#202333] hover:border-[#EF5A34]/60 shadow-black/60'
        }`}
      >
        {!expanded ? (
          /* Collapsed Pill View */
          <div className="flex items-center justify-between gap-2 sm:gap-4 text-[11px] sm:text-xs font-bold text-white">
            <div className="flex items-center gap-1.5 text-[#EF5A34] shrink-0">
              <Flame size={14} className="animate-pulse" />
              <span>{streak}d Streak</span>
            </div>

            <div className="w-px h-3 bg-white/15 shrink-0" />

            <div className="flex items-center gap-2 text-white/80 min-w-0">
              <span className="tabular-nums shrink-0">{done}/{total}</span>
              <div className="w-10 sm:w-14 h-1.5 rounded-full bg-white/10 overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#EF5A34] to-[#E6A04E] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[#E6A04E] shrink-0">{pct}%</span>
            </div>

            <div className="w-px h-3 bg-white/15 shrink-0" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenFocus) onOpenFocus();
              }}
              className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#EF5A34] bg-[#EF5A34]/15 px-2.5 py-1 rounded-full hover:bg-[#EF5A34]/25 transition-all shrink-0"
            >
              <Timer size={11} /> Focus
            </button>
          </div>
        ) : (
          /* Expanded Island Dashboard Card */
          <div className="space-y-3.5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EF5A34]/20 flex items-center justify-center text-[#EF5A34]">
                  <Flame size={16} />
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#EF5A34]">Streak & Practice</h4>
                  <p className="text-xs sm:text-sm font-bold text-white">{streak} Days Continuous Practice</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 text-white/40 hover:text-white"
              >
                <X size={13} />
              </button>
            </div>

            {/* Quick Stats Grid inside Dynamic Island */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/8">
                <div className="text-[9px] text-white/40 uppercase font-semibold">Today's Progress</div>
                <div className="text-sm font-extrabold text-white mt-0.5">{done} of {total} targets</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#EF5A34] to-[#E6A04E]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/8 flex flex-col justify-between">
                <div className="text-[9px] text-white/40 uppercase font-semibold">Hydration Tracker</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-[#5A8A8A] tabular-nums">{waterLog} ml</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      logMetric(today, 'water', waterLog + 250);
                    }}
                    className="px-2 py-1 bg-[#5A8A8A]/20 hover:bg-[#5A8A8A]/30 text-[#5A8A8A] rounded-lg text-[10px] font-bold transition-all"
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
                className="w-full py-2 rounded-xl bg-gradient-to-r from-[#EF5A34] to-[#E6A04E] text-white text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
              >
                <Timer size={13} /> Start 25m Focus Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
