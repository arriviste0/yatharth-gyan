import React from 'react';
import { Sparkles, Shield, ArrowUp, Zap, X } from 'lucide-react';
import RankBadge from './RankBadge';

export default function LevelUpModal({ data, onClose }) {
  if (!data) return null;

  const { newLevel, oldRank, newRank, isRankUp } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-system-flash">
      {/* Reference Card Notification Box */}
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-[#181A26] border border-stone-100 dark:border-white/10 shadow-2xl rounded-[32px] space-y-4">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 animate-bounce" size={20} />
            <span className="font-extrabold text-xs text-stone-900 dark:text-white tracking-wider uppercase">
              System Notification
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Level Up Announcement */}
        <div className="text-center space-y-4 my-4">
          <div className="inline-block px-4 py-1.5 bg-[#FEF3D6] text-[#855B14] rounded-full text-xs font-extrabold tracking-wider uppercase">
            ★ Level Up Granted ★
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-white tracking-tight">
            Level {newLevel}
          </h2>

          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-relaxed">
            Your daily discipline and practice have expanded your capacity.
          </p>

          {/* Rank Up Promotion Highlight */}
          {isRankUp && (
            <div className="p-4 my-3 bg-[#EAE5FF] text-[#4A34A3] rounded-2xl space-y-2">
              <div className="flex items-center justify-center gap-2 font-bold text-xs tracking-wider uppercase">
                <Sparkles size={16} /> Rank Promotion Detected
              </div>
              <div className="flex items-center justify-center gap-3">
                <RankBadge rank={oldRank.name[0]} size="sm" showTitle={false} />
                <ArrowUp size={16} className="text-purple-600 animate-pulse" />
                <RankBadge rank={newRank.name[0]} size="lg" />
              </div>
              <p className="text-[11px] font-dev font-medium">
                {newRank.titleDev} — {newRank.title}
              </p>
            </div>
          )}

          {/* Stat Point Increases */}
          <div className="grid grid-cols-2 gap-2 text-left pt-2">
            <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-200/60 dark:border-white/5">
              <span className="text-[10px] text-stone-400 block uppercase font-bold">Discipline</span>
              <span className="font-extrabold text-sm text-stone-900 dark:text-white">+2 Tapas</span>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-200/60 dark:border-white/5">
              <span className="text-[10px] text-stone-400 block uppercase font-bold">Wisdom</span>
              <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400">+2 Gyaan</span>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-200/60 dark:border-white/5">
              <span className="text-[10px] text-stone-400 block uppercase font-bold">Alignment</span>
              <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">+2 Dharma</span>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-200/60 dark:border-white/5">
              <span className="text-[10px] text-stone-400 block uppercase font-bold">Vitality</span>
              <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">+2 Sadhana</span>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full btn-pill-dark py-3.5 text-center text-xs font-extrabold uppercase tracking-wider cursor-pointer shadow-md"
        >
          Accept Power Up
        </button>
      </div>
    </div>
  );
}
