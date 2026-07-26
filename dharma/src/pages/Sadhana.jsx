import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit3, X, Check, Moon, Soup, Dumbbell, Star, Heart, Flame, Zap, Wind, Sun, Layers, Target, Activity } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';

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
  { id: 'CHECKBOX', label: 'Yes / No' },
  { id: 'NUMBER',   label: 'Number' },
  { id: 'TIME',     label: 'Time' },
  { id: 'DURATION', label: 'Duration' },
];

const FREQUENCY_OPTIONS = [
  { id: 'daily',    label: 'Every day' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: '3x',       label: '3×/week' },
  { id: 'weekly',   label: 'Weekly' },
];

const TARGET_TEMPLATES = [
  { name: 'Wake up by 6am', type: 'TIME', targetValue: '06:00', comparison: 'lte', unit: '' },
  { name: 'Drink 2L water', type: 'NUMBER', targetValue: 2000, comparison: 'gte', unit: 'ml' },
  { name: 'Meditate 10 min', type: 'DURATION', targetValue: 10, comparison: 'gte', unit: 'min' },
  { name: 'Read 20 pages', type: 'NUMBER', targetValue: 20, comparison: 'gte', unit: 'pages' },
  { name: 'Sleep by 10:30pm', type: 'TIME', targetValue: '22:30', comparison: 'lte', unit: '' },
  { name: 'Walk 7000 steps', type: 'NUMBER', targetValue: 7000, comparison: 'gte', unit: 'steps' },
  { name: 'Gym workout', type: 'CHECKBOX', targetValue: null, comparison: 'gte', unit: '' },
  { name: 'Cold shower', type: 'CHECKBOX', targetValue: null, comparison: 'gte', unit: '' },
  { name: 'No social media', type: 'CHECKBOX', targetValue: null, comparison: 'gte', unit: '' },
  { name: 'Journaling', type: 'CHECKBOX', targetValue: null, comparison: 'gte', unit: '' },
];

