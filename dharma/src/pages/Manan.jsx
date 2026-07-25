import { useState, useMemo, useEffect } from 'react';
import {
  Search, BookOpen, Plus, X, Folder, Sparkles, Trophy, Calendar,
  ArrowLeft, Share2, Trash2, Check, ArrowDown, Zap, CheckCircle2,
  Copy, Image as ImageIcon
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { getWeekKey, formatDateDisplay, getMonthLabel, todayKey } from '../utils/dateUtils';

// Preset banner graphics for notes
const BANNER_PRESETS = [
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
];

/* ═══════════════════════════════════════════════════════════════════ *
 *  CLEAN FOLDER CARD COMPONENT                                       *
 * ═══════════════════════════════════════════════════════════════════ */
function FolderCard({ title, count, color, icon: IconComp, onClick, isSelected }) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl p-5 text-left transition-all duration-300 active:scale-[0.97] flex flex-col justify-between min-h-[130px] ${
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
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${color}25` }}
        >
          <IconComp size={20} style={{ color }} />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-base font-bold text-white group-hover:text-[#C9A961] transition-colors truncate">
          {title}
        </h3>
        <p className="text-xs text-white/40 mt-0.5 font-medium">
          {count} {count === 1 ? 'note' : 'notes'}
        </p>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  WORKING NOTE DETAIL & EDITOR                                      *
 * ═══════════════════════════════════════════════════════════════════ */
function NoteDetailView({ entry, onSave, onDelete, onBack }) {
  const [title, setTitle] = useState(entry.title || entry.problem || 'New Note');
  const [todoItems, setTodoItems] = useState(entry.todoItems || [
    { id: '1', text: 'Morning meditation & practice', done: true },
    { id: '2', text: 'Hydrate water & protein breakfast', done: true },
  ]);
  const [placeItems, setPlaceItems] = useState(entry.placeItems || [
    { id: 'p1', text: 'Evening gratitude journaling', done: false },
  ]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newPlaceText, setNewPlaceText] = useState('');
  const [noteContent, setNoteContent] = useState(entry.curiosity || entry.gratitude || '');
  const [bannerIdx, setBannerIdx] = useState(entry.bannerIdx || 0);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync state whenever entry changes
  useEffect(() => {
    setTitle(entry.title || entry.problem || (entry.date ? 'Daily Note' : 'Weekly Reflections'));
    setTodoItems(entry.todoItems || [
      { id: '1', text: 'Morning meditation & practice', done: true },
      { id: '2', text: 'Hydrate water & protein breakfast', done: true },
    ]);
    setPlaceItems(entry.placeItems || [
      { id: 'p1', text: 'Evening gratitude journaling', done: false },
    ]);
    setNoteContent(entry.curiosity || entry.gratitude || '');
    setBannerIdx(entry.bannerIdx || 0);
    setConfirmDelete(false);
  }, [entry.id]);

  const dateInfo = formatDateDisplay(new Date(entry.date || entry.weekStart || Date.now()));

  function toggleTodo(id) {
    setTodoItems(items => items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function togglePlace(id) {
    setPlaceItems(items => items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function removeTodo(id) {
    setTodoItems(items => items.filter(i => i.id !== id));
  }

  function removePlace(id) {
    setPlaceItems(items => items.filter(i => i.id !== id));
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

  function handleShareNote() {
    const text = `${title}\n${dateInfo.full}\n\nTo Do:\n${todoItems.map(i => `${i.done ? '[x]' : '[ ]'} ${i.text}`).join('\n')}\n\nPriorities:\n${placeItems.map(i => `${i.done ? '[x]' : '[ ]'} ${i.text}`).join('\n')}\n\nNotes:\n${noteContent}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveNote() {
    onSave({
      ...entry,
      title: title.trim() || 'Untitled Note',
      todoItems,
      placeItems,
      curiosity: noteContent,
      problem: title.trim() || 'Untitled Note',
      bannerIdx,
      updatedAt: Date.now(),
    });
  }

  return (
    <div className="relative rounded-3xl p-6 space-y-5 bg-[#0e1226]/90 border border-white/8 shadow-2xl">

      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-white/70 hover:text-white transition-all">
            <ArrowLeft size={18} />
          </button>
        ) : <div />}

        <div className="flex items-center gap-2">
          {/* Share/Copy Note Button */}
          <button
            onClick={handleShareNote}
            title="Copy Note Text"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/70 hover:text-white text-xs font-semibold transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Delete Note Button */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 bg-red-500/20 px-2 py-1 rounded-full border border-red-500/40">
              <span className="text-[10px] font-bold text-red-400">Delete?</span>
              <button onClick={() => onDelete(entry.id)} className="text-xs font-bold text-red-400 hover:underline">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-white/40"><X size={12} /></button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete Note"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={15} />
            </button>
          )}
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

      {/* Featured Banner Card with Preset Switcher */}
      <div className="relative overflow-hidden rounded-2xl h-44 bg-gradient-to-r from-[#1e2240] to-[#2d3561] border border-white/10 flex items-center justify-center p-4 group">
        <img
          src={BANNER_PRESETS[bannerIdx]}
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay transition-opacity"
        />
        <div className="relative z-10 text-center space-y-1">
          <span className="text-[10px] font-bold text-[#C9A961] uppercase tracking-[0.2em]">Dharma Reflections</span>
          <h3 className="text-lg font-bold text-white">Mindfulness & Practice Journal</h3>
        </div>

        {/* Change Banner Overlay Button */}
        <button
          onClick={() => setBannerIdx((bannerIdx + 1) % BANNER_PRESETS.length)}
          className="absolute bottom-3 right-3 z-20 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-black/50 text-white/70 hover:text-white border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
        >
          <ImageIcon size={11} /> Change Cover
        </button>
      </div>

      {/* Checklist Section 1: To do list */}
      <div className="space-y-2 pt-2">
        <h4 className="text-sm font-bold text-white">To do list:</h4>
        <div className="space-y-1.5">
          {todoItems.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1 px-1 group/item"
            >
              <button
                onClick={() => toggleTodo(item.id)}
                className="flex items-center gap-3 text-left flex-1 min-w-0"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  item.done ? 'bg-[#E8843C] border-[#E8843C] text-white' : 'border-white/30 group-hover/item:border-[#E8843C]'
                }`}>
                  {item.done && <Check size={11} strokeWidth={3} />}
                </div>
                <span className={`text-xs font-medium truncate ${item.done ? 'line-through text-white/30' : 'text-white'}`}>
                  {item.text}
                </span>
              </button>
              <button onClick={() => removeTodo(item.id)} className="opacity-0 group-hover/item:opacity-100 text-white/20 hover:text-red-400 transition-opacity px-1">
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Quick add item */}
          <div className="flex gap-2 pt-1">
            <input
              value={newTodoText}
              onChange={e => setNewTodoText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTodo(); } }}
              placeholder="+ Add to-do item…"
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
            <div
              key={item.id}
              className="flex items-center justify-between py-1 px-1 group/item"
            >
              <button
                onClick={() => togglePlace(item.id)}
                className="flex items-center gap-3 text-left flex-1 min-w-0"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  item.done ? 'bg-[#C9A961] border-[#C9A961] text-white' : 'border-white/30 group-hover/item:border-[#C9A961]'
                }`}>
                  {item.done && <Check size={11} strokeWidth={3} />}
                </div>
                <span className={`text-xs font-medium truncate ${item.done ? 'line-through text-white/30' : 'text-white'}`}>
                  {item.text}
                </span>
              </button>
              <button onClick={() => removePlace(item.id)} className="opacity-0 group-hover/item:opacity-100 text-white/20 hover:text-red-400 transition-opacity px-1">
                <X size={12} />
              </button>
            </div>
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
          rows={4}
          className="w-full text-xs text-white placeholder-white/20 bg-white/5 border border-white/8 rounded-2xl p-3.5 outline-none resize-none font-verse leading-relaxed"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSaveNote}
          className="px-6 py-2.5 bg-[#E8843C] hover:bg-[#d4732b] text-white rounded-full text-xs font-extrabold uppercase tracking-wider shadow-xl transition-all active:scale-95 flex items-center gap-1.5"
        >
          <Check size={14} /> Save Note
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  MAIN JOTPAD JOURNAL COMPONENT                                      *
 * ═══════════════════════════════════════════════════════════════════ */
