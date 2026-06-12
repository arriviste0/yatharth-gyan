import { useState, useMemo } from 'react';
import { Search, BookOpen, TrendingUp, ChevronRight, Plus, Tag, X } from 'lucide-react';
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
      <div className="flex-1 h-1 rounded-full bg-stone-100 dark:bg-white/10">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#C9A961' : '#E8843C' }} />
      </div>
      <span className="text-[10px] text-stone-400 flex-shrink-0">
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
      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Tags</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {SUGGESTED_TAGS.map(t => (
          <button key={t} type="button"
            onClick={() => tags.includes(t) ? removeTag(t) : addTag(t)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              tags.includes(t)
                ? 'border-[#2D3561] bg-[#2D3561]/10 text-[#2D3561] dark:text-[#8B9FE0]'
                : 'border-black/8 dark:border-white/10 text-stone-400 hover:border-stone-300'
            }`}>
            #{t}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
          <input value={custom} onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(custom); setCustom(''); } }}
            placeholder="custom tag…"
            className="w-full pl-7 pr-3 py-1.5 text-xs text-[#1a1a2e] dark:text-white placeholder-stone-300 bg-white dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-xl outline-none focus:border-[#E8843C] transition-colors" />
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#2D3561]/8 text-[#2D3561] dark:bg-white/8 dark:text-stone-300">
              #{t}
              <button onClick={() => removeTag(t)}><X size={9} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Entry card ──────────────────────────────────────────────────────────────
function EntryCard({ entry, onClick, isSelected = false, isCurrentWeek = false, isDaily = false }) {
  const date    = formatDateDisplay(new Date(isDaily ? entry.date : entry.weekStart));
  const preview = entry.problem || entry.curiosity || entry.gratitude || entry.wins || '';

  return (
    <button onClick={onClick}
      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
        isSelected
          ? 'bg-[#2D3561]/7 dark:bg-white/8 border-[#2D3561]/22 dark:border-white/14'
          : 'bg-white/55 dark:bg-white/3 border-black/5 dark:border-white/6 hover:border-[#E8843C]/35 hover:bg-white/80 dark:hover:bg-white/6'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="text-[10px] text-stone-400 mb-0.5">
            {isDaily ? '' : getMonthLabel(entry.weekStart)}
          </div>
          <div className={`text-sm font-semibold truncate ${isSelected ? 'text-[#2D3561] dark:text-white' : 'text-[#1a1a2e] dark:text-white'}`}>
            {isCurrentWeek ? (isDaily ? 'Today' : 'This Week') : (isDaily ? date.full : `Week of ${date.short}`)}
          </div>
        </div>
        {entry.mood && <MoodBadge id={entry.mood} small />}
      </div>
      {preview
        ? <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">{preview}</p>
        : <p className="text-xs text-stone-300 dark:text-stone-600 italic">No reflection yet</p>
      }
      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {entry.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#2D3561]/6 text-[#2D3561]/60 dark:text-stone-500">#{t}</span>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Editor (weekly OR daily) ─────────────────────────────────────────────────
function Editor({ entry, onSave, onBack, wordCountGoal = 0 }) {
  const [problem,   setProblem]   = useState(entry.problem   || '');
  const [curiosity, setCuriosity] = useState(entry.curiosity || '');
  const [gratitude, setGratitude] = useState(entry.gratitude || '');
  const [wins,      setWins]      = useState(entry.wins      || '');
  const [mood,      setMood]      = useState(entry.mood      || '');
  const [tags,      setTags]      = useState(entry.tags      || []);

  const isDaily      = !!entry.date;
  const isCurrentRef = isDaily
    ? entry.date === todayKey()
    : entry.weekStart === getWeekKey(new Date());
  const date = formatDateDisplay(new Date(isDaily ? entry.date : entry.weekStart));

  const allText = [problem, curiosity, gratitude, wins].join(' ');
  const totalWords = wc(allText);

  const ta = [
    'w-full bg-white dark:bg-white/5',
    'border border-black/8 dark:border-white/10',
    'rounded-2xl px-4 py-3',
    'text-sm text-[#1a1a2e] dark:text-white',
    'placeholder-stone-300 dark:placeholder-stone-600',
    'outline-none focus:border-[#E8843C] transition-colors',
    'resize-none font-verse leading-relaxed',
  ].join(' ');

  function Section({ label, color, value, setValue, placeholder, rows = 4 }) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{label}</span>
          </div>
          {value && <span className="text-[10px] text-stone-300 dark:text-stone-600">{wc(value)} words</span>}
        </div>
        <textarea value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder}
          rows={rows} className={ta} />
        <WordCountBar text={value} goal={wordCountGoal > 0 ? Math.floor(wordCountGoal / 4) : 0} />
      </div>
    );
  }

  return (
    <div className="page-transition">
      {onBack && (
        <button onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors mb-5">
          <ChevronRight size={15} className="rotate-180" /> Back to Journal
        </button>
      )}

      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs text-stone-400 mb-0.5">{isDaily ? date.full : date.full}</p>
          <h2 className="text-xl font-bold text-[#1a1a2e] dark:text-white">
            {isCurrentRef ? (isDaily ? "Today's Reflection" : "This Week's Reflection") : (isDaily ? date.short : `Week of ${date.short}`)}
          </h2>
        </div>
        {totalWords > 0 && (
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-xl font-bold tabular-nums text-[#1a1a2e] dark:text-white">{totalWords}</div>
            <div className="text-[10px] text-stone-400 uppercase tracking-widest">words</div>
            {wordCountGoal > 0 && (
              <div className="text-[10px] mt-0.5" style={{ color: totalWords >= wordCountGoal ? '#C9A961' : '#9CA3AF' }}>
                {totalWords >= wordCountGoal ? '✓ goal met' : `/ ${wordCountGoal}`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mood */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-2.5">State of mind</p>
        <div className="flex gap-2">
          {MOODS.map(m => (
            <button key={m.id} type="button"
              onClick={() => setMood(mood === m.id ? '' : m.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${
                mood === m.id ? 'border-2' : 'border border-black/6 dark:border-white/8'
              }`}
              style={mood === m.id ? { borderColor: m.color, background: m.color + '12' } : {}}>
              <span className="text-lg leading-none">{m.emoji}</span>
              <span className="text-[9px] font-semibold" style={{ color: mood === m.id ? m.color : '#9CA3AF' }}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Section label="A problem I noticed" color="#E8843C" value={problem} setValue={setProblem}
          placeholder="What kept coming up for you? A recurring tension, an avoidance, a friction…" />
        <Section label="A curiosity I explored" color="#5A8A8A" value={curiosity} setValue={setCuriosity}
          placeholder="What drew your attention? What are you thinking about, reading about, wondering about?" />
        <Section label="Gratitude" color="#C9A961" value={gratitude} setValue={setGratitude}
          placeholder="Three things — big or small — you are thankful for today…" rows={3} />
        <Section label="Wins" color="#059669" value={wins} setValue={setWins}
          placeholder="What did you do well? What moved forward?" rows={3} />

        <TagPicker tags={tags} onChange={setTags} />

        <button
          onClick={() => onSave({ ...entry, problem, curiosity, gratitude, wins, mood, tags })}
          className="w-full py-3.5 rounded-2xl text-white font-semibold transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #2D3561, #5B6BAF)' }}
        >
          Save Reflection
        </button>
      </div>
    </div>
  );
}

