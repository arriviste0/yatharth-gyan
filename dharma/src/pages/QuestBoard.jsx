import React, { useState } from 'react';
import { Target, CheckCircle2, ShieldAlert, Plus, Zap, Calendar, Flame, AlertOctagon, Trophy, Sword } from 'lucide-react';
import { useSystemStats } from '../hooks/useSystemStats';
import LevelUpModal from '../components/LevelUpModal';

const STAT_BADGES = {
  mind: { label: 'MIND (ज्ञान)', color: '#A855F7', bg: 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300' },
  health: { label: 'HEALTH (साधना)', color: '#10B981', bg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300' },
  wealth: { label: 'WEALTH (धर्म)', color: '#F59E0B', bg: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' },
  tapas: { label: 'TAPAS (तपस्)', color: '#3B82F6', bg: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300' },
};

export default function QuestBoard() {
  const system = useSystemStats();
  const [activeCategory, setActiveCategory] = useState('daily');

  const [quests, setQuests] = useState([
    {
      id: 'q-1',
      title: 'Morning Meditation & Pranayama',
      desc: 'Complete 20 minutes of breathwork before sunrise.',
      statKey: 'mind',
      xpReward: 300,
      frequency: 'daily',
      status: 'active',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'q-2',
      title: 'Physical Conditioning (Strength Training)',
      desc: 'Complete 45 minutes of heavy push-pull workout routine.',
      statKey: 'health',
      xpReward: 350,
      frequency: 'daily',
      status: 'active',
      dueDate: new Date(Date.now() + 43200000).toISOString(),
    },
    {
      id: 'q-3',
      title: 'Financial Audit & System Optimization',
      desc: 'Review portfolio allocation & complete daily budget review.',
      statKey: 'wealth',
      xpReward: 250,
      frequency: 'daily',
      status: 'active',
      dueDate: new Date(Date.now() + 172800000).toISOString(),
    },
    {
      id: 'q-4',
      title: 'MISSED QUEST: 10k Steps Walk Challenge',
      desc: 'Deadline passed 24h ago without verification.',
      statKey: 'health',
      xpReward: 200,
      frequency: 'daily',
      status: 'failed',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'q-5',
      title: 'WEEKLY DUNGEON: Read 3 Chapters of Gita',
      desc: 'Analyze Sankhya Yoga & Karma Yoga with reflective notes.',
      statKey: 'mind',
      xpReward: 750,
      frequency: 'weekly',
      status: 'active',
      dueDate: new Date(Date.now() + 500000000).toISOString(),
    },
    {
      id: 'q-6',
      title: 'BOSS FIGHT: 7-Day Continuous Streak Challenge',
      desc: 'Maintain 100% daily quest completion rate for 7 consecutive days.',
      statKey: 'tapas',
      xpReward: 1500,
      frequency: 'boss',
      status: 'active',
      dueDate: new Date(Date.now() + 700000000).toISOString(),
    },
  ]);

  function handleComplete(id) {
    const targetQuest = quests.find(q => q.id === id);
    if (!targetQuest) return;

    setQuests(quests.map(q => q.id === id ? { ...q, status: 'completed' } : q));
    system.addXp(targetQuest.xpReward, targetQuest.statKey);
  }

  const dailyQuests = quests.filter(q => q.frequency === 'daily' && q.status !== 'failed');
  const penaltyQuests = quests.filter(q => q.status === 'failed');
  const weeklyQuests = quests.filter(q => q.frequency === 'weekly');
  const bossQuests = quests.filter(q => q.frequency === 'boss');

  const visibleQuests = activeCategory === 'daily' ? dailyQuests
    : activeCategory === 'weekly' ? weeklyQuests
    : bossQuests;

  return (
    <div className="page-container page-transition space-y-6">
      {system.levelUpData && (
        <LevelUpModal data={system.levelUpData} onClose={system.dismissLevelUp} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold text-stone-700 dark:text-stone-300 tracking-wider uppercase px-2.5 py-0.5 bg-stone-200 dark:bg-white/10 rounded-full">
              Quest Board
            </span>
            <span className="text-xs font-dev text-stone-500">साधना मण्डल</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            Quest Board & Dungeons
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Execute daily quests, raid weekly dungeons, and defeat boss milestones to level up.
          </p>
        </div>
      </div>

      {/* Section Tabs (Reference Pill Style) */}
      <div className="flex gap-2 p-1.5 rounded-full bg-stone-100 dark:bg-white/5">
        {[
          { id: 'daily', label: '⚔️ Daily Quests', count: dailyQuests.length },
          { id: 'weekly', label: '🏰 Weekly Dungeons', count: weeklyQuests.length },
          { id: 'boss', label: '🐲 Boss Fights', count: bossQuests.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveCategory(t.id)}
            className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold transition-all ${
              activeCategory === t.id
                ? 'bg-[#18191E] text-white dark:bg-[#00F0FF] dark:text-[#080C18] shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* ── PENALTY ZONE (Overdue Quests) ── */}
      {penaltyQuests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">
            <AlertOctagon size={16} className="animate-pulse" />
            Penalty Zone — Overdue Missed Quests
          </div>

          {penaltyQuests.map((q) => (
            <div key={q.id} className="card-ref p-5 border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 text-[10px] font-extrabold rounded-full">
                    FAILED / PENALTY
                  </span>
                  <h3 className="font-extrabold text-sm text-red-700 dark:text-red-400">{q.title}</h3>
                </div>
                <span className="text-xs text-red-600 dark:text-red-400 font-extrabold">-100 MANA DEDUCTED</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">{q.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── ACTIVE QUEST CARDS ── */}
      <div className="space-y-4">
        {visibleQuests.map((q) => {
          const badge = STAT_BADGES[q.statKey] || STAT_BADGES.mind;
          const isCompleted = q.status === 'completed';

          return (
            <div
              key={q.id}
              className={`card-ref p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCompleted ? 'opacity-60 bg-stone-50 dark:bg-white/[0.02]' : ''
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs font-extrabold text-[#855B14] bg-[#FEF3D6] px-2.5 py-0.5 rounded-full">
                    +{q.xpReward} XP
                  </span>
                </div>
                <h3 className={`text-base font-extrabold ${isCompleted ? 'line-through text-stone-400' : 'text-stone-900 dark:text-white'}`}>
                  {q.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  {q.desc}
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-stone-100 dark:border-white/5">
                <div className="text-xs text-stone-400 font-medium flex items-center gap-1">
                  <Calendar size={14} /> Due: {new Date(q.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <button
                  disabled={isCompleted}
                  onClick={() => handleComplete(q.id)}
                  className={`btn-pill-dark text-xs px-5 py-2.5 ${
                    isCompleted ? 'bg-stone-200 text-stone-500 cursor-not-allowed shadow-none' : ''
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={14} /> Quest Cleared
                    </>
                  ) : (
                    <>
                      <Sword size={14} /> Complete Quest
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
