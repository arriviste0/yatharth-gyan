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
  PieChart, Pie, AreaChart, Area, LineChart, Line, CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../hooks/useStorage';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import {
  formatDateDisplay, todayKey, isAfterElevenPM, dateKey,
  timeStringToValue, valueToTimeString, getDurationInMinutes,
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

/* ── Log Value Modal for Targets (Single or Multi-Metric) ──────────────────────── */
function LogValueModal({ target, dateStr, onLog, onClose }) {
  const isDone = target.done ?? false;
  const subMetrics = target.subMetrics || [];
  const isMulti = subMetrics.length > 0 || target.type === 'MULTI_METRIC';

  const isDuration = target.type === 'DURATION';
  const unit = target.unit || (isDuration ? 'min' : '');

  const initialVal = useMemo(() => {
    // Only prefill from existing log entry, not targetValue (pillars are pure measurement now)
    const raw = target.logEntry?.value != null ? target.logEntry.value : '';
    if (isDuration && raw !== '') {
      return valueToTimeString(raw, unit);
    }
    return String(raw);
  }, [target, isDuration, unit]);

  const [val, setVal] = useState(initialVal);

  const [subVals, setSubVals] = useState(() => {
    const existing = target.logEntry?.subValues || {};
    const initial = {};
    subMetrics.forEach((sub) => {
      const idKey = sub.id || sub.name;
      const raw = existing[idKey] != null ? existing[idKey] : (sub.targetValue || 0);
      initial[idKey] = isDuration ? valueToTimeString(raw, sub.unit || unit) : String(raw);
    });
    return initial;
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (isMulti) {
      const parsedSub = {};
      subMetrics.forEach((sub) => {
        const idKey = sub.id || sub.name;
        const rawInput = subVals[idKey];
        const num = isDuration ? timeStringToValue(rawInput, sub.unit || unit) : (parseFloat(rawInput) || 0);
        parsedSub[idKey] = num;
      });

      const primaryVal = isDuration ? timeStringToValue(val, unit) : (parseFloat(Object.values(subVals)[0]) || parseFloat(val) || 0);
      onLog(dateStr, target.id, {
        done: true,
        value: primaryVal,
        subValues: parsedSub,
        timestamp: Date.now()
      });
    } else {
      let num = 0;
      if (isDuration) {
        num = timeStringToValue(val, unit);
      } else if (target.type === 'TIME') {
        // TIME type logs raw string
        onLog(dateStr, target.id, { done: true, value: val, timestamp: Date.now() });
        onClose();
        return;
      } else {
        num = parseFloat(val);
      }
      if (isNaN(num)) return;
      // Pillars are pure measurement — any value logs as done
      onLog(dateStr, target.id, { done: true, value: num, timestamp: Date.now() });
    }
    onClose();
  }

  function handleClear() {
    onLog(dateStr, target.id, { done: false, value: null, subValues: null, timestamp: Date.now() });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-md bg-white dark:bg-[#181926] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: `${target.pillarColor}15`, color: target.pillarColor }}>
              {target.pillarName}
            </span>
            <h3 className="text-lg font-extrabold text-[#18191E] dark:text-white mt-2">{target.name}</h3>
            {unit && !isMulti && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                Log your {unit ? `value in ${unit}` : 'value'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {isMulti ? (
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-accent uppercase tracking-wider">
                Logged Sub-Metrics Breakdown
              </label>
              {subMetrics.map((sub) => {
                const idKey = sub.id || sub.name;
                return (
                  <div key={idKey} className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#18191E] dark:text-white">
                      <span>{sub.name}</span>
                      <span className="text-[10px] text-stone-400">
                        Goal: {sub.comparison === 'lte' ? '≤' : '≥'} {sub.targetValue} {sub.unit || unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type={isDuration ? 'time' : 'number'}
                        step={!isDuration ? 'any' : undefined}
                        value={subVals[idKey] ?? ''}
                        onChange={(e) => setSubVals({ ...subVals, [idKey]: e.target.value })}
                        placeholder={isDuration ? '00:30' : '0'}
                        className="flex-1 text-base font-bold text-[#18191E] dark:text-white bg-white dark:bg-[#181926] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 outline-none focus:border-accent"
                      />
                      <span className="text-xs font-bold text-stone-500 px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                        {sub.unit || unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-2">
                {isDuration ? 'Select Duration (hh:mm)' : `Enter Logged ${unit ? `Amount (${unit})` : 'Value'}`}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type={isDuration ? 'time' : 'number'}
                  step={!isDuration ? 'any' : undefined}
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder={isDuration ? '00:45' : (target.targetValue != null ? String(target.targetValue) : '0')}
                  autoFocus
                  className="flex-1 text-base font-bold text-[#18191E] dark:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-[#F05A36] transition-colors"
                />
                {unit && !isDuration && (
                  <span className="text-sm font-bold text-stone-500 dark:text-stone-400 px-3.5 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                    {unit}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick presets for single numbers */}
          {!isMulti && target.targetValue > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-stone-400">Quick set:</span>
              {[0.5, 0.75, 1, 1.25, 1.5].map((mult) => {
                const preset = Math.round(target.targetValue * mult * 10) / 10;
                return (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => setVal(String(preset))}
                    className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-accent hover:text-white transition-all text-stone-600 dark:text-stone-300 border border-black/5 dark:border-white/10"
                  >
                    {preset} {unit}
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 btn-coral py-3.5 px-6 text-xs font-extrabold uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isDone ? 'Update Log' : 'Log & Complete'}
            </button>
            {isDone && (
              <button
                type="button"
                onClick={handleClear}
                className="btn-secondary-outline px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-red-500 hover:bg-red-500 hover:text-white border-red-500/30 transition-all rounded-full"
              >
                Clear Log
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function isInputRequired(target) {
  if (!target) return false;
  if (target.type === 'NUMBER' || target.type === 'DURATION' || target.type === 'TIME' || target.type === 'MULTI_METRIC') return true;
  if (target.subMetrics && target.subMetrics.length > 0) return true;
  if (target.type === 'CHECKBOX') return false;
  if (target.unit && target.unit.trim().length > 0) return true;
  if (target.targetValue != null && typeof target.targetValue !== 'boolean') return true;
  const name = (target.name || '').toLowerCase();
  if (name.includes('protein') || name.includes('water') || name.includes('liter') || name.includes('litre') || name.includes('duration') || name.includes('gram') || name.includes('intake') || name.includes('sleep') || name.includes('workout') || name.includes('gym')) return true;
  return false;
}

function formatLoggedSummary(target) {
  if (!target || !target.logEntry) return null;
  const subVals = target.logEntry.subValues;
  if (subVals && Object.keys(subVals).length > 0) {
    const parts = [];
    (target.subMetrics || []).forEach(sub => {
      const idKey = sub.id || sub.name;
      if (subVals[idKey] != null) {
        parts.push(`${sub.name} ${subVals[idKey]}${sub.unit || ''}`);
      }
    });
    if (parts.length > 0) return parts.join(' · ');
  }
  if (target.logEntry.value != null && typeof target.logEntry.value !== 'boolean') {
    return `${target.logEntry.value}${target.unit ? ` ${target.unit}` : ''}`;
  }
  return 'Done';
}

/* ── Mobile Weekly Chart ───────────────────────────────────────────── */
function MobileWeeklyChart({ logs, pillars }) {
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [activeGraph, setActiveGraph] = useState('completion');
  const [selectedNumericId, setSelectedNumericId] = useState('all');

  const activePillar = selectedPillar === 'all' ? null : pillars.find(p => p.id === selectedPillar);
  const METRIC_COLORS = ['#F05A36', '#14B8A6', '#E6A04E', '#8B5CF6', '#3B82F6', '#10B981'];

  const data = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = dateKey(d);
      const dayLog = logs[key] || {};

      let rate = 0;
      if (selectedPillar === 'all') {
        rate = getDayCompletionRate(logs, pillars, key);
      } else if (activePillar) {
        const targets = activePillar.targets.filter(t => t.frequency === 'daily' || !t.frequency);
        const done = targets.filter(t => dayLog[t.id]?.done).length;
        rate = targets.length > 0 ? done / targets.length : 0;
      }

      let durationTotal = 0;
      let durationUnit = 'min';
      const durationTargets = (activePillar ? [activePillar] : pillars)
        .flatMap(p => p.targets.filter(t => t.type === 'DURATION' && (t.frequency === 'daily' || !t.frequency)));

      durationTargets.forEach(t => {
        const entry = dayLog[t.id];
        if (entry) {
          durationTotal += getDurationInMinutes(entry, t.unit);
        }
      });
      const durationDisplay = durationTotal >= 60 ? +(durationTotal / 60).toFixed(1) : Math.round(durationTotal);
      if (durationTotal >= 60) durationUnit = 'hr';

      const numericSeries = {};
      const numericTargets = (activePillar ? [activePillar] : pillars)
        .flatMap(p => p.targets.filter(t => t.type === 'NUMBER' && (t.frequency === 'daily' || !t.frequency)));
      numericTargets.forEach(t => {
        const entry = dayLog[t.id];
        if (entry?.value != null) {
          const n = parseFloat(entry.value);
          if (!isNaN(n)) numericSeries[t.id] = { name: t.name, value: n, unit: t.unit || '' };
        } else if (entry?.subValues && typeof entry.subValues === 'object') {
          const sumSub = Object.values(entry.subValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);
          if (sumSub > 0) numericSeries[t.id] = { name: t.name, value: sumSub, unit: t.unit || '' };
        }
      });

      days.push({
        key,
        label: WEEKDAY_SHORT[d.getDay()],
        rate: Math.round(rate * 100),
        duration: durationDisplay,
        durationUnit,
        isToday: i === 0,
        ...Object.fromEntries(Object.entries(numericSeries).map(([id, v]) => [`n_${id}`, v.value])),
      });
    }
    return days;
  }, [logs, pillars, selectedPillar, activePillar]);

  const avg = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length) : 0;

  const numericTargetDefs = useMemo(() => {
    const seen = new Map();
    (activePillar ? [activePillar] : pillars)
      .flatMap(p => p.targets.filter(t => t.type === 'NUMBER' && (t.frequency === 'daily' || !t.frequency))
        .map(t => ({ ...t, pillarColor: p.color })))
      .forEach(t => { if (!seen.has(t.id)) seen.set(t.id, t); });
    return Array.from(seen.values());
  }, [pillars, activePillar]);

  const activeNumericTarget = numericTargetDefs.find(t => t.id === selectedNumericId);

  const GRAPH_TABS = [
    { id: 'completion', label: '✓ %' },
    { id: 'duration',   label: '⏱ Hrs' },
    { id: 'numeric',    label: '📊 Intake' },
  ];

  return (
    <div className="card-bento p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#18191E] dark:text-white">Weekly Completion</h3>
          <p className="text-[10px] text-stone-400 dark:text-white/40 mt-0.5">Last 7 days</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold tabular-nums text-accent">{avg}%</div>
          <div className="text-[9px] text-stone-400 dark:text-white/30">avg rate</div>
        </div>
      </div>

      {/* Pillar Filter */}
      {pillars.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-black/5 dark:border-white/5">
          <button
            onClick={() => setSelectedPillar('all')}
            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all border ${
              selectedPillar === 'all'
                ? 'bg-accent text-white border-accent'
                : 'bg-black/5 dark:bg-white/5 border-black/8 dark:border-white/10 text-stone-500 dark:text-stone-400'
            }`}
          >
            All
          </button>
          {pillars.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPillar(p.id)}
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all border ${
                selectedPillar === p.id ? 'text-white border-transparent' : 'bg-black/5 dark:bg-white/5 border-black/8 dark:border-white/10 text-stone-500 dark:text-stone-400'
              }`}
              style={selectedPillar === p.id ? { backgroundColor: p.color, borderColor: p.color } : {}}
            >
              {p.english}
            </button>
          ))}
        </div>
      )}

      {/* Graph Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
        {GRAPH_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveGraph(tab.id)}
            className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
              activeGraph === tab.id
                ? 'bg-white dark:bg-[#181926] text-[#18191E] dark:text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Completion % */}
      {activeGraph === 'completion' && (
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="mobileWeekGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activePillar?.color || 'var(--color-accent)'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={activePillar?.color || 'var(--color-accent)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return <div className="bg-[#181926] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white">{payload[0].payload.label}: {payload[0].value}%</div>;
            }} />
            <Area type="monotone" dataKey="rate" stroke={activePillar?.color || 'var(--color-accent)'} strokeWidth={2} fill="url(#mobileWeekGrad2)" dot={{ r: 3, fill: activePillar?.color || 'var(--color-accent)', stroke: '#181926', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Duration */}
      {activeGraph === 'duration' && (
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return <div className="bg-[#181926] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white">{d.label}: {d.duration} {d.durationUnit}</div>;
            }} />
            <Bar dataKey="duration" radius={[5, 5, 0, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={activePillar?.color || (entry.isToday ? 'var(--color-accent)' : '#5B6BAF')} opacity={entry.isToday ? 1 : 0.7} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Intake/Numeric */}
      {activeGraph === 'numeric' && (
        numericTargetDefs.length === 0 ? (
          <p className="text-[11px] text-stone-400 text-center py-4">No quantity trackers. Add NUMBER type in Pillars.</p>
        ) : (
          <div className="space-y-3">
            {/* Metric KPI Cards (Selectable) */}
            <div className="grid grid-cols-2 gap-2">
              {numericTargetDefs.map((t, idx) => {
                const values = data.map(d => d[`n_${t.id}`]).filter(v => v != null);
                const avgVal = values.length > 0 ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;
                const maxVal = values.length > 0 ? Math.max(...values) : 1;
                const isSelected = selectedNumericId === t.id || (selectedNumericId === 'all' && idx === 0);
                const themeColor = t.pillarColor || METRIC_COLORS[idx % METRIC_COLORS.length];

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedNumericId(t.id)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-black/[0.04] dark:bg-white/[0.06] shadow-sm border-accent'
                        : 'bg-black/[0.01] dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
                    }`}
                    style={isSelected ? { borderColor: themeColor, backgroundColor: `${themeColor}10` } : {}}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="text-xs font-extrabold text-[#18191E] dark:text-white truncate">
                        {t.name}
                      </div>
                      <span className="text-[9px] font-bold text-stone-400 shrink-0">{t.unit}</span>
                    </div>

                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-base font-extrabold tabular-nums" style={{ color: themeColor }}>
                        {avgVal} <span className="text-[9px] font-semibold text-stone-400">avg/day</span>
                      </span>
                    </div>

                    {/* Mini 7-Day Sparkline Bars */}
                    <div className="flex items-end gap-1 h-7 pt-1">
                      {data.map((d, di) => {
                        const val = d[`n_${t.id}`] || 0;
                        const pct = Math.min(100, Math.max(10, Math.round((val / (maxVal || 1)) * 100)));
                        return (
                          <div key={di} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                            <div
                              className="w-full rounded-t-sm transition-all duration-300"
                              style={{
                                height: val > 0 ? `${pct}%` : '2px',
                                backgroundColor: val > 0 ? themeColor : 'rgba(150,150,150,0.2)',
                                opacity: d.isToday ? 1 : 0.7,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Metric Detailed Focus Chart */}
            {(() => {
              const activeT = activeNumericTarget || numericTargetDefs[0];
              if (!activeT) return null;
              const themeColor = activeT.pillarColor || 'var(--color-accent)';

              return (
                <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#18191E] dark:text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColor }} />
                      {activeT.name} Daily Breakdown
                    </span>
                    <span className="text-[10px] font-bold text-stone-400">7-Day Trend</span>
                  </div>

                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const val = payload[0].value;
                        return (
                          <div className="bg-[#181926] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white shadow-xl">
                            {payload[0].payload.label}: <span style={{ color: themeColor }}>{val != null ? `${val} ${activeT.unit || ''}` : '0'}</span>
                          </div>
                        );
                      }} />
                      <Bar dataKey={`n_${activeT.id}`} radius={[6, 6, 0, 0]}>
                        {data.map((entry, i) => (
                          <Cell key={i} fill={themeColor} opacity={entry.isToday ? 1 : 0.75} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </div>
        )
      )}
    </div>
  );
}

/* ── Mobile Today View ─────────────────────────────────────────────── */
function MobileTodayView({ pillars, logs, metrics = {}, logTarget, dateStr, streak, settings, onOpenFocus }) {
  const { state } = useStorage();
  const goals = state?.goals || [];
  const [loggingTarget, setLoggingTarget] = useState(null);
  const [tab, setTab] = useState('all');
  const [filterPillar, setFilterPillar] = useState('all');

  const dayLog = logs[dateStr] || {};
  const activeTargets = useMemo(() =>
    pillars.flatMap((p) =>
      p.targets.filter((t) => t.frequency === 'daily' || !t.frequency)
        .map((t) => ({
          ...t,
          pillarId: p.id,
          pillarName: p.english,
          pillarColor: p.color || '#F05A36',
          pillarIcon: p.icon,
          done: !!dayLog[t.id]?.done,
          logEntry: dayLog[t.id],
        }))
    ), [pillars, dayLog]);

  const completedCount = activeTargets.filter((t) => t.done).length;
  const totalCount = activeTargets.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount && totalCount > 0;
  const pendingCount = activeTargets.filter((t) => !t.done).length;
  const doneCount = completedCount;

  const filteredTargets = useMemo(() => {
    let list = activeTargets;
    if (filterPillar !== 'all') list = list.filter((t) => t.pillarId === filterPillar);
    if (tab === 'pending') return list.filter((t) => !t.done);
    if (tab === 'done') return list.filter((t) => t.done);
    return list;
  }, [activeTargets, tab, filterPillar]);

  function handleTaskClick(target) {
    if (isInputRequired(target)) {
      setLoggingTarget(target);
    } else {
      logTarget(dateStr, target.id, { done: !target.done, value: !target.done, timestamp: Date.now() });
    }
  }

  // Weekly chart data
  const weeklyData = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = dateKey(d);
      const rate = getDayCompletionRate(logs, pillars, key);
      days.push({
        key,
        label: WEEKDAY_SHORT[d.getDay()],
        rate: Math.round(rate * 100),
        isToday: i === 0,
      });
    }
    return days;
  }, [logs, pillars]);

  const weeklyAvg = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, d) => s + d.rate, 0) / weeklyData.length)
    : 0;

  // Pillar stats
  const pillarStats = useMemo(() =>
    pillars.map((p) => {
      const dailyTargets = p.targets.filter((t) => t.frequency === 'daily' || !t.frequency);
      const doneC = dailyTargets.filter((t) => dayLog[t.id]?.done).length;
      const totalC = dailyTargets.length;
      const pctP = totalC > 0 ? Math.round((doneC / totalC) * 100) : 0;
      return { id: p.id, name: p.english, sanskrit: p.sanskrit, color: p.color, icon: p.icon, doneCount: doneC, totalCount: totalC, pct: pctP };
    }).sort((a, b) => b.pct - a.pct),
    [pillars, dayLog]);

  // Activity feed
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
          });
        }
      });
    });
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [pillars, dayLog]);

  return (
    <div className="block lg:hidden space-y-5 mb-5">
      {/* Hero Progress Card */}
      <div className="card-bento relative overflow-hidden rounded-3xl p-6 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-md">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent">Today's Practice</span>
            <h2 className="text-xl font-extrabold text-[#18191E] dark:text-white mt-1 leading-tight">{allDone ? 'All done! 🪷' : `${totalCount - completedCount} tasks remaining`}</h2>
            <p className="text-[11px] text-stone-500 dark:text-white/50 mt-1 leading-relaxed">{allDone ? 'Your practice blooms today — rest well.' : 'Tap each target to check it off or enter amounts.'}</p>
            <div className="flex items-center gap-3 mt-4">
              {!settings.silentMode && streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-accent" style={{ background: 'var(--color-accent-light)' }}>
                  <Flame size={11} className="text-accent" /><span className="text-[10px] font-extrabold text-accent">{streak}d streak</span>
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

      {/* ── Mobile KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Completion Rate */}
        <div className="card-bento p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${pct >= 80 ? '#C9A961' : pct >= 50 ? '#E8843C' : '#5B6BAF'}18` }}>
              <Target size={15} style={{ color: pct >= 80 ? '#C9A961' : pct >= 50 ? '#E8843C' : '#5B6BAF' }} />
            </div>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${(pct - weeklyAvg) >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
              {(pct - weeklyAvg) >= 0 ? '↑' : '↓'} {Math.abs(pct - weeklyAvg)}%
            </span>
          </div>
          <div className="text-2xl font-extrabold tabular-nums text-[#18191E] dark:text-white">{pct}%</div>
          <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400">Completion Rate</div>
          <div className="text-[9px] text-stone-400 dark:text-white/40 font-medium mt-0.5">
            {pct >= 100 ? 'All targets done!' : `${totalCount - completedCount} remaining`}
          </div>
        </div>

        {/* Streak */}
        <div className="card-bento p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${streak >= 7 ? '#C9A961' : '#E8843C'}18` }}>
              <Flame size={15} style={{ color: streak >= 7 ? '#C9A961' : '#E8843C' }} />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums text-[#18191E] dark:text-white">{streak}d</div>
          <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400">Current Streak</div>
          <div className="text-[9px] text-stone-400 dark:text-white/40 font-medium mt-0.5">
            {streak > 0 ? 'Keep the flame alive!' : 'Start your streak today'}
          </div>
        </div>

        {/* Tasks Done */}
        <div className="card-bento p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#E8843C18' }}>
              <CheckCircle2 size={15} style={{ color: '#E8843C' }} />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums text-[#18191E] dark:text-white">{completedCount}/{totalCount}</div>
          <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400">Tasks Done</div>
          <div className="text-[9px] text-stone-400 dark:text-white/40 font-medium mt-0.5">Daily targets completed</div>
        </div>

        {/* Active Pillars */}
        <div className="card-bento p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#5A8A8A18' }}>
              <Activity size={15} style={{ color: '#5A8A8A' }} />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums text-[#18191E] dark:text-white">{pillars.length}</div>
          <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400">Active Pillars</div>
          <div className="text-[9px] text-stone-400 dark:text-white/40 font-medium mt-0.5">{totalCount} daily targets tracked</div>
        </div>
      </div>

      {/* Pillar Cards Header & Cards */}
      <div>
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Your Pillars</span>
          <div className="flex items-center gap-2">
            <Link
              to="/sadhana"
              state={{ addPillar: true }}
              className="text-[10px] font-extrabold text-accent bg-accent/10 px-2 py-0.5 rounded-full hover:bg-accent/20 transition-all flex items-center gap-1"
            >
              <Plus size={11} /> Pillar
            </Link>
            <Link to="/sadhana" className="text-[10px] font-extrabold text-accent hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={10} />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {pillars.map((pillar) => <PillarCategoryCard key={pillar.id} pillar={pillar} dayLog={dayLog} />)}
        </div>
      </div>

      {/* Daily Practice Targets - Tabbed & Filterable (matching Desktop) */}
      <div className="card-bento p-4 space-y-3">
        {/* Header & Pillar Filter & Add Target */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-black/5 dark:border-white/5">
          <div>
            <h3 className="text-sm font-extrabold text-[#18191E] dark:text-white">Daily Targets</h3>
            <p className="text-[10px] text-stone-400 font-medium">Track & check off your non-negotiables</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pillar dropdown */}
            <div className="relative">
              <select
                value={filterPillar}
                onChange={(e) => setFilterPillar(e.target.value)}
                className="appearance-none bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#18191E] dark:text-white text-[11px] font-extrabold px-2.5 py-1 pr-6 rounded-xl outline-none cursor-pointer"
              >
                <option value="all" className="text-stone-800">All Pillars</option>
                {pillars.map((p) => <option key={p.id} value={p.id} className="text-stone-800">{p.english}</option>)}
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>

            {/* Quick Add Target button */}
            <Link
              to="/sadhana"
              state={{ addPillar: false }}
              className="btn-coral text-[10px] px-2.5 py-1 flex items-center gap-1 shrink-0 shadow-sm"
            >
              <Plus size={11} /> Target
            </Link>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/8">
          {[
            { id: 'all', label: 'All', count: activeTargets.length },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'done', label: 'Done', count: doneCount },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition-all text-center ${
                tab === t.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-[#18191E] dark:hover:text-white'
              }`}
            >
              {t.label} <span className={`ml-1 text-[9px] px-1.5 py-0.2 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Filtered Targets List */}
        <div className="space-y-2 pt-1">
          {filteredTargets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-stone-400 dark:text-stone-500">
              <CheckCircle2 size={28} className="mb-1.5 opacity-60" />
              <span className="text-xs font-semibold">{tab === 'pending' ? 'All tasks completed! 🪷' : 'No targets match filter'}</span>
            </div>
          ) : (
            filteredTargets.map((target) => {
              const Icon = PILLAR_ICONS[target.pillarIcon] || Zap;
              const isNonCheckbox = isInputRequired(target);

              return (
                <div
                  key={target.id}
                  onClick={() => handleTaskClick(target)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                    target.done
                      ? 'bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/5'
                      : 'bg-white dark:bg-[#181926] border-black/5 dark:border-white/8 hover:border-[#F05A36]/30 shadow-sm'
                  }`}
                >
                  {/* Checkbox button */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(target);
                    }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all ${
                      target.done
                        ? 'bg-accent border-accent text-white shadow-sm'
                        : 'hover:border-accent'
                    }`}
                    style={{ borderColor: target.done ? undefined : `${target.pillarColor}50` }}
                  >
                    {target.done && <Check size={13} strokeWidth={3} />}
                  </div>

                  {/* Icon */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${target.pillarColor}18` }}>
                    <Icon size={14} style={{ color: target.pillarColor }} />
                  </div>

                  {/* Task details */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate ${target.done ? 'line-through text-stone-400 dark:text-stone-500' : 'text-[#18191E] dark:text-white'}`}>
                      {target.name}
                    </div>
                    <div className="text-[10px] text-stone-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold px-1.5 py-0.2 rounded-full" style={{ background: `${target.pillarColor}15`, color: target.pillarColor }}>
                        {target.pillarName}
                      </span>
                      {isNonCheckbox && (
                        target.done ? (
                          <span className="text-emerald-500 font-bold">Logged: {formatLoggedSummary(target)}</span>
                        ) : (
                          <span className="text-stone-400">
                            Target: {target.comparison === 'lte' ? '≤' : '≥'} {target.targetValue} {target.unit || ''}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Action button if non-checkbox and pending */}
                  {isNonCheckbox && !target.done && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLoggingTarget(target);
                      }}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-accent/10 text-accent hover:bg-accent/20 shrink-0 transition-all"
                    >
                      Log
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Mobile Weekly Trend Chart ───────────────────────────────── */}
      <MobileWeeklyChart logs={logs} pillars={pillars} />

      {/* ── Goal Tracking & Target Progress Visualization ─────────────── */}
      <div className="card-bento p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#18191E] dark:text-white flex items-center gap-1.5">
              <Target size={16} className="text-accent" /> Goal Progress & Targets
            </h3>
            <p className="text-[10px] text-stone-400 dark:text-white/40 mt-0.5 font-medium">
              Live tracking across linked pillars, trackers & independent targets
            </p>
          </div>
          <Link
            to="/sadhana"
            state={{ addGoal: true }}
            className="text-[10px] font-extrabold text-accent bg-accent/10 px-2.5 py-1 rounded-full hover:bg-accent/20 transition-all flex items-center gap-1 shrink-0"
          >
            <Plus size={11} /> Goal
          </Link>
        </div>

        {goals && goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((goal) => {
              // Find linked target or pillar
              const linkedTarget = goal.pillarTargetId
                ? pillars.flatMap(p => p.targets).find(t => t.id === goal.pillarTargetId)
                : null;
              const linkedPillar = goal.pillarId
                ? pillars.find(p => p.id === goal.pillarId)
                : (linkedTarget ? pillars.find(p => p.targets.some(t => t.id === linkedTarget.id)) : null);

              const today = todayKey();
              const dayLog = logs[today] || {};

              let currentVal = 0;
              let pct = 0;

              if (linkedTarget) {
                const entry = dayLog[linkedTarget.id];
                if (entry) {
                  if (linkedTarget.type === 'DURATION') {
                    currentVal = getDurationInMinutes(entry, linkedTarget.unit);
                    if (goal.unit && (goal.unit.toLowerCase() === 'hr' || goal.unit.toLowerCase() === 'hrs')) {
                      currentVal = +(currentVal / 60).toFixed(1);
                    }
                  } else if (entry.value != null) {
                    currentVal = parseFloat(entry.value) || 0;
                  } else if (entry.subValues) {
                    currentVal = Object.values(entry.subValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);
                  }
                }
                pct = goal.value > 0 ? Math.min(100, Math.round((currentVal / goal.value) * 100)) : 0;
              } else if (linkedPillar) {
                const targets = linkedPillar.targets || [];
                const doneCount = targets.filter(t => dayLog[t.id]?.done).length;
                pct = targets.length > 0 ? Math.round((doneCount / targets.length) * 100) : 0;
                currentVal = doneCount;
              } else {
                // Independent goal
                pct = goal.completed ? 100 : 0;
              }

              const isGte = goal.direction === 'gte';
              const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000) : null;
              const themeColor = linkedPillar?.color || 'var(--color-accent)';

              return (
                <div
                  key={goal.id}
                  className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#18191E] dark:text-white truncate">
                          {goal.name}
                        </span>
                        <span
                          className="text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase tracking-wider shrink-0"
                          style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                        >
                          {isGte ? '≥ Target' : '≤ Target'}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 font-medium mt-0.5 flex items-center gap-1.5 truncate">
                        {linkedTarget ? (
                          <span>🎯 Linked to <span className="font-bold text-stone-600 dark:text-stone-300">{linkedTarget.name}</span></span>
                        ) : linkedPillar ? (
                          <span>🏛️ Linked to <span className="font-bold text-stone-600 dark:text-stone-300">{linkedPillar.english}</span></span>
                        ) : (
                          <span>✨ Standalone Goal</span>
                        )}
                        {daysLeft !== null && (
                          <span>· <span className={daysLeft < 0 ? 'text-red-500 font-bold' : 'text-stone-400'}>
                            {daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
                          </span></span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold tabular-nums" style={{ color: themeColor }}>
                        {linkedTarget ? `${currentVal} / ${goal.value} ${goal.unit || ''}` : `${pct}%`}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: themeColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <Target size={20} />
            </div>
            <div className="text-xs font-bold text-[#18191E] dark:text-white">No Goals Set Yet</div>
            <p className="text-[10px] text-stone-400 max-w-xs mx-auto">
              Set goals like "Protein 90g/day" or "Water 3L" and link them to your pillars to visualize progress here.
            </p>
            <Link
              to="/sadhana"
              state={{ addGoal: true }}
              className="btn-coral inline-flex items-center gap-1.5 text-[11px] font-extrabold px-4 py-2 shadow-sm"
            >
              <Plus size={13} /> Set First Goal
            </Link>
          </div>
        )}
      </div>

      {/* ── Mobile Activity Feed ────────────────────────────────────── */}
      <div className="card-bento p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#18191E] dark:text-white">Activity Feed</h3>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 font-medium">Recent completions today</p>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-stone-700 dark:text-stone-300 border border-black/5 dark:border-white/10">
            {activities.length} entries
          </span>
        </div>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-stone-500 dark:text-stone-400">
            <Activity size={24} className="mb-2 text-stone-400 dark:text-stone-500" />
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">No completions yet today</span>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 font-medium">Complete a target to see it here</span>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto no-scrollbar">
            {activities.map((a) => {
              const time = new Date(a.timestamp);
              const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.pillarColor }} />
                    <span className="text-xs font-extrabold text-[#18191E] dark:text-white truncate">{a.name}</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${a.pillarColor}15`, color: a.pillarColor }}>
                    {a.pillarName}
                  </span>
                  <span className="text-[10px] text-stone-600 dark:text-stone-300 tabular-nums font-semibold shrink-0">{timeStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {loggingTarget && (
        <LogValueModal
          target={loggingTarget}
          dateStr={dateStr}
          onLog={logTarget}
          onClose={() => setLoggingTarget(null)}
        />
      )}
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
function TaskRow({ target, dateStr, logTarget, onEdit, onLogModal }) {
  const Icon = PILLAR_ICONS[target.pillarIcon] || Zap;
  const isNonCheckbox = isInputRequired(target);
  const loggedVal = target.logEntry?.value;

  function handleCheckClick(e) {
    e.stopPropagation();
    if (isNonCheckbox) {
      onLogModal(target);
    } else {
      logTarget(dateStr, target.id, { done: !target.done, value: !target.done, timestamp: Date.now() });
    }
  }

  return (
    <div
      onClick={() => isNonCheckbox && onLogModal(target)}
      className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group border border-black/5 dark:border-white/5 ${
        isNonCheckbox ? 'cursor-pointer hover:border-[#F05A36]/30' : ''
      } ${
        target.done ? 'bg-black/[0.02] dark:bg-white/[0.02]' : 'bg-white dark:bg-[#181926] shadow-sm hover:shadow-md'
      }`}
    >
      {/* Target check button */}
      <button
        onClick={handleCheckClick}
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
        {isNonCheckbox && (
          <div className="text-[11px] font-medium mt-0.5">
            {target.done ? (
              <span className="text-emerald-500 font-bold">Logged: {formatLoggedSummary(target)}</span>
            ) : (
              <span className="text-stone-400">
                {target.subMetrics && target.subMetrics.length > 0
                  ? `Multi-Metric (${target.subMetrics.length} sub-fields)`
                  : `Target: ${target.comparison === 'lte' ? '≤' : '≥'} ${target.targetValue} ${target.unit || ''}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pillar badge */}
      <span className="text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0"
        style={{ background: `${target.pillarColor}15`, color: target.pillarColor }}>
        {target.pillarName}
      </span>

      {/* Type badge */}
      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-stone-600 dark:text-white/50 shrink-0">
        {!isNonCheckbox ? 'Yes/No' : target.type === 'NUMBER' ? `${target.comparison === 'lte' ? '≤' : '≥'}${target.targetValue}${target.unit ? ` ${target.unit}` : ''}` : target.type === 'TIME' ? `≤${target.targetValue}` : target.type}
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {isNonCheckbox && !target.done && (
          <button
            onClick={(e) => { e.stopPropagation(); onLogModal(target); }}
            title="Log amount"
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-accent/10 text-accent hover:bg-accent/20 transition-all"
          >
            Log Value
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Desktop Task Manager (Tabbed) ────────────────────────────────── */
function DesktopTaskManager({ pillars, logs, logTarget, dateStr, setPillars }) {
  const [tab, setTab] = useState('all');
  const [editingTarget, setEditingTarget] = useState(null);
  const [loggingTarget, setLoggingTarget] = useState(null);
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
          logEntry: dayLog[t.id],
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
            <TaskRow
              key={target.id}
              target={target}
              dateStr={dateStr}
              logTarget={logTarget}
              onEdit={handleEdit}
              onLogModal={(t) => setLoggingTarget(t)}
            />
          ))
        )}
      </div>

      {/* Target Definition Edit Modal */}
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
              className="px-4 py-2 bg-[#E8843C] hover:bg-[#d4732b] text-[#ffffff] rounded-xl text-xs font-bold transition-all"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Log Value Modal for Desktop */}
      {loggingTarget && (
        <LogValueModal
          target={loggingTarget}
          dateStr={dateStr}
          onLog={logTarget}
          onClose={() => setLoggingTarget(null)}
        />
      )}
    </div>
  );
}

/* ── Desktop Weekly Trend Chart ───────────────────────────────────── */
function DesktopWeeklyChart({ logs, pillars }) {
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [activeGraph, setActiveGraph] = useState('completion'); // 'completion' | 'duration' | 'numeric'

  const activePillar = selectedPillar === 'all' ? null : pillars.find(p => p.id === selectedPillar);

  // Build 7-day data
  const data = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = dateKey(d);
      const dayLog = logs[key] || {};

      // Completion rate — scoped to selected pillar or all
      let rate = 0;
      if (selectedPillar === 'all') {
        rate = getDayCompletionRate(logs, pillars, key);
      } else if (activePillar) {
        const targets = activePillar.targets.filter(t => t.frequency === 'daily' || !t.frequency);
        const done = targets.filter(t => dayLog[t.id]?.done).length;
        rate = targets.length > 0 ? done / targets.length : 0;
      }

      // Duration values — sum all DURATION targets for the selected pillar (or all pillars)
      let durationTotal = 0;
      let durationUnit = 'min';
      const durationTargets = (activePillar ? [activePillar] : pillars)
        .flatMap(p => p.targets.filter(t => t.type === 'DURATION' && (t.frequency === 'daily' || !t.frequency)));
      durationTargets.forEach(t => {
        const entry = dayLog[t.id];
        if (entry?.value != null) {
          const n = parseFloat(entry.value);
          if (!isNaN(n)) {
            // If unit is hr/hrs, convert to mins for uniform comparison
            const u = (t.unit || 'min').toLowerCase();
            durationTotal += (u === 'hr' || u === 'hrs' || u === 'hour' || u === 'hours') ? n * 60 : n;
          }
        }
      });
      // Display in hours if > 60 mins
      const durationDisplay = durationTotal >= 60 ? +(durationTotal / 60).toFixed(1) : Math.round(durationTotal);
      if (durationTotal >= 60) durationUnit = 'hr';

      // Numeric values — per-target series for selected pillar
      const numericSeries = {};
      const numericTargets = (activePillar ? [activePillar] : pillars)
        .flatMap(p => p.targets.filter(t => t.type === 'NUMBER' && (t.frequency === 'daily' || !t.frequency)));
      numericTargets.forEach(t => {
        const entry = dayLog[t.id];
        if (entry?.value != null) {
          const n = parseFloat(entry.value);
          if (!isNaN(n)) {
            const shortName = t.name.length > 10 ? t.name.slice(0, 10) + '…' : t.name;
            numericSeries[t.id] = { name: shortName, value: n, unit: t.unit || '' };
          }
        }
      });

      days.push({
        key,
        label: WEEKDAY_FULL[d.getDay()],
        short: WEEKDAY_SHORT[d.getDay()],
        rate: Math.round(rate * 100),
        duration: durationDisplay,
        durationUnit,
        isToday: i === 0,
        ...Object.fromEntries(Object.entries(numericSeries).map(([id, v]) => [`n_${id}`, v.value])),
        _numericSeries: numericSeries,
      });
    }
    return days;
  }, [logs, pillars, selectedPillar, activePillar]);

  const avg = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length) : 0;

  // Get unique numeric targets (for multi-line chart)
  const numericTargetDefs = useMemo(() => {
    const seen = new Map();
    const targets = (activePillar ? [activePillar] : pillars)
      .flatMap(p => p.targets.filter(t => t.type === 'NUMBER' && (t.frequency === 'daily' || !t.frequency))
        .map(t => ({ ...t, pillarColor: p.color })));
    targets.forEach(t => { if (!seen.has(t.id)) seen.set(t.id, t); });
    return Array.from(seen.values());
  }, [pillars, activePillar]);

  const METRIC_COLORS = ['#F05A36', '#14B8A6', '#E6A04E', '#8B5CF6', '#3B82F6', '#10B981', '#EC4899'];

  const GRAPH_TABS = [
    { id: 'completion', label: '✓ Completion %' },
    { id: 'duration',   label: '⏱ Duration (hrs)' },
    { id: 'numeric',    label: '📊 Intake / Metrics' },
  ];

  return (
    <div className="card-bento p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#18191E] dark:text-white">Weekly Completion</h3>
          <p className="text-[11px] text-stone-400 dark:text-white/40 mt-0.5">Last 7 days performance</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-extrabold tabular-nums text-accent">{avg}%</div>
          <div className="text-[10px] text-stone-400 dark:text-white/30">avg rate</div>
        </div>
      </div>

      {/* Pillar Filter Pills */}
      {pillars.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-1 border-b border-black/5 dark:border-white/5">
          <button
            onClick={() => setSelectedPillar('all')}
            className={`text-[11px] font-extrabold px-3 py-1.5 rounded-full transition-all border ${
              selectedPillar === 'all'
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-black/5 dark:bg-white/5 border-black/8 dark:border-white/10 text-stone-500 dark:text-stone-400 hover:text-accent hover:border-accent/40'
            }`}
          >
            All Pillars
          </button>
          {pillars.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPillar(p.id)}
              className={`text-[11px] font-extrabold px-3 py-1.5 rounded-full transition-all border ${
                selectedPillar === p.id
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-black/5 dark:bg-white/5 border-black/8 dark:border-white/10 text-stone-500 dark:text-stone-400 hover:border-accent/40'
              }`}
              style={selectedPillar === p.id ? { backgroundColor: p.color, borderColor: p.color } : {}}
            >
              {p.english}
            </button>
          ))}
        </div>
      )}

      {/* Graph Type Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5">
        {GRAPH_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveGraph(tab.id)}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition-all ${
              activeGraph === tab.id
                ? 'bg-white dark:bg-[#181926] text-[#18191E] dark:text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-[#18191E] dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Graph: Completion % ── */}
      {activeGraph === 'completion' && (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activePillar?.color || 'var(--color-accent)'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={activePillar?.color || 'var(--color-accent)'} stopOpacity={0} />
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
            <Area
              type="monotone"
              dataKey="rate"
              stroke={activePillar?.color || 'var(--color-accent)'}
              strokeWidth={2.5}
              fill="url(#weekGrad)"
              dot={{ r: 4, fill: activePillar?.color || 'var(--color-accent)', stroke: '#181926', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* ── Graph: Duration / hrs ── */}
      {activeGraph === 'duration' && (
        <div className="space-y-2">
          <p className="text-[10px] text-stone-400 font-medium">
            {activePillar ? activePillar.english : 'All'} duration trackers · converted to minutes
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#181926] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
                      <div className="font-bold text-white">{d.label}</div>
                      <div className="text-stone-300 mt-1">{d.duration} {d.durationUnit}</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="duration" radius={[6, 6, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={activePillar?.color || (entry.isToday ? 'var(--color-accent)' : '#5B6BAF')}
                    opacity={entry.isToday ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {data.every(d => d.duration === 0) && (
            <p className="text-[11px] text-stone-400 text-center py-2 font-medium">
              No duration data logged yet — add DURATION trackers in Pillars
            </p>
          )}
        </div>
      )}

      {/* ── Graph: Numeric Intake / Metrics ── */}
      {activeGraph === 'numeric' && (
        <div className="space-y-2">
          <p className="text-[10px] text-stone-400 font-medium">
            {activePillar ? activePillar.english : 'All'} quantity trackers (protein, water, carbs, steps…)
          </p>
          {numericTargetDefs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-stone-400 text-center">
              <span className="text-2xl mb-2">📊</span>
              <p className="text-xs font-semibold">No quantity trackers found</p>
              <p className="text-[10px] mt-1">Add NUMBER type trackers in Pillars → they'll appear here</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-[#181926] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs space-y-1">
                          <div className="font-bold text-white mb-1">{label}</div>
                          {payload.map((p, i) => {
                            const tDef = numericTargetDefs.find(t => `n_${t.id}` === p.dataKey);
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                <span className="text-stone-300">{tDef?.name}: <span className="text-white font-bold">{p.value ?? '—'} {tDef?.unit}</span></span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                  {numericTargetDefs.map((t, i) => (
                    <Line
                      key={t.id}
                      type="monotone"
                      dataKey={`n_${t.id}`}
                      name={t.name}
                      stroke={t.pillarColor || METRIC_COLORS[i % METRIC_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: t.pillarColor || METRIC_COLORS[i % METRIC_COLORS.length], stroke: '#181926', strokeWidth: 1.5 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 pt-1">
                {numericTargetDefs.map((t, i) => (
                  <span key={t.id} className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.pillarColor || METRIC_COLORS[i % METRIC_COLORS.length] }} />
                    {t.name}{t.unit ? ` (${t.unit})` : ''}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}


/* ── Desktop Goal Visualization (Target Progress & Live Tracking) ───── */
function DesktopGoalVisualization({ pillars, logs, dateStr }) {
  const { state } = useStorage();
  const goals = state?.goals || [];
  const dayLog = logs[dateStr] || {};

  return (
    <div className="card-bento p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#18191E] dark:text-white flex items-center gap-2">
            <Target size={18} className="text-accent" /> Goal Progress & Targets
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
            Live progress across linked pillars, trackers & independent goals
          </p>
        </div>
        <Link
          to="/sadhana"
          state={{ addGoal: true }}
          className="btn-coral text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <Plus size={13} /> Set Goal
        </Link>
      </div>

      {goals.length > 0 ? (
        <div className="space-y-3">
          {goals.map((goal) => {
            const linkedTarget = goal.pillarTargetId
              ? pillars.flatMap(p => p.targets).find(t => t.id === goal.pillarTargetId)
              : null;
            const linkedPillar = goal.pillarId
              ? pillars.find(p => p.id === goal.pillarId)
              : (linkedTarget ? pillars.find(p => p.targets.some(t => t.id === linkedTarget.id)) : null);

            let currentVal = 0;
            let pct = 0;

            if (linkedTarget) {
              const entry = dayLog[linkedTarget.id];
              if (entry) {
                if (linkedTarget.type === 'DURATION') {
                  currentVal = getDurationInMinutes(entry, linkedTarget.unit);
                  if (goal.unit && (goal.unit.toLowerCase() === 'hr' || goal.unit.toLowerCase() === 'hrs')) {
                    currentVal = +(currentVal / 60).toFixed(1);
                  }
                } else if (entry.value != null) {
                  currentVal = parseFloat(entry.value) || 0;
                } else if (entry.subValues) {
                  currentVal = Object.values(entry.subValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);
                }
              }
              pct = goal.value > 0 ? Math.min(100, Math.round((currentVal / goal.value) * 100)) : 0;
            } else if (linkedPillar) {
              const targets = linkedPillar.targets || [];
              const doneCount = targets.filter(t => dayLog[t.id]?.done).length;
              pct = targets.length > 0 ? Math.round((doneCount / targets.length) * 100) : 0;
              currentVal = doneCount;
            } else {
              pct = goal.completed ? 100 : 0;
            }

            const isGte = goal.direction === 'gte';
            const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000) : null;
            const themeColor = linkedPillar?.color || 'var(--color-accent)';

            return (
              <div
                key={goal.id}
                className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#18191E] dark:text-white truncate">
                        {goal.name}
                      </span>
                      <span
                        className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                        style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                      >
                        {isGte ? '≥ Target' : '≤ Target'}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 font-medium mt-1 flex items-center gap-2 truncate">
                      {linkedTarget ? (
                        <span>🎯 Linked to <span className="font-bold text-stone-600 dark:text-stone-300">{linkedTarget.name}</span></span>
                      ) : linkedPillar ? (
                        <span>🏛️ Linked to <span className="font-bold text-stone-600 dark:text-stone-300">{linkedPillar.english}</span></span>
                      ) : (
                        <span>✨ Standalone Goal</span>
                      )}
                      {daysLeft !== null && (
                        <span>· <span className={daysLeft < 0 ? 'text-red-500 font-bold' : 'text-stone-400'}>
                          {daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
                        </span></span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold tabular-nums" style={{ color: themeColor }}>
                      {linkedTarget ? `${currentVal} / ${goal.value} ${goal.unit || ''}` : `${pct}%`}
                    </div>
                    <div className="text-[10px] font-bold text-stone-400">
                      {pct >= 100 ? 'Goal Reached! 🎉' : `${pct}% achieved`}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: themeColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 space-y-3 bg-black/[0.01] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
            <Target size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-[#18191E] dark:text-white">No Goals Set Yet</div>
            <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 font-medium">
              Set goals like "Protein 90g/day" or "Water 3L" and link them to your pillars to visualize progress here.
            </p>
          </div>
          <Link
            to="/sadhana"
            state={{ addGoal: true }}
            className="btn-coral inline-flex items-center gap-1.5 text-xs font-extrabold px-5 py-2.5 shadow-md"
          >
            <Plus size={14} /> Set Your First Goal
          </Link>
        </div>
      )}
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
  const pillars = state.pillars || [];
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
        pillars={pillars} logs={logs} metrics={metrics} logTarget={logTarget}
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

          {/* Right Column — Goal Tracking + Activity Feed */}
          <div className="col-span-2 space-y-5">
            <DesktopGoalVisualization pillars={pillars} logs={logs} dateStr={today} />
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