export default function Manan() {
  const { state, addNotebookEntry, deleteNotebookEntry } = useStorage();
  const { notebook = [] } = state;

  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  const currentDayKey = todayKey();

  // Create a default today note if none exists
  const todayEntry = useMemo(() => {
    const existing = notebook.find(e => e.date === currentDayKey);
    if (existing) return existing;
    return {
      id: `note-${currentDayKey}`,
      date: currentDayKey,
      title: 'Daily Note',
      todoItems: [
        { id: '1', text: 'Morning meditation & practice', done: true },
        { id: '2', text: 'Hydrate water & protein breakfast', done: true },
      ],
      placeItems: [
        { id: 'p1', text: 'Evening gratitude journaling', done: false },
      ],
      curiosity: '',
      problem: 'Daily Note',
    };
  }, [notebook, currentDayKey]);

  // Folder counts based on real data
  const folderCounts = useMemo(() => {
    const dailyCount = notebook.filter(e => !!e.date).length;
    const weeklyCount = notebook.filter(e => !!e.weekStart).length;
    const curiositiesCount = notebook.filter(e => !!e.curiosity && e.curiosity.trim().length > 0).length;
    const gratitudeCount = notebook.filter(e => !!e.gratitude || !!e.wins).length;
    return { daily: dailyCount, weekly: weeklyCount, curiosities: curiositiesCount, gratitude: gratitudeCount };
  }, [notebook]);

  // Filtered & Sorted Notes List
  const filteredNotes = useMemo(() => {
    let list = [...notebook];

    if (selectedFolder === 'daily') list = list.filter(e => !!e.date);
    else if (selectedFolder === 'weekly') list = list.filter(e => !!e.weekStart);
    else if (selectedFolder === 'curiosities') list = list.filter(e => !!e.curiosity && e.curiosity.trim().length > 0);
    else if (selectedFolder === 'gratitude') list = list.filter(e => !!e.gratitude || !!e.wins);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        ['title','problem','curiosity','gratitude','wins'].some(f => e[f]?.toLowerCase().includes(q)) ||
        (e.todoItems || []).some(t => t.text?.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      const ta = a.updatedAt || new Date(a.date || a.weekStart || 0).getTime();
      const tb = b.updatedAt || new Date(b.date || b.weekStart || 0).getTime();
      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });
  }, [notebook, selectedFolder, search, sortOrder]);

  // Currently selected note to display in NoteDetailView
  const selectedNote = useMemo(() => {
    if (!activeEntryId) return todayEntry;
    return notebook.find(e => e.id === activeEntryId) || todayEntry;
  }, [activeEntryId, notebook, todayEntry]);

  function handleSaveNote(updated) {
    addNotebookEntry(updated);
    setActiveEntryId(updated.id);
  }

  function handleDeleteNote(id) {
    deleteNotebookEntry(id);
    setActiveEntryId(null);
  }

  function handleCreateNewNote() {
    const newId = `note-${Date.now()}`;
    const newNote = {
      id: newId,
      date: currentDayKey,
      title: 'New Reflection',
      todoItems: [],
      placeItems: [],
      curiosity: '',
      problem: 'New Reflection',
      createdAt: Date.now(),
    };
    addNotebookEntry(newNote);
    setActiveEntryId(newId);
  }

  return (
    <div className="page-container page-transition relative min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            JotPad
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Your Daily Note Journal for Reflection</p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-44 lg:w-60 pl-9 pr-3 py-2 text-xs text-white bg-white/5 border border-white/10 rounded-full outline-none focus:border-[#E8843C]"
          />
        </div>
      </div>

      {/* Subheader Filters */}
      <div className="flex items-center justify-between mb-5 px-1">
        <button
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-1.5 text-xs text-white/60 font-semibold hover:text-white transition-colors"
        >
          <ArrowDown size={12} className={sortOrder === 'oldest' ? 'rotate-180' : ''} />
          <span>{sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}</span>
        </button>

        <button
          onClick={handleCreateNewNote}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8843C] text-white text-xs font-bold hover:bg-[#d4732b] transition-all"
        >
          <Plus size={14} /> New Note
        </button>
      </div>

      {/* 2x2 Folder Box Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FolderCard
          title="Daily Notes"
          count={folderCounts.daily}
          color="#E8843C"
          icon={Calendar}
          isSelected={selectedFolder === 'daily'}
          onClick={() => setSelectedFolder(selectedFolder === 'daily' ? 'all' : 'daily')}
        />
        <FolderCard
          title="Reflections"
          count={folderCounts.weekly}
          color="#C9A961"
          icon={Folder}
          isSelected={selectedFolder === 'weekly'}
          onClick={() => setSelectedFolder(selectedFolder === 'weekly' ? 'all' : 'weekly')}
        />
        <FolderCard
          title="Ideas & Insights"
          count={folderCounts.curiosities}
          color="#5A8A8A"
          icon={Sparkles}
          isSelected={selectedFolder === 'curiosities'}
          onClick={() => setSelectedFolder(selectedFolder === 'curiosities' ? 'all' : 'curiosities')}
        />
        <FolderCard
          title="Random Notes"
          count={folderCounts.gratitude}
          color="#2D3561"
          icon={Trophy}
          isSelected={selectedFolder === 'gratitude'}
          onClick={() => setSelectedFolder(selectedFolder === 'gratitude' ? 'all' : 'gratitude')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Notes List Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40">
              {selectedFolder === 'all' ? 'All Notes' : `${selectedFolder} Notes`}
            </span>
            <span className="text-xs text-[#E8843C] font-bold">{filteredNotes.length} notes</span>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto scrollbar-thin">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/20 rounded-2xl border border-dashed border-white/10">
                <BookOpen size={28} className="mb-2" />
                <p className="text-xs font-medium">No notes found</p>
                <button onClick={handleCreateNewNote} className="text-[11px] text-[#E8843C] font-bold mt-1 hover:underline">+ Create a note</button>
              </div>
            ) : (
              filteredNotes.map(entry => {
                const isSelected = selectedNote?.id === entry.id;
                const titleText = entry.title || entry.problem || 'Daily Note';
                const dateInfo = formatDateDisplay(new Date(entry.date || entry.weekStart || Date.now()));

                return (
                  <button
                    key={entry.id}
                    onClick={() => setActiveEntryId(entry.id)}
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
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Note Detail Column */}
        <div className="lg:col-span-7">
          <NoteDetailView
            entry={selectedNote}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
            onBack={null}
          />
        </div>

      </div>

      {/* Floating Action '+' Button at Bottom Right */}
      <button
        onClick={handleCreateNewNote}
        title="Create New Note"
        className="fixed bottom-20 right-6 lg:bottom-10 lg:right-10 z-40 w-14 h-14 rounded-full bg-[#E8843C] text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        style={{ boxShadow: '0 8px 30px rgba(232,132,60,0.5)' }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <div className="h-6" />
    </div>
  );
}
