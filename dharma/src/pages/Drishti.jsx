import { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine,
} from 'recharts';
import { Trophy, CalendarDays, Timer, TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_PILLARS } from '../data/defaultPillars';
import { getLast90Days, getLast8Weeks, dateKey } from '../utils/dateUtils';
import {
  getCurrentStreak, getBestStreak, getPillarStreak,
  getDayCompletionRate, getTargetSuccessRate,
  getPhilosophicalInsight,
} from '../utils/streakUtils';
import BowArrowSVG from '../components/svgs/BowArrowSVG';
import ChakraSVG from '../components/svgs/ChakraSVG';

/* ── Shared stat card ─────────────────────────────────────────────── */
function StatCard({ value, label, sublabel, color = '#E8843C', icon = null, loading = false }) {
  if (loading) {
    return (
      <div className="card flex flex-col items-center text-center py-5 animate-pulse">
        <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-white/10 mb-2" />
        <div className="w-12 h-7 rounded-lg bg-stone-200 dark:bg-white/10 mb-1" />
        <div className="w-16 h-3 rounded bg-stone-100 dark:bg-white/5" />
      </div>
    );
  }
  return (
    <div className="card flex flex-col items-center text-center py-5">
      {icon && <div className="mb-2 opacity-70">{icon}</div>}
      <div className="text-3xl font-bold mb-0.5 tabular-nums" style={{ color }}>{value}</div>
      <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{label}</div>
      {sublabel && <div className="text-[11px] text-stone-400 mt-0.5">{sublabel}</div>}
    </div>
  );
}

