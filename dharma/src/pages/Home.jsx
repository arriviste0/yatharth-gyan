import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, Sparkles, Timer, LogIn, Check, Plus, Heart, Flame,
  Moon, Utensils, Dumbbell, ChevronRight, ArrowRight, Zap,
} from 'lucide-react';
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

const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const PILLAR_ICONS = {
  moon: Moon,
  bowl: Utensils,
  dumbbell: Dumbbell,
};

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

/* ── Circular Progress Ring ───────────────────────────────────────── */
function CircularProgress({ percentage, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="url(#progressGrad)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E8843C" />
          <stop offset="100%" stopColor="#C9A961" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Desktop-only Weekly Chart ─────────────────────────────────────── */
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
    <div className="card mb-4 hidden lg:block">
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

/* ── Pillar Category Card (mobile) ─────────────────────────────────── */
function PillarCategoryCard({ pillar, dayLog }) {
  const IconComp = PILLAR_ICONS[pillar.icon] || Zap;
  const dailyTargets = pillar.targets.filter((t) => t.frequency === 'daily' || !t.frequency);
  const doneCount = dailyTargets.filter((t) => dayLog[t.id]?.done).length;
  const totalCount = dailyTargets.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between min-h-[110px] transition-all active:scale-[0.97]"
      style={{
        background: `linear-gradient(145deg, ${pillar.color}18, ${pillar.color}08)`,
        border: `1px solid ${pillar.color}20`,
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${pillar.color}20` }}
        >
          <IconComp size={18} style={{ color: pillar.color }} />
        </div>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${pillar.color}15`, color: pillar.color }}
        >
          {pct}%
        </span>
      </div>
      <div className="mt-3">
        <h4 className="text-sm font-bold text-[#1a1a2e] dark:text-white">{pillar.english}</h4>
        <p className="text-[10px] text-stone-400 mt-0.5 font-medium">{doneCount}/{totalCount} completed</p>
      </div>
      {/* Mini progress bar */}
      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: `${pillar.color}15` }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pillar.color }}
        />
      </div>
    </div>
  );
}

