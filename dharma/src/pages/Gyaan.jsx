import { useState, useMemo } from 'react';
import { Search, Bookmark, BookmarkCheck, CheckCircle2, ChevronDown, ChevronUp, CalendarDays, BookOpen, Sparkles, Send, Loader2 } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import chapters from '../data/chapters.json';
import shlokas from '../data/shlokas.json';
import VerseCard from '../components/VerseCard';
import { todayKey } from '../utils/dateUtils';
import { askKrishnaAI } from '../api/ai';

/* ── Ask Krishna theme chips (#29) ─────────────────────────────── */
const SUGGEST_THEMES = ['duty', 'fear', 'grief', 'attachment', 'action', 'peace', 'purpose', 'identity', 'impermanence', 'focus'];

/* ── 18-cell chapter grid (#31) ───────────────────────────────── */
function ChapterGrid({ progress }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(18, 1fr)' }}>
      {chapters.map((ch) => {
        const done = progress.includes(ch.number);
        return (
          <div key={ch.number}
            title={`Ch. ${ch.number}: ${ch.english_name}`}
            className="aspect-square rounded-sm flex items-center justify-center text-[7px] font-bold transition-all"
            style={{
              background: done ? '#F05A36' : 'rgba(240,90,54,0.12)',
              color: done ? 'white' : '#F05A36',
            }}>
            {ch.number}
          </div>
        );
      })}
    </div>
  );
}

