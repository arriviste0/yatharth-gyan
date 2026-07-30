import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus, Trash2, Edit3, X, Check,
  Moon, Soup, Dumbbell, Star, Heart, Flame, Zap, Wind, Sun,
  Layers, Target, Activity, ChevronRight, Flag, Calendar,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { timeStringToValue, valueToTimeString } from '../utils/dateUtils';

const ICON_OPTIONS = [
  { id: 'moon', Icon: Moon }, { id: 'bowl', Icon: Soup }, { id: 'dumbbell', Icon: Dumbbell },
  { id: 'star', Icon: Star }, { id: 'heart', Icon: Heart }, { id: 'flame', Icon: Flame },
  { id: 'zap', Icon: Zap }, { id: 'wind', Icon: Wind }, { id: 'sun', Icon: Sun },
];

const COLOR_OPTIONS = [
  '#5A8A8A','#E8843C','#2D3561','#C9A961',
  '#7C3AED','#059669','#DC2626','#D97706',
];

const ICON_MAP = {
  moon: Moon, bowl: Soup, dumbbell: Dumbbell,
  star: Star, heart: Heart, flame: Flame, zap: Zap, wind: Wind, sun: Sun,
};

const TARGET_TYPES = [
  { id: 'CHECKBOX', label: 'Checklist', desc: 'Simple Yes / No habit toggle' },
  { id: 'NUMBER',   label: 'Quantity',  desc: 'Water, Protein, Steps, Meals...' },
  { id: 'DURATION', label: 'Duration',  desc: 'Workout, Meditate, Sleep time' },
];

const QUICK_UNITS = ['g', 'L', 'ml', 'kg', 'kcal', 'steps', 'pages', 'sessions', 'reps'];

// AI-recognisable categories for quantity trackers — stored as t.aiCategory
const AI_CATEGORIES = [
  { id: 'water',    label: 'Water / Hydration', emoji: '💧' },
  { id: 'protein',  label: 'Protein',            emoji: '🥩' },
  { id: 'carbs',    label: 'Carbs',              emoji: '🍞' },
  { id: 'calories', label: 'Calories',           emoji: '🔥' },
  { id: 'sleep',    label: 'Sleep / Rest',       emoji: '😴' },
  { id: 'workout',  label: 'Workout / Exercise', emoji: '🏋️' },
  { id: 'steps',    label: 'Steps',              emoji: '👟' },
  { id: 'weight',   label: 'Weight',             emoji: '⚖️' },
  { id: 'fiber',    label: 'Fiber',              emoji: '🌿' },
  { id: 'fat',      label: 'Fat / Lipids',       emoji: '🫙' },
];


/* ── Goal direction icons ──────────────────────────────────────── */
const GOAL_DIRECTIONS = [
  { id: 'gte', label: '≥ At least', icon: TrendingUp, desc: 'Minimum goal (more is better)' },
  { id: 'lte', label: '≤ At most',  icon: TrendingDown, desc: 'Maximum limit (less is better)' },
  { id: 'eq',  label: '= Exactly',  icon: Minus, desc: 'Hit a specific number' },
];

const GOAL_QUICK_UNITS = ['g', 'L', 'ml', 'kg', 'kcal', 'steps', 'min', 'hr', 'pages', 'sessions', 'reps', '%'];

const GOAL_TEMPLATES = [
  { name: 'Drink 3L Water', value: 3, unit: 'L', direction: 'gte', emoji: '💧' },
  { name: 'Protein 90g / day', value: 90, unit: 'g', direction: 'gte', emoji: '🥩' },
  { name: 'Workout 45 min', value: 45, unit: 'min', direction: 'gte', emoji: '🏋️' },
  { name: 'Sleep 8 hrs', value: 8, unit: 'hr', direction: 'gte', emoji: '😴' },
  { name: '10,000 Steps', value: 10000, unit: 'steps', direction: 'gte', emoji: '👟' },
  { name: 'Calories < 2000', value: 2000, unit: 'kcal', direction: 'lte', emoji: '🔥' },
  { name: 'Read 20 pages', value: 20, unit: 'pages', direction: 'gte', emoji: '📖' },
  { name: 'Weight goal', value: 70, unit: 'kg', direction: 'lte', emoji: '⚖️' },
];

