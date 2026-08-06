import { NavLink, useLocation } from 'react-router-dom';
import {
  Layers, BookOpen, BookMarked, Settings, Timer, LogIn, Cloud,
  CheckCircle2, LayoutDashboard, Sun, Moon, Wand2, Sparkles, Shield, Sword, Film
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { getTodayCompletedCount, getCurrentStreak } from '../utils/streakUtils';
import { formatDateDisplay, todayKey } from '../utils/dateUtils';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS_LEFT = [
  { path: '/status',   label: 'Status', Icon: Shield },
  { path: '/quests',   label: 'Quests', Icon: Sword },
];

const NAV_ITEMS_RIGHT = [
  { path: '/episodes', label: 'Episodes', Icon: Film },
  { path: '/gyaan',    label: 'Codex', Icon: BookMarked },
];

const SIDE_NAV_ITEMS = [
  { path: '/home',         label: 'Dashboard',    Icon: LayoutDashboard },
  { path: '/status',       label: 'Status Window',Icon: Shield },
  { path: '/quests',       label: 'Quest Board',  Icon: Sword },
  { path: '/episodes',     label: 'Episode Log',  Icon: Film },
  { path: '/sadhana',      label: 'Pillars',      Icon: Layers },
  { path: '/ai-architect', label: 'System AI',    Icon: Wand2 },
  { path: '/gyaan',        label: 'System Codex', Icon: BookMarked },
  { path: '/settings',     label: 'Settings',     Icon: Settings },
];

/* ── Mobile bottom bar ──────────────────────────────────────────────────────── */
export default function BottomNav({ onOpenProfile }) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-nav safe-bottom z-50 lg:hidden">
      <div className="grid grid-cols-5 items-center px-3 py-1.5">
        {/* Left items */}
        {NAV_ITEMS_LEFT.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-all duration-200 ${
                isActive ? 'bg-[#18191E] text-white dark:bg-[#00F0FF]/20 dark:text-[#00F0FF]' : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
              }`}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.4 : 1.7}
              />
              <span className="text-[9px] font-bold tracking-wide">
                {label}
              </span>
            </NavLink>
          );
        })}

        {/* Center Floating System AI Button */}
        <div className="flex justify-center relative">
          <NavLink
            to="/ai-architect"
            className="w-11 h-11 rounded-full -mt-5 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-[#18191E] text-white dark:bg-[#00F0FF] dark:text-[#080C18] border-2 border-white dark:border-[#0F111A] z-20 shrink-0"
            title="System AI"
          >
            <Wand2 size={18} />
          </NavLink>
        </div>

        {/* Right items */}
        {NAV_ITEMS_RIGHT.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-full transition-all duration-200 ${
                isActive ? 'bg-[#18191E] text-white dark:bg-[#00F0FF]/20 dark:text-[#00F0FF]' : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
              }`}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.4 : 1.7}
              />
              <span className="text-[9px] font-bold tracking-wide">
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
  const { state, updateSettings } = useStorage();
  const pillars   = state.pillars || [];
  const { logs, settings } = state;

  const isDark = settings?.theme === 'dark';

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
    <nav className="hidden lg:flex flex-col w-64 min-h-screen bg-white dark:bg-[#141622] border-r border-stone-200/80 dark:border-white/5 px-4 py-8 sticky top-0 shrink-0 text-stone-800 dark:text-white font-sans">
      {/* Logo + Profile */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-2xl bg-[#FEF3D6] text-[#855B14] flex items-center justify-center font-black text-xl shadow-sm">
            ⚡
          </div>
          <div>
            <div className="font-extrabold text-base text-stone-900 dark:text-white tracking-tight">ASCEND</div>
            <div className="text-[10px] font-bold text-stone-400 dark:text-stone-400 tracking-wider uppercase">System Navigator</div>
          </div>
        </div>

        {/* Profile Card */}
        {user ? (
          <button onClick={onOpenProfile}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all bg-[#F8FAF9] dark:bg-[#1D2030] border border-stone-200/60 dark:border-white/10 hover:border-stone-400 text-left">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
              style={{ background: user.avatarColor || '#18191E' }}>
              {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-stone-900 dark:text-white truncate">{user.name}</div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
                {syncing  ? <><Cloud size={9} className="animate-pulse text-stone-700 dark:text-cyan-400" />syncing…</>
                : lastSync ? <><CheckCircle2 size={9} className="text-emerald-500" />synced</>
                : 'System ready'}
              </div>
            </div>
          </button>
        ) : (
          <button onClick={onOpenProfile}
            className="btn-pill-dark w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider">
            <LogIn size={14} /> Sign in to system
          </button>
        )}
      </div>

      {/* Today's Status Progress Card */}
      <div className="mb-6 p-4 rounded-3xl bg-[#FEF3D6] text-[#855B14] space-y-2">
        <div className="text-[10px] font-extrabold uppercase tracking-wider">
          Today · {dateInfo.dayEn.slice(0, 3)} · {dateInfo.short}
        </div>
        <div className="h-2 rounded-full bg-white/60 overflow-hidden">
          <div className="h-full rounded-full bg-[#855B14] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs font-bold">
          <span>{done}/{total} Done ({pct}%)</span>
          {streak > 0 && (
            <span>🔥 {streak}d</span>
          )}
        </div>
      </div>

      {/* Side Nav Links (Clean Reference Pill Style) */}
      <div className="flex flex-col gap-1.5 flex-1">
        {SIDE_NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-[#18191E] text-white dark:bg-[#00F0FF]/20 dark:text-[#00F0FF] shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5'
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.7} />
              {label}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="mt-4 border-t border-stone-200/80 dark:border-white/5 pt-4 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-bold text-stone-700 dark:text-white bg-[#F8FAF9] dark:bg-[#1D2030] border border-stone-200/60 dark:border-white/10 hover:border-stone-400 transition-all"
        >
          <div className="flex items-center gap-2">
            {isDark ? <Moon size={14} className="text-purple-400" /> : <Sun size={14} className="text-amber-500" />}
            <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-white/10 font-bold">
            Toggle
          </span>
        </button>

        {onOpenFocus && (
          <button onClick={onOpenFocus}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
            <Timer size={15} />
            Focus Timer
          </button>
        )}
      </div>
    </nav>
  );
}
