import { useState } from 'react';
import { ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Share2, Check, PenLine } from 'lucide-react';

export default function VerseCard({
  shloka,
  bookmarked = false,
  onToggleBookmark,
  compact = false,
  annotation = '',
  onSaveAnnotation = null,
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [showHindi, setShowHindi] = useState(false);
  const [noteText,  setNoteText]  = useState(annotation);
  const [noteSaved, setNoteSaved] = useState(false);

  if (!shloka) return null;

  async function handleShare() {
    const text = `"${shloka.english}"\n— Bhagavad Gita ${shloka.chapter}.${shloka.verse}`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  function saveNote() {
    onSaveAnnotation?.(shloka.id, noteText);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1500);
  }

  return (
    <div className="card" style={{ borderLeft: '3px solid rgba(201,169,97,0.4)' }}>
      {/* Sanskrit */}
      <div className="verse-sanskrit text-center leading-loose mb-3 px-2 text-sm">
        {shloka.sanskrit}
      </div>

      {/* Hindi transliteration toggle (#32) */}
      {shloka.hindi && (
        <button onClick={() => setShowHindi(!showHindi)}
          className="w-full text-[10px] text-stone-400 mb-2 hover:text-stone-500 transition-colors text-left pl-1">
          {showHindi ? '▲ hide hindi' : '▼ हिन्दी अनुवाद'}
        </button>
      )}
      {showHindi && shloka.hindi && (
        <p className="font-verse text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-3 px-1 italic">
          {shloka.hindi}
        </p>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(201,169,97,0.12)', color: '#C9A961' }}>
            BG {shloka.chapter}.{shloka.verse}
          </span>
          {shloka.theme && (
            <span className="text-[10px] text-stone-400 italic truncate max-w-[120px]">{shloka.theme}</span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={handleShare}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: copied ? '#C9A961' : '#D1D5DB' }} title="Copy / Share">
            {copied ? <Check size={13} /> : <Share2 size={13} />}
          </button>
          {onToggleBookmark && (
            <button onClick={() => onToggleBookmark(shloka.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: bookmarked ? '#C9A961' : '#D1D5DB' }}>
              {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-stone-500 dark:hover:text-stone-300 transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {!compact && (
        <p className="font-verse italic text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          "{shloka.english}"
        </p>
      )}

      {expanded && (
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 space-y-3 page-transition">
          {shloka.arjuna_struggle && (
            <>
              <div className="rounded-xl bg-black/3 dark:bg-white/4 p-3">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5">Arjuna's question</p>
                <p className="font-verse italic text-sm text-stone-600 dark:text-stone-300">
                  "{shloka.arjuna_struggle}"
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(232,132,60,0.06)', border: '1px solid rgba(232,132,60,0.15)' }}>
                <p className="text-[10px] font-semibold text-[#E8843C] uppercase tracking-widest mb-1.5">Krishna's answer</p>
                <p className="font-verse text-sm text-[#1a1a2e] dark:text-stone-200 leading-relaxed">
                  {shloka.krishna_answer}
                </p>
              </div>
            </>
          )}

          {/* Personal note (#28) */}
          {onSaveAnnotation && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
                <PenLine size={10} /> My Note
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Your personal reflection on this shloka…"
                rows={2}
                className="w-full text-xs text-[#1a1a2e] dark:text-white placeholder-stone-400 bg-white dark:bg-white/8 border border-black/8 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:border-[#C9A961] transition-colors resize-none font-verse leading-relaxed"
              />
              <div className="flex justify-end">
                <button onClick={saveNote}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{ color: noteSaved ? '#C9A961' : 'white', background: noteSaved ? 'rgba(201,169,97,0.12)' : 'linear-gradient(135deg,#C9A961,#E8843C)' }}>
                  {noteSaved ? '✓ Saved' : 'Save note'}
                </button>
              </div>
            </div>
          )}
          {/* Show saved note read-only when no edit handler */}
          {!onSaveAnnotation && annotation && (
            <div className="rounded-xl bg-black/2 dark:bg-white/3 p-3">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">My Note</p>
              <p className="font-verse text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{annotation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
