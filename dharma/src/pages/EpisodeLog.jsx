import React from 'react';
import { BookOpen, ChevronRight, Zap, Target, Award, Calendar, Sparkles, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const EPISODE_DATA = [
  {
    id: 'ep-1',
    number: 1,
    title: 'Episode 1: The Awakening & System Initialization',
    date: 'August 1, 2026',
    desc: 'The Seeker initializes the System interface. Building morning discipline, establishing mind-body alignment, and conquering the initial 7-day streak.',
    statGains: { mind: '+2 PTS', health: '+1 PTS', wealth: '+1 PTS' },
    linkedQuest: 'Morning Meditation & Pranayama',
    linkedQuestId: 'q-1',
    bossName: 'Initial Inertia Boss Cleared',
    xpEarned: 1250,
  },
  {
    id: 'ep-2',
    number: 2,
    title: 'Episode 2: Sankhya Yoga & Mental Fortitude',
    date: 'August 2, 2026',
    desc: 'Deep study of Bhagavad Gita Chapter 2. Learning the doctrine of non-attachment (Karma Yoga) and converting mental friction into focused energy.',
    statGains: { mind: '+3 PTS', health: '+0 PTS', wealth: '+2 PTS' },
    linkedQuest: 'WEEKLY DUNGEON: Read 3 Chapters of Gita',
    linkedQuestId: 'q-5',
    bossName: 'Distraction Demon Defeated',
    xpEarned: 1800,
  },
  {
    id: 'ep-3',
    number: 3,
    title: 'Episode 3: The Tapas Ritual & Physical Conditioning',
    date: 'August 3, 2026',
    desc: 'Physical discipline peak. Pushing through exhaustion, completing 50 pushups challenge, and locking in hydration targets.',
    statGains: { mind: '+1 PTS', health: '+4 PTS', wealth: '+1 PTS' },
    linkedQuest: 'Physical Conditioning (Strength Training)',
    linkedQuestId: 'q-2',
    bossName: 'Lethargy Titan Overcome',
    xpEarned: 2100,
  },
];

export default function EpisodeLog() {
  return (
    <div className="page-container page-transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap sm:flex-nowrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-display font-extrabold text-[#00F0FF] tracking-widest uppercase px-2 py-0.5 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xs">
              SYSTEM CHRONICLES
            </span>
            <span className="text-[11px] font-dev text-[#00F0FF]/70">मनन गाथा</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-black text-white tracking-wider text-glow-cyan">
            EPISODE LOG & QUEST ARCHIVE
          </h1>
          <p className="text-xs text-white/60 font-sans mt-1">
            Chronological records of content episodes, stat evolution snapshots, and linked quest battles.
          </p>
        </div>
      </div>

      {/* Episode Timeline Feed */}
      <div className="space-y-6">
        {EPISODE_DATA.map((ep) => (
          <div key={ep.id} className="hud-panel hud-brackets p-5 rounded-xs space-y-4 text-white hover:border-[#00F0FF]/60 transition-all">
            
            {/* Episode Header */}
            <div className="flex items-start justify-between border-b border-[#00F0FF]/20 pb-3 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-display font-extrabold rounded-xs">
                    EPISODE 0{ep.number}
                  </span>
                  <span className="text-xs text-white/50 font-sans">{ep.date}</span>
                </div>
                <h2 className="font-display font-bold text-lg text-white mt-1">
                  {ep.title}
                </h2>
              </div>

              <div className="text-right">
                <span className="font-display font-extrabold text-sm text-[#A855F7]">
                  +{ep.xpEarned} XP GAINED
                </span>
              </div>
            </div>

            {/* Episode Description */}
            <p className="text-xs text-white/80 font-sans leading-relaxed">
              {ep.desc}
            </p>

            {/* Stat Snapshot Pills */}
            <div className="flex items-center gap-3 flex-wrap pt-1">
              <span className="text-[10px] font-display font-bold text-white/50 uppercase">STAT SNAPSHOT:</span>
              <span className="px-2.5 py-1 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-display font-bold rounded-xs">
                MIND {ep.statGains.mind}
              </span>
              <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-display font-bold rounded-xs">
                HEALTH {ep.statGains.health}
              </span>
              <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-display font-bold rounded-xs">
                WEALTH {ep.statGains.wealth}
              </span>
            </div>

            {/* Linked Quest & Boss Fight Bridges */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3 flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-[#00F0FF]" />
                <span className="text-white/60">LINKED QUEST:</span>
                <Link to="/quests" className="font-display font-bold text-[#00F0FF] hover:underline">
                  {ep.linkedQuest}
                </Link>
              </div>

              <div className="flex items-center gap-1.5 text-amber-400 font-display font-bold">
                <Award size={14} />
                <span>{ep.bossName}</span>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
