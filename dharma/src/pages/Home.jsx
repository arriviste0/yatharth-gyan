import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Sparkles, Timer, LogIn } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../hooks/useStorage';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import {
  formatDateDisplay, todayKey, isAfterElevenPM, dateKey,
} from '../utils/dateUtils';
import {
  getDayCompletionRate, getTodayCompletedCount, getCurrentStreak,
} from '../utils/streakUtils';
import VerseCard from '../components/VerseCard';
import NightInterstitial from '../components/NightInterstitial';
import DayCelebration from '../components/DayCelebration';
import ShankhaSVG from '../components/svgs/ShankhaSVG';
import MonthlyTracker from '../components/MonthlyTracker';

const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getGreeting(name) {
  const h = new Date().getHours();
  const base =
    h < 5 ? 'Still up' :
      h < 12 ? 'Good morning' :
        h < 17 ? 'Good afternoon' :
          h < 21 ? 'Good evening' :
            'Evening';
  return name ? `${base}, ${name}` : base;
}

/* ── Week Bar Chart ───────────────────────────────────────────────── */
function WeekBarChart({ logs, pillars }) {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const rate = getDayCompletionRate(logs, pillars, key);
    days.push({ key, label: WEEKDAY_SHORT[d.getDay()], rate, isToday: i === 0 });
  }

  const totalTargets = pillars.reduce((s, p) =>
    s + p.targets.filter((t) => t.frequency === 'daily' || !t.frequency).length, 0);

  const completedThisWeek = days.reduce((s, day) => {
    const dayLog = logs[day.key] || {};
    return s + pillars.reduce((ps, p) =>
      ps + p.targets.filter(
        (t) => (t.frequency === 'daily' || !t.frequency) && dayLog[t.id]?.done
      ).length
      , 0);
  }, 0);

  return (
    <div className="card mb-4">
      <div className="section-label mb-3">Completed in the last 7 days</div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={days} barCategoryGap="25%" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 1]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white dark:bg-[#0F1429] border border-stone-100 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg text-xs">
                  <div className="font-semibold text-[#1a1a2e] dark:text-white">
                    {Math.round(d.rate * 100)}%
                  </div>
                </div>
              );
            }}
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          />
          <Bar dataKey="rate" radius={[5, 5, 0, 0]}>
            {days.map((d) => (
              <Cell
                key={d.key}
                fill={
                  d.rate >= 0.8 ? '#C9A961' :
                    d.rate >= 0.5 ? '#E8843C' :
                      d.rate > 0 ? '#5A8A8A' :
                        '#E5E7EB'
                }
                className="dark:[&]:fill-stone-700"
                opacity={d.isToday ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-3 pt-2 border-t border-black/5 dark:border-white/5 mt-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold" style={{ color: '#E8843C' }}>{completedThisWeek}</span>
          <span className="text-xs text-stone-400">done this week</span>
        </div>
        <div className="w-px h-3 bg-black/10 dark:bg-white/10" />
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold" style={{ color: '#5B6BAF' }}>{totalTargets}</span>
          <span className="text-xs text-stone-400">Targets</span>
        </div>
        <div className="w-px h-3 bg-black/10 dark:bg-white/10" />
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-stone-500">{pillars.length}</span>
          <span className="text-xs text-stone-400">Pillars</span>
        </div>
      </div>
    </div>
  );
}

/* ── Practice Progress Card ───────────────────────────────────────── */
function PracticeProgressCard({ done, total, completion, pillars, logs }) {
  const today = todayKey();
  const dayLog = logs[today] || {};
  const hour = new Date().getHours();
  const isLateEvening = hour >= 21;

  const incompleteTargets = pillars.flatMap((p) =>
    p.targets
      .filter((t) => (t.frequency === 'daily' || !t.frequency) && !dayLog[t.id]?.done)
      .map((t) => ({ ...t, pillarColor: p.color }))
  ).slice(0, 3);

  const pct = Math.round(completion * 100);

  return (
    <div
      className="relative mb-4 rounded-2xl overflow-hidden p-5"
      style={{ background: 'linear-gradient(135deg, #1e2240 0%, #2d3561 55%, #3d4880 100%)' }}
    >
      {/* Decorative rings */}
      <div
        className="absolute pointer-events-none"
        style={{ right: '-28px', top: '-28px', width: '140px', height: '140px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.07)' }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ right: '4px', top: '48px', width: '80px', height: '80px', borderRadius: '50%', border: '2px solid rgba(201,169,97,0.09)' }}
      />

      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Today's practice progress
        </p>
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-4xl font-bold text-white tabular-nums">{done}/{total}</span>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: pct >= 100 ? '#C9A961' : pct >= 50 ? '#F0A060' : 'rgba(255,255,255,0.65)' }}
          >
            {pct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct >= 100 ? 'linear-gradient(90deg,#C9A961,#DFC07A)' :
                pct >= 50 ? 'linear-gradient(90deg,#E8843C,#F0A060)' :
                  'linear-gradient(90deg,#5B6BAF,#7A8BC0)',
            }}
          />
        </div>

        {done === total && total > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">🪷</span>
            <span className="text-sm font-semibold text-white">All done — lotus blooms</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {incompleteTargets.map((t) => (
              <span
                key={t.id}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full truncate max-w-[150px]"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
              >
                {t.name}
              </span>
            ))}
            {total - done > 3 && (
              <span
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
              >
                +{total - done - 3} more
              </span>
            )}
          </div>
        )}

        {isLateEvening && done > 0 && (
          <p className="mt-3 pt-3 text-[11px] font-verse italic" style={{ color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            "{done} of {total} stands on the battlefield today."
          </p>
        )}
      </div>
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
  if (user.avatarPhoto) {
    return (
      <button onClick={onOpenProfile} title={user.name}
        className="w-9 h-9 rounded-full overflow-hidden transition-all hover:scale-105">
        <img src={user.avatarPhoto} alt={user.name} className="w-full h-full object-cover" />
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
  const { state, toggleBookmark } = useStorage();
  const pillars = state.pillars || DEFAULT_PILLARS;
  const { logs, bookmarks, settings } = state;
  const dailyVerse = useDailyVerse();

  const [showNight, setShowNight] = useState(false);
  const [nightShown, setNightShown] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevDoneRef = useState(null);

  const today = todayKey();
  const dateInfo = formatDateDisplay(new Date());
  const { done, total } = getTodayCompletedCount(logs, pillars);
  const completion = total > 0 ? done / total : 0;
  const streak = getCurrentStreak(logs, pillars);

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

  return (
    <div className="page-container page-transition">
      {showNight && <NightInterstitial onClose={() => setShowNight(false)} />}
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

      {/* ── Practice Progress Card (full-width) ─────────────────── */}
      <PracticeProgressCard
        done={done}
        total={total}
        completion={completion}
        pillars={pillars}
        logs={logs}
      />

      {/* ── Weekly Chart (dashboard) ────────────────────────────── */}
      <WeekBarChart logs={logs} pillars={pillars} />

      {/* ── Verse of the Day ────────────────────────────────────── */}
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

      {/* ── Monthly Habit Tracker (dashboard) ───────────────────── */}
      <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5">
        <MonthlyTracker />
      </div>

      <div className="h-6" />
    </div>
  );
}