/* ── Mobile Today View ─────────────────────────────────────────────── */
function MobileTodayView({ pillars, logs, logTarget, dateStr, streak, settings, onOpenFocus }) {
  const dayLog = logs[dateStr] || {};
  const activeTargets = useMemo(() =>
    pillars.flatMap((p) =>
      p.targets
        .filter((t) => t.frequency === 'daily' || !t.frequency)
        .map((t) => ({
          ...t,
          pillarName: p.english,
          pillarColor: p.color || '#E8843C',
          pillarIcon: p.icon,
          done: !!dayLog[t.id]?.done,
        }))
    ), [pillars, dayLog]
  );

  const completedCount = activeTargets.filter((t) => t.done).length;
  const totalCount = activeTargets.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount && totalCount > 0;

  // Separate done and pending
  const pendingTargets = activeTargets.filter((t) => !t.done);
  const doneTargets = activeTargets.filter((t) => t.done);

  return (
    <div className="block lg:hidden space-y-5 mb-5">

      {/* ── Hero Progress Card with Circular Ring ──────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6"
        style={{ background: 'linear-gradient(145deg, #1b1f3b 0%, #2a3158 50%, #3a4478 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #C9A961, transparent)' }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #E8843C, transparent)' }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A961]/70">
              Today's Progress
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1 leading-tight">
              {allDone ? 'All done! 🪷' : `${totalCount - completedCount} tasks remaining`}
            </h2>
            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
              {allDone
                ? 'Your practice blooms today — rest well.'
                : 'Tap each target to check it off.'
              }
            </p>

            {/* Streak + Stats Row */}
            <div className="flex items-center gap-3 mt-4">
              {!settings.silentMode && streak > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(232,132,60,0.15)' }}>
                  <Flame size={11} className="text-[#E8843C]" />
                  <span className="text-[10px] font-bold text-[#E8843C]">{streak}d streak</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(201,169,97,0.12)' }}>
                <Check size={10} className="text-[#C9A961]" />
                <span className="text-[10px] font-bold text-[#C9A961]">{completedCount} done</span>
              </div>
            </div>
          </div>

          {/* Circular Progress Ring */}
          <div className="relative flex items-center justify-center ml-4">
            <CircularProgress percentage={pct} size={100} strokeWidth={7} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-white tabular-nums">{pct}%</span>
              <span className="text-[9px] text-white/40 font-medium -mt-0.5">complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pillar Category Cards ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Your Pillars</span>
          <Link to="/sadhana" className="text-[10px] font-bold text-[#E8843C] flex items-center gap-0.5">
            View all <ChevronRight size={10} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {pillars.map((pillar) => (
            <PillarCategoryCard key={pillar.id} pillar={pillar} dayLog={dayLog} />
          ))}
        </div>
      </div>

      {/* ── Active Tasks Checklist ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
            {pendingTargets.length > 0 ? 'Pending Tasks' : 'Completed'}
          </span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: '#E8843C' }}>
            {completedCount}/{totalCount}
          </span>
        </div>

        <div className="space-y-2">
          {/* Pending targets first */}
          {pendingTargets.map((target) => {
            const Icon = PILLAR_ICONS[target.pillarIcon] || Zap;
            return (
              <button
                key={target.id}
                onClick={() => logTarget(dateStr, target.id, { done: true, timestamp: Date.now() })}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.97]
                  bg-white dark:bg-[#0f1428] border-black/5 dark:border-white/8
                  hover:border-[#E8843C]/25 hover:shadow-sm"
              >
                {/* Pillar icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${target.pillarColor}15` }}
                >
                  <Icon size={15} style={{ color: target.pillarColor }} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#1a1a2e] dark:text-white truncate">
                    {target.name}
                  </div>
                  <div className="text-[10px] text-stone-400 font-medium uppercase tracking-wide mt-0.5">
                    {target.pillarName}
                  </div>
                </div>

                {/* Checkbox circle */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all"
                  style={{ borderColor: `${target.pillarColor}30` }}
                >
                  <Plus size={12} style={{ color: target.pillarColor, opacity: 0.5 }} />
                </div>
              </button>
            );
          })}

          {/* Completed targets */}
          {doneTargets.map((target) => {
            const Icon = PILLAR_ICONS[target.pillarIcon] || Zap;
            return (
              <button
                key={target.id}
                onClick={() => logTarget(dateStr, target.id, { done: false, timestamp: Date.now() })}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.97]
                  bg-stone-50 dark:bg-white/[0.03] border-stone-100 dark:border-[#C9A961]/15"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(201,169,97,0.1)' }}
                >
                  <Icon size={15} style={{ color: target.pillarColor, opacity: 0.5 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-stone-400 dark:text-stone-500 line-through truncate">
                    {target.name}
                  </div>
                  <div className="text-[10px] text-stone-300 dark:text-stone-600 font-medium uppercase tracking-wide mt-0.5">
                    {target.pillarName}
                  </div>
                </div>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{ background: 'linear-gradient(135deg, #E8843C, #C9A961)' }}
                >
                  <Check size={13} color="white" strokeWidth={3} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Quick Access Banner ────────────────────────────────── */}
      <Link
        to="/drishti"
        className="flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, rgba(232,132,60,0.08), rgba(201,169,97,0.06))',
          border: '1px solid rgba(232,132,60,0.12)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(232,132,60,0.12)' }}
          >
            <Sparkles size={16} style={{ color: '#E8843C' }} />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-[#1a1a2e] dark:text-white">View Full Dashboard</h4>
            <p className="text-[10px] text-stone-400 mt-0.5">Monthly grid, health logs & analytics</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-[#E8843C] shrink-0" />
      </Link>
    </div>
  );
}

/* ── Practice Progress Card (Desktop) ─────────────────────────────── */
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
  const { state, toggleBookmark, logTarget } = useStorage();
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

      {/* ── Mobile Creative Today View (lg:hidden) ────────────── */}
      <MobileTodayView
        pillars={pillars}
        logs={logs}
        logTarget={logTarget}
        dateStr={today}
        streak={streak}
        settings={settings}
        onOpenFocus={onOpenFocus}
      />

      {/* ── Practice Progress Card (Desktop) ─────────────────── */}
      <div className="hidden lg:block">
        <PracticeProgressCard
          done={done}
          total={total}
          completion={completion}
          pillars={pillars}
          logs={logs}
        />
      </div>

      {/* ── Desktop-only Weekly Chart ────────────────────────────── */}
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

      {/* ── Dashboard Quick Access Banner (Desktop) ──────────────── */}
      <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 hidden lg:block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#1e2240] to-[#2d3561] p-4 sm:p-5 rounded-2xl text-white shadow-md">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A961]">Habit Matrix & Health</span>
            <h3 className="text-sm sm:text-base font-bold mt-0.5">Explore Detailed Monthly Tracker</h3>
            <p className="text-xs text-stone-300 mt-0.5">View your 31-day habit grid, water, protein & mood logs</p>
          </div>
          <Link
            to="/drishti"
            className="px-4 py-2 bg-[#E8843C] hover:bg-[#d4732b] text-white rounded-xl text-xs font-bold transition-all shadow-md text-center shrink-0"
          >
            Open Dashboard →
          </Link>
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}