/* ── ChapterCard ───────────────────────────────────────────────── */
function ChapterCard({ chapter, isRead, onMarkRead, bookmarks, onToggleBookmark }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card-bento p-4 transition-all duration-200 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm ${isRead ? 'border-[#F05A36]/30' : ''}`}>
      <button className="w-full flex items-start gap-3 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-dev font-bold text-lg"
          style={{ background: isRead ? '#F05A36' : 'rgba(240,90,54,0.10)', color: isRead ? 'white' : '#F05A36' }}>
          {chapter.devanagari}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-dev text-sm font-bold text-[#18191E] dark:text-white leading-snug">{chapter.sanskrit_name}</div>
              <div className="text-xs text-stone-400 font-medium">{chapter.english_name}</div>
            </div>
            {isRead && <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-500 mt-0.5" />}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">{chapter.essence}</p>
        </div>
        <div className="text-stone-400 flex-shrink-0 mt-1">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-slide-up">
          <p className="font-verse text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{chapter.essence}</p>

          <div>
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Key Shlokas</div>
            <div className="space-y-3">
              {chapter.key_shlokas.map((ks) => {
                const full = shlokas.find((s) => `${s.chapter}.${s.verse}` === ks.verse);
                return (
                  <div key={ks.verse} className="rounded-xl border border-black/5 dark:border-white/10 p-3 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="verse-sanskrit text-sm mb-2 text-[#18191E] dark:text-white">{ks.sanskrit}</div>
                    <div className="font-verse italic text-xs text-stone-500 dark:text-stone-400">{ks.english}</div>
                    {full && (
                      <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(full.id); }}
                        className="mt-2 flex items-center gap-1 text-[11px] font-bold"
                        style={{ color: bookmarks.includes(full.id) ? '#F05A36' : '#9CA3AF' }}>
                        {bookmarks.includes(full.id) ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                        {bookmarks.includes(full.id) ? 'Bookmarked' : 'Bookmark'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl p-3 bg-[#F05A36]/5 border border-[#F05A36]/15">
            <div className="text-[10px] font-extrabold text-[#F05A36] uppercase tracking-widest mb-1.5">Reflection</div>
            <p className="font-verse italic text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{chapter.reflection}</p>
          </div>

          {!isRead && (
            <button onClick={(e) => { e.stopPropagation(); onMarkRead(chapter.number); }}
              className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[#F05A36] bg-[#F05A36]/10 hover:bg-[#F05A36]/20 transition-all border border-[#F05A36]/20">
              Mark as read
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── AskKrishna (AI-powered Krishna Ji Companion) ──────────────── */
function AskKrishna({ bookmarks, allShlokas }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [matchedShloka, setMatchedShloka] = useState(null);
  const [messages, setMessages] = useState([]);

  async function handleAsk(userPrompt) {
    const text = (userPrompt || query).trim();
    if (!text || loading) return;

    setLoading(true);
    setQuery('');

    // Match best shloka based on text
    const keywords = text.toLowerCase().split(/\s+/);
    const scored = allShlokas.map((s) => {
      let score = 0;
      const combined = `${s.english} ${s.hindi} ${s.theme} ${s.arjuna_struggle || ''} ${s.krishna_answer || ''}`.toLowerCase();
      for (const kw of keywords) {
        if (combined.includes(kw)) score += 2;
        if ((s.theme || '').toLowerCase().includes(kw)) score += 3;
      }
      return { shloka: s, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const bestShloka = scored[0]?.score > 0 ? scored[0].shloka : null;
    setMatchedShloka(bestShloka);

    try {
      const result = await askKrishnaAI(text, messages);
      const newMsg = { prompt: text, reply: result.reply, source: result.source };
      setAiResponse(result.reply);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      setAiResponse('Dear friend, stay steady in your duty. Bring your mind gently to the next small step before you.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-bento p-5 bg-white dark:bg-[#181926] border border-black/5 dark:border-white/8 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F05A36]/15 text-[#F05A36]">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#18191E] dark:text-white">Ask Krishna Ji AI</h3>
            <p className="text-[10px] text-stone-400 font-medium">Gita-inspired advice for focus, motivation & work</p>
          </div>
        </div>
        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F05A36]/12 text-[#F05A36]">
          AI Powered
        </span>
      </div>

      {/* Input box */}
      <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask Krishna Ji (e.g., How to stop procrastinating?)"
          disabled={loading}
          className="flex-1 text-xs text-[#18191E] dark:text-white placeholder-stone-400 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-[#F05A36] transition-colors font-verse"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-coral text-xs px-4 flex items-center gap-1.5 shadow-md disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>

      {/* Quick Theme Chips */}
      <div className="space-y-1">
        <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Common Struggles:</span>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {SUGGEST_THEMES.map((t) => (
            <button
              key={t}
              onClick={() => handleAsk(`How can Krishna's wisdom help me with ${t}?`)}
              disabled={loading}
              className="text-[10px] px-3 py-1 rounded-full font-bold transition-all bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-[#F05A36]/15 hover:text-[#F05A36] border border-black/5 dark:border-white/5"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#F05A36]/8 text-[#F05A36] text-xs font-semibold animate-pulse border border-[#F05A36]/20">
          <Loader2 size={16} className="animate-spin shrink-0" />
          <span>Krishna Ji is contemplating your question…</span>
        </div>
      )}

      {/* Latest AI Response */}
      {aiResponse && !loading && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F05A36]/10 via-[#F05A36]/5 to-transparent border border-[#F05A36]/20 space-y-2 animate-slide-up">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F05A36] flex items-center gap-1">
              <Sparkles size={12} /> Krishna Ji's Guidance
            </span>
          </div>
          <p className="font-verse text-xs leading-relaxed text-[#18191E] dark:text-stone-200">
            {aiResponse}
          </p>
        </div>
      )}

      {/* Matched Shloka Card if relevant */}
      {matchedShloka && !loading && (
        <div className="pt-2 space-y-1.5">
          <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Relevant Shloka for you:</span>
          <VerseCard shloka={matchedShloka} compact />
        </div>
      )}
    </div>
  );
}

