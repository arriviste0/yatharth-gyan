import { NavLink, useLocation } from 'react-router-dom';
import { Home, Layers, BookOpen, BarChart2, BookMarked, Settings, Timer, Target, LogIn, Cloud, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { getTodayCompletedCount, getCurrentStreak } from '../utils/streakUtils';
import { formatDateDisplay, todayKey } from '../utils/dateUtils';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/home',    label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/sadhana', label: 'Pillars',   Icon: Layers },
  { path: '/manan',   label: 'Journal',   Icon: BookOpen },
  { path: '/gyaan',   label: 'Wisdom',    Icon: BookMarked },
];

/* ── Mobile bottom bar ──────────────────────────────────────────────────────── */
export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#FAF6F0]/90 dark:bg-[#181925]/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10 safe-bottom z-50 lg:hidden">
      <div className="flex items-stretch px-2 py-1.5">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all duration-200 relative"
              style={isActive ? { background: 'rgba(239, 90, 52, 0.12)' } : {}}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.4 : 1.7}
                style={{ color: isActive ? '#EF5A34' : '#9CA3AF' }}
              />
              <span
                className="text-[9px] font-bold tracking-wide"
                style={{ color: isActive ? '#EF5A34' : '#9CA3AF' }}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/* ── Desktop side nav ───────────────────────────────────────────────────────── */
export function SideNav({ onOpenFocus, onOpenProfile }) {
  const location  = useLocation();
  const { state } = useStorage();
  const pillars   = state.pillars || DEFAULT_PILLARS;
  const { logs, settings } = state;

  const { done, total } = getTodayCompletedCount(logs, pillars);
  const streak          = getCurrentStreak(logs, pillars);
  const dateInfo        = formatDateDisplay(new Date());
  const today           = todayKey();
  const completion      = total > 0 ? done / total : 0;
  const pct             = Math.round(completion * 100);
  const todayIntention  = state.intentions?.[today] || '';
  const dailyVerse      = useDailyVerse();
  const { user, syncing, lastSync } = useAuth();

  return (
    <nav className="hidden lg:flex flex-col w-60 min-h-screen bg-[#FAF6F0] dark:bg-[#12141F] border-r border-black/5 dark:border-white/5 px-3.5 py-8 sticky top-0 shrink-0">
      {/* Logo + profile */}
      <div className="mb-6 px-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#EF5A34] to-[#E6A04E] flex items-center justify-center font-bold text-xl text-white shadow-md">
            ॐ
          </div>
          <div>
            <div className="font-extrabold text-sm text-[#18191E] dark:text-white">Dharma</div>
            <div className="text-[11px] text-[#EF5A34] font-semibold">Private Practice</div>
          </div>
        </div>

        {/* Profile card */}
        {user ? (
          <button onClick={onOpenProfile}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl transition-all hover:bg-black/5 dark:hover:bg-white/5 text-left">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
              style={{ background: user.avatarColor || '#EF5A34' }}>
              {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#18191E] dark:text-white truncate">{user.name}</div>
              <div className="text-[10px] text-stone-400 flex items-center gap-1">
                {syncing  ? <><Cloud size={9} className="animate-pulse text-[#EF5A34]" />syncing…</>
                : lastSync ? <><CheckCircle2 size={9} className="text-emerald-500" />synced</>
                : 'cloud ready'}
              </div>
            </div>
          </button>
        ) : (
          <button onClick={onOpenProfile}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm"
            style={{ background: 'rgba(239,90,52,0.12)', color: '#EF5A34' }}>
            <LogIn size={14} /> Sign in to sync
          </button>
        )}
      </div>

      {/* Today's status card */}
      <div className="mx-0 mb-5 px-3.5 py-3.5 rounded-2xl" style={{ background: 'rgba(239,90,52,0.08)' }}>
        <div className="text-[10px] font-bold text-[#EF5A34] uppercase tracking-widest mb-2">
          {dateInfo.dayEn.slice(0, 3)} · {dateInfo.short}
        </div>
        {/* Mini progress bar */}
        <div className="h-1.5 rounded-full bg-black/6 dark:bg-white/8 mb-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #EF5A34, #E6A04E)',
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">{done}/{total} done</span>
          {!settings.silentMode && streak > 0 && (
            <span className="text-xs font-bold" style={{ color: '#EF5A34' }}>
              🔥 {streak}d
            </span>
          )}
        </div>
      </div>

      {/* Nav links */}
      <div className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'text-[#EF5A34] shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-[#18191E] dark:hover:text-white'
              }`}
              style={isActive ? { background: 'rgba(239,90,52,0.12)' } : {}}
            >
              <Icon size={18} strokeWidth={isActive ? 2.3 : 1.7} />
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF5A34' }} />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom: Focus + Settings */}
      <div className="mt-4 border-t border-black/5 dark:border-white/5 pt-4 space-y-1">
        {onOpenFocus && (
          <button onClick={onOpenFocus}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-stone-500 hover:text-[#EF5A34] transition-all">
            <Timer size={17} strokeWidth={1.7} />
            Focus Timer
          </button>
        )}
        <NavLink
          to="/settings"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            location.pathname === '/settings'
              ? 'text-[#EF5A34] bg-[#EF5A34]/12'
              : 'text-stone-500 hover:text-[#18191E] dark:hover:text-white'
          }`}
        >
          <Settings size={17} strokeWidth={1.7} />
          Settings
        </NavLink>
      </div>
    </nav>
  );
}
