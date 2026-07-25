import { useState, useMemo } from 'react';
import {
  Search, BookOpen, TrendingUp, ChevronRight, Plus, Tag, X,
  Folder, FolderOpen, Heart, Sparkles, Trophy, Calendar, CheckSquare,
  Square, Edit3, ArrowLeft, Share2, MoreVertical, SlidersHorizontal,
  Flame, CheckCircle2, Star, Smile, CircleCheck
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { getWeekKey, formatDateDisplay, getMonthLabel, todayKey } from '../utils/dateUtils';

// ─── Mood definitions (emoji scale) ──────────────────────────────────────────
const MOODS = [
  { id: '1', emoji: '😞', label: 'Rough',     color: '#DC2626' },
  { id: '2', emoji: '😐', label: 'Okay',      color: '#D97706' },
  { id: '3', emoji: '🙂', label: 'Good',      color: '#5A8A8A' },
  { id: '4', emoji: '😊', label: 'Great',     color: '#059669' },
  { id: '5', emoji: '🌟', label: 'Excellent',  color: '#C9A961' },
];

const SUGGESTED_TAGS = ['clarity', 'struggle', 'gratitude', 'insight', 'growth', 'focus', 'rest', 'creative'];

function MoodBadge({ id, small = false }) {
  const m = MOODS.find(x => x.id === id);
  if (!m) return null;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${
      small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
    }`} style={{ borderColor: m.color + '40', background: m.color + '12', color: m.color }}>
      {m.emoji} {m.label}
    </span>
  );
}

// ─── Word count ──────────────────────────────────────────────────────────────
function wc(s) { return (s || '').trim().split(/\s+/).filter(Boolean).length; }

function WordCountBar({ text, goal }) {
  if (!goal || goal <= 0) return null;
  const count = wc(text);
  const pct = Math.min((count / goal) * 100, 100);
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#C9A961' : '#E8843C' }} />
      </div>
      <span className="text-[10px] text-white/40 flex-shrink-0">
        {count}/{goal}w
      </span>
    </div>
  );
}

// ─── Tag Picker ──────────────────────────────────────────────────────────────
function TagPicker({ tags, onChange }) {
  const [custom, setCustom] = useState('');

  function addTag(t) {
    const clean = t.trim().toLowerCase().replace(/\s+/g, '-');
    if (clean && !tags.includes(clean)) onChange([...tags, clean]);
  }
  function removeTag(t) { onChange(tags.filter(x => x !== t)); }

  return (
    <div>
      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">Tags & Categories</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {SUGGESTED_TAGS.map(t => (
          <button key={t} type="button"
            onClick={() => tags.includes(t) ? removeTag(t) : addTag(t)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              tags.includes(t)
                ? 'border-[#E8843C] bg-[#E8843C]/20 text-[#E8843C]'
                : 'border-white/10 text-white/40 hover:border-white/30'
            }`}>
            #{t}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input value={custom} onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(custom); setCustom(''); } }}
            placeholder="Add custom tag…"
            className="w-full pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-[#E8843C] transition-colors" />
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white/80">
              #{t}
              <button onClick={() => removeTag(t)}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  FOLDER CARD COMPONENT (Reference Image Folder Design)             *
 * ═══════════════════════════════════════════════════════════════════ */
function FolderCard({ title, count, color, icon: IconComp, onClick, isSelected }) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl p-5 text-left transition-all duration-300 active:scale-[0.97] flex flex-col justify-between min-h-[140px] ${
        isSelected
          ? 'ring-2 ring-[#E8843C] shadow-2xl scale-[1.02]'
          : 'hover:scale-[1.01] hover:shadow-xl'
      }`}
      style={{
        background: `linear-gradient(135deg, ${color}28 0%, ${color}10 100%)`,
        border: `1px solid ${color}35`,
      }}
    >
      {/* Tab top detail like real folders */}
      <div
        className="absolute top-0 left-6 w-14 h-2 rounded-b-md opacity-80"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${color}25` }}
        >
          <IconComp size={22} style={{ color }} />
        </div>
        <MoreVertical size={16} className="text-white/30 hover:text-white" />
      </div>

      <div className="mt-4">
        <h3 className="text-base font-bold text-white group-hover:text-[#C9A961] transition-colors">
          {title}
        </h3>
        <p className="text-xs text-white/40 mt-0.5 font-medium">
          {count} {count === 1 ? 'entry' : 'entries'}
        </p>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  NOTE EDITOR CARD (Matching Reference Image Page Layout)            *
 * ═══════════════════════════════════════════════════════════════════ */
