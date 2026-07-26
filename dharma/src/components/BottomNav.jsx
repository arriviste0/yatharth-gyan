import { NavLink, useLocation } from 'react-router-dom';
import {
  Layers, BookOpen, BookMarked, Settings, Timer, LogIn, Cloud,
  CheckCircle2, LayoutDashboard, Sun, Moon
} from 'lucide-react';
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
  { path: '/settings', label: 'Settings',  Icon: Settings },
];

/* ── Mobile bottom bar ──────────────────────────────────────────────────────── */
export default function BottomNav({ onOpenProfile }) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-nav safe-bottom z-50 lg:hidden">
      <div className="flex items-stretch px-2 py-1.5">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all duration-200 relative"
              style={isActive ? { background: 'rgba(240, 90, 54, 0.12)' } : {}}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.4 : 1.7}
                style={{ color: isActive ? '#F05A36' : '#9CA3AF' }}
              />
              <span
                className="text-[9px] font-bold tracking-wide"
                style={{ color: isActive ? '#F05A36' : '#9CA3AF' }}
              >
                {label}
              </span>
            </NavLink>
          );
        })}

        {/* Mobile Profile / Sign In Button */}
        <button
          onClick={onOpenProfile}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all duration-200 relative"
        >
          {user ? (
            user.avatarPhoto ? (
              <div className="w-5 h-5 rounded-full overflow-hidden border border-[#F05A36]/60 shadow-sm">
                <img src={user.avatarPhoto} alt={user.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shadow-sm"
                style={{ background: user.avatarColor || '#F05A36' }}
              >
                {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )
          ) : (
            <LogIn size={19} strokeWidth={1.7} style={{ color: '#9CA3AF' }} />
          )}
          <span className="text-[9px] font-bold tracking-wide text-stone-400">
            {user ? 'Profile' : 'Sign in'}
          </span>
        </button>
      </div>
    </nav>
  );
}

/* ── Desktop side nav ───────────────────────────────────────────────────────── */
export function SideNav({ onOpenFocus, onOpenProfile }) {
  const location  = useLocation();
  const { state, updateSettings } = useStorage();
  const pillars   = state.pillars || DEFAULT_PILLARS;
  const { logs, settings } = state;

  const isDark = settings.theme === 'dark';

  function toggleTheme() {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  }

  const { done, total } = getTodayCompletedCount(logs, pillars);
  const streak          = getCurrentStreak(logs, pillars);
  const dateInfo        = formatDateDisplay(new Date());
  const completion      = total > 0 ? done / total : 0;
  const pct             = Math.round(completion * 100);
  const { user, syncing, lastSync } = useAuth();

  return (
    <nav className="hidden lg:flex flex-col w-60 min-h-screen bg-[#FBF9F5] dark:bg-[#12131C] border-r border-black/5 dark:border-white/5 px-4 py-8 sticky top-0 shrink-0">
      {/* Logo + profile */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F05A36] flex items-center justify-center font-bold text-xl text-white shadow-md shadow-[#F05A36]/30">
            ॐ
          </div>
          <div>
            <div className="font-extrabold text-sm text-[#18191E] dark:text-white">Dharma</div>
            <div className="text-[11px] text-[#F05A36] font-bold">Private Practice</div>
          </div>
        </div>

        {/* Profile card */}
        {user ? (
          <button onClick={onOpenProfile}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl transition-all hover:bg-black/5 dark:hover:bg-white/5 text-left border border-black/5 dark:border-white/5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
              style={{ background: user.avatarColor || '#F05A36' }}>
              {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#18191E] dark:text-white truncate">{user.name}</div>
              <div className="text-[10px] text-stone-400 flex items-center gap-1">
                {syncing  ? <><Cloud size={9} className="animate-pulse text-[#F05A36]" />syncing…</>
                : lastSync ? <><CheckCircle2 size={9} className="text-emerald-500" />synced</>
                : 'cloud ready'}
              </div>
            </div>
          </button>
        ) : (
          <button onClick={onOpenProfile}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-xs font-extrabold transition-all shadow-sm"
            style={{ background: '#F05A36', color: '#FFFFFF' }}>
            <LogIn size={14} /> Sign in to sync
          </button>
        )}
      </div>

      {/* Today's status card */}
      <div className="mb-5 px-4 py-3.5 rounded-3xl bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm">
        <div className="text-[10px] font-extrabold text-[#F05A36] uppercase tracking-widest mb-2">
          {dateInfo.dayEn.slice(0, 3)} · {dateInfo.short}
        </div>
        {/* Mini progress bar */}
        <div className="h-2 rounded-full bg-black/5 dark:bg-white/8 mb-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 bg-[#F05A36]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-500 dark:text-stone-400">{done}/{total} done</span>
          {!settings.silentMode && streak > 0 && (
            <span className="font-extrabold text-[#F05A36]">
              🔥 {streak}d
            </span>
          )}
        </div>
      </div>

      {/* Nav links */}
      <div className="flex flex-col gap-1.5 flex-1">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-extrabold transition-all duration-200 ${
                isActive
                  ? 'bg-[#F05A36] text-white shadow-md shadow-[#F05A36]/30'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              {label}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Controls: Theme Toggle + Focus + Settings */}
      <div className="mt-4 border-t border-black/5 dark:border-white/5 pt-4 space-y-2">

        {/* Dynamic Light/Dark Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-bold text-[#18191E] dark:text-white bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2">
            {isDark ? <Moon size={15} className="text-amber-400" /> : <Sun size={15} className="text-[#F05A36]" />}
            <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 uppercase font-extrabold">
            Switch
          </span>
        </button>

        {onOpenFocus && (
          <button onClick={onOpenFocus}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <Timer size={16} strokeWidth={1.8} />
            Focus Timer
          </button>
        )}

        <NavLink
          to="/settings"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
            location.pathname === '/settings'
              ? 'bg-[#F05A36]/15 text-[#F05A36]'
              : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Settings size={16} strokeWidth={1.8} />
          Settings
        </NavLink>
      </div>
    </nav>
  );
}