/* ── Target Form (add OR edit) ─────────────────────────────────────── */
function TargetForm({ initial, onSave, onCancel }) {
  const [name,        setName]        = useState(initial?.name        ?? '');
  const [type,        setType]        = useState(initial?.type        ?? 'CHECKBOX');
  const [targetValue, setTargetValue] = useState(initial?.targetValue != null ? String(initial.targetValue) : '');
  const [unit,        setUnit]        = useState(initial?.unit        ?? '');
  const [comparison,  setComparison]  = useState(initial?.comparison  ?? 'gte');
  const [frequency,   setFrequency]   = useState(initial?.frequency   ?? 'daily');
  const [showTemplates, setShowTemplates] = useState(false);

  const fieldCls =
    'w-full text-sm text-[#18191E] dark:text-white placeholder-stone-400 ' +
    'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 ' +
    'rounded-xl px-3.5 py-2.5 outline-none focus:border-[#F05A36] transition-colors';

  function applyTemplate(t) {
    setName(t.name);
    setType(t.type);
    setTargetValue(t.targetValue != null ? String(t.targetValue) : '');
    setUnit(t.unit);
    setComparison(t.comparison);
    setShowTemplates(false);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? `custom-${Date.now()}`,
      name: name.trim(),
      type,
      targetValue: (type === 'NUMBER' || type === 'DURATION') ? parseFloat(targetValue) || 0 : targetValue,
      unit, comparison, frequency, reminder: null,
    });
  }

  return (
    <form onSubmit={handleSave} className="rounded-2xl p-4 space-y-3.5 bg-white/80 dark:bg-white/[0.04] border border-black/8 dark:border-white/10 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#C9A961] uppercase tracking-wider">
          {initial?.id ? 'Edit Target' : 'New Target'}
        </p>
        {!initial?.id && (
          <button type="button" onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs text-[#E8843C] font-semibold hover:underline">
            {showTemplates ? 'Hide templates' : 'Quick-add templates ▾'}
          </button>
        )}
      </div>

      {showTemplates && (
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-black/6 dark:border-white/6">
          {TARGET_TEMPLATES.map((t) => (
            <button key={t.name} type="button" onClick={() => applyTemplate(t)}
              className="text-xs px-2.5 py-1 rounded-lg border border-black/8 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-[#E8843C] hover:text-[#E8843C] transition-all bg-white/5">
              {t.name}
            </button>
          ))}
        </div>
      )}

      <input value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Target name (e.g. Read 20 pages)" autoFocus className={fieldCls} />

      <div>
        <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider mb-1.5">Type</p>
        <div className="flex gap-1.5 flex-wrap">
          {TARGET_TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => setType(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                type === t.id
                  ? 'bg-[#E8843C] text-white border-[#E8843C] shadow-sm'
                  : 'bg-transparent border-black/10 dark:border-white/12 text-stone-400 hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {(type === 'NUMBER' || type === 'DURATION') && (
        <div className="flex gap-2">
          <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)}
            placeholder="Target value" className={fieldCls} />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit (ml, min…)"
            className="w-28 text-sm text-[#1a1a2e] dark:text-white placeholder-white/30 bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors" />
          <select value={comparison} onChange={(e) => setComparison(e.target.value)}
            className="text-sm text-[#1a1a2e] dark:text-white bg-white/5 dark:bg-[#12162d] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none">
            <option value="gte">≥ at least</option>
            <option value="lte">≤ at most</option>
          </select>
        </div>
      )}
      {type === 'TIME' && (
        <div className="flex gap-2">
          <input type="time" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className={fieldCls} />
          <select value={comparison} onChange={(e) => setComparison(e.target.value)}
            className="text-sm text-[#1a1a2e] dark:text-white bg-white/5 dark:bg-[#12162d] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none">
            <option value="lte">by (before)</option>
            <option value="gte">after</option>
          </select>
        </div>
      )}

      <div>
        <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider mb-1.5">Frequency</p>
        <div className="flex gap-1.5 flex-wrap">
          {FREQUENCY_OPTIONS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFrequency(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                frequency === f.id
                  ? 'bg-[#2D3561] text-white border-[#2D3561] shadow-sm'
                  : 'bg-transparent border-black/10 dark:border-white/12 text-stone-400 hover:text-white'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit"
          className="flex-1 btn-coral py-3 px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center">
          {initial?.id ? 'Save Changes' : 'Add Target'}
        </button>
        <button type="button" onClick={onCancel}
          className="btn-secondary-outline px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-stone-400 hover:text-white rounded-full">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Pillar Editor ──────────────────────────────────────────────────── */
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
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave({ ...pillar, sanskrit, english, description, icon, color })}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md"
          style={{ background: 'linear-gradient(135deg,#2D3561,#5B6BAF)' }}>
          Save Pillar
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-400 border border-black/8 dark:border-white/10">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────── */
export default function Sadhana() {
  const { state, setPillars } = useStorage();
  const pillars = state.pillars || [];
  const [editingId,       setEditingId]       = useState(null);
  const [addingTargetTo,  setAddingTargetTo]  = useState(null);
  const [editingTarget,   setEditingTarget]   = useState(null);
  const [addingPillar,    setAddingPillar]    = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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

  const totalTargets = useMemo(() => pillars.reduce((s, p) => s + p.targets.length, 0), [pillars]);
  const dailyTargets = useMemo(() => pillars.reduce((s, p) => s + p.targets.filter(t => t.frequency === 'daily' || !t.frequency).length, 0), [pillars]);

  return (
    <div className="page-container page-transition">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#18191E] dark:text-white">Pillars of Practice</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">Customize your non-negotiables & core habits</p>
        </div>
        <button
          onClick={() => setAddingPillar(true)}
          className="btn-coral text-xs flex items-center gap-1.5 shadow-md"
        >
          <Plus size={14} /> Add Pillar
        </button>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card-bento p-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className="text-[#F05A36]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Total Pillars</span>
          </div>
          <div className="text-2xl font-extrabold text-[#18191E] dark:text-white tabular-nums">{pillars.length}</div>
        </div>
        <div className="card-bento p-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-[#E6A04E]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">All Targets</span>
          </div>
          <div className="text-2xl font-extrabold text-[#18191E] dark:text-white tabular-nums">{totalTargets}</div>
        </div>
        <div className="card-bento p-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-emerald-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Daily Targets</span>
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

      {/* Empty State when no pillars exist */}
      {pillars.length === 0 && !addingPillar && (
        <div className="card-bento p-8 text-center space-y-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm rounded-3xl">
          <div className="w-14 h-14 rounded-3xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
            <Layers size={28} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#18191E] dark:text-white">No Pillars Defined</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1 max-w-sm mx-auto">
              Your account has no pre-set pillars. Click "Add Pillar" above to create your custom daily targets.
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

      {/* Pillars List (2 columns on desktop) */}
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

              {/* Targets List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Targets ({pillar.targets.length})</span>
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
                            {target.type === 'CHECKBOX' ? 'Yes / No' : target.type === 'NUMBER' ? `Goal: ≥ ${target.targetValue} ${target.unit || ''}` : target.type === 'TIME' ? `Time: ≤ ${target.targetValue}` : target.type}
                            {' · '}{target.frequency || 'daily'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTarget({ pillarId: pillar.id, target })}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#18191E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => deleteTarget(pillar.id, target.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add target button / form */}
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
                  <Plus size={13} /> Add Target to {pillar.english}
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