function NoteEditor({ entry, onSave, onBack, wordCountGoal }) {
  const [problem,   setProblem]   = useState(entry.problem   || '');
  const [curiosity, setCuriosity] = useState(entry.curiosity || '');
  const [gratitude, setGratitude] = useState(entry.gratitude || '');
  const [wins,      setWins]      = useState(entry.wins      || '');
  const [mood,      setMood]      = useState(entry.mood      || '');
  const [tags,      setTags]      = useState(entry.tags      || []);

  const totalText = `${problem} ${curiosity} ${gratitude} ${wins}`;
  const dateInfo  = formatDateDisplay(new Date(entry.date || entry.weekStart));

  function handleFormSave() {
    onSave({
      ...entry,
      problem, curiosity, gratitude, wins, mood, tags,
    });
  }

  return (
    <div className="rounded-3xl p-6 space-y-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-white/70 hover:text-white">
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold text-white">
              {entry.date ? `Reflection for ${dateInfo.short}` : `Weekly Reflection (${getMonthLabel(entry.weekStart)})`}
            </h2>
            <p className="text-xs text-white/40">{dateInfo.full}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleFormSave} className="px-4 py-2 bg-gradient-to-r from-[#E8843C] to-[#C9A961] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-all">
            Save Note
          </button>
        </div>
      </div>

      {/* Mood Chip Picker */}
      <div>
        <p className="text-[11px] font-bold text-[#C9A961] uppercase tracking-wider mb-2">How are you feeling?</p>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMood(m.id)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mood === m.id
                  ? 'scale-105 shadow-lg ring-2 ring-white/30'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
              style={mood === m.id ? { backgroundColor: `${m.color}35`, color: '#fff', border: `1px solid ${m.color}` } : {}}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Layout */}
      <div className="space-y-4">
        {/* Section 1: Problem / Obstacle */}
        <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#E8843C]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E8843C]">1. Problem or Obstacle Noticed</h4>
          </div>
          <textarea
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder="What friction, doubt, or pattern showed up today?"
            rows={3}
            className="w-full text-sm text-white placeholder-white/20 bg-transparent outline-none resize-none font-verse leading-relaxed"
          />
        </div>

        {/* Section 2: Curiosity / Insight */}
        <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#5A8A8A]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A8A8A]">2. Curiosity or Idea Explored</h4>
          </div>
          <textarea
            value={curiosity}
            onChange={e => setCuriosity(e.target.value)}
            placeholder="What sparked your interest, what insight did you discover?"
            rows={3}
            className="w-full text-sm text-white placeholder-white/20 bg-transparent outline-none resize-none font-verse leading-relaxed"
          />
        </div>

        {/* Section 3: Gratitude */}
        <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#C9A961]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A961]">3. Gratitude & Blessings</h4>
          </div>
          <textarea
            value={gratitude}
            onChange={e => setGratitude(e.target.value)}
            placeholder="What are you grateful for in this moment?"
            rows={2}
            className="w-full text-sm text-white placeholder-white/20 bg-transparent outline-none resize-none font-verse leading-relaxed"
          />
        </div>

        {/* Section 4: Wins */}
        <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">4. Wins & Achievements</h4>
          </div>
          <textarea
            value={wins}
            onChange={e => setWins(e.target.value)}
            placeholder="What did you accomplish today, big or small?"
            rows={2}
            className="w-full text-sm text-white placeholder-white/20 bg-transparent outline-none resize-none font-verse leading-relaxed"
          />
        </div>
      </div>

      {/* Word Count & Tags */}
      <WordCountBar text={totalText} goal={wordCountGoal} />
      <TagPicker tags={tags} onChange={setTags} />

      {/* Save Button */}
      <button
        onClick={handleFormSave}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#E8843C] to-[#C9A961] text-white font-bold text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-all active:scale-[0.98]"
      >
        Save Reflection Note
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  MAIN MANAN (JOURNAL) COMPONENT                                     *
 * ═══════════════════════════════════════════════════════════════════ */