/* ── Target Form (add OR edit) — pure measurement, no goals ──── */
function TargetForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(
    initial?.type === 'TIME' || initial?.type === 'MULTI_METRIC' ? 'NUMBER' : (initial?.type ?? 'CHECKBOX')
  );
  const [unit, setUnit]             = useState(initial?.unit       ?? '');
  const [aiCategory, setAiCategory] = useState(initial?.aiCategory ?? '');
  const [subMetrics, setSubMetrics] = useState(() => {
    const existing = initial?.subMetrics || [];
    return existing.map(s => ({ ...s }));
  });

  const fieldCls =
    'w-full text-sm font-bold text-[#18191E] dark:text-white placeholder-stone-400 ' +
    'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 ' +
    'rounded-2xl px-4 py-3 outline-none focus:border-accent transition-colors';

  function addSubMetric() {
    setSubMetrics([
      ...subMetrics,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: '',
        unit: type === 'DURATION' ? 'min' : 'g',
      }
    ]);
  }

  function updateSubMetric(idx, key, val) {
    const next = [...subMetrics];
    next[idx] = { ...next[idx], [key]: val };
    setSubMetrics(next);
  }

  function removeSubMetric(idx) {
    setSubMetrics(subMetrics.filter((_, i) => i !== idx));
  }

  function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanSub = (type === 'NUMBER' || type === 'DURATION')
      ? subMetrics.filter(s => s.name.trim().length > 0).map(s => ({
          id: s.id,
          name: s.name.trim(),
          unit: s.unit || '',
        }))
      : [];

    onSave({
      id: initial?.id ?? `custom-${Date.now()}`,
      name: name.trim(),
      type,
      targetValue: null,
      unit: type === 'CHECKBOX' ? '' : (unit.trim() || (type === 'DURATION' ? 'min' : '')),
      aiCategory: type === 'NUMBER' ? (aiCategory.trim() || null) : null,
      comparison: 'gte',
      subMetrics: cleanSub,
      frequency: 'daily',
      reminder: null,
    });
  }

  return (
    <form onSubmit={handleSave} className="rounded-3xl p-5 space-y-4 bg-white dark:bg-[#181926] border border-black/8 dark:border-white/10 shadow-xl animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold text-accent uppercase tracking-wider">
          {initial?.id ? 'Edit Tracker' : 'New Tracker'}
        </p>
        <span className="text-[10px] text-stone-400 font-medium px-2 py-1 rounded-full bg-black/5 dark:bg-white/5">
          📏 Measurement only
        </span>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-accent/8 border border-accent/20">
        <Flag size={13} className="text-accent mt-0.5 shrink-0" />
        <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium leading-snug">
          Pillars track <strong>what you do</strong>. Set aspirational goals (like "90g protein/day") in the <strong>Goals</strong> tab — AI will compare them against your logs.
        </p>
      </div>

      {/* Target Name */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
          What are you tracking?
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Water intake, Workout, Sleep duration"
          autoFocus
          className={fieldCls}
        />
      </div>

      {/* Type Selector */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
          Tracking Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TARGET_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setType(t.id);
                if (t.id === 'CHECKBOX') { setUnit(''); setSubMetrics([]); }
              }}
              className={`p-3 rounded-2xl text-left transition-all border ${
                type === t.id
                  ? 'bg-accent text-white border-accent shadow-md scale-[1.02]'
                  : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-accent/50'
              }`}
            >
              <div className="text-xs font-extrabold">{t.label}</div>
              <div className={`text-[10px] mt-0.5 font-medium ${type === t.id ? 'text-white/80' : 'text-stone-400'}`}>
                {t.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Unit (for Quantity and Duration) */}
      {(type === 'NUMBER' || type === 'DURATION') && (
        <div className="space-y-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
          {type === 'DURATION' ? (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
              Duration is logged as <strong>hh:mm</strong> when you tap to log each day. Leave blank or any time is valid.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-1">
                  Unit (optional)
                </label>
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. L, g, kcal, steps"
                  className={fieldCls}
                />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mr-2">Quick Units:</span>
                <div className="inline-flex gap-1.5 flex-wrap mt-1">
                  {QUICK_UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all border ${
                        unit === u
                          ? 'bg-accent text-white border-accent'
                          : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-stone-500 hover:text-accent'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Category — helps AI correctly classify this metric */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-1.5">
                  🤖 AI Category <span className="font-normal normal-case text-stone-300">(tells AI what this metric is)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {AI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAiCategory(aiCategory === cat.id ? '' : cat.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all border flex items-center gap-1 ${
                        aiCategory === cat.id
                          ? 'bg-accent text-white border-accent shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-stone-500 dark:text-stone-400 hover:text-accent hover:border-accent/40'
                      }`}
                    >
                      <span>{cat.emoji}</span>{cat.label}
                    </button>
                  ))}
                </div>
                {/* Free-text custom label when nothing matches */}
                {!AI_CATEGORIES.find(c => c.id === aiCategory) && (
                  <input
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    placeholder="Custom label (e.g. creatine, caffeine)…"
                    className={`${fieldCls} text-xs`}
                  />
                )}
                {aiCategory && AI_CATEGORIES.find(c => c.id === aiCategory) && (
                  <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                    <span>✓</span> AI will classify this as "{AI_CATEGORIES.find(c => c.id === aiCategory)?.label}"
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sub-Metrics Section */}
      {(type === 'NUMBER' || type === 'DURATION') && (
        <div className="space-y-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-accent uppercase tracking-wider">
                {type === 'DURATION' ? 'Multiple Time Blocks' : 'Multiple Sub-Metrics'}
              </span>
              <p className="text-[10px] text-stone-400 font-medium">
                {type === 'DURATION'
                  ? 'Track specific blocks (e.g. Cardio 20m, Lifting 30m)'
                  : 'Track breakdowns (e.g. Protein, Carbs, Calories)'}
              </p>
            </div>
            <button
              type="button"
              onClick={addSubMetric}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 shrink-0 ml-2"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {subMetrics.length > 0 && (
            <div className="space-y-2 pt-1">
              {subMetrics.map((sub, idx) => (
                <div key={sub.id || idx} className="bg-white dark:bg-[#181926] p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center gap-2">
                  <input
                    value={sub.name}
                    onChange={(e) => updateSubMetric(idx, 'name', e.target.value)}
                    placeholder={type === 'DURATION' ? 'e.g. Cardio, Lifting' : 'e.g. Protein, Carbs'}
                    className="flex-1 text-xs font-bold text-[#18191E] dark:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 outline-none"
                  />
                  <input
                    value={sub.unit || ''}
                    onChange={(e) => updateSubMetric(idx, 'unit', e.target.value)}
                    placeholder="unit"
                    className="w-14 text-xs font-bold text-[#18191E] dark:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2 py-2 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeSubMetric(idx)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 flex-wrap sm:flex-nowrap">
        <button
          type="submit"
          className="flex-1 btn-coral py-3.5 px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {initial?.id ? 'Save Changes' : 'Add Tracker'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary-outline px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-stone-400 hover:text-white rounded-full whitespace-nowrap"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Goal Form ─────────────────────────────────────────────────── */
function GoalForm({ initial, pillars, onSave, onCancel }) {
  const [name,      setName]      = useState(initial?.name      ?? '');
  const [value,     setValue]     = useState(initial?.value     != null ? String(initial.value) : '');
  const [unit,      setUnit]      = useState(initial?.unit      ?? '');
  const [direction, setDirection] = useState(initial?.direction ?? 'gte');
  const [deadline,  setDeadline]  = useState(initial?.deadline  ?? '');
  const [pillarTargetId, setPillarTargetId] = useState(initial?.pillarTargetId ?? '');
  const [notes,     setNotes]     = useState(initial?.notes     ?? '');
  const [showTemplates, setShowTemplates] = useState(false);

  const fieldCls =
    'w-full text-sm font-bold text-[#18191E] dark:text-white placeholder-stone-400 ' +
    'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 ' +
    'rounded-2xl px-4 py-3 outline-none focus:border-accent transition-colors';

  // Flatten all pillar targets for the link dropdown
  const allTargets = useMemo(() => {
    const out = [];
    (pillars || []).forEach(p => {
      (p.targets || []).forEach(t => {
        out.push({ id: t.id, label: `${p.english} → ${t.name}`, unit: t.unit });
      });
    });
    return out;
  }, [pillars]);

  function applyTemplate(t) {
    setName(t.name);
    setValue(String(t.value));
    setUnit(t.unit);
    setDirection(t.direction);
    setShowTemplates(false);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!name.trim() || !value) return;
    onSave({
      id: initial?.id ?? `goal-${Date.now()}`,
      name: name.trim(),
      value: parseFloat(value) || 0,
      unit: unit.trim(),
      direction,
      deadline: deadline || null,
      pillarTargetId: pillarTargetId || null,
      notes: notes.trim() || null,
      createdAt: initial?.createdAt ?? Date.now(),
    });
  }

  return (
    <form onSubmit={handleSave} className="rounded-3xl p-5 space-y-4 bg-white dark:bg-[#181926] border border-black/8 dark:border-white/10 shadow-xl animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold text-accent uppercase tracking-wider">
          {initial?.id ? 'Edit Goal' : 'New AI Goal'}
        </p>
        {!initial?.id && (
          <button type="button" onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs text-accent font-bold hover:underline flex items-center gap-1">
            {showTemplates ? 'Hide templates' : 'Quick templates ▾'}
          </button>
        )}
      </div>

      {showTemplates && (
        <div className="flex flex-wrap gap-1.5 pb-3 border-b border-black/6 dark:border-white/6">
          {GOAL_TEMPLATES.map((t) => (
            <button key={t.name} type="button" onClick={() => applyTemplate(t)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-black/8 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-accent hover:text-accent transition-all bg-black/5 dark:bg-white/5 flex items-center gap-1">
              <span>{t.emoji}</span> {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Goal Name */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
          Goal Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Daily Protein, Water Intake, Weight Goal"
          autoFocus
          className={fieldCls}
        />
      </div>

      {/* Value + Unit + Direction */}
      <div className="space-y-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-1">
              Target Value
            </label>
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 90"
              className={fieldCls}
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-1">
              Unit
            </label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="g, L, kg, hrs..."
              className={fieldCls}
            />
          </div>
        </div>

        {/* Quick unit chips */}
        <div className="flex flex-wrap gap-1.5">
          {GOAL_QUICK_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all border ${
                unit === u
                  ? 'bg-accent text-white border-accent'
                  : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-stone-500 hover:text-accent'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        {/* Direction */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-2">
            Direction
          </label>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_DIRECTIONS.map((d) => {
              const DIcon = d.icon;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDirection(d.id)}
                  className={`p-2.5 rounded-2xl text-center transition-all border ${
                    direction === d.id
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-accent/50'
                  }`}
                >
                  <DIcon size={14} className="mx-auto mb-1" />
                  <div className="text-[11px] font-extrabold">{d.label}</div>
                  <div className={`text-[9px] mt-0.5 font-medium ${direction === d.id ? 'text-white/70' : 'text-stone-400'}`}>
                    {d.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Link to pillar tracker (optional) */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
          Link to Pillar Tracker <span className="font-normal text-stone-400 normal-case">(optional — AI uses this for progress)</span>
        </label>
        <div className="relative">
          <select
            value={pillarTargetId}
            onChange={(e) => setPillarTargetId(e.target.value)}
            className={`${fieldCls} appearance-none pr-10 cursor-pointer`}
          >
            <option value="" className="bg-white dark:bg-[#181926] text-[#18191E] dark:text-white">
              {allTargets.length === 0 ? 'No pillar trackers created yet (Add one in Pillars tab)' : 'Not linked (Standalone Goal)'}
            </option>
            {allTargets.map(t => (
              <option key={t.id} value={t.id} className="bg-white dark:bg-[#181926] text-[#18191E] dark:text-white">
                {t.label}{t.unit ? ` (${t.unit})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
          Deadline <span className="font-normal text-stone-400 normal-case">(optional)</span>
        </label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={fieldCls}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
          Why this goal? <span className="font-normal text-stone-400 normal-case">(optional — AI uses this for context)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Building muscle mass for competition in August..."
          rows={2}
          className={`${fieldCls} resize-none`}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 flex-wrap sm:flex-nowrap">
        <button
          type="submit"
          className="flex-1 btn-coral py-3.5 px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Target size={14} />
          {initial?.id ? 'Save Goal' : 'Add Goal'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary-outline px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-stone-400 hover:text-white rounded-full whitespace-nowrap"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Pillar Editor ──────────────────────────────────────────────── */
function PillarEditor({ pillar, onSave, onCancel }) {
  const [sanskrit,    setSanskrit]    = useState(pillar.sanskrit);
  const [english,     setEnglish]     = useState(pillar.english);
  const [description, setDescription] = useState(pillar.description ?? '');
  const [icon,        setIcon]        = useState(pillar.icon);
  const [color,       setColor]       = useState(pillar.color);

  const inputCls =
    'text-sm text-[#1a1a2e] dark:text-white placeholder-white/30 ' +
    'bg-white/5 border border-black/12 dark:border-white/12 ' +
    'rounded-xl px-3.5 py-2.5 outline-none focus:border-[#E8843C] transition-colors';

  return (
    <div className="space-y-3.5 p-4 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
      <div className="flex gap-2">
        <input value={english} onChange={(e) => setEnglish(e.target.value)} placeholder="English Name"
          autoFocus className={`flex-1 ${inputCls}`} />
        <input value={sanskrit} onChange={(e) => setSanskrit(e.target.value)} placeholder="Sanskrit"
          className={`w-32 font-dev ${inputCls}`} />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Why this pillar matters to you… (optional)"
        rows={2}
        className={`w-full resize-none font-verse leading-relaxed ${inputCls}`}
      />
      <div>
        <p className="text-xs text-stone-400 font-semibold mb-2">Icon</p>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map(({ id, Icon }) => (
            <button key={id} type="button" onClick={() => setIcon(id)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                icon === id ? 'border-[#E8843C] bg-[#E8843C]/20 text-[#E8843C]' : 'border-black/10 dark:border-white/10 bg-white/5 text-stone-400'
              }`}>
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-stone-400 font-semibold mb-2">Color Accent</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition-all"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none',
                transform: color === c ? 'scale(1.15)' : 'scale(1)',
              }} />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1 flex-wrap sm:flex-nowrap">
        <button onClick={() => onSave({ ...pillar, sanskrit, english, description, icon, color })}
          className="flex-1 btn-coral py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-md whitespace-nowrap">
          Save Pillar
        </button>
        <button onClick={onCancel}
          className="btn-secondary-outline px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-stone-400 hover:text-white rounded-full whitespace-nowrap">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────── */
export default function Sadhana() {
  const location = useLocation();
  const { state, setPillars, setGoals } = useStorage();
  const pillars = state.pillars || [];
  const goals   = state.goals   || [];

  const [activeTab,       setActiveTab]       = useState('pillars');
  const [editingId,       setEditingId]       = useState(null);
  const [addingTargetTo,  setAddingTargetTo]  = useState(null);
  const [editingTarget,   setEditingTarget]   = useState(null);
  const [addingPillar,    setAddingPillar]    = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [addingGoal,      setAddingGoal]      = useState(false);
  const [editingGoal,     setEditingGoal]     = useState(null);
  const [confirmDeleteGoalId, setConfirmDeleteGoalId] = useState(null);

  useEffect(() => {
    if (location.state?.addPillar) {
      setAddingPillar(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (location.state?.addTargetTo) {
      setAddingTargetTo(location.state.addTargetTo);
    } else if (location.state?.addGoal) {
      setActiveTab('goals');
      setAddingGoal(true);
    }
  }, [location.state]);

  function savePillar(updated) {
    setPillars(pillars.map((p) => (p.id === updated.id ? updated : p)));
    setEditingId(null);
  }

  function deletePillar(id) {
    setPillars(pillars.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
  }

  function addTarget(pillarId, target) {
    setPillars(pillars.map((p) => p.id === pillarId ? { ...p, targets: [...p.targets, target] } : p));
    setAddingTargetTo(null);
  }

  function saveEditedTarget(pillarId, updated) {
    setPillars(pillars.map((p) =>
      p.id === pillarId ? { ...p, targets: p.targets.map((t) => t.id === updated.id ? updated : t) } : p
    ));
    setEditingTarget(null);
  }

  function deleteTarget(pillarId, targetId) {
    setPillars(pillars.map((p) => p.id === pillarId ? { ...p, targets: p.targets.filter((t) => t.id !== targetId) } : p));
  }

  function addNewPillar(data) {
    setPillars([...pillars, {
      id: `pillar-${Date.now()}`,
      sanskrit: data.sanskrit || 'नया',
      english: data.english || 'New',
      description: data.description || '',
      icon: data.icon || 'star',
      color: data.color || '#E8843C',
      targets: [],
    }]);
    setAddingPillar(false);
  }

  function saveGoal(goal) {
    if (editingGoal) {
      setGoals(goals.map(g => g.id === goal.id ? goal : g));
      setEditingGoal(null);
    } else {
      setGoals([...goals, goal]);
      setAddingGoal(false);
    }
  }

  function deleteGoal(id) {
    setGoals(goals.filter(g => g.id !== id));
    setConfirmDeleteGoalId(null);
  }

  const totalTargets = useMemo(() => pillars.reduce((s, p) => s + p.targets.length, 0), [pillars]);
  const dailyTargets = useMemo(() => pillars.reduce((s, p) => s + p.targets.filter(t => t.frequency === 'daily' || !t.frequency).length, 0), [pillars]);

  const directionLabel = (d) => d === 'lte' ? '≤ At most' : d === 'eq' ? '= Exactly' : '≥ At least';
  const directionColor = (d) => d === 'lte' ? 'text-blue-500' : d === 'eq' ? 'text-purple-500' : 'text-emerald-500';

  return (
    <div className="page-container page-transition">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap sm:flex-nowrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#18191E] dark:text-white">Pillars of Practice</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">Track your habits · Set your goals · Let AI guide you</p>
        </div>
        <button
          onClick={() => activeTab === 'pillars' ? setAddingPillar(true) : (setAddingGoal(true), setEditingGoal(null))}
          className="btn-coral text-xs flex items-center gap-1.5 shadow-md shrink-0 whitespace-nowrap"
        >
          <Plus size={14} /> {activeTab === 'pillars' ? 'Add Pillar' : 'Add Goal'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 mb-6">
        {[
          { id: 'pillars', label: '📏 Pillars', sub: 'Track what you do' },
          { id: 'goals',   label: '🎯 Goals',   sub: 'AI tracks your targets' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#181926] text-[#18191E] dark:text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-[#18191E] dark:hover:text-white'
            }`}
          >
            <div>{tab.label}</div>
            <div className="text-[10px] font-medium opacity-60">{tab.sub}</div>
          </button>
        ))}
      </div>

      {/* ══════════════════ PILLARS TAB ══════════════════ */}
      {activeTab === 'pillars' && (
        <>
          {/* Summary KPI Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card-bento p-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Layers size={14} className="text-[#F05A36]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Pillars</span>
              </div>
              <div className="text-2xl font-extrabold text-[#18191E] dark:text-white tabular-nums">{pillars.length}</div>
            </div>
            <div className="card-bento p-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Target size={14} className="text-[#E6A04E]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Trackers</span>
              </div>
              <div className="text-2xl font-extrabold text-[#18191E] dark:text-white tabular-nums">{totalTargets}</div>
            </div>
            <div className="card-bento p-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={14} className="text-emerald-500" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Daily</span>
              </div>
              <div className="text-2xl font-extrabold text-[#18191E] dark:text-white tabular-nums">{dailyTargets}</div>
            </div>
          </div>

          {/* New Pillar Form */}
          {addingPillar && (
            <div className="mb-6">
              <PillarEditor
                pillar={{ sanskrit: '', english: '', description: '', icon: 'star', color: '#F05A36' }}
                onSave={addNewPillar}
                onCancel={() => setAddingPillar(false)}
              />
            </div>
          )}

          {/* Empty State */}
          {pillars.length === 0 && !addingPillar && (
            <div className="card-bento p-8 text-center space-y-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm rounded-3xl">
              <div className="w-14 h-14 rounded-3xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
                <Layers size={28} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#18191E] dark:text-white">No Pillars Defined</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1 max-w-sm mx-auto">
                  Create pillars to track your daily habits and routines.
                </p>
              </div>
              <button
                onClick={() => setAddingPillar(true)}
                className="btn-coral inline-flex items-center gap-2 text-xs font-extrabold px-6 py-3 shadow-md"
              >
                <Plus size={16} /> Create Your First Pillar
              </button>
            </div>
          )}

          {/* Pillars List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {pillars.map((pillar) => {
              const IconComp = ICON_MAP[pillar.icon] || Star;
              const isEditingPillar = editingId === pillar.id;

              if (isEditingPillar) {
                return (
                  <PillarEditor
                    key={pillar.id}
                    pillar={pillar}
                    onSave={savePillar}
                    onCancel={() => setEditingId(null)}
                  />
                );
              }

              return (
                <div
                  key={pillar.id}
                  className="card-bento p-5 space-y-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm"
                >
                  {/* Pillar Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: `${pillar.color}20` }}
                      >
                        <IconComp size={20} style={{ color: pillar.color }} />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-lg font-bold text-[#18191E] dark:text-white leading-tight">
                            {pillar.english}
                          </h3>
                          <span className="font-dev text-sm font-semibold" style={{ color: pillar.color }}>
                            {pillar.sanskrit}
                          </span>
                        </div>
                        {pillar.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">{pillar.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingId(pillar.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-[#18191E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      {confirmDeleteId === pillar.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deletePillar(pillar.id)} className="text-xs font-bold text-red-500 px-2 py-1 bg-red-500/10 rounded-lg">Delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-stone-400 px-1"><X size={12} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(pillar.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Trackers List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Trackers ({pillar.targets.length})</span>
                    </div>

                    {pillar.targets.map((target) => {
                      const isEditingThisTarget = editingTarget?.target?.id === target.id;

                      if (isEditingThisTarget) {
                        return (
                          <TargetForm
                            key={target.id}
                            initial={target}
                            onSave={(updated) => saveEditedTarget(pillar.id, updated)}
                            onCancel={() => setEditingTarget(null)}
                          />
                        );
                      }

                      return (
                        <div
                          key={target.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pillar.color }} />
                            <div>
                              <div className="text-xs font-bold text-[#18191E] dark:text-white truncate">{target.name}</div>
                              <div className="text-[10px] text-stone-400 font-medium">
                                {target.type === 'CHECKBOX' ? 'Yes / No' : target.type === 'DURATION' ? `Duration${target.unit ? ` (${target.unit})` : ''}` : target.type === 'NUMBER' ? `Quantity${target.unit ? ` (${target.unit})` : ''}` : target.type}
                                {' · '}{target.frequency || 'daily'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingTarget({ pillarId: pillar.id, target })}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#18191E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 transition-all"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => deleteTarget(pillar.id, target.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/20 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add tracker button / form */}
                  {addingTargetTo === pillar.id ? (
                    <TargetForm
                      onSave={(t) => addTarget(pillar.id, t)}
                      onCancel={() => setAddingTargetTo(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setAddingTargetTo(pillar.id)}
                      className="w-full py-2.5 rounded-2xl border border-dashed border-black/15 dark:border-white/15 text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-[#F05A36] hover:border-[#F05A36]/50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={13} /> Add Tracker to {pillar.english}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════ GOALS TAB ══════════════════ */}
      {activeTab === 'goals' && (
        <>
          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-accent/10 to-amber-500/10 border border-accent/20 mb-6">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Target size={16} className="text-accent" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#18191E] dark:text-white">AI-Powered Goals</h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug font-medium">
                Set aspirational targets here. Link them to your pillar trackers and the AI will calculate your daily progress, streaks, and projected completion.
              </p>
            </div>
          </div>

          {/* Summary KPI */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="card-bento p-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Flag size={14} className="text-accent" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Total Goals</span>
              </div>
              <div className="text-2xl font-extrabold text-[#18191E] dark:text-white tabular-nums">{goals.length}</div>
            </div>
            <div className="card-bento p-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-emerald-500" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">With Deadline</span>
              </div>
              <div className="text-2xl font-extrabold text-[#18191E] dark:text-white tabular-nums">
                {goals.filter(g => g.deadline).length}
              </div>
            </div>
          </div>

          {/* Add Goal Form */}
          {(addingGoal || editingGoal) && (
            <div className="mb-6">
              <GoalForm
                initial={editingGoal || undefined}
                pillars={pillars}
                onSave={saveGoal}
                onCancel={() => { setAddingGoal(false); setEditingGoal(null); }}
              />
            </div>
          )}

          {/* Empty State */}
          {goals.length === 0 && !addingGoal && (
            <div className="card-bento p-8 text-center space-y-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm rounded-3xl">
              <div className="w-14 h-14 rounded-3xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
                <Target size={28} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#18191E] dark:text-white">No Goals Yet</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1 max-w-sm mx-auto">
                  Add goals like "Protein 90g/day", "Drink 3L water", or "Lose 2kg" — AI will track your progress daily.
                </p>
              </div>
              <button
                onClick={() => setAddingGoal(true)}
                className="btn-coral inline-flex items-center gap-2 text-xs font-extrabold px-6 py-3 shadow-md"
              >
                <Plus size={16} /> Set Your First Goal
              </button>
            </div>
          )}

          {/* Goals List */}
          <div className="space-y-3">
            {goals.map((goal) => {
              if (editingGoal?.id === goal.id) return null; // rendered above as form
              const linkedTarget = pillars.flatMap(p => p.targets).find(t => t.id === goal.pillarTargetId);
              const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000) : null;

              return (
                <div
                  key={goal.id}
                  className="card-bento p-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm rounded-2xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-[#18191E] dark:text-white truncate">{goal.name}</h4>
                        <span className={`text-[10px] font-extrabold shrink-0 ${directionColor(goal.direction)}`}>
                          {directionLabel(goal.direction)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-base font-extrabold text-accent tabular-nums">
                          {goal.value} <span className="text-sm font-bold text-stone-500">{goal.unit}</span>
                        </span>
                        {linkedTarget && (
                          <span className="text-[10px] font-semibold text-stone-400 flex items-center gap-1">
                            <ChevronRight size={10} /> linked to <span className="text-accent">{linkedTarget.name}</span>
                          </span>
                        )}
                        {daysLeft !== null && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            daysLeft < 0 ? 'bg-red-500/10 text-red-500' :
                            daysLeft <= 7 ? 'bg-amber-500/10 text-amber-500' :
                            'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </span>
                        )}
                      </div>
                      {goal.notes && (
                        <p className="text-[10px] text-stone-400 mt-1 italic leading-snug">{goal.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => { setEditingGoal(goal); setAddingGoal(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#18191E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      >
                        <Edit3 size={12} />
                      </button>
                      {confirmDeleteGoalId === goal.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteGoal(goal.id)} className="text-xs font-bold text-red-500 px-2 py-1 bg-red-500/10 rounded-lg">Delete</button>
                          <button onClick={() => setConfirmDeleteGoalId(null)} className="text-xs text-stone-400 px-1"><X size={12} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteGoalId(goal.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
