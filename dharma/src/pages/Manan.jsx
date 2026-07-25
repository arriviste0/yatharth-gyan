import { useState, useMemo, useEffect } from 'react';
import {
  Search, BookOpen, Plus, X, Folder, Sparkles, Trophy, Calendar,
  ArrowLeft, Share2, Trash2, Check, ArrowDown, Zap, CheckCircle2,
  Copy, Image as ImageIcon, Edit3, MoreVertical, FileText, CheckSquare,
  ChevronRight, FolderPlus, FilePlus, Layers
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { formatDateDisplay, todayKey } from '../utils/dateUtils';

// Preset banner graphics for notes
const BANNER_PRESETS = [
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
];

const FOLDER_COLORS = [
  '#E8843C', '#C9A961', '#5A8A8A', '#2D3561',
  '#7C3AED', '#059669', '#DC2626', '#D97706',
];

const FOLDER_ICONS = {
  calendar: Calendar,
  folder: Folder,
  sparkles: Sparkles,
  trophy: Trophy,
  layers: Layers,
};

/* ═══════════════════════════════════════════════════════════════════ *
 *  3D FOLDER CARD COMPONENT                                           *
 * ═══════════════════════════════════════════════════════════════════ */
function FolderCard({ folder, count, onOpen, onRename, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(folder.title);

  const IconComp = FOLDER_ICONS[folder.icon] || Folder;

  function handleSaveRename(e) {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    onRename(folder.id, editTitle.trim());
    setIsEditing(false);
  }

  return (
    <div
      onClick={() => !isEditing && onOpen(folder.id)}
      className="group relative overflow-hidden rounded-3xl p-5 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[145px] bg-white dark:bg-[#181926] shadow-sm hover:shadow-xl border border-black/5 dark:border-white/8 hover:border-[#F05A36]/40"
      style={{
        background: `linear-gradient(135deg, ${folder.color}15 0%, ${folder.color}05 100%)`,
      }}
    >
      {/* 3D Top Curved Tab */}
      <div
        className="absolute top-0 left-6 w-16 h-2.5 rounded-b-lg opacity-90 shadow-sm"
        style={{ backgroundColor: folder.color }}
      />

      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${folder.color}25` }}
        >
          <IconComp size={20} style={{ color: folder.color }} />
        </div>

        {/* Options Menu Button */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-[#18191E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <MoreVertical size={15} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 w-36 bg-white dark:bg-[#181926] border border-black/10 dark:border-white/12 rounded-xl shadow-2xl p-1 z-30 space-y-0.5">
              <button
                onClick={() => { setShowMenu(false); setIsEditing(true); }}
                className="w-full px-3 py-1.5 text-xs text-left text-[#18191E] dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg flex items-center gap-2"
              >
                <Edit3 size={12} /> Rename
              </button>
              <button
                onClick={() => { setShowMenu(false); onDelete(folder.id); }}
                className="w-full px-3 py-1.5 text-xs text-left text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        {isEditing ? (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(e); }}
              autoFocus
              className="w-full text-xs text-[#18191E] dark:text-white bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-lg px-2 py-1 outline-none focus:border-[#F05A36]"
            />
            <button onClick={handleSaveRename} className="p-1 text-emerald-500"><Check size={14} /></button>
          </div>
        ) : (
          <h3 className="text-base font-extrabold text-[#18191E] dark:text-white group-hover:text-[#F05A36] transition-colors truncate">
            {folder.title}
          </h3>
        )}
        <p className="text-xs text-stone-500 dark:text-white/40 mt-0.5 font-medium">
          {count} {count === 1 ? 'file' : 'files'}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  FILE EDITOR (Matching Middle Screen Reference Image)              *
 * ═══════════════════════════════════════════════════════════════════ */
function FileEditor({ file, onSave, onDelete, onBack }) {
  const [title, setTitle] = useState(file.title || 'Untitled Note');
  const [fileType, setFileType] = useState(file.fileType || 'todo'); // 'todo' | 'txt'
  const [todoItems, setTodoItems] = useState(file.todoItems || [
    { id: '1', text: 'Morning meditation & practice', done: true },
    { id: '2', text: 'Hydrate water & protein breakfast', done: true },
  ]);
  const [placeItems, setPlaceItems] = useState(file.placeItems || [
    { id: 'p1', text: 'Evening gratitude journaling', done: false },
  ]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newPlaceText, setNewPlaceText] = useState('');
  const [noteContent, setNoteContent] = useState(file.content || file.curiosity || '');
  const [bannerIdx, setBannerIdx] = useState(file.bannerIdx || 0);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setTitle(file.title || (file.fileType === 'todo' ? 'To-Do List Note' : 'Text Note'));
    setFileType(file.fileType || 'todo');
    setTodoItems(file.todoItems || [
      { id: '1', text: 'Morning meditation & practice', done: true },
      { id: '2', text: 'Hydrate water & protein breakfast', done: true },
    ]);
    setPlaceItems(file.placeItems || [
      { id: 'p1', text: 'Evening gratitude journaling', done: false },
    ]);
    setNoteContent(file.content || file.curiosity || '');
    setBannerIdx(file.bannerIdx || 0);
    setConfirmDelete(false);
  }, [file.id]);

  const dateInfo = formatDateDisplay(new Date(file.updatedAt || Date.now()));

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

  function handleCopy() {
    const text = `${title}\n${dateInfo.full}\n\nTo Do:\n${todoItems.map(i => `${i.done ? '[x]' : '[ ]'} ${i.text}`).join('\n')}\n\nNotes:\n${noteContent}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    onSave({
      ...file,
      title: title.trim() || 'Untitled Note',
      fileType,
      todoItems,
      placeItems,
      content: noteContent,
      curiosity: noteContent,
      problem: title.trim() || 'Untitled Note',
      bannerIdx,
      updatedAt: Date.now(),
    });
  }

  return (
    <div className="relative rounded-3xl p-6 space-y-5 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-2xl">

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#F05A36] transition-all">
          <ArrowLeft size={16} /> Back to Files
        </button>

        <div className="flex items-center gap-2">
          {/* File Type toggle */}
          <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-xl p-0.5 border border-black/5 dark:border-white/8">
            <button
              onClick={() => setFileType('todo')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                fileType === 'todo' ? 'bg-[#F05A36] text-white' : 'text-stone-400 hover:text-stone-700 dark:hover:text-white'
              }`}
            >
              .todo List
            </button>
            <button
              onClick={() => setFileType('txt')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                fileType === 'txt' ? 'bg-[#E6A04E] text-white' : 'text-stone-400 hover:text-stone-700 dark:hover:text-white'
              }`}
            >
              .txt Note
            </button>
          </div>

          <button
            onClick={handleCopy}
            title="Copy file text"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-stone-600 dark:text-white/70 hover:text-[#F05A36] text-xs font-semibold"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded-xl border border-red-500/40">
              <span className="text-[10px] font-bold text-red-500">Delete?</span>
              <button onClick={() => onDelete(file.id)} className="text-xs font-bold text-red-500 hover:underline">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-stone-400"><X size={12} /></button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-stone-400 hover:text-red-500 hover:bg-red-500/10"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Title & Date */}
      <div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="File Title…"
          className="w-full text-2xl font-extrabold text-[#18191E] dark:text-white bg-transparent outline-none border-b border-transparent focus:border-[#F05A36] transition-colors"
        />
        <p className="text-xs text-stone-400 font-medium mt-1">{dateInfo.full}</p>
      </div>

      {/* Featured Banner Card */}
      <div className="relative overflow-hidden rounded-2xl h-40 bg-gradient-to-r from-[#1e2240] to-[#2d3561] border border-white/10 flex items-center justify-center p-4 group">
        <img
          src={BANNER_PRESETS[bannerIdx]}
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="relative z-10 text-center space-y-1">
          <span className="text-[10px] font-bold text-[#E6A04E] uppercase tracking-[0.2em]">JotPad Note</span>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        <button
          onClick={() => setBannerIdx((bannerIdx + 1) % BANNER_PRESETS.length)}
          className="absolute bottom-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/50 text-white/70 hover:text-white border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
        >
          <ImageIcon size={10} /> Cover
        </button>
      </div>

      {/* Interactive To-Do List Section */}
      {fileType === 'todo' && (
        <div className="space-y-4 pt-1">
          {/* Section 1: To do list */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[#18191E] dark:text-white">To do list:</h4>
            <div className="space-y-1.5">
              {todoItems.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1 px-1 group/item">
                  <button onClick={() => toggleTodo(item.id)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      item.done ? 'bg-[#F05A36] border-[#F05A36] text-white' : 'border-stone-300 dark:border-white/30 group-hover/item:border-[#F05A36]'
                    }`}>
                      {item.done && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className={`text-xs font-medium truncate ${item.done ? 'line-through text-stone-400 dark:text-white/30' : 'text-[#18191E] dark:text-white'}`}>
                      {item.text}
                    </span>
                  </button>
                  <button onClick={() => removeTodo(item.id)} className="opacity-0 group-hover/item:opacity-100 text-stone-400 hover:text-red-500 px-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input
                  value={newTodoText}
                  onChange={e => setNewTodoText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTodo(); } }}
                  placeholder="+ Add to-do item…"
                  className="flex-1 text-xs text-[#18191E] dark:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 outline-none focus:border-[#F05A36]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Priorities */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[#18191E] dark:text-white">Places / Priorities:</h4>
            <div className="space-y-1.5">
              {placeItems.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1 px-1 group/item">
                  <button onClick={() => togglePlace(item.id)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      item.done ? 'bg-[#E6A04E] border-[#E6A04E] text-white' : 'border-stone-300 dark:border-white/30 group-hover/item:border-[#E6A04E]'
                    }`}>
                      {item.done && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className={`text-xs font-medium truncate ${item.done ? 'line-through text-stone-400 dark:text-white/30' : 'text-[#18191E] dark:text-white'}`}>
                      {item.text}
                    </span>
                  </button>
                  <button onClick={() => removePlace(item.id)} className="opacity-0 group-hover/item:opacity-100 text-stone-400 hover:text-red-500 px-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input
                  value={newPlaceText}
                  onChange={e => setNewPlaceText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPlace(); } }}
                  placeholder="+ Add priority…"
                  className="flex-1 text-xs text-[#18191E] dark:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 outline-none focus:border-[#E6A04E]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Freeform Text Note Content */}
      <div className="pt-1">
        <h4 className="text-sm font-bold text-[#18191E] dark:text-white mb-1.5">Notes & Text:</h4>
        <textarea
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          placeholder="Type your notes or reflections here…"
          rows={5}
          className="w-full text-xs text-[#18191E] dark:text-white placeholder-stone-400 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3.5 outline-none resize-none font-verse leading-relaxed"
        />
      </div>

      {/* Floating Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="btn-coral text-xs flex items-center gap-1.5 shadow-xl"
        >
          <Check size={14} /> Save File
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  MAIN MANAN FILE EXPLORER COMPONENT                                *
 * ═══════════════════════════════════════════════════════════════════ */
export default function Manan() {
  const { state, addNotebookEntry, deleteNotebookEntry, addFolder, updateFolder, deleteFolder } = useStorage();
  const folders = state.folders || [];
  const notebook = state.notebook || [];

  const [activeFolderId, setActiveFolderId] = useState(null); // null = Root explorer view
  const [activeFile, setActiveFile] = useState(null); // null = Folder view, file object = FileEditor view
  const [search, setSearch] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#E8843C');

  const currentFolder = useMemo(() => folders.find(f => f.id === activeFolderId), [folders, activeFolderId]);

  // Count files per folder
  const fileCounts = useMemo(() => {
    const counts = {};
    folders.forEach(f => {
      counts[f.id] = notebook.filter(e => e.folderId === f.id || (!e.folderId && f.id === 'f-1')).length;
    });
    return counts;
  }, [folders, notebook]);

  // Files inside currently opened folder
  const folderFiles = useMemo(() => {
    if (!activeFolderId) return [];
    let list = notebook.filter(e => e.folderId === activeFolderId || (!e.folderId && activeFolderId === 'f-1'));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q));
    }
    return list;
  }, [notebook, activeFolderId, search]);

  function handleCreateFolder(e) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newF = {
      id: `f-${Date.now()}`,
      title: newFolderName.trim(),
      color: newFolderColor,
      icon: 'folder',
    };
    addFolder(newF);
    setNewFolderName('');
    setShowAddFolder(false);
  }

  function handleCreateFile(fileType = 'todo') {
    const targetFolderId = activeFolderId || folders[0]?.id || 'f-1';
    const newFile = {
      id: `file-${Date.now()}`,
      folderId: targetFolderId,
      title: fileType === 'todo' ? 'New Checklist' : 'New Text Note',
      fileType,
      todoItems: fileType === 'todo' ? [{ id: '1', text: 'First item', done: false }] : [],
      placeItems: [],
      content: '',
      createdAt: Date.now(),
    };
    addNotebookEntry(newFile);
    setActiveFile(newFile);
  }

  function handleSaveFile(updated) {
    addNotebookEntry(updated);
    setActiveFile(updated);
  }

  function handleDeleteFile(fileId) {
    deleteNotebookEntry(fileId);
    setActiveFile(null);
  }

  return (
    <div className="page-container page-transition relative min-h-screen">

      {/* JotPad File Explorer Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            {activeFolderId && (
              <button
                onClick={() => { setActiveFolderId(null); setActiveFile(null); }}
                className="text-xs text-[#F05A36] font-bold hover:underline flex items-center gap-1 mr-1"
              >
                Folders <ChevronRight size={12} />
              </button>
            )}
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#18191E] dark:text-white tracking-tight">
              {activeFolderId ? currentFolder?.title : 'JotPad Explorer'}
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-white/40 mt-0.5 font-medium">
            {activeFolderId ? `${folderFiles.length} files in folder` : 'Manage your folders, notes & checklists'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!activeFolderId ? (
            <button
              onClick={() => setShowAddFolder(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#181926] text-[#18191E] dark:text-white font-extrabold text-xs border border-black/10 dark:border-white/10 shadow-sm hover:border-[#F05A36] transition-all"
            >
              <FolderPlus size={15} className="text-[#F05A36]" /> New Folder
            </button>
          ) : (
            <button
              onClick={() => handleCreateFile('todo')}
              className="btn-coral text-xs flex items-center gap-1.5 shadow-md"
            >
              <FilePlus size={15} /> New File
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={activeFolderId ? `Search inside ${currentFolder?.title}…` : 'Search folders and notes…'}
          className="w-full pl-10 pr-4 py-2.5 text-xs text-[#18191E] dark:text-white placeholder-stone-400 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl outline-none focus:border-[#F05A36] transition-colors"
        />
      </div>

      {/* New Folder Modal / Inline Creator */}
      {showAddFolder && (
        <form onSubmit={handleCreateFolder} className="mb-6 p-5 rounded-3xl bg-white dark:bg-[#181926] border border-black/10 dark:border-white/12 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-[#F05A36] uppercase tracking-wider">Create New Folder</h4>
            <button type="button" onClick={() => setShowAddFolder(false)} className="text-stone-400 hover:text-stone-700 dark:hover:text-white"><X size={14} /></button>
          </div>
          <div className="flex gap-2">
            <input
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder Name (e.g. Science, Recipes, Work…)"
              autoFocus
              className="flex-1 text-xs text-[#18191E] dark:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:border-[#F05A36]"
            />
            <button type="submit" className="btn-coral text-xs px-4 py-2">
              Create
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-stone-400 font-semibold">Color:</span>
            <div className="flex gap-2">
              {FOLDER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewFolderColor(c)}
                  className="w-5 h-5 rounded-full transition-transform"
                  style={{ backgroundColor: c, transform: newFolderColor === c ? 'scale(1.2)' : 'scale(1)' }}
                />
              ))}
            </div>
          </div>
        </form>
      )}

      {/* Active File Editor Screen */}
      {activeFile ? (
        <FileEditor
          file={activeFile}
          onSave={handleSaveFile}
          onDelete={handleDeleteFile}
          onBack={() => setActiveFile(null)}
        />
      ) : activeFolderId ? (
        /* Inside Folder Files Explorer */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">Files in {currentFolder?.title}</span>
            <div className="flex gap-3">
              <button onClick={() => handleCreateFile('todo')} className="text-xs font-bold text-[#F05A36] hover:underline">+ .todo</button>
              <button onClick={() => handleCreateFile('txt')} className="text-xs font-bold text-[#E6A04E] hover:underline">+ .txt</button>
            </div>
          </div>

          {folderFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400 dark:text-white/20 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
              <BookOpen size={36} className="mb-2 text-stone-300 dark:text-white/20" />
              <p className="text-xs font-medium">Folder is empty</p>
              <button onClick={() => handleCreateFile('todo')} className="text-xs text-[#F05A36] font-bold mt-2 hover:underline">+ Create first file</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folderFiles.map(file => (
                <div
                  key={file.id}
                  onClick={() => setActiveFile(file)}
                  className="card-bento p-4 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 hover:border-[#F05A36]/40 transition-all cursor-pointer flex flex-col justify-between min-h-[120px] group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {file.fileType === 'todo' ? (
                        <CheckSquare size={16} className="text-[#F05A36]" />
                      ) : (
                        <FileText size={16} className="text-[#E6A04E]" />
                      )}
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{file.fileType || 'note'}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotebookEntry(file.id); }}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-[#18191E] dark:text-white group-hover:text-[#F05A36] transition-colors truncate">
                      {file.title || 'Untitled Note'}
                    </h4>
                    <p className="text-[10px] text-stone-400 mt-1 font-medium">
                      {formatDateDisplay(new Date(file.updatedAt || Date.now())).short}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Root Explorer: 2x2 or 4-column Folder Cards Grid */
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-400">All Folders ({folders.length})</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map(f => (
              <FolderCard
                key={f.id}
                folder={f}
                count={fileCounts[f.id] || 0}
                onOpen={(id) => setActiveFolderId(id)}
                onRename={(id, title) => updateFolder(id, { title })}
                onDelete={(id) => deleteFolder(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating '+' Action Button */}
      <button
        onClick={() => {
          if (!activeFolderId && folders.length > 0) setActiveFolderId(folders[0].id);
          handleCreateFile('todo');
        }}
        title="Quick Create File"
        className="fixed bottom-20 right-6 lg:bottom-10 lg:right-10 z-40 w-14 h-14 rounded-full bg-[#F05A36] text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        style={{ boxShadow: '0 8px 30px rgba(240,90,54,0.5)' }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <div className="h-6" />
    </div>
  );
}
