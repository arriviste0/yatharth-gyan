import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, Sparkles, Timer, LogIn, Check, Plus, Flame,
  Moon, Utensils, Dumbbell, ChevronRight, ArrowRight, Zap,
  TrendingUp, Target, Edit3, X, Clock, Activity, Filter,
  CheckCircle2, Circle, MoreHorizontal, ChevronDown,
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
 *  MOBILE COMPONENTS (unchanged)                                     *
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
        stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none" />
      <circle cx={center} cy={center} r={radius}
        stroke="url(#progressGrad)" strokeWidth={strokeWidth} fill="none"
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E8843C" />
          <stop offset="100%" stopColor="#C9A961" />
        </linearGradient>
      </defs>
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
    <div className="relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between min-h-[110px] transition-all active:scale-[0.97]"
      style={{ background: `linear-gradient(145deg, ${pillar.color}18, ${pillar.color}08)`, border: `1px solid ${pillar.color}20` }}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${pillar.color}20` }}>
          <IconComp size={18} style={{ color: pillar.color }} />
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${pillar.color}15`, color: pillar.color }}>{pct}%</span>
      </div>
      <div className="mt-3">
        <h4 className="text-sm font-bold text-[#1a1a2e] dark:text-white">{pillar.english}</h4>
        <p className="text-[10px] text-stone-400 mt-0.5 font-medium">{doneCount}/{totalCount} completed</p>
      </div>
      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: `${pillar.color}15` }}>
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
        .map((t) => ({ ...t, pillarName: p.english, pillarColor: p.color || '#E8843C', pillarIcon: p.icon, done: !!dayLog[t.id]?.done }))
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
      <div className="relative overflow-hidden rounded-3xl p-6" style={{ background: 'linear-gradient(145deg, #1b1f3b 0%, #2a3158 50%, #3a4478 100%)' }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #C9A961, transparent)' }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #E8843C, transparent)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A961]/70">Today's Progress</span>
            <h2 className="text-xl font-extrabold text-white mt-1 leading-tight">{allDone ? 'All done! 🪷' : `${totalCount - completedCount} tasks remaining`}</h2>
            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">{allDone ? 'Your practice blooms today — rest well.' : 'Tap each target to check it off.'}</p>
            <div className="flex items-center gap-3 mt-4">
              {!settings.silentMode && streak > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(232,132,60,0.15)' }}>
                  <Flame size={11} className="text-[#E8843C]" /><span className="text-[10px] font-bold text-[#E8843C]">{streak}d streak</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(201,169,97,0.12)' }}>
                <Check size={10} className="text-[#C9A961]" /><span className="text-[10px] font-bold text-[#C9A961]">{completedCount} done</span>
              </div>
            </div>
          </div>
          <div className="relative flex items-center justify-center ml-4">
            <CircularProgress percentage={pct} size={100} strokeWidth={7} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-white tabular-nums">{pct}%</span>
              <span className="text-[9px] text-white/40 font-medium -mt-0.5">complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar Cards */}
      <div>
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Your Pillars</span>
          <Link to="/sadhana" className="text-[10px] font-bold text-[#E8843C] flex items-center gap-0.5">View all <ChevronRight size={10} /></Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {pillars.map((pillar) => <PillarCategoryCard key={pillar.id} pillar={pillar} dayLog={dayLog} />)}
        </div>
      </div>

      {/* Task Checklist */}
      <div>
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{pendingTargets.length > 0 ? 'Pending Tasks' : 'Completed'}</span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: '#E8843C' }}>{completedCount}/{totalCount}</span>
        </div>
        <div className="space-y-2">
          {pendingTargets.map((target) => {
            const Icon = PILLAR_ICONS[target.pillarIcon] || Zap;
            return (
              <button key={target.id} onClick={() => logTarget(dateStr, target.id, { done: true, timestamp: Date.now() })}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.97] bg-white dark:bg-[#0f1428] border-black/5 dark:border-white/8 hover:border-[#E8843C]/25 hover:shadow-sm">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${target.pillarColor}15` }}>
                  <Icon size={15} style={{ color: target.pillarColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#1a1a2e] dark:text-white truncate">{target.name}</div>
                  <div className="text-[10px] text-stone-400 font-medium uppercase tracking-wide mt-0.5">{target.pillarName}</div>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all" style={{ borderColor: `${target.pillarColor}30` }}>
                  <Plus size={12} style={{ color: target.pillarColor, opacity: 0.5 }} />
                </div>
              </button>
            );
          })}
          {doneTargets.map((target) => {
            const Icon = PILLAR_ICONS[target.pillarIcon] || Zap;
            return (
              <button key={target.id} onClick={() => logTarget(dateStr, target.id, { done: false, timestamp: Date.now() })}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.97] bg-stone-50 dark:bg-white/[0.03] border-stone-100 dark:border-[#C9A961]/15">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(201,169,97,0.1)' }}>
                  <Icon size={15} style={{ color: target.pillarColor, opacity: 0.5 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-stone-400 dark:text-stone-500 line-through truncate">{target.name}</div>
                  <div className="text-[10px] text-stone-300 dark:text-stone-600 font-medium uppercase tracking-wide mt-0.5">{target.pillarName}</div>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all" style={{ background: 'linear-gradient(135deg, #E8843C, #C9A961)' }}>
                  <Check size={13} color="white" strokeWidth={3} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard Banner */}
      <Link to="/drishti" className="flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, rgba(232,132,60,0.08), rgba(201,169,97,0.06))', border: '1px solid rgba(232,132,60,0.12)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,132,60,0.12)' }}>
            <Sparkles size={16} style={{ color: '#E8843C' }} />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-[#1a1a2e] dark:text-white">View Full Dashboard</h4>
            <p className="text-[10px] text-stone-400 mt-0.5">Monthly grid, health logs & analytics</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-[#E8843C] shrink-0" />
      </Link>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════ *
 *  DESKTOP DASHBOARD COMPONENTS                                      *
 * ═══════════════════════════════════════════════════════════════════ */

/* ── KPI Metric Card ──────────────────────────────────────────────── */
function KPICard({ label, value, sublabel, color = '#E8843C', icon: IconComp, trend }) {
  return (
    <div className="rounded-2xl p-5 transition-all hover:shadow-lg"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          {IconComp && <IconComp size={18} style={{ color }} />}
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-extrabold tabular-nums text-white mb-0.5">{value}</div>
      <div className="text-xs font-semibold text-white/60">{label}</div>
      {sublabel && <div className="text-[10px] text-white/30 mt-0.5">{sublabel}</div>}
    </div>
  );
}

/* ── Desktop Tab Button ───────────────────────────────────────────── */
function TabButton({ active, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
        active
          ? 'bg-[#E8843C] text-white shadow-md'
          : 'text-white/40 hover:text-white/70 hover:bg-white/5'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-white/20' : 'bg-white/5'}`}>
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
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
      target.done
        ? 'bg-white/[0.02] opacity-60'
        : 'bg-white/[0.03] hover:bg-white/[0.06]'
    }`}>
      {/* Checkbox */}
      <button
        onClick={() => logTarget(dateStr, target.id, { done: !target.done, timestamp: Date.now() })}
        className="shrink-0 transition-all"
      >
        {target.done ? (
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #E8843C, #C9A961)' }}>
            <Check size={13} color="white" strokeWidth={3} />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center hover:border-[#E8843C]/50 transition-colors"
            style={{ borderColor: `${target.pillarColor}30` }}>
          </div>
        )}
      </button>

      {/* Pillar icon */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${target.pillarColor}15` }}>
        <Icon size={14} style={{ color: target.pillarColor }} />
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold truncate ${target.done ? 'line-through text-white/30' : 'text-white'}`}>
          {target.name}
        </div>
      </div>

      {/* Pillar badge */}
      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0"
        style={{ background: `${target.pillarColor}12`, color: target.pillarColor }}>
        {target.pillarName}
      </span>

      {/* Type badge */}
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-white/40 shrink-0">
        {target.type === 'CHECKBOX' ? 'Yes/No' : target.type === 'NUMBER' ? `≥${target.targetValue}${target.unit || ''}` : target.type === 'TIME' ? `≤${target.targetValue}` : target.type}
      </span>

      {/* Edit button */}
      <button
        onClick={() => onEdit(target)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-[#E8843C] hover:bg-[#E8843C]/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
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
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Today's Targets</h3>
            <p className="text-[11px] text-white/30 mt-0.5">Complete your daily practice</p>
          </div>
          {/* Pillar filter */}
          <div className="relative">
            <select
              value={filterPillar}
              onChange={(e) => setFilterPillar(e.target.value)}
              className="appearance-none bg-white/5 border border-white/8 text-white/70 text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg outline-none focus:border-[#E8843C]/40 cursor-pointer"
            >
              <option value="all">All Pillars</option>
              {pillars.map((p) => <option key={p.id} value={p.id}>{p.english}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
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
      <div className="px-3 pb-3 space-y-1 max-h-[420px] overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-white/20">
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
              className="flex-1 text-sm text-white bg-white/5 border border-white/8 rounded-xl px-3 py-2 outline-none focus:border-[#E8843C]/40 placeholder-white/20"
              placeholder="Target name"
            />
            {(editingTarget.type === 'NUMBER' || editingTarget.type === 'TIME') && (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-24 text-sm text-white bg-white/5 border border-white/8 rounded-xl px-3 py-2 outline-none focus:border-[#E8843C]/40 placeholder-white/20"
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
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Weekly Completion</h3>
          <p className="text-[11px] text-white/30 mt-0.5">Last 7 days performance</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold tabular-nums" style={{ color: avg >= 80 ? '#C9A961' : avg >= 50 ? '#E8843C' : '#5B6BAF' }}>{avg}%</div>
          <div className="text-[10px] text-white/30">avg rate</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8843C" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#E8843C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-[#1a1f3d] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
                  <div className="font-bold text-white">{payload[0].payload.label}: {payload[0].value}%</div>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="rate" stroke="#E8843C" strokeWidth={2} fill="url(#weekGrad)" dot={{ r: 4, fill: '#E8843C', stroke: '#1a1f3d', strokeWidth: 2 }} />
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
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Pillar Breakdown</h3>
          <p className="text-[11px] text-white/30 mt-0.5">Today's completion by category</p>
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
            <span className="text-2xl font-extrabold text-white tabular-nums">{totalDone}</span>
            <span className="text-[9px] text-white/30 font-medium">of {totalAll}</span>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="space-y-2">
        {pillarStats.map((p, i) => {
          const Icon = PILLAR_ICONS[p.icon] || Zap;
          return (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all">
              <span className="text-[10px] font-bold text-white/20 w-4">{i + 1}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${p.color}18` }}>
                <Icon size={13} style={{ color: p.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                <div className="text-[9px] text-white/25 font-dev">{p.sanskrit}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums" style={{ color: p.color }}>{p.pct}%</div>
                <div className="text-[9px] text-white/25">{p.doneCount}/{p.totalCount}</div>
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
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Activity Feed</h3>
          <p className="text-[11px] text-white/30 mt-0.5">Recent completions today</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-white/30">
          {activities.length} entries
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-white/15">
          <Activity size={28} className="mb-2" />
          <span className="text-xs font-medium">No completions yet today</span>
          <span className="text-[10px] mt-0.5">Complete a target to see it here</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-thin">
          {/* Table header */}
          <div className="flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-white/20 uppercase tracking-wider">
            <span className="flex-1">Target</span>
            <span className="w-20 text-center">Pillar</span>
            <span className="w-16 text-right">Time</span>
          </div>

          {activities.map((a) => {
            const Icon = PILLAR_ICONS[a.pillarIcon] || Zap;
            const time = new Date(a.timestamp);
            const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.pillarColor }} />
                  <span className="text-xs font-medium text-white truncate">{a.name}</span>
                </div>
                <span className="w-20 text-center text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0"
                  style={{ background: `${a.pillarColor}12`, color: a.pillarColor }}>
                  {a.pillarName}
                </span>
                <span className="w-16 text-right text-[10px] text-white/30 tabular-nums font-medium shrink-0">
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


/* ═══════════════════════════════════════════════════════════════════ *
 *  SHARED / PROFILE                                                  *
 * ═══════════════════════════════════════════════════════════════════ */

function ProfileHeaderButton({ onOpenProfile }) {
  const { user } = useAuth();
  if (!user) {
    return (
      <button onClick={onOpenProfile}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-[#E8843C] transition-colors"
        style={{ background: 'rgba(0,0,0,0.04)' }} title="Sign in">
        <LogIn size={17} />
      </button>
    );
  }
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
  const { state, toggleBookmark, logTarget, setPillars } = useStorage();
  const pillars = state.pillars || DEFAULT_PILLARS;
  const { logs, bookmarks, settings } = state;
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
            {getGreeting(settings.name)}
          </h1>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {completion >= 1 && total > 0 && <ShankhaSVG size={26} color="#C9A961" />}
          <button onClick={onOpenFocus}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-[#E8843C] transition-colors"
            style={{ background: 'rgba(0,0,0,0.04)' }} title="Focus Timer">
            <Timer size={17} />
          </button>
          <ProfileHeaderButton onOpenProfile={onOpenProfile} />
          <Link to="/settings"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            style={{ background: 'rgba(0,0,0,0.04)' }}>
            <Settings size={17} />
          </Link>
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

      {/* ═══ MOBILE: Verse of the Day ══════════════════════════════ */}
      <div className="lg:hidden">
        {dailyVerse && (
          <div className="mb-4">
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