/* ── 18-week reading plan (#27) ────────────────────────────────── */
function ReadingPlan({ chapterProgress, readingPlanStart, onSetStart }) {
  if (!readingPlanStart) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(201,169,97,0.12)' }}>
          <CalendarDays size={28} style={{ color: '#C9A961' }} />
        </div>
        <h3 className="text-base font-bold text-[#1a1a2e] dark:text-white mb-2">18-Week Journey</h3>
        <p className="text-sm text-stone-400 max-w-xs mx-auto mb-6 font-verse leading-relaxed">
          Read one chapter per week. 18 chapters, 18 weeks — the complete Gita.
        </p>
        <button onClick={() => onSetStart(todayKey())}
          className="px-6 py-3 rounded-xl font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#C9A961,#E8843C)' }}>
          Begin this week
        </button>
      </div>
    );
  }

  const startDate = new Date(readingPlanStart);
  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const currentWeek = Math.min(Math.floor((now - startDate) / msPerWeek), 17);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Week {currentWeek + 1} of 18</p>
          <p className="text-xs text-stone-400">Started {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
        </div>
        <div className="w-24 h-1.5 rounded-full bg-stone-100 dark:bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${((currentWeek + 1) / 18) * 100}%`, background: 'linear-gradient(90deg,#C9A961,#E8843C)' }} />
        </div>
      </div>

      {chapters.map((ch, idx) => {
        const weekNum  = idx;
        const isPast   = weekNum < currentWeek;
        const isCurrent = weekNum === currentWeek;
        const isRead   = chapterProgress.includes(ch.number);
        const weekStart = new Date(startDate.getTime() + weekNum * msPerWeek);
        const weekLabel = weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        return (
          <div key={ch.number}
            className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
              isCurrent ? 'border-2' : 'border'
            }`}
            style={{
              borderColor: isCurrent ? '#E8843C' : 'rgba(0,0,0,0.07)',
              background: isCurrent ? 'rgba(232,132,60,0.05)' : isRead ? 'rgba(201,169,97,0.05)' : 'transparent',
            }}>
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-dev font-bold text-sm"
              style={{ background: isRead ? 'linear-gradient(135deg,#C9A961,#E8843C)' : isPast ? 'rgba(0,0,0,0.06)' : 'rgba(45,53,97,0.08)', color: isRead ? 'white' : '#2D3561' }}>
              {ch.devanagari}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <div className="font-dev text-xs font-semibold text-[#1a1a2e] dark:text-white">{ch.sanskrit_name}</div>
                  <div className="text-[10px] text-stone-400">{ch.english_name}</div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1">
                  {isCurrent && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#E8843C' }}>THIS WEEK</span>}
                  {isRead && <CheckCircle2 size={13} style={{ color: '#C9A961' }} />}
                </div>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Week {weekNum + 1} · {weekLabel}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function Gyaan() {
  const { state, toggleBookmark, markChapterRead, saveShlokaAnnotation, setReadingPlanStart } = useStorage();
  const { bookmarks, chapterProgress, shlokaAnnotations = {}, readingPlanStart } = state;
  const [tab, setTab] = useState('chapters');
  const [search, setSearch] = useState('');

  const bookmarkedShlokas = useMemo(() => shlokas.filter((s) => bookmarks.includes(s.id)), [bookmarks]);

  const filteredChapters = useMemo(() => {
    if (!search) return chapters;
    const q = search.toLowerCase();
    return chapters.filter((c) =>
      c.english_name.toLowerCase().includes(q) ||
      c.sanskrit_name.toLowerCase().includes(q) ||
      c.essence.toLowerCase().includes(q)
    );
  }, [search]);

  /* Chapter of the day (#30) */
  const chapterOfDay = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((d - start) / 86400000);
    return chapters[dayOfYear % 18];
  }, []);

  const progress = Math.round((chapterProgress.length / 18) * 100);

  const TABS = [
    { id: 'chapters',  label: '18 Chapters' },
    { id: 'bookmarks', label: `Saved${bookmarks.length > 0 ? ` (${bookmarks.length})` : ''}` },
    { id: 'plan',      label: 'Reading Plan' },
    { id: 'ask',       label: 'Ask Krishna' },
  ];

  return (
    <div className="page-container page-transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white">Wisdom</h1>
          <div className="text-sm text-stone-400">Gita · 18 Chapters</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-stone-400 mb-1">{chapterProgress.length}/18 read</div>
          {/* 18-cell grid (#31) */}
          <ChapterGrid progress={chapterProgress} />
        </div>
      </div>

      {/* Chapter of the day (#30) */}
      <div className="card mb-4 flex items-center gap-3 py-3"
        style={{ background: 'rgba(201,169,97,0.06)', border: '1px solid rgba(201,169,97,0.2)' }}>
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-dev font-bold text-base"
          style={{ background: chapterProgress.includes(chapterOfDay?.number) ? 'linear-gradient(135deg,#C9A961,#E8843C)' : 'rgba(45,53,97,0.10)', color: chapterProgress.includes(chapterOfDay?.number) ? 'white' : '#2D3561' }}>
          {chapterOfDay?.devanagari}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-bold text-[#C9A961] uppercase tracking-widest mb-0.5">Chapter of the Day</div>
          <div className="font-dev text-sm font-semibold text-[#1a1a2e] dark:text-white truncate">{chapterOfDay?.sanskrit_name}</div>
          <div className="text-[10px] text-stone-400 truncate">{chapterOfDay?.english_name}</div>
        </div>
        <BookOpen size={16} className="text-stone-300 flex-shrink-0" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 mb-5 overflow-x-auto" style={{ background: 'rgba(0,0,0,0.05)' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex-1 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              tab === t.id
                ? 'bg-white dark:bg-[#2D3561] text-[#1a1a2e] dark:text-white shadow-sm'
                : 'text-stone-400'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Chapters tab */}
      {tab === 'chapters' && (
        <>
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chapters…"
              className="w-full pl-9 pr-4 py-2.5 text-sm text-[#1a1a2e] dark:text-white placeholder-stone-400 bg-white dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-xl outline-none focus:border-[#E8843C] transition-colors" />
          </div>
          <div className="grid md:grid-cols-2 md:gap-3 gap-3">
            {filteredChapters.map((ch) => (
              <ChapterCard key={ch.number} chapter={ch}
                isRead={chapterProgress.includes(ch.number)}
                onMarkRead={markChapterRead}
                bookmarks={bookmarks}
                onToggleBookmark={toggleBookmark} />
            ))}
          </div>
        </>
      )}

      {/* Bookmarks tab (#28 personal notes) */}
      {tab === 'bookmarks' && (
        <>
          {bookmarkedShlokas.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">🔖</div>
              <p className="text-sm text-stone-400">Tap the bookmark icon on any shloka to save it here.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 md:gap-3 gap-3">
              {bookmarkedShlokas.map((s) => (
                <VerseCard key={s.id} shloka={s}
                  bookmarked
                  onToggleBookmark={toggleBookmark}
                  annotation={shlokaAnnotations[s.id] || ''}
                  onSaveAnnotation={saveShlokaAnnotation} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Reading plan tab (#27) */}
      {tab === 'plan' && (
        <ReadingPlan
          chapterProgress={chapterProgress}
          readingPlanStart={readingPlanStart}
          onSetStart={setReadingPlanStart} />
      )}

      {/* Ask Krishna tab (#29) */}
      {tab === 'ask' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(45,53,97,0.05)', border: '1px solid rgba(45,53,97,0.10)' }}>
            <p className="font-verse italic text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              "Type a struggle, a question, or tap a theme. Krishna will answer from the Gita."
            </p>
            {bookmarks.length < 5 && (
              <p className="text-xs text-stone-400 mt-2">
                Bookmark at least 5 shlokas to draw from your personal collection. Until then, the full Gita answers.
              </p>
            )}
          </div>
          <AskKrishna bookmarks={bookmarks} allShlokas={shlokas} />
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
