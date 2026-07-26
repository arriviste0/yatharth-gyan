import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, Sparkles, Timer, LogIn, Check, Plus, Flame,
  Moon, Utensils, Dumbbell, ChevronRight, ArrowRight, Zap,
  TrendingUp, Target, Edit3, X, Clock, Activity, Filter,
  CheckCircle2, Circle, MoreHorizontal, ChevronDown, Droplets,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../hooks/useStorage';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import {
  formatDateDisplay, todayKey, isAfterElevenPM, dateKey,
} from '../utils/dateUtils';
import {
  getDayCompletionRate, getTodayCompletedCount, getCurrentStreak,
} from '../utils/streakUtils';
import VerseCard from '../components/VerseCard';
import NightInterstitial from '../components/NightInterstitial';
import DayCelebration from '../components/DayCelebration';
import ShankhaSVG from '../components/svgs/ShankhaSVG';
import AIDailyReportCard from '../components/AIDailyReportCard';

const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PILLAR_ICONS = {
  moon: Moon,
  bowl: Utensils,
  dumbbell: Dumbbell,
};

function getGreeting(name) {
  const h = new Date().getHours();
  const base =
    h < 5 ? 'Still up' :
      h < 12 ? 'Good morning' :
        h < 17 ? 'Good afternoon' :
          h < 21 ? 'Good evening' :
            'Evening';
  return name ? `${base}, ${name}` : base;
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  DYNAMIC ISLAND WIDGET                                             *
 * ═══════════════════════════════════════════════════════════════════ */
function DynamicIsland({ streak, done, total, pct, onOpenFocus, logMetric, metrics, today }) {
  const [expanded, setExpanded] = useState(false);
  const waterLog = metrics[today]?.water || 0;

  return (
    <div className="flex justify-center mb-6 z-40">
      <div
        onClick={() => setExpanded(!expanded)}
        className={`cursor-pointer transition-all duration-300 ease-out select-none border border-[#C9A961]/30 shadow-2xl backdrop-blur-xl ${
          expanded
            ? 'rounded-3xl p-5 w-full max-w-md bg-[#0e1226]/95 border-[#E8843C]/40 ring-1 ring-[#E8843C]/20'
            : 'rounded-full px-5 py-2 bg-[#0e1226]/90 hover:bg-[#141936] hover:border-[#C9A961]/50'
        }`}
      >
        {!expanded ? (
          /* Collapsed Pill View */
          <div className="flex items-center justify-between gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-[#E8843C]">
              <Flame size={14} className="animate-pulse" />
              <span>{streak}d Streak</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2 text-white/80">
              <span className="tabular-nums">{done}/{total}</span>
              <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#E8843C] to-[#C9A961]" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[#C9A961]">{pct}%</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <button
              onClick={(e) => { e.stopPropagation(); onOpenFocus(); }}
              className="flex items-center gap-1 text-[11px] text-[#C9A961] bg-[#C9A961]/10 px-2.5 py-1 rounded-full hover:bg-[#C9A961]/20 transition-all"
            >
              <Timer size={11} /> Focus
            </button>
          </div>
        ) : (
          /* Expanded Island Dashboard Card */
          <div className="space-y-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E8843C]/20 flex items-center justify-center text-[#E8843C]">
                  <Flame size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#C9A961]">Streak & Practice</h4>
                  <p className="text-sm font-bold text-white">{streak} Days Continuous Practice</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setExpanded(false); }} className="text-white/30 hover:text-white">
                <X size={14} />
              </button>
            </div>

            {/* Quick Stats Grid inside Dynamic Island */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/8">
                <div className="text-[10px] text-white/40 uppercase font-semibold">Today's Progress</div>
                <div className="text-base font-extrabold text-white mt-0.5">{done} of {total} targets</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#E8843C] to-[#C9A961]" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/8 flex flex-col justify-between">
                <div className="text-[10px] text-white/40 uppercase font-semibold">Hydration Tracker</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-[#5A8A8A] tabular-nums">{waterLog} ml</span>
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

            {/* Action buttons inside island */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onOpenFocus(); }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#E8843C] to-[#C9A961] text-white text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
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

/* ═══════════════════════════════════════════════════════════════════ *
 *  MOBILE COMPONENTS                                                  *
 * ═══════════════════════════════════════════════════════════════════ */

/* ── Circular Progress Ring ───────────────────────────────────────── */
function CircularProgress({ percentage, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={center} cy={center} r={radius}
        className="stroke-black/5 dark:stroke-white/10" strokeWidth={strokeWidth} fill="none" />
      <circle cx={center} cy={center} r={radius}
        stroke="#F05A36" strokeWidth={strokeWidth} fill="none"
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
    </svg>
  );
}

/* ── Pillar Category Card (mobile) ─────────────────────────────────── */
function PillarCategoryCard({ pillar, dayLog }) {
  const IconComp = PILLAR_ICONS[pillar.icon] || Zap;
  const dailyTargets = pillar.targets.filter((t) => t.frequency === 'daily' || !t.frequency);
  const doneCount = dailyTargets.filter((t) => dayLog[t.id]?.done).length;
  const totalCount = dailyTargets.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between min-h-[110px] transition-all active:scale-[0.97] bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${pillar.color}18` }}>
          <IconComp size={17} style={{ color: pillar.color }} />
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: `${pillar.color}15`, color: pillar.color }}>{pct}%</span>
      </div>
      <div className="mt-3">
        <h4 className="text-xs font-bold text-[#18191E] dark:text-white truncate">{pillar.english}</h4>
        <p className="text-[10px] text-stone-400 font-medium">{doneCount}/{totalCount} done</p>
      </div>
      <div className="mt-2 h-1 rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pillar.color }} />
      </div>
    </div>
  );
}

/* ── Mobile Today View ─────────────────────────────────────────────── */
function MobileTodayView({ pillars, logs, logTarget, dateStr, streak, settings, onOpenFocus }) {
  const dayLog = logs[dateStr] || {};
  const activeTargets = useMemo(() =>
    pillars.flatMap((p) =>
      p.targets.filter((t) => t.frequency === 'daily' || !t.frequency)
        .map((t) => ({ ...t, pillarName: p.english, pillarColor: p.color || '#F05A36', pillarIcon: p.icon, done: !!dayLog[t.id]?.done }))
    ), [pillars, dayLog]);

  const completedCount = activeTargets.filter((t) => t.done).length;
  const totalCount = activeTargets.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount && totalCount > 0;
  const pendingTargets = activeTargets.filter((t) => !t.done);
  const doneTargets = activeTargets.filter((t) => t.done);

  return (
    <div className="block lg:hidden space-y-5 mb-5">
      {/* Hero Progress Card */}
      <div className="card-bento relative overflow-hidden rounded-3xl p-6 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-md">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F05A36]">Today's Practice</span>
            <h2 className="text-xl font-extrabold text-[#18191E] dark:text-white mt-1 leading-tight">{allDone ? 'All done! 🪷' : `${totalCount - completedCount} tasks remaining`}</h2>
            <p className="text-[11px] text-stone-500 dark:text-white/50 mt-1 leading-relaxed">{allDone ? 'Your practice blooms today — rest well.' : 'Tap each target to check it off.'}</p>
            <div className="flex items-center gap-3 mt-4">
              {!settings.silentMode && streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F05A36]/12">
                  <Flame size={11} className="text-[#F05A36]" /><span className="text-[10px] font-extrabold text-[#F05A36]">{streak}d streak</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/12">
                <Check size={11} className="text-emerald-500" /><span className="text-[10px] font-extrabold text-emerald-500">{completedCount} done</span>
              </div>
            </div>
          </div>
          <div className="relative flex items-center justify-center ml-4">
            <CircularProgress percentage={pct} size={90} strokeWidth={7} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-[#18191E] dark:text-white tabular-nums">{pct}%</span>
              <span className="text-[9px] text-stone-400 font-medium -mt-0.5">complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar Cards */}
      <div>
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Your Pillars</span>
          <Link to="/sadhana" className="text-[10px] font-extrabold text-[#F05A36] flex items-center gap-0.5">View all <ChevronRight size={10} /></Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {pillars.map((pillar) => <PillarCategoryCard key={pillar.id} pillar={pillar} dayLog={dayLog} />)}
        </div>
      </div>

      {/* Task Checklist */}
      <div>
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{pendingTargets.length > 0 ? 'Pending Tasks' : 'Completed'}</span>
          <span className="text-[11px] font-bold tabular-nums text-[#F05A36]">{completedCount}/{totalCount}</span>
        </div>
        <div className="space-y-2">
          {pendingTargets.map((target) => {
            const Icon = PILLAR_ICONS[target.pillarIcon] || Zap;
            return (
              <button key={target.id} onClick={() => logTarget(dateStr, target.id, { done: true, timestamp: Date.now() })}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.97] bg-white dark:bg-[#181926] border-black/5 dark:border-white/8 hover:border-[#F05A36]/30 shadow-sm">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${target.pillarColor}18` }}>
                  <Icon size={15} style={{ color: target.pillarColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[#18191E] dark:text-white truncate">{target.name}</div>
                  <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide mt-0.5">{target.pillarName}</div>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all" style={{ borderColor: `${target.pillarColor}40` }}>
                  <Plus size={12} style={{ color: target.pillarColor, opacity: 0.6 }} />
                </div>
              </button>
            );
          })}
          {doneTargets.map((target) => {
            const Icon = PILLAR_ICONS[target.pillarIcon] || Zap;
            return (
              <button key={target.id} onClick={() => logTarget(dateStr, target.id, { done: false, timestamp: Date.now() })}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.97] bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${target.pillarColor}12` }}>
                  <Icon size={15} style={{ color: target.pillarColor, opacity: 0.5 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-stone-400 dark:text-stone-500 line-through truncate">{target.name}</div>
                  <div className="text-[10px] text-stone-400 dark:text-stone-600 font-semibold uppercase tracking-wide mt-0.5">{target.pillarName}</div>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all bg-[#F05A36] text-white">
                  <Check size={13} strokeWidth={3} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════ *
 *  DESKTOP DASHBOARD COMPONENTS                                      *
 * ═══════════════════════════════════════════════════════════════════ */

/* ── KPI Metric Card ──────────────────────────────────────────────── */
function KPICard({ label, value, sublabel, color = '#F05A36', icon: IconComp, trend }) {
  return (
    <div className="card-bento p-5 transition-all hover:shadow-md flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${color}18` }}>
          {IconComp && <IconComp size={18} style={{ color }} />}
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${trend >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-extrabold tabular-nums text-[#18191E] dark:text-white mb-0.5">{value}</div>
        <div className="text-xs font-bold text-stone-500 dark:text-stone-400">{label}</div>
        {sublabel && <div className="text-[10px] text-stone-400 dark:text-white/40 mt-0.5 font-medium">{sublabel}</div>}
      </div>
    </div>
  );
}

/* ── Desktop Tab Button ───────────────────────────────────────────── */
function TabButton({ active, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-full transition-all ${
        active
          ? 'bg-accent text-white shadow-md'
          : 'text-stone-500 dark:text-white/50 hover:text-[#18191E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Desktop Task Row ─────────────────────────────────────────────── */
function TaskRow({ target, dateStr, logTarget, onEdit }) {
  const Icon = PILLAR_ICONS[target.pillarIcon] || Zap;

  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group border border-black/5 dark:border-white/5 ${
      target.done ? 'bg-black/[0.02] dark:bg-white/[0.02]' : 'bg-white dark:bg-[#181926] shadow-sm hover:shadow-md'
    }`}>
      {/* Target check button */}
      <button
        onClick={() => logTarget(dateStr, target.id, { done: !target.done })}
        className="shrink-0 transition-transform active:scale-95"
      >
        {target.done ? (
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-accent text-white shadow-sm">
            <Check size={14} strokeWidth={3} />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center hover:border-accent transition-colors"
            style={{ borderColor: `${target.pillarColor}40` }}>
          </div>
        )}
      </button>

      {/* Pillar icon */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${target.pillarColor}18` }}>
        <Icon size={14} style={{ color: target.pillarColor }} />
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold truncate ${target.done ? 'line-through text-stone-400 dark:text-white/30' : 'text-[#18191E] dark:text-white'}`}>
          {target.name}
        </div>
      </div>

      {/* Pillar badge */}
      <span className="text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0"
        style={{ background: `${target.pillarColor}15`, color: target.pillarColor }}>
        {target.pillarName}
      </span>

      {/* Type badge */}
      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-stone-600 dark:text-white/50 shrink-0">
        {target.type === 'CHECKBOX' ? 'Yes/No' : target.type === 'NUMBER' ? `≥${target.targetValue}${target.unit || ''}` : target.type === 'TIME' ? `≤${target.targetValue}` : target.type}
      </span>

      {/* Edit button */}
      <button
        onClick={() => onEdit(target)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#F05A36] hover:bg-[#F05A36]/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
      >
        <Edit3 size={13} />
      </button>
    </div>
  );
}

/* ── Desktop Task Manager (Tabbed) ────────────────────────────────── */
function DesktopTaskManager({ pillars, logs, logTarget, dateStr, setPillars }) {
  const [tab, setTab] = useState('all');
  const [editingTarget, setEditingTarget] = useState(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [filterPillar, setFilterPillar] = useState('all');

  const dayLog = logs[dateStr] || {};

  const activeTargets = useMemo(() =>
    pillars.flatMap((p) =>
      p.targets
        .filter((t) => t.frequency === 'daily' || !t.frequency)
        .map((t) => ({
          ...t,
          pillarId: p.id,
          pillarName: p.english,
          pillarColor: p.color || '#E8843C',
          pillarIcon: p.icon,
          done: !!dayLog[t.id]?.done,
        }))
    ), [pillars, dayLog]);

  const filtered = useMemo(() => {
    let list = activeTargets;
    if (filterPillar !== 'all') list = list.filter((t) => t.pillarId === filterPillar);
    if (tab === 'pending') return list.filter((t) => !t.done);
    if (tab === 'done') return list.filter((t) => t.done);
    return list;
  }, [activeTargets, tab, filterPillar]);

  const pendingCount = activeTargets.filter((t) => !t.done).length;
  const doneCount = activeTargets.filter((t) => t.done).length;

  function handleEdit(target) {
    setEditingTarget(target);
    setEditName(target.name);
    setEditValue(target.targetValue != null ? String(target.targetValue) : '');
  }

  function handleSaveEdit() {
    if (!editingTarget || !editName.trim()) return;
    const newPillars = pillars.map((p) => ({
      ...p,
      targets: p.targets.map((t) =>
        t.id === editingTarget.id
          ? { ...t, name: editName.trim(), targetValue: editValue || t.targetValue }
          : t
      ),
    }));
    setPillars(newPillars);
    setEditingTarget(null);
  }

  return (
    <div id="daily-targets" className="card-bento p-5">
      {/* Header */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#18191E] dark:text-white">Daily Practice Targets</h3>
            <p className="text-[11px] text-stone-400 dark:text-white/40 mt-0.5 font-medium">Complete your daily targets</p>
          </div>
          {/* Pillar filter */}
          <div className="relative">
            <select
              value={filterPillar}
              onChange={(e) => setFilterPillar(e.target.value)}
              className="appearance-none bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#18191E] dark:text-white text-xs font-extrabold px-3 py-1.5 pr-7 rounded-xl outline-none focus:border-[#F05A36] cursor-pointer"
            >
              <option value="all" className="text-stone-800">All Pillars</option>
              {pillars.map((p) => <option key={p.id} value={p.id} className="text-stone-800">{p.english}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5">
          <TabButton active={tab === 'all'} label="All" count={activeTargets.length} onClick={() => setTab('all')} />
          <TabButton active={tab === 'pending'} label="Pending" count={pendingCount} onClick={() => setTab('pending')} />
          <TabButton active={tab === 'done'} label="Done" count={doneCount} onClick={() => setTab('done')} />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-1.5 max-h-[440px] overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-stone-300 dark:text-white/20">
            <CheckCircle2 size={32} className="mb-2" />
            <span className="text-sm font-medium">{tab === 'pending' ? 'All tasks completed!' : 'No tasks yet'}</span>
          </div>
        ) : (
          filtered.map((target) => (
            <TaskRow key={target.id} target={target} dateStr={dateStr} logTarget={logTarget} onEdit={handleEdit} />
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingTarget && (
        <div className="border-t border-white/5 px-5 py-4 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#C9A961] uppercase tracking-wider">Edit Target</span>
            <button onClick={() => setEditingTarget(null)} className="text-white/30 hover:text-white/60"><X size={14} /></button>
          </div>
          <div className="flex gap-3">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 text-sm text-[#18191E] dark:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:border-[#F05A36] placeholder-stone-400"
              placeholder="Target name"
            />
            {(editingTarget.type === 'NUMBER' || editingTarget.type === 'TIME') && (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-24 text-sm text-[#18191E] dark:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:border-[#F05A36] placeholder-stone-400"
                placeholder={editingTarget.type === 'TIME' ? 'HH:MM' : 'Value'}
              />
            )}
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-[#E8843C] hover:bg-[#d4732b] text-white rounded-xl text-xs font-bold transition-all"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Desktop Weekly Trend Chart ───────────────────────────────────── */
function DesktopWeeklyChart({ logs, pillars }) {
  const data = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = dateKey(d);
      const rate = getDayCompletionRate(logs, pillars, key);
      days.push({
        key,
        label: WEEKDAY_FULL[d.getDay()],
        short: WEEKDAY_SHORT[d.getDay()],
        rate: Math.round(rate * 100),
        isToday: i === 0,
      });
    }
    return days;
  }, [logs, pillars]);

  const avg = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length) : 0;

  return (
    <div className="card-bento p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#18191E] dark:text-white">Weekly Completion</h3>
          <p className="text-[11px] text-stone-400 dark:text-white/40 mt-0.5">Last 7 days performance</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold tabular-nums text-[#F05A36]">{avg}%</div>
          <div className="text-[10px] text-stone-400 dark:text-white/30">avg rate</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F05A36" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#F05A36" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-[#181926] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
                  <div className="font-bold text-white">{payload[0].payload.label}: {payload[0].value}%</div>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="rate" stroke="#F05A36" strokeWidth={2.5} fill="url(#weekGrad)" dot={{ r: 4, fill: '#F05A36', stroke: '#181926', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Desktop Pillar Breakdown (Donut + Table) ─────────────────────── */
function DesktopPillarBreakdown({ pillars, logs, dateStr }) {
  const dayLog = logs[dateStr] || {};

  const pillarStats = useMemo(() =>
    pillars.map((p) => {
      const dailyTargets = p.targets.filter((t) => t.frequency === 'daily' || !t.frequency);
      const doneCount = dailyTargets.filter((t) => dayLog[t.id]?.done).length;
      const totalCount = dailyTargets.length;
      const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
      return { id: p.id, name: p.english, sanskrit: p.sanskrit, color: p.color, icon: p.icon, doneCount, totalCount, pct };
    }).sort((a, b) => b.pct - a.pct),
    [pillars, dayLog]);

  const donutData = pillarStats.map((p) => ({
    name: p.name,
    value: Math.max(p.doneCount, 0.3),
    color: p.color,
    actualValue: p.doneCount,
  }));

  const totalDone = pillarStats.reduce((s, p) => s + p.doneCount, 0);
  const totalAll = pillarStats.reduce((s, p) => s + p.totalCount, 0);

  return (
    <div className="card-bento p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#18191E] dark:text-white">Pillar Breakdown</h3>
          <p className="text-[11px] text-stone-400 dark:text-white/40 mt-0.5">Today's completion by category</p>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-5">
        <div className="relative">
          <PieChart width={160} height={160}>
            <Pie
              data={donutData}
              cx={80}
              cy={80}
              innerRadius={50}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {donutData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-[#18191E] dark:text-white tabular-nums">{totalDone}</span>
            <span className="text-[9px] text-stone-400 dark:text-white/30 font-medium">of {totalAll}</span>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="space-y-2">
        {pillarStats.map((p, i) => {
          const Icon = PILLAR_ICONS[p.icon] || Zap;
          return (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all border border-black/5 dark:border-white/5">
              <span className="text-[10px] font-bold text-stone-400 dark:text-white/30 w-4">{i + 1}</span>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${p.color}18` }}>
                <Icon size={13} style={{ color: p.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#18191E] dark:text-white truncate">{p.name}</div>
                <div className="text-[9px] text-stone-400 dark:text-white/30 font-dev">{p.sanskrit}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold tabular-nums" style={{ color: p.color }}>{p.pct}%</div>
                <div className="text-[9px] text-stone-400 dark:text-white/30">{p.doneCount}/{p.totalCount}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Desktop Activity Feed ────────────────────────────────────────── */
function DesktopActivityFeed({ logs, pillars, dateStr }) {
  const dayLog = logs[dateStr] || {};

  const activities = useMemo(() => {
    const items = [];
    pillars.forEach((p) => {
      p.targets.forEach((t) => {
        const entry = dayLog[t.id];
        if (entry?.done && entry?.timestamp) {
          items.push({
            id: t.id,
            name: t.name,
            pillarName: p.english,
            pillarColor: p.color,
            pillarIcon: p.icon,
            timestamp: entry.timestamp,
            type: t.type,
          });
        }
      });
    });
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [pillars, dayLog]);

  return (
    <div className="card-bento p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#18191E] dark:text-white">Activity Feed</h3>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-medium">Recent completions today</p>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-stone-700 dark:text-stone-300 border border-black/5 dark:border-white/10">
          {activities.length} entries
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-stone-500 dark:text-stone-400">
          <Activity size={28} className="mb-2 text-stone-400 dark:text-stone-500" />
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">No completions yet today</span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-medium">Complete a target to see it here</span>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto no-scrollbar">
          {/* Table header */}
          <div className="flex items-center gap-3 px-3 py-2 text-[10px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            <span className="flex-1">Target</span>
            <span className="w-20 text-center">Pillar</span>
            <span className="w-16 text-right">Time</span>
          </div>

          {activities.map((a) => {
            const time = new Date(a.timestamp);
            const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.pillarColor }} />
                  <span className="text-xs font-extrabold text-[#18191E] dark:text-white truncate">{a.name}</span>
                </div>
                <span className="w-20 text-center text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: `${a.pillarColor}15`, color: a.pillarColor }}>
                  {a.pillarName}
                </span>
                <span className="w-16 text-right text-[10px] text-stone-600 dark:text-stone-300 tabular-nums font-semibold shrink-0">
                  {timeStr}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Profile Header Button ───────────────────────────────────────── */
function ProfileHeaderButton({ onOpenProfile }) {
  const { user } = useAuth();
  if (!user) return null;
  if (user.avatarPhoto) {
    return (
      <button onClick={onOpenProfile} title={user.name}
        className="w-9 h-9 rounded-full overflow-hidden transition-all hover:scale-105">
        <img src={user.avatarPhoto} alt={user.name} className="w-full h-full object-cover" />
      </button>
    );
  }
  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <button onClick={onOpenProfile} title={user.name}
      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white transition-all hover:scale-105"
      style={{ background: user.avatarColor || '#E8843C' }}>
      {initials}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  MAIN PAGE                                                         *
 * ═══════════════════════════════════════════════════════════════════ */

export default function Home({ onOpenFocus, onOpenProfile }) {
  const { state, toggleBookmark, logTarget, setPillars, logMetric } = useStorage();
  const pillars = state.pillars || DEFAULT_PILLARS;
  const { logs, bookmarks, settings, metrics = {} } = state;
  const dailyVerse = useDailyVerse();

  const [showNight, setShowNight] = useState(false);
  const [nightShown, setNightShown] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevDoneRef = useState(null);

  const today = todayKey();
  const dateInfo = formatDateDisplay(new Date());
  const { done, total } = getTodayCompletedCount(logs, pillars);
  const completion = total > 0 ? done / total : 0;
  const streak = getCurrentStreak(logs, pillars);
  const pct = Math.round(completion * 100);

  // Weekly average for KPI trend
  const weeklyAvg = useMemo(() => {
    let sum = 0;
    const d = new Date();
    for (let i = 1; i <= 7; i++) {
      const dd = new Date(d);
      dd.setDate(d.getDate() - i);
      sum += getDayCompletionRate(logs, pillars, dateKey(dd));
    }
    return Math.round((sum / 7) * 100);
  }, [logs, pillars]);

  useEffect(() => {
    if (isAfterElevenPM() && !nightShown) {
      const key = `night_shown_${today}`;
      if (!sessionStorage.getItem(key)) {
        setShowNight(true);
        setNightShown(true);
        sessionStorage.setItem(key, '1');
      }
    }
  }, []);

  useEffect(() => {
    const prev = prevDoneRef[0];
    if (done === total && total > 0 && prev !== null && prev < total) {
      const key = `celebrated_${today}`;
      if (!sessionStorage.getItem(key)) {
        setShowCelebration(true);
        sessionStorage.setItem(key, '1');
      }
    }
    prevDoneRef[0] = done;
  }, [done, total]);

  return (
    <div className="page-container page-transition">
      {showNight && <NightInterstitial onClose={() => setShowNight(false)} />}
      {showCelebration && <DayCelebration onClose={() => setShowCelebration(false)} />}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 lg:mb-6">
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-0.5">
            {dateInfo.dayEn} · {dateInfo.short}
          </p>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1a2e] dark:text-white leading-tight">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {completion >= 1 && total > 0 && <ShankhaSVG size={26} color="#C9A961" />}
          <ProfileHeaderButton onOpenProfile={onOpenProfile} />
        </div>
      </div>

      {/* ═══ MOBILE VIEW ═══════════════════════════════════════════ */}
      <MobileTodayView
        pillars={pillars} logs={logs} logTarget={logTarget}
        dateStr={today} streak={streak} settings={settings} onOpenFocus={onOpenFocus}
      />

      {/* ═══ DESKTOP DASHBOARD ═════════════════════════════════════ */}
      <div className="hidden lg:block space-y-5">

        {/* ── KPI Metric Cards Row ─────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            label="Completion Rate"
            value={`${pct}%`}
            sublabel={pct >= 100 ? 'All targets done!' : `${total - done} remaining`}
            color={pct >= 80 ? '#C9A961' : pct >= 50 ? '#E8843C' : '#5B6BAF'}
            icon={Target}
            trend={pct - weeklyAvg}
          />
          <KPICard
            label="Tasks Done"
            value={`${done}/${total}`}
            sublabel="Daily targets completed"
            color="#E8843C"
            icon={CheckCircle2}
          />
          <KPICard
            label="Current Streak"
            value={`${streak}d`}
            sublabel={streak > 0 ? 'Keep the flame alive!' : 'Start your streak today'}
            color={streak >= 7 ? '#C9A961' : '#E8843C'}
            icon={Flame}
          />
          <KPICard
            label="Active Pillars"
            value={pillars.length}
            sublabel={`${total} daily targets tracked`}
            color="#5A8A8A"
            icon={Activity}
          />
        </div>

        {/* ── Main Content Grid (2 columns) ────────────────────── */}
        <div className="grid grid-cols-5 gap-5">
          {/* Left Column — Task Manager + Weekly Chart */}
          <div className="col-span-3 space-y-5">
            <DesktopTaskManager
              pillars={pillars}
              logs={logs}
              logTarget={logTarget}
              dateStr={today}
              setPillars={setPillars}
            />
            <DesktopWeeklyChart logs={logs} pillars={pillars} />
          </div>

          {/* Right Column — Pillar Breakdown + Activity Feed */}
          <div className="col-span-2 space-y-5">
            <DesktopPillarBreakdown pillars={pillars} logs={logs} dateStr={today} />
            <DesktopActivityFeed logs={logs} pillars={pillars} dateStr={today} />
          </div>
        </div>

        {/* ── Big Full Body & Practice AI Report Card ────────────── */}
        <AIDailyReportCard />

        {/* ── Verse of the Day ──────────────────────────────────── */}
        {dailyVerse && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles size={13} style={{ color: '#E8843C' }} />
              <span className="section-label">Verse of the day</span>
            </div>
            <VerseCard
              shloka={dailyVerse}
              bookmarked={bookmarks.includes(dailyVerse.id)}
              onToggleBookmark={toggleBookmark}
            />
          </div>
        )}
      </div>

      {/* ═══ MOBILE: AI Analyze Card & Verse of the Day ═══════════ */}
      <div className="lg:hidden space-y-5 mt-4">
        {/* Full Body & Practice AI Report Card for Mobile */}
        <AIDailyReportCard />

        {dailyVerse && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles size={13} style={{ color: '#E8843C' }} />
              <span className="section-label">Verse of the day</span>
            </div>
            <VerseCard
              shloka={dailyVerse}
              bookmarked={bookmarks.includes(dailyVerse.id)}
              onToggleBookmark={toggleBookmark}
            />
          </div>
        )}
      </div>

      <div className="h-6" />
    </div>
  );
}
