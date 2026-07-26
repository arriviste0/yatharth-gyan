import { useState, useRef } from 'react';
import {
  ChevronDown, ChevronUp, Check, Edit3,
  Moon, Soup, Dumbbell, Star, Heart, Flame, Zap, Wind, Sun,
} from 'lucide-react';
import { todayKey } from '../utils/dateUtils';
import { haptic } from '../utils/haptic';

const ICON_MAP = {
  moon: Moon, bowl: Soup, dumbbell: Dumbbell,
  star: Star, heart: Heart, flame: Flame,
  zap: Zap, wind: Wind, sun: Sun,
};

function TargetRow({ target, logEntry, onLog }) {
  const [inputVal, setInputVal] = useState('');
  const [open, setOpen]         = useState(false);
  const isDone = logEntry?.done ?? false;

  function handleCheckbox() {
    haptic(isDone ? 4 : 10);
    onLog(target.id, { done: !isDone, value: !isDone });
  }

  function handleNumberSubmit(e) {
    e.preventDefault();
    const num = parseFloat(inputVal);
    if (isNaN(num)) return;
    const tv   = target.targetValue ?? 0;
    const done = target.comparison === 'gte' ? num >= tv : num <= tv;
    onLog(target.id, { done, value: num });
    setOpen(false);
  }

  function handleTimeSubmit(e) {
    e.preventDefault();
    if (!inputVal) return;
    const [h, m]   = inputVal.split(':').map(Number);
    const [th, tm] = (target.targetValue || '23:00').split(':').map(Number);
    const done = target.comparison === 'lte'
      ? (h * 60 + m) <= (th * 60 + tm)
      : (h * 60 + m) >= (th * 60 + tm);
    onLog(target.id, { done, value: inputVal });
    setOpen(false);
  }

  function handleCircleClick() {
    if (target.type === 'CHECKBOX') { handleCheckbox(); return; }
    if (isDone) {
      haptic(4);
      onLog(target.id, { done: false, value: null });
      setInputVal('');
      setOpen(false);
    } else {
      haptic(6);
      setOpen((v) => !v);
    }
  }

  function handleEditClick() {
    setInputVal(logEntry?.value != null ? String(logEntry.value) : '');
    setOpen(true);
  }

  const isNonCheckbox = target.type !== 'CHECKBOX';
  const showInput     = isNonCheckbox && open;

  const inputBase =
    'flex-1 text-sm text-[#1a1a2e] dark:text-white bg-white dark:bg-white/15 ' +
    'border border-black/10 dark:border-white/20 rounded-xl px-3 py-2.5 ' +
    'outline-none focus:border-[#E8843C] transition-colors';

  return (
    <div className={`rounded-xl transition-all duration-200 overflow-hidden ${
      isDone ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-black/3 dark:bg-white/3'
    }`}>
      {/* ── Main row ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 py-2.5 px-3">
        {/* Circle — interactive for ALL types */}
        <button
          onClick={handleCircleClick}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            isDone
              ? 'border-emerald-500 bg-emerald-500'
              : open
              ? 'border-[#E8843C] bg-[#E8843C]/10'
              : 'border-stone-300 dark:border-stone-600 hover:border-[#E8843C]'
          }`}
        >
          {isDone && <Check size={10} color="white" strokeWidth={3} />}
        </button>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate transition-colors ${
            isDone ? 'text-stone-400 line-through' : 'text-[#1a1a2e] dark:text-white'
          }`}>
            {target.name}
          </p>
          {/* Hint for non-checkbox when closed */}
          {isNonCheckbox && !isDone && !open && (
            <p className="text-[10px] text-stone-400 mt-0.5">
              {target.type === 'TIME' ? 'Tap ○ to log time' : `Tap ○ to log${target.unit ? ` (${target.unit})` : ''}`}
            </p>
          )}
        </div>

        {/* Done: show logged value + edit button */}
        {isDone && isNonCheckbox && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {logEntry?.value != null && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {logEntry.value}{target.unit ? ` ${target.unit}` : ''}
              </span>
            )}
            <button
              onClick={handleEditClick}
              title="Edit value"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-300 hover:text-[#E8843C] transition-colors"
            >
              <Edit3 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* ── Expanded input form (full-width, below the label row) ── */}
      {showInput && (
        <div className="px-3 pb-3 pt-0 animate-[fadeSlideUp_0.15s_ease-out_both]">
          {(target.type === 'NUMBER' || target.type === 'DURATION') && (
            <form onSubmit={handleNumberSubmit} className="flex items-center gap-2">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={target.targetValue != null ? String(target.targetValue) : '0'}
                autoFocus
                className={inputBase}
              />
              {target.unit && (
                <span className="text-sm text-stone-400 flex-shrink-0 font-medium">{target.unit}</span>
              )}
              <button
                type="submit"
                className="flex-shrink-0 h-10 px-5 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all active:scale-95 bg-accent hover:bg-accent-hover shadow-md"
              >
                Log
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-shrink-0 h-10 px-3 rounded-full text-stone-400 text-sm border border-stone-200 dark:border-white/10 transition-all hover:text-white"
              >
                ✕
              </button>
            </form>
          )}
          {target.type === 'TIME' && (
            <form onSubmit={handleTimeSubmit} className="flex items-center gap-2">
              <input
                type="time"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                autoFocus
                className={inputBase}
              />
              <button
                type="submit"
                className="flex-shrink-0 h-10 px-5 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all active:scale-95 bg-accent hover:bg-accent-hover shadow-md"
              >
                Log
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-shrink-0 h-10 px-3 rounded-full text-stone-400 text-sm border border-stone-200 dark:border-white/10 transition-all hover:text-white"
              >
                ✕
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function PillarCard({ pillar, logs, onLog, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [markAllFlash, setMarkAllFlash] = useState(false);
  const longPressRef = useRef(null);
  const today  = todayKey();
  const dayLog = logs[today] || {};

  const dailyTargets = pillar.targets.filter((t) => t.frequency === 'daily' || !t.frequency);
  const doneCount    = dailyTargets.filter((t) => dayLog[t.id]?.done).length;
  const completion   = dailyTargets.length > 0 ? doneCount / dailyTargets.length : 0;

  const IconComponent = ICON_MAP[pillar.icon] || Star;

  function handleHeaderPointerDown() {
    longPressRef.current = setTimeout(() => {
      longPressRef.current = null;
      const allDone = doneCount === dailyTargets.length && dailyTargets.length > 0;
      dailyTargets.forEach((t) => onLog(today, t.id, { done: !allDone, value: !allDone }));
      haptic([10, 30, 10]);
      setMarkAllFlash(true);
      setTimeout(() => setMarkAllFlash(false), 600);
    }, 500);
  }

  function handleHeaderPointerUp() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  return (
    <div
      className="card transition-all duration-200"
      style={{ borderLeft: `3px solid ${pillar.color}`, outline: markAllFlash ? `2px solid ${pillar.color}` : 'none' }}
    >
      <button
        className="w-full flex items-center gap-3 select-none"
        onClick={() => setExpanded(!expanded)}
        onPointerDown={handleHeaderPointerDown}
        onPointerUp={handleHeaderPointerUp}
        onPointerLeave={handleHeaderPointerUp}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: pillar.color + '18' }}
        >
          <IconComponent size={16} style={{ color: pillar.color }} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{pillar.english}</span>
            <span className="font-dev text-[11px] text-stone-400">{pillar.sanskrit}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-black/6 dark:bg-white/8 max-w-[100px]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${completion * 100}%`, backgroundColor: pillar.color }}
              />
            </div>
            <span className="text-[10px] text-stone-400 tabular-nums">{doneCount}/{dailyTargets.length}</span>
          </div>
        </div>
        <span className="text-stone-200 dark:text-stone-700 flex-shrink-0">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5 page-transition">
          {pillar.targets.map((target) => (
            <TargetRow
              key={target.id}
              target={target}
              logEntry={dayLog[target.id]}
              onLog={(id, entry) => onLog(today, id, entry)}
            />
          ))}
          {pillar.targets.length === 0 && (
            <p className="text-xs text-stone-400 italic py-2 text-center">
              No targets yet — add some in Pillars
            </p>
          )}
        </div>
      )}
    </div>
  );
}