/* ── Skeleton bar ─────────────────────────────────────────────────── */
function SkeletonBar() {
  return (
    <div className="card mb-4 animate-pulse">
      <div className="w-28 h-4 rounded bg-stone-200 dark:bg-white/10 mb-4" />
      <div className="flex items-end gap-2 h-24">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1 rounded-t bg-stone-200 dark:bg-white/10"
            style={{ height: `${30 + Math.random() * 60}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ── Heatmap cell ─────────────────────────────────────────────────── */
function HeatmapCell({ date, completion }) {
  const opacity = completion === 0 ? 0.09 : 0.2 + completion * 0.8;
  const color =
    completion >= 0.8 ? '#C9A961' :
      completion >= 0.5 ? '#E8843C' :
        completion > 0 ? '#5A8A8A' :
          '#D1C8B8';

  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString('default', { month: 'short' });

  return (
    <div
      className="heatmap-cell aspect-square rounded-sm"
      style={{ backgroundColor: color, opacity }}
      title={`${day} ${month}: ${Math.round(completion * 100)}%`}
    />
  );
}

/* ── Chart tooltips ───────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#0F1429] border border-stone-100 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg text-xs">
      <div className="text-stone-400 mb-0.5">{label}</div>
      <div className="font-semibold text-[#1a1a2e] dark:text-white">
        {typeof payload[0].value === 'number' && payload[0].value <= 1
          ? `${Math.round(payload[0].value * 100)}%`
          : payload[0].value}
      </div>
    </div>
  );
};

const NumericTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#0F1429] border border-stone-100 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg text-xs">
      <div className="text-stone-400 mb-0.5">{label}</div>
      <div className="font-semibold text-[#1a1a2e] dark:text-white">{payload[0].value}</div>
    </div>
  );
};

/* ── Week range label ─────────────────────────────────────────────── */
function weekRangeLabel(key) {
  const start = new Date(key);
  const end = new Date(key);
  end.setDate(end.getDate() + 6);
  const sm = start.toLocaleString('default', { month: 'short' });
  const em = end.toLocaleString('default', { month: 'short' });
  if (sm === em) return `${sm} ${start.getDate()}–${end.getDate()}`;
  return `${sm} ${start.getDate()} – ${em} ${end.getDate()}`;
}

/* ── Trend arrow — current/prev are 0-1 rates ─────────────────────── */
function TrendArrow({ current, prev, size = 14 }) {
  const delta = current - prev;
  /* Neutral if difference < 5 percentage points */
  if (Math.abs(delta) < 0.05) return <Minus size={size} className="text-stone-400" />;
  if (delta > 0) return <TrendingUp size={size} className="text-emerald-500" />;
  return <TrendingDown size={size} className="text-red-400" />;
}

/* ── Main page ────────────────────────────────────────────────────── */
export default function Drishti() {
  const { state } = useStorage();
  const pillars = state.pillars || DEFAULT_PILLARS;
  const { logs, settings, focusLog = [] } = state;

  /* Skeleton loading — 1 frame so charts mount with data */
  const [loading, setLoading] = useState(true);
  useEffect(() => { const id = requestAnimationFrame(() => setLoading(false)); return () => cancelAnimationFrame(id); }, []);

  /* Date range filter (#21) */
  const [heatmapRange, setHeatmapRange] = useState(90);

  const currentStreak = useMemo(() => getCurrentStreak(logs, pillars), [logs, pillars]);
  const bestStreak = useMemo(() => getBestStreak(logs, pillars), [logs, pillars]);
  const last90 = useMemo(() => getLast90Days(), []);
  const last8Weeks = useMemo(() => getLast8Weeks(), []);

  /* Total days ever logged */
  const totalActiveDays = useMemo(() =>
    Object.keys(logs).filter((d) => Object.values(logs[d] || {}).some((e) => e?.done)).length,
    [logs]
  );

  /* This-week average */
  const thisWeekAvg = useMemo(() => {
    const thisWeek = last8Weeks.slice(-1)[0];
    if (!thisWeek) return 0;
    let total = 0, count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(thisWeek.key);
      d.setDate(d.getDate() + i);
      const dk = dateKey(d);
      if (dk <= dateKey(new Date())) { total += getDayCompletionRate(logs, pillars, dk); count++; }
    }
    return count > 0 ? Math.round((total / count) * 100) : 0;
  }, [logs, pillars, last8Weeks]);

  /* Focus stats (#42) */
  const focusStats = useMemo(() => {
    const sessions = focusLog.length;
    const totalMins = focusLog.reduce((s, f) => s + (f.duration || 0), 0);
    const avgMins = sessions > 0 ? Math.round(totalMins / sessions) : 0;
    const thisWeekKey = last8Weeks.slice(-1)[0]?.key || '';
    const weekMins = focusLog.filter((s) => s.date >= thisWeekKey).reduce((s, f) => s + (f.duration || 0), 0);
    return { sessions, totalMins, avgMins, weekMins };
  }, [focusLog, last8Weeks]);

  /* Best day of week (#23) */
  const bestDayOfWeek = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = Array(7).fill(0);
    const counts = Array(7).fill(0);
    Object.keys(logs).forEach((dk) => {
      const rate = getDayCompletionRate(logs, pillars, dk);
      if (rate > 0) {
        const dow = new Date(dk).getDay();
        totals[dow] += rate; counts[dow]++;
      }
    });
    const avgs = totals.map((t, i) => counts[i] > 0 ? t / counts[i] : 0);
    const best = avgs.indexOf(Math.max(...avgs));
    return Math.max(...avgs) > 0 ? labels[best] : '—';
  }, [logs, pillars]);

  /* Month-over-month comparison (#25) */
  const monthComparison = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const avgForRange = (start, end) => {
      let total = 0, count = 0;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dk = dateKey(d);
        if (dk <= dateKey(now)) { total += getDayCompletionRate(logs, pillars, dk); count++; }
      }
      return count > 0 ? total / count : 0;
    };

    const thisRate = avgForRange(thisMonthStart, now);
    const lastRate = avgForRange(lastMonthStart, lastMonthEnd);
    const delta = lastRate > 0 ? Math.round((thisRate - lastRate) * 100) : null;
    return {
      thisMonth: Math.round(thisRate * 100),
      lastMonth: Math.round(lastRate * 100),
      thisRate, lastRate, delta,
    };
  }, [logs, pillars]);

  /* Heatmap data — respects range filter */
  const heatmapData = useMemo(() => {
    const days = last90.slice(90 - heatmapRange);
    return days.map((d) => ({ date: d, completion: getDayCompletionRate(logs, pillars, d) }));
  }, [logs, pillars, last90, heatmapRange]);

  /* Month label markers for heatmap (#20) */
  const heatmapMonthLabels = useMemo(() => {
    const cols = heatmapRange === 30 ? 5 : heatmapRange === 60 ? 9 : 13;
    const labels = [];
    let lastMonth = -1;
    heatmapData.forEach(({ date }, idx) => {
      const m = new Date(date).getMonth();
      if (m !== lastMonth) {
        labels.push({ idx, label: new Date(date).toLocaleString('default', { month: 'short' }) });
        lastMonth = m;
      }
    });
    return { labels, cols };
  }, [heatmapData, heatmapRange]);

  /* Weekly chart data with date ranges (#24) */
  const weeklyData = useMemo(() =>
    last8Weeks.map(({ key, label }) => {
      let total = 0, count = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(key); d.setDate(d.getDate() + i);
        const dk = dateKey(d);
        if (dk <= dateKey(new Date())) { total += getDayCompletionRate(logs, pillars, dk); count++; }
      }
      return { label, range: weekRangeLabel(key), value: count > 0 ? total / count : 0 };
    }),
    [logs, pillars, last8Weeks]
  );

  /* Per-pillar insights with trend arrows */
  const pillarInsights = useMemo(() => {
    return pillars.map((p) => {
      const streak = getPillarStreak(logs, p);
      const weeks = getLast8Weeks();
      const thisWeek = weeks.slice(-1)[0];
      const prevWeek = weeks.slice(-2)[0];
      const rate = (wk) => {
        if (!wk) return 0;
        let total = 0, count = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(wk.key); d.setDate(d.getDate() + i);
          const dk = dateKey(d);
          const dayLog = logs[dk] || {};
          const targets = p.targets.filter(t => t.frequency === 'daily' || !t.frequency);
          if (targets.length > 0) {
            total += targets.filter(t => dayLog[t.id]?.done).length / targets.length;
            count++;
          }
        }
        return count > 0 ? total / count : 0;
      };
      return { pillar: p, streak, currentRate: rate(thisWeek), prevRate: rate(prevWeek) };
    });
  }, [logs, pillars]);

  const targetRates = useMemo(() =>
    pillars.flatMap((p) =>
      p.targets.filter((t) => t.frequency === 'daily' || !t.frequency).map((t) => ({
        target: t, pillar: p, rate: getTargetSuccessRate(logs, t.id, 30),
      }))
    ).sort((a, b) => b.rate - a.rate),
    [logs, pillars]
  );

  /* Numeric target trends (last 30 days) */
  const numericTrends = useMemo(() => {
    const results = [];
    for (const p of pillars) {
      for (const t of p.targets) {
        if (t.type !== 'NUMBER') continue;
        const data = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(today); d.setDate(today.getDate() - i);
          const dk = dateKey(d);
          const entry = logs[dk]?.[t.id];
          if (entry?.value !== undefined && entry.value !== null) {
            data.push({
              day: dk.slice(5).replace('-', '/'),
              value: typeof entry.value === 'number' ? entry.value : parseFloat(entry.value) || 0,
            });
          }
        }
        if (data.length >= 2) results.push({ target: t, pillar: p, data });
      }
    }
    return results;
  }, [logs, pillars]);

  const { cols: heatmapCols, labels: monthLabels } = heatmapMonthLabels;

  return (
    <div className="page-container page-transition">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white">Dashboard</h1>
          <div className="text-sm text-stone-400">Your practice at a glance</div>
        </div>
        <div className="opacity-40">
          <ChakraSVG size={40} color="#C9A961" rotating />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

        {/* ── LEFT column ────────────────────────────────────────── */}
        <div>
          {/* 4 stat cards (#26 consistent icons) */}
          {!settings.silentMode && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard loading={loading} value={currentStreak} label="Streak" sublabel="days active"
                color="#E8843C" icon={<BowArrowSVG size={22} />} />
              <StatCard loading={loading} value={bestStreak} label="Best" sublabel="personal record"
                color="#C9A961" icon={<Trophy size={20} color="#C9A961" />} />
              <StatCard loading={loading} value={totalActiveDays} label="Total days" sublabel="ever logged"
                color="#5B6BAF" icon={<CalendarDays size={20} color="#5B6BAF" />} />
              <StatCard loading={loading}
                value={focusStats.weekMins > 0 ? `${focusStats.weekMins}m` : `${thisWeekAvg}%`}
                label={focusStats.weekMins > 0 ? 'Focus' : 'This week'}
                sublabel={focusStats.weekMins > 0 ? 'focused this week' : 'avg completion'}
                color="#5A8A8A"
                icon={focusStats.weekMins > 0 ? <Timer size={20} color="#5A8A8A" /> : <Flame size={20} color="#5A8A8A" />} />
            </div>
          )}

          {/* Month-over-month comparison (#25) */}
          {!settings.silentMode && monthComparison.delta !== null && (
            <div className="card mb-4">
              <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-3">Month-over-Month</div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <div className="text-xs text-stone-400 mb-1">Last month</div>
                  <div className="text-2xl font-bold text-stone-500 tabular-nums">{monthComparison.lastMonth}%</div>
                </div>
                <div className="flex flex-col items-center">
                  <TrendArrow current={monthComparison.thisRate} prev={monthComparison.lastRate} size={22} />
                  <div className={`text-xs font-semibold mt-1 tabular-nums ${monthComparison.delta > 0 ? 'text-emerald-500' :
                      monthComparison.delta < 0 ? 'text-red-400' : 'text-stone-400'
                    }`}>
                    {monthComparison.delta > 0 ? '+' : ''}{monthComparison.delta}%
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-xs text-stone-400 mb-1">This month</div>
                  <div className="text-2xl font-bold tabular-nums" style={{ color: '#E8843C' }}>{monthComparison.thisMonth}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Best day of week (#23) + weekly avg */}
          {!settings.silentMode && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="card text-center py-4">
                <div className="text-xs text-stone-400 mb-1">Best day of week</div>
                <div className="text-2xl font-bold" style={{ color: '#C9A961' }}>{bestDayOfWeek}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">historically</div>
              </div>
              <div className="card text-center py-4">
                <div className="text-xs text-stone-400 mb-1">This week</div>
                <div className="text-2xl font-bold" style={{ color: '#E8843C' }}>{thisWeekAvg}%</div>
                <div className="text-[10px] text-stone-400 mt-0.5">avg completion</div>
              </div>
            </div>
          )}

          {/* Weekly progress bars (#24 date ranges in tooltip) */}
          {loading ? <SkeletonBar /> : (
            <div className="card mb-4">
              <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-4">Weekly Progress</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weeklyData} barCategoryGap="30%">
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 1]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-[#0F1429] border border-stone-100 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg text-xs">
                          <div className="text-stone-400 mb-0.5">{d.range}</div>
                          <div className="font-semibold text-[#1a1a2e] dark:text-white">{Math.round(d.value * 100)}%</div>
                        </div>
                      );
                    }}
                    cursor={{ fill: 'transparent', stroke: 'none' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#E8843C" opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-pillar streaks with trend arrows (#22) */}
          {!settings.silentMode && (
            <div className="card mb-4">
              <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-3">By Pillar</div>
              <div className="space-y-2.5">
                {pillarInsights.map(({ pillar, streak, currentRate, prevRate }) => (
                  <div key={pillar.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pillar.color }} />
                    <div className="text-sm text-[#1a1a2e] dark:text-white flex-1 min-w-0 truncate">{pillar.english}</div>
                    <TrendArrow current={currentRate} prev={prevRate} size={13} />
                    <div className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: pillar.color }}>{streak}d</div>
                    <div className="w-20 h-1.5 rounded-full bg-stone-100 dark:bg-white/10 flex-shrink-0">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(streak / 30 * 100, 100)}%`, backgroundColor: pillar.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-pillar weekly bars */}
          {loading ? (
            <div className="space-y-4">
              {pillars.map((p) => <SkeletonBar key={p.id} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pillars.map((p) => {
                const data = last8Weeks.map(({ label, key }) => {
                  let total = 0, count = 0;
                  for (let i = 0; i < 7; i++) {
                    const d = new Date(key); d.setDate(d.getDate() + i);
                    const dk = dateKey(d);
                    const dayLog = logs[dk] || {};
                    const targets = p.targets.filter(t => t.frequency === 'daily' || !t.frequency);
                    if (targets.length > 0) {
                      total += targets.filter(t => dayLog[t.id]?.done).length / targets.length;
                      count++;
                    }
                  }
                  return { label, value: count > 0 ? total / count : 0 };
                });
                return (
                  <div key={p.id} className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{p.english}</div>
                      <div className="font-dev text-xs text-stone-400">{p.sanskrit}</div>
                    </div>
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={data} barCategoryGap="30%">
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 1]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent', stroke: 'none' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={p.color} opacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT column ───────────────────────────────────────── */}
        <div>
          {/* 90-day heatmap with range filter (#20 month labels, #21 range) */}
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{heatmapRange} Days</div>
              <div className="flex gap-1">
                {[30, 60, 90].map((r) => (
                  <button key={r} onClick={() => setHeatmapRange(r)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all ${heatmapRange === r
                        ? 'text-white'
                        : 'text-stone-400 bg-stone-100 dark:bg-white/5'
                      }`}
                    style={heatmapRange === r ? { background: '#E8843C' } : {}}>
                    {r}d
                  </button>
                ))}
              </div>
            </div>

            {/* Month labels row (#20) */}
            <div className="flex justify-between mb-1">
              {monthLabels.map(({ label }) => (
                <span key={label} className="text-[9px] text-stone-400 font-medium">{label}</span>
              ))}
            </div>

            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${heatmapCols}, 1fr)` }}>
              {heatmapData.map(({ date, completion }) => (
                <HeatmapCell key={date} date={date} completion={completion} />
              ))}
            </div>

            <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#C9A961' }} /> Complete
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#E8843C' }} /> Partial
              </div>
            </div>
          </div>

          {/* Focus stats section (#42) */}
          {focusStats.sessions > 0 && (
            <div className="card mb-4">
              <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-3">Focus Practice</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(232,132,60,0.07)' }}>
                  <div className="text-xl font-bold tabular-nums" style={{ color: '#E8843C' }}>{focusStats.sessions}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">sessions</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(45,53,97,0.07)' }}>
                  <div className="text-xl font-bold tabular-nums" style={{ color: '#5B6BAF' }}>{focusStats.totalMins}m</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">total</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(90,138,138,0.07)' }}>
                  <div className="text-xl font-bold tabular-nums" style={{ color: '#5A8A8A' }}>{focusStats.avgMins}m</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">avg/session</div>
                </div>
              </div>
            </div>
          )}

          {/* 30-day success rates */}
          {!settings.silentMode && targetRates.length > 0 && (
            <div className="card mb-4">
              <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-3">30-Day Success Rate</div>
              <div className="space-y-2.5">
                {targetRates.map(({ target, rate }) => (
                  <div key={target.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-stone-500 dark:text-stone-400 truncate pr-2">{target.name}</span>
                      <span className="text-xs font-semibold flex-shrink-0"
                        style={{ color: rate >= 0.8 ? '#C9A961' : rate >= 0.5 ? '#E8843C' : '#5A8A8A' }}>
                        {Math.round(rate * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-100 dark:bg-white/10">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${rate * 100}%`, backgroundColor: rate >= 0.8 ? '#C9A961' : rate >= 0.5 ? '#E8843C' : '#5A8A8A' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Numeric trends */}
          {numericTrends.length > 0 && (
            <>
              <div className="section-label mb-3">Numeric Trends</div>
              <div className="space-y-4">
                {numericTrends.map(({ target, pillar, data }) => {
                  const avg = data.reduce((s, d) => s + d.value, 0) / data.length;
                  return (
                    <div key={target.id} className="card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{target.name}</div>
                          <div className="text-[11px] text-stone-400">
                            avg {avg.toFixed(1)}{target.unit ? ` ${target.unit}` : ''} · last {data.length} entries
                          </div>
                        </div>
                        <div className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${pillar.color}18`, color: pillar.color }}>
                          {pillar.english}
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={100}>
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                          <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                          <YAxis hide />
                          <Tooltip content={<NumericTooltip />} cursor={{ fill: 'transparent', stroke: 'none' }} />
                          {target.targetValue && (
                            <ReferenceLine y={target.targetValue} stroke={pillar.color} strokeDasharray="4 3" strokeOpacity={0.4} />
                          )}
                          <Line type="monotone" dataKey="value" stroke={pillar.color} strokeWidth={2}
                            dot={{ r: 3, fill: pillar.color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Philosophical insights with trend arrows (#22) */}
          {pillarInsights.length > 0 && (
            <div className="card mt-4 dark:bg-white/3"
              style={{ background: 'rgba(45,53,97,0.04)', border: '1px solid rgba(45,53,97,0.10)' }}>
              <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-3">Insights</div>
              <div className="space-y-3">
                {pillarInsights.map(({ pillar, currentRate, prevRate }) => (
                  <div key={pillar.id} className="flex items-start gap-2">
                    <TrendArrow current={currentRate} prev={prevRate} size={14} />
                    <p className="font-verse text-sm text-stone-600 dark:text-stone-300 leading-relaxed flex-1">
                      {getPhilosophicalInsight(pillar, currentRate, prevRate)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="h-8" />
    </div>
  );
}
