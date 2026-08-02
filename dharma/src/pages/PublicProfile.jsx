import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2, Shield, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import RankBadge from '../components/RankBadge';

export default function PublicProfile() {
  const { username } = useParams();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  // Mock / public player data
  const player = {
    name: username ? username.toUpperCase() : 'PARTH_SEEKER',
    level: 42,
    rank: 'A',
    title: 'Shadow Master',
    titleDev: 'तपोनिष्ठ ज्ञानी',
    xp: 2850,
    xpReq: 3500,
    stats: [
      { name: 'Mind / Wisdom', val: 54, color: '#A855F7', dev: 'ज्ञान' },
      { name: 'Health / Fitness', val: 48, color: '#10B981', dev: 'साधना' },
      { name: 'Wealth / Mastery', val: 42, color: '#F59E0B', dev: 'धर्म' },
    ],
    achievements: ['7-Day Streak Master', 'Gita Chapter 2 Unlocked', 'S-Rank Prelude'],
  };

  const pct = Math.round((player.xp / player.xpReq) * 100);

  function handleShareDownload() {
    setDownloading(true);
    setTimeout(() => {
      // Create a canvas-based download for 1080x1350 portrait image
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      // Draw Navy System Background
      ctx.fillStyle = '#0B0E1A';
      ctx.fillRect(0, 0, 1080, 1350);

      // Draw Neon Border
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 8;
      ctx.strokeRect(30, 30, 1020, 1290);

      // Draw Title Header
      ctx.fillStyle = '#00F0FF';
      ctx.font = '900 48px Orbitron, sans-serif';
      ctx.fillText('ASCEND SYSTEM STATUS CARD', 80, 120);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 64px Orbitron, sans-serif';
      ctx.fillText(`PLAYER: ${player.name}`, 80, 220);

      ctx.fillStyle = '#A855F7';
      ctx.font = '700 36px Orbitron, sans-serif';
      ctx.fillText(`LEVEL ${player.level} — RANK ${player.rank} [${player.title}]`, 80, 290);

      // Draw Stat Bars
      let y = 420;
      player.stats.forEach((st) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 32px Orbitron, sans-serif';
        ctx.fillText(`${st.name.toUpperCase()} (LV. ${st.val})`, 80, y);

        // Bar Container
        ctx.fillStyle = '#080C18';
        ctx.fillRect(80, y + 20, 920, 40);

        // Bar Fill
        ctx.fillStyle = st.color;
        ctx.fillRect(80, y + 20, (st.val / 100) * 920, 40);

        y += 140;
      });

      // Footer
      ctx.fillStyle = '#00F0FF';
      ctx.font = '600 28px Orbitron, sans-serif';
      ctx.fillText('Yatharth Gyan · ASCEND Real-Life Stat Tracker', 80, 1260);

      const link = document.createElement('a');
      link.download = `ASCEND_Status_${player.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloading(false);
    }, 400);
  }

  return (
    <div className="page-container page-transition flex flex-col items-center">
      {/* Action Bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6">
        <span className="text-xs font-display font-bold text-[#00F0FF] uppercase tracking-widest">
          PUBLIC CHARACTER SHEET (READ-ONLY)
        </span>
        <button
          onClick={handleShareDownload}
          disabled={downloading}
          className="btn-system-primary text-xs flex items-center gap-2 py-2 px-4 shadow-lg uppercase tracking-wider"
        >
          <Share2 size={14} /> {downloading ? 'GENERATING IMAGE…' : 'SHARE STATUS CARD (1080x1350)'}
        </button>
      </div>

      {/* 1080x1350 Aspect Ratio Social Media Ready Card */}
      <div
        ref={cardRef}
        className="w-full max-w-lg hud-panel hud-brackets p-6 text-white space-y-6 rounded-xs border-2 border-[#00F0FF]/40 shadow-[0_0_40px_rgba(0,240,255,0.2)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#00F0FF]/25 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-display font-extrabold text-[#00F0FF] tracking-widest uppercase px-2 py-0.5 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xs">
                PLAYER PROFILE
              </span>
              <span className="text-[11px] font-dev text-[#00F0FF]/70">आत्म विवरण</span>
            </div>
            <h1 className="text-2xl font-display font-black tracking-wider text-white">
              {player.name}
            </h1>
            <p className="text-xs text-white/60 font-sans">
              TITLE: <span className="text-[#A855F7] font-semibold">{player.title}</span> <span className="font-dev text-purple-300/80">({player.titleDev})</span>
            </p>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <RankBadge rank={player.rank} size="lg" />
            <div className="font-display font-black text-3xl text-glow-cyan">
              LV. {player.level}
            </div>
          </div>
        </div>

        {/* Capacity XP Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-display">
            <span className="text-white/70 tracking-wider">OVERALL CAPACITY EXP</span>
            <span className="text-[#00F0FF] font-bold tabular-nums">
              {player.xp} / {player.xpReq} XP ({pct}%)
            </span>
          </div>
          <div className="h-3.5 rounded-xs xp-bar-container">
            <div className="xp-bar-fill rounded-xs" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Core Stat Bars */}
        <div className="space-y-3.5 pt-2">
          <h3 className="text-xs font-display font-extrabold uppercase tracking-widest text-[#00F0FF]">
            STAT ATTRIBUTES (MIND · HEALTH · WEALTH)
          </h3>

          {player.stats.map((st) => (
            <div key={st.name} className="p-3 bg-[#080C18]/90 border border-white/10 rounded-xs space-y-1.5">
              <div className="flex items-center justify-between font-display text-xs">
                <span className="text-white font-bold">{st.name.toUpperCase()} <span className="font-dev text-white/40">({st.dev})</span></span>
                <span style={{ color: st.color }} className="font-black">LV. {st.val}</span>
              </div>
              <div className="h-2 rounded-xs bg-slate-900 overflow-hidden border border-white/10">
                <div className="h-full rounded-xs" style={{ width: `${st.val}%`, backgroundColor: st.color, boxShadow: `0 0 10px ${st.color}` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Achievements Badge Snapshot */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <h4 className="text-[11px] font-display font-bold uppercase tracking-widest text-white/50">UNLOCKED ACHIEVEMENTS</h4>
          <div className="flex flex-wrap gap-2">
            {player.achievements.map((ach) => (
              <span key={ach} className="px-2.5 py-1 bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs font-display font-bold rounded-xs flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#00F0FF]" /> {ach}
              </span>
            ))}
          </div>
        </div>

        {/* Card Footer Brand */}
        <div className="pt-2 text-center border-t border-white/10">
          <span className="text-[10px] font-display text-[#00F0FF]/70 tracking-widest uppercase">
            YATHARTH GYAN · ASCEND REAL-LIFE STAT TRACKER
          </span>
        </div>
      </div>
    </div>
  );
}
