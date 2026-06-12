import { NavLink, useLocation } from 'react-router-dom';
import { Home, Layers, BookOpen, BarChart2, BookMarked, Settings, Timer, Target, LogIn, Cloud, CheckCircle2 } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { getTodayCompletedCount, getCurrentStreak } from '../utils/streakUtils';
import { formatDateDisplay, todayKey } from '../utils/dateUtils';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/home',    label: 'Today',     Icon: Home },
  { path: '/sadhana', label: 'Pillars',   Icon: Layers },
  { path: '/manan',   label: 'Journal',   Icon: BookOpen },
  { path: '/drishti', label: 'Dashboard', Icon: BarChart2 },
  { path: '/gyaan',   label: 'Wisdom',    Icon: BookMarked },
];

/* ── Mobile bottom bar ──────────────────────────────────────────────────────── */
export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-nav safe-bottom z-50 lg:hidden">
      <div className="flex items-stretch px-2 py-1">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <NavLink
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl transition-all duration-200 relative"
              style={isActive ? { background: 'rgba(232,132,60,0.12)' } : {}}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.3 : 1.6}
                style={{ color: isActive ? '#E8843C' : '#9CA3AF' }}
              />
              <span
                className="text-[9px] font-semibold tracking-wide"
                style={{ color: isActive ? '#E8843C' : '#9CA3AF' }}
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
    <nav className="hidden lg:flex flex-col w-60 min-h-screen bg-white dark:bg-[#0a0a16] border-r border-black/5 dark:border-white/5 px-3 py-8 sticky top-0 shrink-0">
      {/* Logo + profile */}
      <div className="mb-6 px-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-dev text-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #2D3561, #5B6BAF)', color: '#C9A961' }}>
            ॐ
          </div>
          <div>
            <div className="font-bold text-sm text-[#1a1a2e] dark:text-white">Dharma</div>
            <div className="text-[11px] text-stone-400">Private Practice</div>
          </div>
        </div>

        {/* Profile card */}
        {user ? (
          <button onClick={onOpenProfile}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all hover:bg-black/4 dark:hover:bg-white/5 text-left">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
              style={{ background: user.avatarColor || '#E8843C' }}>
              {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#1a1a2e] dark:text-white truncate">{user.name}</div>
              <div className="text-[10px] text-stone-400 flex items-center gap-1">
                {syncing  ? <><Cloud size={9} className="animate-pulse" />syncing…</>
                : lastSync ? <><CheckCircle2 size={9} className="text-emerald-500" />synced</>
                : 'cloud ready'}
              </div>
            </div>
          </button>
        ) : (
          <button onClick={onOpenProfile}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(232,132,60,0.10)', color: '#E8843C' }}>
            <LogIn size={13} /> Sign in to sync
          </button>
        )}
      </div>

      {/* Today's status card */}
      <div className="mx-0 mb-5 px-3 py-3 rounded-2xl" style={{ background: 'rgba(232,132,60,0.07)' }}>
        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-2">
          {dateInfo.dayEn.slice(0, 3)} · {dateInfo.short}
        </div>
        {/* Mini progress bar */}
        <div className="h-1.5 rounded-full bg-black/6 dark:bg-white/8 mb-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct >= 80 ? '#C9A961' : '#E8843C',
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-stone-500 dark:text-stone-400">{done}/{total} done</span>
          {!settings.silentMode && streak > 0 && (
            <span className="text-xs font-bold" style={{ color: '#E8843C' }}>
              🔥 {streak}d
            </span>
          )}
        </div>
      </div>

      {/* Today's intention (#48) */}
      {todayIntention && (
        <div className="mx-0 mb-4 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(201,169,97,0.07)', border: '1px solid rgba(201,169,97,0.15)' }}>
          <div className="flex items-center gap-1 mb-1">
            <Target size={9} style={{ color: '#C9A961' }} />
            <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#C9A961' }}>Today's intention</span>
          </div>
          <p className="font-verse italic text-xs text-stone-500 dark:text-stone-400 leading-snug line-clamp-2">"{todayIntention}"</p>
        </div>
      )}

      {/* Daily verse (#48) */}
      {dailyVerse && (
        <div className="mx-0 mb-4 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(45,53,97,0.05)', border: '1px solid rgba(45,53,97,0.10)' }}>
          <div className="text-[9px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
            BG {dailyVerse.chapter}.{dailyVerse.verse}
          </div>
          <p className="font-verse italic text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-3">
            "{dailyVerse.english}"
          </p>
        </div>
      )}

      {/* Nav links */}
      <div className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-[#E8843C]'
                  : 'text-stone-500 dark:text-stone-400 hover:text-[#1a1a2e] dark:hover:text-white'
              }`}
              style={isActive ? { background: 'rgba(232,132,60,0.1)' } : {}}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.7} />
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#E8843C' }} />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom: Focus + Settings */}
      <div className="mt-4 border-t border-black/5 dark:border-white/5 pt-4 space-y-0.5">
        {onOpenFocus && (
          <button onClick={onOpenFocus}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-400 hover:text-[#E8843C] transition-all">
            <Timer size={17} strokeWidth={1.7} />
            Focus Timer
          </button>
        )}
        <NavLink
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            location.pathname === '/settings'
              ? 'text-[#E8843C] bg-[#E8843C]/10'
              : 'text-stone-400 hover:text-[#1a1a2e] dark:hover:text-white'
          }`}
        >
          <Settings size={17} strokeWidth={1.7} />
          Settings
        </NavLink>
      </div>
    </nav>
  );
}