export default function Manan() {
  const { state, addNotebookEntry, updateSettings } = useStorage();
  const { notebook, settings } = state;
  const wordCountGoal = settings.wordCountGoal || 0;

  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all'); // 'all' | 'daily' | 'weekly' | 'curiosities' | 'gratitude'
  const [activeEntry, setActiveEntry] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const currentWeekKey = getWeekKey(new Date());
  const currentDayKey  = todayKey();

  const currentWeekEntry = notebook.find(e => e.weekStart === currentWeekKey) || {
    id: `week-${currentWeekKey}`, weekStart: currentWeekKey, problem: '', curiosity: '', gratitude: '', wins: '', mood: '', tags: [],
  };
  const todayEntry = notebook.find(e => e.date === currentDayKey) || {
    id: `day-${currentDayKey}`, date: currentDayKey, problem: '', curiosity: '', gratitude: '', wins: '', mood: '', tags: [],
  };

  // Counts for folder cards
  const folderCounts = useMemo(() => {
    const dailyCount = notebook.filter(e => !!e.date).length;
    const weeklyCount = notebook.filter(e => !!e.weekStart).length;
    const curiositiesCount = notebook.filter(e => !!e.curiosity).length;
    const gratitudeCount = notebook.filter(e => !!e.gratitude || !!e.wins).length;
    return { daily: dailyCount, weekly: weeklyCount, curiosities: curiositiesCount, gratitude: gratitudeCount, total: notebook.length };
  }, [notebook]);

  // Filtered notes based on search & selected folder
  const filteredNotes = useMemo(() => {
    let list = notebook;
    if (selectedFolder === 'daily') list = list.filter(e => !!e.date);
    else if (selectedFolder === 'weekly') list = list.filter(e => !!e.weekStart);
    else if (selectedFolder === 'curiosities') list = list.filter(e => !!e.curiosity);
    else if (selectedFolder === 'gratitude') list = list.filter(e => !!e.gratitude || !!e.wins);

    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(e =>
      ['problem','curiosity','gratitude','wins'].some(f => e[f]?.toLowerCase().includes(q)) ||
      (e.tags || []).some(t => t.includes(q))
    );
  }, [notebook, selectedFolder, search]);

  function handleSave(updated) {
    addNotebookEntry(updated);
    setIsCreatingNew(false);
    setActiveEntry(updated);
  }

  const selectedNote = isCreatingNew ? todayEntry : (activeEntry || todayEntry);

  return (
    <div className="page-container page-transition">

      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1a2e] dark:text-white flex items-center gap-2">
            Journal & Reflections
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">Your daily notebook for clarity & spiritual growth</p>
        </div>

        <button
          onClick={() => { setIsCreatingNew(true); setActiveEntry(todayEntry); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#E8843C] to-[#C9A961] text-white font-bold text-xs shadow-lg hover:opacity-90 transition-all active:scale-95"
        >
          <Plus size={16} /> New Note
        </button>
      </div>

      {/* Folder Cards Row (Matching JotPad reference design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FolderCard
          title="Daily Reflections"
          count={folderCounts.daily}
          color="#E8843C"
          icon={Calendar}
          isSelected={selectedFolder === 'daily'}
          onClick={() => setSelectedFolder(selectedFolder === 'daily' ? 'all' : 'daily')}
        />
        <FolderCard
          title="Weekly Reviews"
          count={folderCounts.weekly}
          color="#C9A961"
          icon={Folder}
          isSelected={selectedFolder === 'weekly'}
          onClick={() => setSelectedFolder(selectedFolder === 'weekly' ? 'all' : 'weekly')}
        />
        <FolderCard
          title="Curiosities"
          count={folderCounts.curiosities}
          color="#5A8A8A"
          icon={Sparkles}
          isSelected={selectedFolder === 'curiosities'}
          onClick={() => setSelectedFolder(selectedFolder === 'curiosities' ? 'all' : 'curiosities')}
        />
        <FolderCard
          title="Gratitude & Wins"
          count={folderCounts.gratitude}
          color="#2D3561"
          icon={Trophy}
          isSelected={selectedFolder === 'gratitude'}
          onClick={() => setSelectedFolder(selectedFolder === 'gratitude' ? 'all' : 'gratitude')}
        />
      </div>

      {/* Main Content Layout (Search + List + Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Notes List & Search (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes by keyword or tag…"
              className="w-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 bg-white/5 border border-white/8 rounded-2xl outline-none focus:border-[#E8843C] transition-colors"
            />
          </div>

          {/* Active Folder Filter Indicator */}
          {selectedFolder !== 'all' && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/8">
              <span className="text-xs font-semibold text-[#C9A961]">
                Folder: <span className="capitalize">{selectedFolder}</span>
              </span>
              <button onClick={() => setSelectedFolder('all')} className="text-xs text-white/40 hover:text-white">Clear filter</button>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto scrollbar-thin">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/20 rounded-2xl border border-dashed border-white/10">
                <BookOpen size={32} className="mb-2" />
                <p className="text-xs font-medium">No notes found</p>
                <p className="text-[10px] mt-0.5">Click "New Note" to create one</p>
              </div>
            ) : (
              filteredNotes.map(entry => {
                const isSelected = selectedNote?.id === entry.id;
                const preview = entry.problem || entry.curiosity || entry.gratitude || entry.wins || 'Empty note…';
                const dateInfo = formatDateDisplay(new Date(entry.date || entry.weekStart));

                return (
                  <button
                    key={entry.id}
                    onClick={() => { setIsCreatingNew(false); setActiveEntry(entry); }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#E8843C]/20 to-[#C9A961]/10 border-[#E8843C]/50 shadow-lg'
                        : 'bg-white/[0.03] border-white/6 hover:bg-white/[0.06] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-bold text-[#C9A961] uppercase tracking-wider">
                          {entry.date ? dateInfo.short : `Week of ${dateInfo.short}`}
                        </span>
                        <h4 className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                          {entry.problem ? entry.problem.slice(0, 40) : (entry.curiosity ? entry.curiosity.slice(0, 40) : 'Daily Reflection')}
                        </h4>
                      </div>
                      {entry.mood && <MoodBadge id={entry.mood} small />}
                    </div>

                    <p className="text-xs text-white/40 line-clamp-2 leading-relaxed font-verse">
                      {preview}
                    </p>

                    {entry.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {entry.tags.map(t => (
                          <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Note Editor Card (7 cols) */}
        <div className="lg:col-span-7">
          <NoteEditor
            entry={selectedNote}
            onSave={handleSave}
            onBack={null}
            wordCountGoal={wordCountGoal}
          />
        </div>

      </div>

      <div className="h-6" />
    </div>
  );
}
