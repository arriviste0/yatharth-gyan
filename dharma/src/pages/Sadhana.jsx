import { useState } from 'react';
import { Plus, Trash2, Edit3, X, Check, Moon, Soup, Dumbbell, Star, Heart, Flame, Zap, Wind, Sun } from 'lucide-react';
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

// Popular target presets for quick-add
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
    'w-full text-sm text-[#1a1a2e] dark:text-white placeholder-stone-400 ' +
    'bg-white dark:bg-white/10 border border-black/10 dark:border-white/12 ' +
    'rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors';

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
    <form onSubmit={handleSave} className="rounded-2xl p-4 space-y-3 bg-white/60 dark:bg-white/5 border border-black/8 dark:border-white/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
          {initial?.id ? 'Edit Target' : 'New Target'}
        </p>
        {!initial?.id && (
          <button type="button" onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs text-[#E8843C] font-semibold">
            {showTemplates ? 'Hide templates' : 'Quick-add ▾'}
          </button>
        )}
      </div>

      {showTemplates && (
        <div className="flex flex-wrap gap-1.5 pb-1 border-b border-black/6 dark:border-white/6">
          {TARGET_TEMPLATES.map((t) => (
            <button key={t.name} type="button" onClick={() => applyTemplate(t)}
              className="text-xs px-2.5 py-1 rounded-lg border border-black/8 dark:border-white/10 text-stone-500 dark:text-stone-400 hover:border-[#E8843C] hover:text-[#E8843C] transition-all">
              {t.name}
            </button>
          ))}
        </div>
      )}

      <input value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Target name" autoFocus className={fieldCls} />

      <div>
        <p className="text-[11px] text-stone-400 mb-1.5">Type</p>
        <div className="flex gap-1.5 flex-wrap">
          {TARGET_TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => setType(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                type === t.id
                  ? 'bg-[#E8843C] text-white border-[#E8843C]'
                  : 'bg-transparent border-black/10 dark:border-white/15 text-stone-500 dark:text-stone-400'
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
            className="w-28 text-sm text-[#1a1a2e] dark:text-white placeholder-stone-400 bg-white dark:bg-white/10 border border-black/10 dark:border-white/12 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors" />
          <select value={comparison} onChange={(e) => setComparison(e.target.value)}
            className="text-sm text-[#1a1a2e] dark:text-white bg-white dark:bg-white/10 border border-black/10 dark:border-white/12 rounded-xl px-3 py-2.5 outline-none">
            <option value="gte">≥ at least</option>
            <option value="lte">≤ at most</option>
          </select>
        </div>
      )}
      {type === 'TIME' && (
        <div className="flex gap-2">
          <input type="time" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className={fieldCls} />
          <select value={comparison} onChange={(e) => setComparison(e.target.value)}
            className="text-sm text-[#1a1a2e] dark:text-white bg-white dark:bg-white/10 border border-black/10 dark:border-white/12 rounded-xl px-3 py-2.5 outline-none">
            <option value="lte">by (before)</option>
            <option value="gte">after</option>
          </select>
        </div>
      )}

      <div>
        <p className="text-[11px] text-stone-400 mb-1.5">Frequency</p>
        <div className="flex gap-1.5 flex-wrap">
          {FREQUENCY_OPTIONS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFrequency(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                frequency === f.id
                  ? 'bg-[#2D3561] text-white border-[#2D3561]'
                  : 'bg-transparent border-black/10 dark:border-white/15 text-stone-500 dark:text-stone-400'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-0.5">
        <button type="submit"
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#E8843C,#C9A961)' }}>
          {initial?.id ? 'Save Changes' : 'Add Target'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-stone-400 dark:text-stone-500 border border-black/8 dark:border-white/10">
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
    'text-sm text-[#1a1a2e] dark:text-white placeholder-stone-400 ' +
    'bg-white dark:bg-white/[0.12] border border-black/12 dark:border-white/25 ' +
    'rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors';

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={english} onChange={(e) => setEnglish(e.target.value)} placeholder="Name"
          autoFocus className={`flex-1 ${inputCls}`} />
        <input value={sanskrit} onChange={(e) => setSanskrit(e.target.value)} placeholder="Sanskrit"
          className={`w-28 font-dev ${inputCls}`} />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Why this pillar matters to you… (optional)"
        rows={2}
        className={`w-full resize-none font-verse leading-relaxed ${inputCls}`}
      />
      <div>
        <p className="text-xs text-stone-400 mb-2">Icon</p>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map(({ id, Icon }) => (
            <button key={id} type="button" onClick={() => setIcon(id)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                icon === id ? 'border-[#E8843C] bg-[#E8843C]/10' : 'border-black/10 dark:border-white/20 bg-white/50 dark:bg-white/5'
              }`}>
              <Icon size={15} style={{ color: icon === id ? '#E8843C' : '#9CA3AF' }} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-stone-400 mb-2">Color</p>
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
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#2D3561,#5B6BAF)' }}>
          Save
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-stone-400 border border-black/8 dark:border-white/8">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────── */
export default function Sadhana() {
  const { state, setPillars } = useStorage();
  const pillars = state.pillars || DEFAULT_PILLARS;
  const [editingId,       setEditingId]       = useState(null);
  const [addingTargetTo,  setAddingTargetTo]  = useState(null);
  const [editingTarget,   setEditingTarget]   = useState(null); // { pillarId, target }
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

  const FREQ_LABEL = { daily: 'daily', weekdays: 'weekdays', '3x': '3×/wk', weekly: 'weekly' };

  // Drag-to-reorder state
  const dragOverId = { current: null };

  function handleDragStart(e, id) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('pillarId', id);
  }

  function handleDragOver(e, id) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverId.current = id;
  }

  function handleDrop(e, targetId) {
    e.preventDefault();
    const srcId = e.dataTransfer.getData('pillarId');
    if (!srcId || srcId === targetId) return;
    const srcIdx = pillars.findIndex((p) => p.id === srcId);
    const tgtIdx = pillars.findIndex((p) => p.id === targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    const next = [...pillars];
    const [moved] = next.splice(srcIdx, 1);
    next.splice(tgtIdx, 0, moved);
    setPillars(next);
  }

  return (
    <div className="page-container page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white">Pillars</h1>
        <p className="text-sm text-stone-400">Drag to reorder · long-press a card on Home to mark all</p>
      </div>

      <div className="grid md:grid-cols-2 md:gap-4 mb-6 gap-4">
        {pillars.map((pillar) => {
          const IconComponent = ICON_MAP[pillar.icon] || Star;
          const isEditing = editingId === pillar.id;

          return (
            <div
              key={pillar.id}
              className="card transition-opacity"
              style={{ borderLeft: `3px solid ${pillar.color}` }}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, pillar.id)}
              onDragOver={(e) => handleDragOver(e, pillar.id)}
              onDrop={(e) => handleDrop(e, pillar.id)}
            >
              {isEditing ? (
                <PillarEditor pillar={pillar} onSave={savePillar} onCancel={() => setEditingId(null)} />
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: pillar.color + '18' }}>
                      <IconComponent size={16} style={{ color: pillar.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{pillar.english}</div>
                      <div className="font-dev text-[11px] text-stone-400">{pillar.sanskrit}</div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => setEditingId(pillar.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-stone-500 transition-colors">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => setConfirmDeleteId(pillar.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Pillar description */}
                  {pillar.description && (
                    <p className="font-verse italic text-xs text-stone-400 leading-relaxed mb-2 pl-12">
                      {pillar.description}
                    </p>
                  )}

                  {confirmDeleteId === pillar.id && (
                    <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-between">
                      <span className="text-sm text-red-500">Remove this pillar?</span>
                      <div className="flex gap-2">
                        <button onClick={() => deletePillar(pillar.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-medium">Remove</button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-black/8 text-stone-500">Keep</button>
                      </div>
                    </div>
                  )}

                  {/* Targets */}
                  <div className="space-y-1.5 mt-2">
                    {pillar.targets.map((target) => {
                      const isEditingThis = editingTarget?.pillarId === pillar.id && editingTarget?.target.id === target.id;
                      if (isEditingThis) {
                        return (
                          <div key={target.id} className="mt-2">
                            <TargetForm
                              initial={target}
                              onSave={(t) => saveEditedTarget(pillar.id, t)}
                              onCancel={() => setEditingTarget(null)}
                            />
                          </div>
                        );
                      }
                      return (
                        <div key={target.id}
                          className="flex items-center gap-2 py-2 px-3 rounded-xl bg-black/2 dark:bg-white/3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#1a1a2e] dark:text-white truncate">{target.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-stone-400"
                                style={{ background: 'rgba(0,0,0,0.05)' }}>
                                {target.type}
                              </span>
                              {target.targetValue != null && target.targetValue !== '' && (
                                <span className="text-[10px] text-stone-400">
                                  {target.targetValue}{target.unit ? ` ${target.unit}` : ''}
                                </span>
                              )}
                              {target.frequency && target.frequency !== 'daily' && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                  style={{ background: 'rgba(45,53,97,0.08)', color: '#2D3561' }}>
                                  {FREQ_LABEL[target.frequency] || target.frequency}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => setEditingTarget({ pillarId: pillar.id, target })}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-300 hover:text-[#E8843C] transition-colors">
                            <Edit3 size={11} />
                          </button>
                          <button onClick={() => deleteTarget(pillar.id, target.id)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-200 hover:text-red-400 transition-colors">
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {addingTargetTo === pillar.id ? (
                    <div className="mt-3">
                      <TargetForm
                        onSave={(t) => addTarget(pillar.id, t)}
                        onCancel={() => setAddingTargetTo(null)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTargetTo(pillar.id)}
                      className="mt-3 w-full py-2 rounded-xl text-sm text-stone-400 border border-dashed border-black/10 dark:border-white/10 hover:border-[#E8843C] hover:text-[#E8843C] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={13} /> Add target
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {addingPillar ? (
        <div className="card">
          <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-3">New Pillar</p>
          <PillarEditor
            pillar={{ id: '', sanskrit: '', english: '', description: '', icon: 'star', color: '#E8843C', targets: [] }}
            onSave={addNewPillar}
            onCancel={() => setAddingPillar(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingPillar(true)}
          className="w-full py-4 rounded-2xl text-sm font-medium text-stone-400 flex items-center justify-center gap-2 transition-all border-2 border-dashed border-black/8 dark:border-white/8 hover:border-[#E8843C] hover:text-[#E8843C]"
        >
          <Plus size={16} /> Add Pillar
        </button>
      )}

      <div className="h-6" />
    </div>
  );
}
