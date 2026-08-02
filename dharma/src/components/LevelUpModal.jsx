import React from 'react';
import { Sparkles, Shield, ArrowUp, Zap, X } from 'lucide-react';
import RankBadge from './RankBadge';

export default function LevelUpModal({ data, onClose }) {
  if (!data) return null;

  const { newLevel, oldRank, newRank, isRankUp } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-system-flash">
      {/* Holographic System Notification Box */}
      <div className="relative w-full max-w-md p-6 bg-[#0D1224]/95 border-2 border-[#00F0FF] shadow-[0_0_50px_rgba(0,240,255,0.4)] rounded-sm hud-brackets">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#00F0FF]/30 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Zap className="text-[#00F0FF] animate-bounce" size={20} />
            <span className="font-display font-black text-xs text-[#00F0FF] tracking-widest uppercase">
              SYSTEM NOTIFICATION
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Level Up Announcement */}
        <div className="text-center space-y-4 my-6">
          <div className="inline-block px-3 py-1 bg-[#00F0FF]/10 border border-[#00F0FF]/40 rounded-full text-xs font-display text-[#00F0FF] tracking-wider uppercase animate-pulse">
            ★ LEVEL UP GRANTED ★
          </div>

          <h2 className="font-display text-4xl sm:text-5xl font-black text-white tracking-widest text-glow-cyan">
            LEVEL {newLevel}
          </h2>

          <p className="text-xs text-white/70 font-sans tracking-wide">
            Your daily discipline and spiritual practice have expanded your capacity.
          </p>

          {/* Rank Up Promotion Highlight */}
          {isRankUp && (
            <div className="p-4 my-3 bg-purple-950/80 border border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.5)] rounded-sm space-y-2">
              <div className="flex items-center justify-center gap-2 text-purple-300 font-display text-xs tracking-wider uppercase font-bold">
                <Sparkles size={16} /> RANK PROMOTION DETECTED
              </div>
              <div className="flex items-center justify-center gap-3">
                <RankBadge rank={oldRank.name[0]} size="sm" showTitle={false} />
                <ArrowUp size={16} className="text-purple-400 animate-pulse" />
                <RankBadge rank={newRank.name[0]} size="lg" />
              </div>
              <p className="text-[11px] text-purple-200/80 font-dev tracking-wide">
                {newRank.titleDev} — {newRank.title}
              </p>
            </div>
          )}

          {/* Stat Point Increases */}
          <div className="grid grid-cols-2 gap-2 text-left pt-2">
            <div className="p-2.5 bg-[#080C18] border border-[#00F0FF]/20 rounded-xs">
              <span className="text-[10px] text-white/50 block uppercase font-display">TAPAS (तपस्)</span>
              <span className="font-display font-bold text-sm text-[#00F0FF]">+2 Discipline</span>
            </div>
            <div className="p-2.5 bg-[#080C18] border border-[#00F0FF]/20 rounded-xs">
              <span className="text-[10px] text-white/50 block uppercase font-display">GYAAN (ज्ञान)</span>
              <span className="font-display font-bold text-sm text-[#A855F7]">+2 Wisdom</span>
            </div>
            <div className="p-2.5 bg-[#080C18] border border-[#00F0FF]/20 rounded-xs">
              <span className="text-[10px] text-white/50 block uppercase font-display">DHARMA (धर्म)</span>
              <span className="font-display font-bold text-sm text-[#4F8CFF]">+2 Alignment</span>
            </div>
            <div className="p-2.5 bg-[#080C18] border border-[#00F0FF]/20 rounded-xs">
              <span className="text-[10px] text-white/50 block uppercase font-display">SADHANA (साधना)</span>
              <span className="font-display font-bold text-sm text-emerald-400">+2 Vitality</span>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 btn-system-primary py-3 text-center uppercase tracking-widest font-display text-sm text-slate-950 font-black cursor-pointer"
        >
          ACCEPT SYSTEM POWER UP
        </button>
      </div>
    </div>
  );
}
