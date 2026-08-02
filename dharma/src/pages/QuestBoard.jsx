import React, { useState } from 'react';
import { Target, CheckCircle2, ShieldAlert, Plus, Zap, Calendar, Flame, AlertOctagon, Trophy, Sword } from 'lucide-react';
import { useSystemStats } from '../hooks/useSystemStats';
import LevelUpModal from '../components/LevelUpModal';

const STAT_BADGES = {
  mind: { label: 'MIND (ज्ञान)', color: '#A855F7', border: 'border-purple-500/40', bg: 'bg-purple-950/60' },
  health: { label: 'HEALTH (साधना)', color: '#10B981', border: 'border-emerald-500/40', bg: 'bg-emerald-950/60' },
  wealth: { label: 'WEALTH (धर्म)', color: '#F59E0B', border: 'border-amber-500/40', bg: 'bg-amber-950/60' },
  tapas: { label: 'TAPAS (तपस्)', color: '#00F0FF', border: 'border-cyan-500/40', bg: 'bg-cyan-950/60' },
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
      status: 'failed', // Penalty state!
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

  return (
    <div className="page-container page-transition">
      {system.levelUpData && (
        <LevelUpModal data={system.levelUpData} onClose={system.dismissLevelUp} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap sm:flex-nowrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-display font-extrabold text-[#00F0FF] tracking-widest uppercase px-2 py-0.5 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xs">
              SYSTEM QUEST BOARD
            </span>
            <span className="text-[11px] font-dev text-[#00F0FF]/70">साधना मण्डल</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-black text-white tracking-wider text-glow-cyan">
            QUEST BOARD & DUNGEONS
          </h1>
          <p className="text-xs text-white/60 font-sans mt-1">
            Execute daily quests, raid weekly dungeons, and defeat boss milestones to level up.
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 rounded-xs bg-[#0D1224] border border-white/10 mb-6">
        {[
          { id: 'daily', label: '⚔️ DAILY QUESTS', count: dailyQuests.length },
          { id: 'weekly', label: '🏰 WEEKLY DUNGEONS', count: weeklyQuests.length },
          { id: 'boss', label: '🐲 BOSS FIGHTS', count: bossQuests.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveCategory(t.id)}
            className={`flex-1 py-2.5 px-3 rounded-xs text-xs font-display font-bold transition-all ${
              activeCategory === t.id
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* ── PENALTY ZONE (Overdue Quests) ── */}
      {penaltyQuests.length > 0 && (
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-display font-bold text-[#FF4D4D] tracking-widest uppercase">
            <AlertOctagon size={16} className="animate-pulse" />
            [!] SYSTEM PENALTY ZONE — OVERDUE MISSED QUESTS
          </div>

          {penaltyQuests.map((q) => (
            <div key={q.id} className="hud-panel hud-panel-warning p-4 rounded-xs text-white space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-950 border border-red-500/50 text-[#FF4D4D] text-[10px] font-display font-bold rounded-xs">
                    FAILED / PENALTY
                  </span>
                  <h3 className="font-display font-bold text-sm text-[#FF4D4D]">{q.title}</h3>
                </div>
                <span className="font-display text-xs text-[#FF4D4D] font-bold">-100 MANA DEDUCTED</span>
              </div>
              <p className="text-xs text-white/70 font-sans">{q.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── QUEST CARDS LIST ── */}
      <div className="space-y-4">
        {activeCategory === 'daily' && dailyQuests.map(q => <QuestCard key={q.id} quest={q} onComplete={handleComplete} />)}
        {activeCategory === 'weekly' && weeklyQuests.map(q => <QuestCard key={q.id} quest={q} onComplete={handleComplete} />)}
        {activeCategory === 'boss' && bossQuests.map(q => <QuestCard key={q.id} quest={q} onComplete={handleComplete} />)}
      </div>
    </div>
  );
}

function QuestCard({ quest, onComplete }) {
  const isDone = quest.status === 'completed';
  const badge = STAT_BADGES[quest.statKey] || STAT_BADGES.mind;

  return (
    <div className={`hud-panel p-4 rounded-xs space-y-3 transition-all ${isDone ? 'opacity-60 border-emerald-500/40 bg-emerald-950/20' : 'hover:border-[#00F0FF]/50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[10px] font-display font-bold rounded-xs border ${badge.border} ${badge.bg}`} style={{ color: badge.color }}>
              {badge.label}
            </span>
            <span className="text-[10px] font-display text-white/40 uppercase tracking-wider">
              {quest.frequency} QUEST
            </span>
          </div>
          <h3 className={`font-display font-bold text-base ${isDone ? 'line-through text-emerald-300' : 'text-white'}`}>
            {quest.title}
          </h3>
          <p className="text-xs text-white/70 font-sans leading-relaxed">{quest.desc}</p>
        </div>

        <div className="text-right shrink-0">
          <span className="font-display font-black text-sm text-[#00F0FF] text-glow-cyan block">
            +{quest.xpReward} XP
          </span>
          <span className="text-[10px] font-sans text-white/50 block mt-0.5">
            REWARD
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-white/50 font-sans">
          <Calendar size={13} className="text-[#00F0FF]" />
          <span>DUE: {new Date(quest.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {!isDone ? (
          <button
            onClick={() => onComplete(quest.id)}
            className="btn-system-primary py-1.5 px-4 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} /> COMPLETE QUEST
          </button>
        ) : (
          <span className="text-xs font-display font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={14} /> QUEST CLEARED
          </span>
        )}
      </div>
    </div>
  );
}
