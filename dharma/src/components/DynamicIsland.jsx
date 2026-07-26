import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Timer, X, Droplets, Sparkles, ChevronDown, Calendar as CalendarIcon, LogIn } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { getTodayCompletedCount, getCurrentStreak } from '../utils/streakUtils';
import { todayKey } from '../utils/dateUtils';
import PracticeCalendarModal from './PracticeCalendarModal';

export default function DynamicIsland({ onOpenFocus, onOpenProfile }) {
  const [expanded, setExpanded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { state, logMetric } = useStorage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const pillars = state.pillars || DEFAULT_PILLARS;
  const logs = state.logs || {};
  const metrics = state.metrics || {};
  const today = todayKey();

  const { done, total } = getTodayCompletedCount(logs, pillars);
  const streak = getCurrentStreak(logs, pillars);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const waterLog = metrics[today]?.water || 0;

  const goToDailyTasks = (e) => {
    e.stopPropagation();
    setExpanded(false);
    navigate('/home');
    setTimeout(() => {
      document.getElementById('daily-targets')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const openStreakCalendar = (e) => {
    e.stopPropagation();
    setExpanded(false);
    setShowCalendar(true);
  };

  return (
    <>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex justify-center w-full px-3">
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            transformOrigin: 'top center',
            borderRadius: expanded ? '28px' : '24px',
            boxShadow: expanded
              ? '0 30px 80px -10px rgba(0,0,0,0.7), 0 0 60px -5px rgba(240,90,54,0.35)'
              : '0 12px 35px -5px rgba(0,0,0,0.45), 0 0 18px rgba(240,90,54,0.2)',
            transition: 'all 500ms cubic-bezier(0.34, 1.4, 0.64, 1)',
          }}
          className={`relative overflow-hidden cursor-pointer select-none backdrop-blur-2xl border transition-all duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] active:scale-[0.98] ${
            expanded
              ? 'w-full max-w-md p-5 bg-[#181926]/95 border-[#F05A36]/40 text-white ring-1 ring-[#F05A36]/30'
              : 'w-auto max-w-[92vw] sm:max-w-sm px-4 sm:px-5 py-2.5 bg-[#181926]/90 hover:bg-[#202334] border-[#F05A36]/30 text-white hover:border-[#F05A36]/60'
          }`}
        >
          {/* Ambient Top Glow Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-[1.5px] bg-gradient-to-r from-transparent via-[#F05A36] to-transparent opacity-80" />

          {/* Collapsed Pill View */}
          <div
            className={`transition-all duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
              expanded
                ? 'opacity-0 scale-90 pointer-events-none absolute -translate-y-3'
                : 'opacity-100 scale-100 translate-y-0 flex items-center justify-between gap-2.5 sm:gap-4 text-[11px] sm:text-xs font-extrabold text-white'
            }`}
          >
            {/* Streak numeric button -> opens calendar modal */}
            <button
              onClick={openStreakCalendar}
              title="Open Streak & Practice Calendar"
              className="flex items-center gap-1.5 text-[#F05A36] shrink-0 hover:scale-105 transition-all"
            >
              <Flame size={14} className="animate-pulse" />
              <span>{streak}d Streak</span>
            </button>

            <div className="w-px h-3.5 bg-white/15 shrink-0" />

            {/* Task count button -> redirects to Daily Practice Targets */}
            <button
              onClick={goToDailyTasks}
              title="Go to Daily Practice Targets"
              className="flex items-center gap-2 text-white/90 hover:text-white shrink-0 min-w-0 transition-all hover:scale-102"
            >
              <span className="tabular-nums shrink-0 font-extrabold">{done}/{total}</span>
              <div className="w-10 sm:w-14 h-1.5 rounded-full bg-white/15 overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full bg-[#F05A36] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[#F05A36] shrink-0 font-extrabold">{pct}%</span>
            </button>

            <div className="w-px h-3.5 bg-white/15 shrink-0" />

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenFocus) onOpenFocus();
                }}
                className="flex items-center gap-1 text-[10px] sm:text-[11px] text-white bg-[#F05A36] px-2.5 py-1 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md font-bold"
              >
                <Timer size={11} /> Focus
              </button>

              {/* Profile / Sign In Button inside Collapsed Island */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenProfile) onOpenProfile();
                }}
                title={user ? user.name : 'Sign in'}
                className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/20 flex items-center justify-center bg-white/10 text-white hover:scale-105 active:scale-95 transition-all"
              >
                {user ? (
                  user.avatarPhoto ? (
                    <img src={user.avatarPhoto} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] font-extrabold" style={{ color: user.avatarColor || '#F05A36' }}>
                      {user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  )
                ) : (
                  <LogIn size={11} className="text-stone-300" />
                )}
              </button>

              <ChevronDown size={12} className="text-white/40 ml-0.5" />
            </div>
          </div>

          {/* Expanded Island Dashboard Card (Smooth Spring Grid Height Animation) */}
          <div
            className={`grid transition-all duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
              expanded
                ? 'grid-rows-[1fr] opacity-100 scale-100 pt-0'
                : 'grid-rows-[0fr] opacity-0 scale-90 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden space-y-4 text-white">
              <div className="flex items-center justify-between">
                <button
                  onClick={openStreakCalendar}
                  title="View Practice & Streak Calendar"
                  className="flex items-center gap-2.5 text-left group"
                >
                  <div className="w-9 h-9 rounded-2xl bg-[#F05A36]/20 border border-[#F05A36]/30 flex items-center justify-center text-[#F05A36] group-hover:scale-105 transition-all">
                    <Flame size={18} className="animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#F05A36] flex items-center gap-1 group-hover:underline">
                      <CalendarIcon size={11} /> Practice & Streak Calendar
                    </h4>
                    <p className="text-xs sm:text-sm font-extrabold text-white">{streak} Days Continuous Practice</p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white transition-all text-xs font-bold border border-white/10"
                  >
                    {user ? (
                      <>
                        <div className="w-4 h-4 rounded-full overflow-hidden bg-[#F05A36] text-white flex items-center justify-center text-[8px] font-extrabold shrink-0">
                          {user.avatarPhoto ? (
                            <img src={user.avatarPhoto} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                          )}
                        </div>
                        <span className="truncate max-w-[70px]">{user.name.split(' ')[0]}</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={13} className="text-[#F05A36]" />
                        <span>Sign in</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Quick Stats Grid inside Dynamic Island */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* Today's Progress -> Redirects to Daily Practice Targets */}
                <button
                  onClick={goToDailyTasks}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group"
                >
                  <div className="text-[9px] text-stone-400 uppercase font-extrabold tracking-wider group-hover:text-[#F05A36]">Today's Progress ➔</div>
                  <div className="text-sm font-extrabold text-white mt-0.5">{done} of {total} targets</div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#F05A36] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>

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
      </div>

      {/* Practice & Streak Calendar Modal */}
      {showCalendar && (
        <PracticeCalendarModal onClose={() => setShowCalendar(false)} />
      )}
    </>
  );
}
