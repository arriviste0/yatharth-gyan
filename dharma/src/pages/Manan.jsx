import { useState, useMemo } from 'react';
import {
  Search, BookOpen, TrendingUp, ChevronRight, Plus, Tag, X,
  Folder, FolderOpen, Heart, Sparkles, Trophy, Calendar, CheckSquare,
  Square, Edit3, ArrowLeft, Share2, MoreVertical, SlidersHorizontal,
  Flame, CheckCircle2, Star, Smile, CircleCheck, Image as ImageIcon,
  Check, LayoutGrid, ListFilter, ArrowDown, Zap
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { getWeekKey, formatDateDisplay, getMonthLabel, todayKey } from '../utils/dateUtils';

// Preset banner illustrations/images for notes
const BANNER_PRESETS = [
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
];

/* ═══════════════════════════════════════════════════════════════════ *
 *  FOLDER CARD COMPONENT (Matching JotPad Right Screen)              *
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
      {/* Curved Tab on top of folder box */}
      <div
        className="absolute top-0 left-6 w-16 h-2.5 rounded-b-lg opacity-90 shadow-sm"
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
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white group-hover:text-[#C9A961] transition-colors truncate">
            {title}
          </h3>
          <MoreVertical size={14} className="text-white/20" />
        </div>
        <p className="text-xs text-white/40 mt-0.5 font-medium">
          {count} {count === 1 ? 'note' : 'notes'}
        </p>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  NOTE DETAIL & EDITOR (Matching Middle Screen Reference Image)     *
 * ═══════════════════════════════════════════════════════════════════ */
function NoteDetailView({ entry, onSave, onBack }) {
  const [title, setTitle] = useState(entry.title || entry.problem || (entry.date ? 'Daily Note' : 'Weekly Reflections'));
  const [todoItems, setTodoItems] = useState(entry.todoItems || [
    { id: '1', text: 'Morning meditation & pranayama', done: true },
    { id: '2', text: 'Hydrate 2L water & protein breakfast', done: true },
    { id: '3', text: 'Read Bhagavad Gita Chapter 7', done: false },
  ]);
  const [placeItems, setPlaceItems] = useState(entry.placeItems || [
    { id: 'p1', text: 'Nature walk at sunset park', done: false },
    { id: 'p2', text: 'Evening gratitude journaling', done: false },
  ]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newPlaceText, setNewPlaceText] = useState('');
  const [noteContent, setNoteContent] = useState(entry.curiosity || entry.gratitude || '');

  const dateInfo = formatDateDisplay(new Date(entry.date || entry.weekStart));

  function toggleTodo(id) {
    setTodoItems(items => items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function togglePlace(id) {
    setPlaceItems(items => items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function addTodo() {
    if (!newTodoText.trim()) return;
    setTodoItems([...todoItems, { id: `t-${Date.now()}`, text: newTodoText.trim(), done: false }]);
    setNewTodoText('');
  }

  function addPlace() {
    if (!newPlaceText.trim()) return;
    setPlaceItems([...placeItems, { id: `p-${Date.now()}`, text: newPlaceText.trim(), done: false }]);
    setNewPlaceText('');
  }

  function handleSaveNote() {
    onSave({
      ...entry,
      title,
      todoItems,
      placeItems,
      curiosity: noteContent,
      problem: title,
    });
  }

  return (
    <div className="relative rounded-3xl p-6 space-y-5 bg-[#0e1226]/90 border border-white/8 shadow-2xl">

      {/* Top Header Bar (Matching Middle Screen Reference) */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-white/70 hover:text-white transition-all">
            <ArrowLeft size={18} />
          </button>
        ) : <div />}

        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-white/70 hover:text-white transition-all">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Note Title & Date */}
      <div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note Title…"
          className="w-full text-2xl font-extrabold text-white bg-transparent outline-none border-b border-transparent focus:border-[#E8843C] transition-colors"
        />
        <p className="text-xs text-white/40 font-medium mt-1">{dateInfo.full}</p>
      </div>

      {/* Featured Banner Card (Matching Middle Screen Poster Image) */}
      <div className="relative overflow-hidden rounded-2xl h-44 bg-gradient-to-r from-[#1e2240] to-[#2d3561] border border-white/10 flex items-center justify-center p-4">
        <img
          src={BANNER_PRESETS[0]}
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="relative z-10 text-center space-y-1">
          <span className="text-[10px] font-bold text-[#C9A961] uppercase tracking-[0.2em]">Dharma Reflections</span>
          <h3 className="text-lg font-bold text-white">Mindfulness & Practice Journal</h3>
        </div>
      </div>

      {/* Checklist Section 1: To do list */}
      <div className="space-y-2 pt-2">
        <h4 className="text-sm font-bold text-white">To do list:</h4>
        <div className="space-y-1.5">
          {todoItems.map(item => (
            <button
              key={item.id}
              onClick={() => toggleTodo(item.id)}
              className="w-full flex items-center gap-3 py-1.5 px-1 text-left transition-all group"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                item.done ? 'bg-[#E8843C] border-[#E8843C] text-white' : 'border-white/30 group-hover:border-[#E8843C]'
              }`}>
                {item.done && <Check size={11} strokeWidth={3} />}
              </div>
              <span className={`text-xs font-medium ${item.done ? 'line-through text-white/30' : 'text-white'}`}>
                {item.text}
              </span>
            </button>
          ))}

          {/* Quick add item */}
          <div className="flex gap-2 pt-1">
            <input
              value={newTodoText}
              onChange={e => setNewTodoText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTodo(); } }}
              placeholder="+ Add item…"
              className="flex-1 text-xs text-white bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 outline-none focus:border-[#E8843C]"
            />
          </div>
        </div>
      </div>

      {/* Checklist Section 2: Priorities & Insights */}
      <div className="space-y-2 pt-2">
        <h4 className="text-sm font-bold text-white">Priorities & Insights:</h4>
        <div className="space-y-1.5">
          {placeItems.map(item => (
            <button
              key={item.id}
              onClick={() => togglePlace(item.id)}
              className="w-full flex items-center gap-3 py-1.5 px-1 text-left transition-all group"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                item.done ? 'bg-[#C9A961] border-[#C9A961] text-white' : 'border-white/30 group-hover:border-[#C9A961]'
              }`}>
                {item.done && <Check size={11} strokeWidth={3} />}
              </div>
              <span className={`text-xs font-medium ${item.done ? 'line-through text-white/30' : 'text-white'}`}>
                {item.text}
              </span>
            </button>
          ))}

          {/* Quick add priority */}
          <div className="flex gap-2 pt-1">
            <input
              value={newPlaceText}
              onChange={e => setNewPlaceText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPlace(); } }}
              placeholder="+ Add priority…"
              className="flex-1 text-xs text-white bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 outline-none focus:border-[#C9A961]"
            />
          </div>
        </div>
      </div>

      {/* Freeform Notes Section */}
      <div className="pt-2">
        <h4 className="text-sm font-bold text-white mb-1.5">Notes & Reflections:</h4>
        <textarea
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          placeholder="Write your freeform thoughts, curiosities, or gratitude here…"
          rows={3}
          className="w-full text-xs text-white placeholder-white/20 bg-white/5 border border-white/8 rounded-2xl p-3 outline-none resize-none font-verse leading-relaxed"
        />
      </div>

      {/* Floating Save Button (Matching Pink/Saffron Save Button in Middle Screen Reference Image) */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSaveNote}
          className="px-6 py-2.5 bg-[#E8843C] hover:bg-[#d4732b] text-white rounded-full text-xs font-extrabold uppercase tracking-wider shadow-xl transition-all active:scale-95 flex items-center gap-1.5"
        >
          <Check size={14} /> Save
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  MAIN JOTPAD JOURNAL COMPONENT                                      *
 * ═══════════════════════════════════════════════════════════════════ */
export default function Manan() {
  const { state, addNotebookEntry } = useStorage();
  const { notebook } = state;

  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [activeEntry, setActiveEntry] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const currentWeekKey = getWeekKey(new Date());
  const currentDayKey  = todayKey();

  const todayEntry = notebook.find(e => e.date === currentDayKey) || {
    id: `day-${currentDayKey}`, date: currentDayKey, title: 'Daily Note', problem: '', curiosity: '', gratitude: '', wins: '',
  };

  const folderCounts = useMemo(() => {
    const dailyCount = notebook.filter(e => !!e.date).length;
    const weeklyCount = notebook.filter(e => !!e.weekStart).length;
    const curiositiesCount = notebook.filter(e => !!e.curiosity).length;
    const gratitudeCount = notebook.filter(e => !!e.gratitude || !!e.wins).length;
    return { daily: dailyCount, weekly: weeklyCount, curiosities: curiositiesCount, gratitude: gratitudeCount };
  }, [notebook]);

  const filteredNotes = useMemo(() => {
    let list = notebook;
    if (selectedFolder === 'daily') list = list.filter(e => !!e.date);
    else if (selectedFolder === 'weekly') list = list.filter(e => !!e.weekStart);
    else if (selectedFolder === 'curiosities') list = list.filter(e => !!e.curiosity);
    else if (selectedFolder === 'gratitude') list = list.filter(e => !!e.gratitude || !!e.wins);

    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(e =>
      ['title','problem','curiosity','gratitude','wins'].some(f => e[f]?.toLowerCase().includes(q))
    );
  }, [notebook, selectedFolder, search]);

  function handleSave(updated) {
    addNotebookEntry(updated);
    setIsCreatingNew(false);
    setActiveEntry(updated);
  }

  const selectedNote = isCreatingNew ? todayEntry : (activeEntry || todayEntry);

  return (
    <div className="page-container page-transition relative min-h-screen">

      {/* JotPad Header (Matching Right Screen Reference Header) */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            JotPad
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Your Daily Note Journal for Reflection</p>
        </div>

        {/* Top Header Icons (Search & Options) */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-40 lg:w-56 pl-9 pr-3 py-1.5 text-xs text-white bg-white/5 border border-white/10 rounded-full outline-none focus:border-[#E8843C]"
            />
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:text-white">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Subheader Filters: ↓ Last opened & View Toggle */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-1 text-xs text-white/50 font-semibold cursor-pointer hover:text-white">
          <ArrowDown size={12} />
          <span>Last opened</span>
        </div>
        <div className="flex items-center gap-2 text-white/30">
          <LayoutGrid size={16} className="text-[#E8843C]" />
        </div>
      </div>

      {/* 2x2 Folder Box Grid (Matching Right Screen Reference) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FolderCard
          title="Daily Notes"
          count={folderCounts.daily || 12}
          color="#E8843C"
          icon={Calendar}
          isSelected={selectedFolder === 'daily'}
          onClick={() => setSelectedFolder(selectedFolder === 'daily' ? 'all' : 'daily')}
        />
        <FolderCard
          title="Reflections"
          count={folderCounts.weekly || 8}
          color="#C9A961"
          icon={Folder}
          isSelected={selectedFolder === 'weekly'}
          onClick={() => setSelectedFolder(selectedFolder === 'weekly' ? 'all' : 'weekly')}
        />
        <FolderCard
          title="Ideas & Insights"
          count={folderCounts.curiosities || 15}
          color="#5A8A8A"
          icon={Sparkles}
          isSelected={selectedFolder === 'curiosities'}
          onClick={() => setSelectedFolder(selectedFolder === 'curiosities' ? 'all' : 'curiosities')}
        />
        <FolderCard
          title="Random Notes"
          count={folderCounts.gratitude || 10}
          color="#2D3561"
          icon={Trophy}
          isSelected={selectedFolder === 'gratitude'}
          onClick={() => setSelectedFolder(selectedFolder === 'gratitude' ? 'all' : 'gratitude')}
        />
      </div>

      {/* Main Content: Notes List + Middle Screen Note Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Notes List Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40">Notes List</span>
            <span className="text-xs text-[#E8843C] font-bold">{filteredNotes.length} notes</span>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto scrollbar-thin">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/20 rounded-2xl border border-dashed border-white/10">
                <BookOpen size={28} className="mb-2" />
                <p className="text-xs font-medium">No notes in this folder</p>
              </div>
            ) : (
              filteredNotes.map(entry => {
                const isSelected = selectedNote?.id === entry.id;
                const titleText = entry.title || entry.problem || 'Daily Note';
                const dateInfo = formatDateDisplay(new Date(entry.date || entry.weekStart));

                return (
                  <button
                    key={entry.id}
                    onClick={() => { setIsCreatingNew(false); setActiveEntry(entry); }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#E8843C]/20 to-[#C9A961]/10 border-[#E8843C]/50 shadow-lg'
                        : 'bg-white/[0.03] border-white/6 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white truncate">{titleText}</h4>
                        <p className="text-[10px] text-white/40 mt-0.5 font-medium">{dateInfo.short}</p>
                      </div>
                      <MoreVertical size={14} className="text-white/20" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Note Detail Column (Matching Middle Screen Reference) */}
        <div className="lg:col-span-7">
          <NoteDetailView
            entry={selectedNote}
            onSave={handleSave}
            onBack={null}
          />
        </div>

      </div>

      {/* Floating Action '+' Button at Bottom Right (Matching Pink '+' Circle Button in Reference Image) */}
      <button
        onClick={() => { setIsCreatingNew(true); setActiveEntry(todayEntry); }}
        className="fixed bottom-20 right-6 lg:bottom-10 lg:right-10 z-40 w-14 h-14 rounded-full bg-[#E8843C] text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        style={{ boxShadow: '0 8px 30px rgba(232,132,60,0.5)' }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <div className="h-6" />
    </div>
  );
}
