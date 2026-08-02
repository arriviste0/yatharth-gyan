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
      <div className="grid grid-cols-5 items-center px-2 py-1">
        {/* Left items */}
        {NAV_ITEMS_LEFT.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all duration-200 relative"
              style={isActive ? { background: 'var(--color-accent-light)' } : {}}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.4 : 1.7}
                style={{ color: isActive ? 'var(--color-accent)' : '#9CA3AF' }}
              />
              <span
                className="text-[9px] font-bold tracking-wide"
                style={{ color: isActive ? 'var(--color-accent)' : '#9CA3AF' }}
              >
                {label}
              </span>
            </NavLink>
          );
        })}

        {/* Center Floating System AI Button */}
        <div className="flex justify-center relative">
          <NavLink
            to="/ai-architect"
            className="w-12 h-12 rounded-full -mt-6 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-white dark:border-[#12131C] z-20 shrink-0"
            style={{ background: 'var(--color-accent)', color: '#FFFFFF', boxShadow: '0 8px 20px var(--color-accent-shadow)' }}
            title="System AI"
          >
            <Wand2 size={20} className="animate-pulse" />
          </NavLink>
        </div>

        {/* Right items */}
        {NAV_ITEMS_RIGHT.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all duration-200 relative"
              style={isActive ? { background: 'var(--color-accent-light)' } : {}}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.4 : 1.7}
                style={{ color: isActive ? 'var(--color-accent)' : '#9CA3AF' }}
              />
              <span
                className="text-[9px] font-bold tracking-wide"
                style={{ color: isActive ? 'var(--color-accent)' : '#9CA3AF' }}
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
    <nav className="hidden lg:flex flex-col w-64 min-h-screen bg-[#0D1224] border-r border-[#00F0FF]/25 px-4 py-8 sticky top-0 shrink-0 text-white font-display">
      {/* Logo + profile */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xs bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center font-black text-xl text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            ⚡
          </div>
          <div>
            <div className="font-black text-base text-white tracking-wider text-glow-cyan">ASCEND</div>
            <div className="text-[10px] font-bold text-[#A855F7] tracking-widest uppercase">SYSTEM NAVIGATOR</div>
          </div>
        </div>

        {/* Profile card */}
        {user ? (
          <button onClick={onOpenProfile}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs transition-all bg-[#080C18] border border-[#00F0FF]/30 hover:border-[#00F0FF] text-left">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
              style={{ background: user.avatarColor || '#00F0FF' }}>
              {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{user.name.toUpperCase()}</div>
              <div className="text-[10px] text-[#00F0FF] flex items-center gap-1">
                {syncing  ? <><Cloud size={9} className="animate-pulse text-[#00F0FF]" />syncing…</>
                : lastSync ? <><CheckCircle2 size={9} className="text-emerald-400" />synced</>
                : 'SYSTEM READY'}
              </div>
            </div>
          </button>
        ) : (
          <button onClick={onOpenProfile}
            className="btn-system-primary w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xs text-xs font-black uppercase tracking-widest">
            <LogIn size={14} /> SIGN IN TO SYSTEM
          </button>
        )}
      </div>

      {/* Today's status card */}
      <div className="mb-6 p-4 rounded-xs bg-[#080C18] border border-[#00F0FF]/30 space-y-2">
        <div className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-widest">
          SYSTEM DATE · {dateInfo.dayEn.slice(0, 3).toUpperCase()} · {dateInfo.short.toUpperCase()}
        </div>
        <div className="h-2.5 rounded-xs xp-bar-container">
          <div className="xp-bar-fill rounded-xs" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>{done}/{total} CLEARED</span>
          {streak > 0 && (
            <span className="font-bold text-[#F59E0B]">
              🔥 {streak}D STREAK
            </span>
          )}
        </div>
      </div>

      {/* Nav links */}
      <div className="flex flex-col gap-2 flex-1">
        {SIDE_NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xs text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#00F0FF]' : 'text-white/50'} />
              {label}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Controls: Theme Toggle + Focus + Settings */}
      <div className="mt-4 border-t border-[#00F0FF]/20 pt-4 space-y-2">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xs text-xs font-bold text-white bg-[#080C18] border border-white/10 hover:border-[#00F0FF]/40 transition-all uppercase"
        >
          <div className="flex items-center gap-2">
            {isDark ? <Moon size={14} className="text-[#A855F7]" /> : <Sun size={14} className="text-[#00F0FF]" />}
            <span>{isDark ? 'DARK MODE' : 'LIGHT MODE'}</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-xs bg-white/10 text-white/70 uppercase">
            TOGGLE
          </span>
        </button>

        {onOpenFocus && (
          <button onClick={onOpenFocus}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xs text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 border border-transparent transition-all uppercase">
            <Timer size={15} className="text-[#00F0FF]" />
            FOCUS TIMER
          </button>
        )}
      </div>
    </nav>
  );
}