// ─── Pattern Review ───────────────────────────────────────────────────────────
function PatternReview({ entries, onBack }) {
  const problems    = entries.filter(e => e.problem);
  const curiosities = entries.filter(e => e.curiosity);
  const moodCounts  = entries.reduce((acc, e) => {
    if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1;
    return acc;
  }, {});
  const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);

  // Tag frequency
  const tagCounts = entries.reduce((acc, e) => {
    (e.tags || []).forEach(t => { acc[t] = (acc[t] || 0) + 1; });
    return acc;
  }, {});
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="page-transition">
      {onBack && (
        <button onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-5">
          <ChevronRight size={15} className="rotate-180" /> Back
        </button>
      )}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[#1a1a2e] dark:text-white">Pattern Review</h2>
        <p className="text-sm text-stone-400">{entries.length} entries of reflection</p>
      </div>

      {topMoods.length > 0 && (
        <div className="card mb-5">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-3">Your state of mind</p>
          <div className="flex flex-wrap gap-2">
            {topMoods.map(([id, count]) => (
              <div key={id} className="flex items-center gap-1.5">
                <MoodBadge id={id} />
                <span className="text-xs text-stone-400">{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topTags.length > 0 && (
        <div className="card mb-5">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-3">Your themes</p>
          <div className="flex flex-wrap gap-1.5">
            {topTags.map(([tag, count]) => (
              <span key={tag} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#2D3561]/8 text-[#2D3561] dark:text-[#8B9FE0]">
                #{tag} <span className="text-stone-400 text-[10px]">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl mb-5"
        style={{ background: 'rgba(45,53,97,0.05)', border: '1px solid rgba(45,53,97,0.1)' }}>
        <p className="font-verse text-sm text-stone-600 dark:text-stone-300 leading-relaxed italic">
          "The overlap between your recurring problems and your deepest curiosities
          often points to the thing you are meant to do."
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E8843C]" />
            <span className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Problems</span>
            <span className="text-xs text-stone-400">({problems.length})</span>
          </div>
          <div className="space-y-2">
            {problems.map(e => (
              <div key={e.id} className="bg-white/60 dark:bg-white/5 rounded-xl p-3 border border-black/5 dark:border-white/6">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] text-stone-400">{e.date ? formatDateDisplay(new Date(e.date)).short : getMonthLabel(e.weekStart)}</span>
                  {e.mood && <MoodBadge id={e.mood} small />}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{e.problem}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#5A8A8A]" />
            <span className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Curiosities</span>
            <span className="text-xs text-stone-400">({curiosities.length})</span>
          </div>
          <div className="space-y-2">
            {curiosities.map(e => (
              <div key={e.id} className="bg-white/60 dark:bg-white/5 rounded-xl p-3 border border-black/5 dark:border-white/6">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] text-stone-400">{e.date ? formatDateDisplay(new Date(e.date)).short : getMonthLabel(e.weekStart)}</span>
                  {e.mood && <MoodBadge id={e.mood} small />}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{e.curiosity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Manan() {
  const { state, addNotebookEntry, updateSettings } = useStorage();
  const { notebook, settings } = state;
  const wordCountGoal = settings.wordCountGoal || 0;

  const [search,       setSearch]       = useState('');
  const [mobileView,   setMobileView]   = useState('list');
  const [mobileEntry,  setMobileEntry]  = useState(null);
  const [desktopEntry, setDesktopEntry] = useState(null);
  const [mode,         setMode]         = useState('weekly'); // 'weekly' | 'daily'
  const [goalInput,    setGoalInput]    = useState(wordCountGoal > 0 ? String(wordCountGoal) : '');

  const currentWeekKey   = getWeekKey(new Date());
  const currentDayKey    = todayKey();

  const currentWeekEntry = notebook.find(e => e.weekStart === currentWeekKey) || {
    id: `week-${currentWeekKey}`, weekStart: currentWeekKey, problem: '', curiosity: '', gratitude: '', wins: '', mood: '', tags: [],
  };
  const todayEntry = notebook.find(e => e.date === currentDayKey) || {
    id: `day-${currentDayKey}`, date: currentDayKey, problem: '', curiosity: '', gratitude: '', wins: '', mood: '', tags: [],
  };

  // Streak (weekly entries)
  const weekStreak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 52; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i * 7);
      const key = getWeekKey(d);
      const e = notebook.find(n => n.weekStart === key);
      if (i === 0) { count++; continue; }
      if (e && (e.problem || e.curiosity || e.gratitude)) count++;
      else break;
    }
    return count;
  }, [notebook]);

  // All entries filtered for current mode
  const allEntries = useMemo(() =>
    notebook.filter(e => mode === 'daily' ? !!e.date : !!e.weekStart),
    [notebook, mode]
  );

  const currentEntry = mode === 'daily' ? todayEntry : currentWeekEntry;
  const currentKey   = mode === 'daily' ? currentDayKey : currentWeekKey;

  const pastEntries = useMemo(() =>
    allEntries.filter(e => mode === 'daily' ? e.date !== currentDayKey : e.weekStart !== currentWeekKey)
      .sort((a, b) => {
        const ka = a.date || a.weekStart;
        const kb = b.date || b.weekStart;
        return kb.localeCompare(ka);
      }),
    [allEntries, currentDayKey, currentWeekKey, mode]
  );

  const filteredPast = useMemo(() => {
    if (!search) return pastEntries;
    const q = search.toLowerCase();
    return pastEntries.filter(e =>
      ['problem','curiosity','gratitude','wins'].some(f => e[f]?.toLowerCase().includes(q)) ||
      (e.tags || []).some(t => t.includes(q))
    );
  }, [pastEntries, search]);

  // Also search current entry (#19 fix)
  const currentMatchesSearch = search && ['problem','curiosity','gratitude','wins'].some(
    f => currentEntry[f]?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = useMemo(() => {
    const out = {};
    for (const entry of filteredPast) {
      const k = entry.date
        ? new Date(entry.date).toLocaleString('default', { month: 'long', year: 'numeric' })
        : getMonthLabel(entry.weekStart);
      if (!out[k]) out[k] = [];
      out[k].push(entry);
    }
    return out;
  }, [filteredPast]);

  function handleSave(updated) {
    addNotebookEntry(updated);
    setMobileView('list');
    const isCurrent = (updated.date === currentDayKey) || (updated.weekStart === currentWeekKey);
    setDesktopEntry(isCurrent ? null : updated);
  }

  function openEntry(entry) {
    setMobileEntry(entry);
    setMobileView('editor');
  }

  const hasWrittenToday = !!(currentEntry.problem || currentEntry.curiosity || currentEntry.gratitude);
  const desktopActiveEntry = (desktopEntry && desktopEntry !== 'pattern') ? desktopEntry : currentEntry;

  function StatsRow({ compact }) {
    return (
      <div className={`flex gap-2 ${compact ? '' : 'mb-5'}`}>
        <div className={`flex-1 rounded-xl border text-center ${compact ? 'px-2 py-2' : 'px-3 py-2.5'} bg-white/60 dark:bg-white/5 border-black/5 dark:border-white/8`}>
          <div className={`font-bold text-[#1a1a2e] dark:text-white ${compact ? 'text-base' : 'text-lg'}`}>{notebook.length}</div>
          <div className="text-[10px] text-stone-400">entries</div>
        </div>
        <div className={`flex-1 rounded-xl border text-center ${compact ? 'px-2 py-2' : 'px-3 py-2.5'} bg-white/60 dark:bg-white/5 border-black/5 dark:border-white/8`}>
          <div className={`font-bold text-[#E8843C] ${compact ? 'text-base' : 'text-lg'}`}>{weekStreak}</div>
          <div className="text-[10px] text-stone-400">wk streak</div>
        </div>
        <div className={`flex-1 rounded-xl border text-center ${compact ? 'px-2 py-2' : 'px-3 py-2.5'} ${
          hasWrittenToday ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50' : 'bg-white/60 dark:bg-white/5 border-black/5 dark:border-white/8'
        }`}>
          <div className={`font-bold ${compact ? 'text-base' : 'text-lg'} ${hasWrittenToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`}>
            {hasWrittenToday ? '✓' : '·'}
          </div>
          <div className="text-[10px] text-stone-400">{mode === 'daily' ? 'today' : 'this wk'}</div>
        </div>
      </div>
    );
  }

  function ModeToggle({ compact }) {
    return (
      <div className={`flex gap-1 rounded-xl p-1 ${compact ? 'mb-3' : 'mb-4'}`} style={{ background: 'rgba(0,0,0,0.05)' }}>
        {['weekly','daily'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === m ? 'bg-white dark:bg-[#2D3561] text-[#1a1a2e] dark:text-white shadow-sm' : 'text-stone-400'
            }`}>
            {m === 'weekly' ? 'Weekly' : 'Daily'}
          </button>
        ))}
      </div>
    );
  }

  function SearchInput({ compact }) {
    return (
      <div className="relative">
        <Search size={compact ? 12 : 13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reflections…"
          className={`w-full ${compact ? 'pl-8 pr-3 py-2 text-xs' : 'pl-9 pr-4 py-2.5 text-sm'} text-[#1a1a2e] dark:text-white placeholder-stone-400 bg-white dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-xl outline-none focus:border-[#E8843C] transition-colors`} />
      </div>
    );
  }

  return (
    <>
      {/* ══ MOBILE ══════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        {mobileView === 'pattern' ? (
          <div className="page-container page-transition">
            <PatternReview entries={notebook} onBack={() => setMobileView('list')} />
            <div className="h-8" />
          </div>
        ) : mobileView === 'editor' && mobileEntry ? (
          <div className="page-container page-transition">
            <Editor entry={mobileEntry} onSave={handleSave} onBack={() => setMobileView('list')} wordCountGoal={wordCountGoal} />
            <div className="h-8" />
          </div>
        ) : (
          <div className="page-container page-transition">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white">Journal</h1>
                <p className="text-sm text-stone-400">Reflect. Notice. Grow.</p>
              </div>
              {notebook.length >= 8 && (
                <button onClick={() => setMobileView('pattern')}
                  className="text-xs px-3 py-2 rounded-xl font-semibold text-white flex items-center gap-1.5 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#2D3561,#5B6BAF)' }}>
                  <TrendingUp size={12} /> Patterns
                </button>
              )}
            </div>

            <ModeToggle compact={false} />
            <StatsRow compact={false} />

            {/* Word count goal setting */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-stone-400">Word goal:</span>
              <input type="number" value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onBlur={() => updateSettings({ wordCountGoal: parseInt(goalInput) || 0 })}
                placeholder="0 = off"
                className="w-20 text-xs text-[#1a1a2e] dark:text-white bg-white dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-lg px-2 py-1 outline-none focus:border-[#E8843C] transition-colors" />
              <span className="text-xs text-stone-400">words/entry</span>
            </div>

            {/* Current entry */}
            <div className="mb-1">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-2.5">
                {mode === 'daily' ? 'Today' : 'This Week'}
                {search && currentMatchesSearch && <span className="ml-1 text-[#E8843C]">· matches search</span>}
              </p>
              <button onClick={() => openEntry(currentEntry)}
                className="w-full card text-left hover:border-[#E8843C]/40"
                style={{ borderColor: 'rgba(232,132,60,0.18)' }}>
                {hasWrittenToday ? (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <p className="text-xs text-stone-400">
                        {mode === 'daily'
                          ? formatDateDisplay(new Date()).full
                          : formatDateDisplay(new Date(currentWeekEntry.weekStart)).full}
                      </p>
                      {currentEntry.mood && <MoodBadge id={currentEntry.mood} small />}
                    </div>
                    {currentEntry.problem && (
                      <p className="font-verse text-sm text-[#1a1a2e] dark:text-white line-clamp-2 leading-relaxed mb-1">{currentEntry.problem}</p>
                    )}
                    <p className="mt-2 text-xs text-[#E8843C]">Tap to edit →</p>
                  </>
                ) : (
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(45,53,97,0.08)' }}>
                      <BookOpen size={18} style={{ color: '#5B6BAF' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white">
                        {mode === 'daily' ? "Write today's reflection" : "Write this week's reflection"}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">Problem noticed · curiosity · gratitude · wins</p>
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Past entries */}
            {pastEntries.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">Past entries</p>
                  {search && <p className="text-[10px] text-stone-400">{filteredPast.length} result{filteredPast.length !== 1 ? 's' : ''}</p>}
                </div>
                {pastEntries.length >= 3 && <div className="mb-4"><SearchInput compact={false} /></div>}
                <div className="space-y-5">
                  {Object.entries(grouped).map(([month, entries]) => (
                    <div key={month}>
                      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-2.5">{month}</p>
                      <div className="space-y-2">
                        {entries.map(entry => (
                          <EntryCard key={entry.id} entry={entry} onClick={() => openEntry(entry)} isDaily={!!entry.date} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="h-8" />
          </div>
        )}
      </div>

      {/* ══ DESKTOP ══════════════════════════════════════════════════ */}
      <div className="hidden lg:flex" style={{ minHeight: '100vh' }}>
        {/* Sidebar */}
        <div className="flex-shrink-0 flex flex-col border-r border-black/6 dark:border-white/6 overflow-y-auto"
          style={{ width: '320px', position: 'sticky', top: 0, maxHeight: '100vh' }}>
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center justify-between mb-0.5">
              <h1 className="text-lg font-bold text-[#1a1a2e] dark:text-white">Journal</h1>
              {notebook.length >= 8 && (
                <button onClick={() => setDesktopEntry('pattern')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                    desktopEntry === 'pattern' ? 'bg-[#2D3561] text-white' : 'text-[#2D3561] dark:text-[#5B6BAF] bg-[#2D3561]/8 hover:bg-[#2D3561]/14'
                  }`}>
                  <TrendingUp size={11} /> Patterns
                </button>
              )}
            </div>
            <p className="text-xs text-stone-400 mb-3">Reflect. Notice. Grow.</p>
            <ModeToggle compact={true} />
            <StatsRow compact={true} />
          </div>

          <div className="px-4 mb-1">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2 px-0.5">
              {mode === 'daily' ? 'Today' : 'This Week'}
            </p>
            <EntryCard entry={currentEntry} onClick={() => setDesktopEntry(null)}
              isSelected={desktopEntry === null} isCurrentWeek isDaily={mode === 'daily'} />
          </div>

          {pastEntries.length > 0 && (
            <div className="px-4 flex-1 pb-6 mt-3">
              {pastEntries.length >= 3 && (
                <div className="mb-3">
                  <SearchInput compact={true} />
                  {search && <p className="text-[10px] text-stone-400 mt-1.5 px-0.5">{filteredPast.length} result{filteredPast.length !== 1 ? 's' : ''}</p>}
                </div>
              )}
              <div className="space-y-4">
                {Object.entries(grouped).map(([month, entries]) => (
                  <div key={month}>
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2 px-0.5">{month}</p>
                    <div className="space-y-1.5">
                      {entries.map(entry => (
                        <EntryCard key={entry.id} entry={entry}
                          onClick={() => setDesktopEntry(entry)}
                          isSelected={desktopEntry?.id === entry.id}
                          isDaily={!!entry.date} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl px-10 xl:px-14 py-8 mx-auto">
            {desktopEntry === 'pattern' ? (
              <PatternReview entries={notebook} onBack={null} />
            ) : (
              <Editor entry={desktopActiveEntry} onSave={handleSave} onBack={null} wordCountGoal={wordCountGoal} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
