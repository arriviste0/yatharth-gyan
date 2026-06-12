import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Sparkles, Timer, Target, Edit3, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../hooks/useStorage';
import { useDailyVerse, useDailyArjunaKrishna } from '../hooks/useDailyVerse';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import {
  formatDateDisplay, todayKey, isAfterElevenPM, dateKey,
} from '../utils/dateUtils';
import {
  getDayCompletionRate, getTodayCompletedCount, getCurrentStreak,
} from '../utils/streakUtils';
import PillarCard from '../components/PillarCard';
import CompletionRing from '../components/CompletionRing';
import VerseCard from '../components/VerseCard';
import NightInterstitial from '../components/NightInterstitial';
import DayCelebration from '../components/DayCelebration';
import ShankhaSVG from '../components/svgs/ShankhaSVG';
import MandalaBg from '../components/svgs/MandalaBg';
import ChariotSVG from '../components/svgs/ChariotSVG';

const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getGreeting(name) {
  const h = new Date().getHours();
  const base =
    h < 5  ? 'Still up' :
    h < 12 ? 'Good morning' :
    h < 17 ? 'Good afternoon' :
    h < 21 ? 'Good evening' :
    'Evening';
  return name ? `${base}, ${name}` : base;
}

/* ── Week at a Glance ─────────────────────────────────────────────── */
function WeekGlance({ logs, pillars }) {
  const [popover, setPopover] = useState(null);
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const rate = getDayCompletionRate(logs, pillars, key);
    const dayLog = logs[key] || {};
    const pillarDetails = pillars.map((p) => {
      const targets = p.targets.filter((t) => t.frequency === 'daily' || !t.frequency);
      const done = targets.filter((t) => dayLog[t.id]?.done).length;
      return { name: p.english, color: p.color, done, total: targets.length };
    }).filter((p) => p.total > 0);
    days.push({ key, label: WEEKDAY_SHORT[d.getDay()], rate, isToday: i === 0, pillarDetails });
  }

  return (
    <div className="card mb-4">
      <div className="section-label mb-3">This week</div>
      <div className="flex gap-1.5 justify-between">
        {days.map(({ key, label, rate, isToday, pillarDetails }) => {
          const bg =
            rate >= 0.8 ? '#C9A961' :
            rate >= 0.5 ? '#E8843C' :
            rate > 0    ? '#5A8A8A' :
            'transparent';
          const isOpen = popover === key;
          return (
            <div key={key} className="flex flex-col items-center gap-1.5 flex-1 relative">
              <button
                className="w-full aspect-square rounded-xl transition-all max-w-[52px] cursor-pointer"
                style={{
                  background: rate > 0 ? bg : 'rgba(0,0,0,0.06)',
                  opacity: isToday && rate === 0 ? 0.55 : rate > 0 ? 0.88 : 0.35,
                  boxShadow: isToday ? `0 0 0 2px #E8843C` : isOpen ? `0 0 0 2px ${bg}` : 'none',
                }}
                onClick={() => setPopover(isOpen ? null : key)}
                aria-label={`${label}: ${Math.round(rate * 100)}%`}
              />
              <span className="text-[10px] font-bold" style={{ color: isToday ? '#E8843C' : '#9CA3AF' }}>
                {label}
              </span>
              {isOpen && (
                <div
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 rounded-xl p-2.5 w-36 shadow-xl"
                  style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.08)' }}
                >
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                    {Math.round(rate * 100)}% complete
                  </p>
                  {pillarDetails.length === 0 ? (
                    <p className="text-[11px] text-stone-300 italic">No targets logged</p>
                  ) : pillarDetails.map((p) => (
                    <div key={p.name} className="flex items-center gap-1.5 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-[11px] text-stone-600 flex-1 truncate">{p.name}</span>
                      <span className="text-[10px] font-semibold" style={{ color: p.done === p.total ? '#C9A961' : p.color }}>
                        {p.done}/{p.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Today's Intention ────────────────────────────────────────────── */
function IntentionCard({ today, intention, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(intention || '');

  function commit() {
    onSave(today, draft.trim());
    setEditing(false);
  }

  return (
    <div className="card mb-4" style={{ borderLeft: '3px solid rgba(201,169,97,0.55)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Target size={12} style={{ color: '#C9A961' }} />
          <span className="section-label">Today's intention</span>
        </div>
        {intention && !editing && (
          <button
            onClick={() => { setDraft(intention); setEditing(true); }}
            className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-stone-500 transition-colors"
          >
            <Edit3 size={11} />
          </button>
        )}
      </div>
      {editing ? (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          placeholder="I will focus on…"
          autoFocus
          className="w-full text-sm bg-transparent outline-none text-[#1a1a2e] dark:text-white placeholder-stone-300 font-verse italic"
        />
      ) : intention ? (
        <button
          onClick={() => { setDraft(intention); setEditing(true); }}
          className="text-sm font-verse italic text-[#1a1a2e] dark:text-white text-left w-full leading-snug"
        >
          "{intention}"
        </button>
      ) : (
        <button onClick={() => setEditing(true)}
          className="text-sm text-stone-300 dark:text-stone-600 italic font-verse text-left">
          Set your intention for today…
        </button>
      )}
    </div>
  );
}

/* ── Profile header button ────────────────────────────────────────── */
function ProfileHeaderButton({ onOpenProfile }) {
  const { user } = useAuth();
  if (!user) {
    return (
      <button onClick={onOpenProfile}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-[#E8843C] transition-colors"
        style={{ background: 'rgba(0,0,0,0.04)' }} title="Sign in">
        <LogIn size={17} />
      </button>
    );
  }
  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <button onClick={onOpenProfile} title={user.name}
      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white transition-all hover:scale-105"
      style={{ background: user.avatarColor || '#E8843C' }}>
      {initials}
    </button>
  );
}

/* ── Main page ────────────────────────────────────────────────────── */
export default function Home({ onOpenFocus, onOpenProfile }) {
  const { state, logTarget, toggleBookmark, setIntention } = useStorage();
  const pillars = state.pillars || DEFAULT_PILLARS;
  const { logs, bookmarks, settings, intentions } = state;
  const dailyVerse    = useDailyVerse();
  const dailyDialogue = useDailyArjunaKrishna();

  const [showNight, setShowNight]       = useState(false);
  const [nightShown, setNightShown]     = useState(false);
  // Hero resets every session (sessionStorage, not state)
  const [showHero, setShowHero]         = useState(() => !sessionStorage.getItem('hero_hidden'));
  const [showCelebration, setShowCelebration] = useState(false);
  const prevDoneRef = useState(null);

  const today          = todayKey();
  const dateInfo       = formatDateDisplay(new Date());
  const { done, total } = getTodayCompletedCount(logs, pillars);
  const completion     = total > 0 ? done / total : 0;
  const streak         = getCurrentStreak(logs, pillars);
  const hour           = new Date().getHours();
  const todayIntention = intentions?.[today] || '';

  useEffect(() => {
    if (isAfterElevenPM() && !nightShown) {
      const key = `night_shown_${today}`;
      if (!sessionStorage.getItem(key)) {
        setShowNight(true);
        setNightShown(true);
        sessionStorage.setItem(key, '1');
      }
    }
  }, []);

  // Celebrate when all targets just became done (transition to 100%)
  useEffect(() => {
    const prev = prevDoneRef[0];
    if (done === total && total > 0 && prev !== null && prev < total) {
      const key = `celebrated_${today}`;
      if (!sessionStorage.getItem(key)) {
        setShowCelebration(true);
        sessionStorage.setItem(key, '1');
      }
    }
    prevDoneRef[0] = done;
  }, [done, total]);

  const isLateEvening   = hour >= 21;
  const endOfDayMessage =
    isLateEvening && done > 0
      ? `You stood on the battlefield ${done} of ${total} times today. Continue tomorrow.`
      : null;

  return (
    <div className="page-container page-transition">
      {showNight       && <NightInterstitial onClose={() => setShowNight(false)} />}
      {showCelebration && <DayCelebration onClose={() => setShowCelebration(false)} />}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-0.5">
            {dateInfo.dayEn} · {dateInfo.short}
          </p>
          <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white leading-tight">
            {getGreeting(settings.name)}
          </h1>
          {!settings.silentMode && streak > 0 && (
            <p className="text-xs text-stone-400 mt-0.5">
              <span style={{ color: '#E8843C' }} className="font-semibold">{streak} day</span> streak
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1">
          {completion >= 1 && total > 0 && <ShankhaSVG size={26} color="#C9A961" />}
          <button onClick={onOpenFocus}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-[#E8843C] transition-colors"
            style={{ background: 'rgba(0,0,0,0.04)' }} title="Focus Timer">
            <Timer size={17} />
          </button>
          <ProfileHeaderButton onOpenProfile={onOpenProfile} />
          <Link to="/settings"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            style={{ background: 'rgba(0,0,0,0.04)' }}>
            <Settings size={17} />
          </Link>
        </div>
      </div>

      {/* ── Hero banner ─────────────────────────────────────────── */}
      {showHero && (
        <div
          className="relative mb-4 rounded-2xl overflow-hidden cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #1e2240 0%, #2d3561 60%, #1a1a3e 100%)' }}
          onClick={() => { setShowHero(false); sessionStorage.setItem('hero_hidden', '1'); }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
            <MandalaBg size={300} color="#C9A961" opacity={1} />
          </div>
          <ChariotSVG className="w-full relative z-10 py-1" opacity={0.85} />
          <span className="absolute bottom-2 right-3 text-[10px] text-white/15 select-none">tap to hide</span>
        </div>
      )}

      {/* ── Desktop 2-col / Mobile single-col ───────────────────── */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-6 lg:items-start">

        {/* ── Left column (desktop 3/5) ────────────────────────── */}
        <div className="lg:col-span-3">
          <IntentionCard today={today} intention={todayIntention} onSave={setIntention} />
          <WeekGlance logs={logs} pillars={pillars} />

          {/* Verse of the Day */}
          {dailyVerse && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles size={13} style={{ color: '#E8843C' }} />
                <span className="section-label">Verse of the day</span>
              </div>
              <VerseCard
                shloka={dailyVerse}
                bookmarked={bookmarks.includes(dailyVerse.id)}
                onToggleBookmark={toggleBookmark}
              />
            </div>
          )}

          {/* Arjuna asks · Krishna answers */}
          {dailyDialogue && (
            <div className="card mb-4" style={{ borderLeft: '3px solid #E8843C' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">Arjuna asks · Krishna answers</p>
                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,132,60,0.1)', color: '#E8843C' }}>
                  BG {dailyDialogue.chapter}.{dailyDialogue.verse}
                </span>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl bg-black/3 dark:bg-white/4 p-3">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">The struggle</p>
                  <p className="font-verse italic text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    "{dailyDialogue.arjuna_struggle}"
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(232,132,60,0.06)', border: '1px solid rgba(232,132,60,0.15)' }}>
                  <p className="text-[10px] text-[#E8843C] uppercase tracking-widest mb-1">The answer</p>
                  <p className="font-verse text-sm text-[#1a1a2e] dark:text-stone-200 leading-relaxed">
                    {dailyDialogue.krishna_answer}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column (desktop 2/5) ───────────────────────── */}
        <div className="lg:col-span-2">
          {/* Completion ring */}
          <div className="card mb-4">
            <div className="flex items-center gap-4">
              <CompletionRing completion={completion} done={done} total={total} size={96} />
              <div className="flex-1">
                <p className="font-semibold text-base text-[#1a1a2e] dark:text-white mb-0.5">
                  {done === total && total > 0
                    ? 'All done for today'
                    : done === 0
                    ? 'Ready to begin'
                    : 'Keep going'}
                </p>
                <p className="text-xs text-stone-400 mb-2">
                  {done === total && total > 0
                    ? 'Every target met.'
                    : `${total - done} target${total - done !== 1 ? 's' : ''} remaining`}
                </p>
                {!settings.silentMode && completion >= 0.8 && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                    style={{ background: 'rgba(201,169,97,0.12)', color: '#C9A961' }}
                  >
                    🪷 Lotus blooms
                  </span>
                )}
              </div>
            </div>
            {endOfDayMessage && (
              <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                <p className="font-verse italic text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  "{endOfDayMessage}"
                </p>
                <p className="text-[11px] text-stone-300 dark:text-stone-600 mt-1 font-dev">
                  अभ्यासेन — continue tomorrow.
                </p>
              </div>
            )}
          </div>

          {/* Today's Practice */}
          <div className="mb-2">
            <p className="section-label mb-3">Today's practice</p>
            <div className="space-y-3">
              {pillars.map((pillar) => (
                <PillarCard
                  key={pillar.id}
                  pillar={pillar}
                  logs={logs}
                  onLog={(dateStr, targetId, entry) => logTarget(dateStr, targetId, entry)}
                  defaultExpanded={pillars.length <= 3}
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="h-6" />
    </div>
  );
}
