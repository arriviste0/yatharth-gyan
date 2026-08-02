import React from 'react';

const RANK_STYLES = {
  E: {
    bg: 'bg-slate-900/90',
    text: 'text-slate-300',
    border: 'border-slate-500/50',
    glow: 'shadow-[0_0_12px_rgba(148,163,184,0.3)]',
    label: 'E-RANK',
  },
  D: {
    bg: 'bg-emerald-950/90',
    text: 'text-emerald-400',
    border: 'border-emerald-500/60',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    label: 'D-RANK',
  },
  C: {
    bg: 'bg-cyan-950/90',
    text: 'text-cyan-400',
    border: 'border-cyan-500/60',
    glow: 'shadow-[0_0_18px_rgba(6,182,212,0.5)]',
    label: 'C-RANK',
  },
  B: {
    bg: 'bg-blue-950/90',
    text: 'text-blue-400',
    border: 'border-blue-500/70',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.6)]',
    label: 'B-RANK',
  },
  A: {
    bg: 'bg-purple-950/90',
    text: 'text-purple-300',
    border: 'border-purple-500/80',
    glow: 'shadow-[0_0_22px_rgba(168,85,247,0.7)]',
    label: 'A-RANK',
  },
  S: {
    bg: 'bg-amber-950/95',
    text: 'text-amber-300',
    border: 'border-amber-400',
    glow: 'shadow-[0_0_28px_rgba(245,158,11,0.95)]',
    label: 'S-RANK',
  },
};

export default function RankBadge({ rank = 'E', size = 'md', showTitle = true }) {
  const style = RANK_STYLES[rank] || RANK_STYLES.E;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
    xl: 'px-6 py-2 text-xl',
  }[size] || 'px-3 py-1 text-sm';

  return (
    <div className={`inline-flex items-center gap-2 border ${style.border} ${style.bg} ${style.glow} ${sizeClasses} rounded-xs font-display tracking-widest font-extrabold select-none transition-all duration-300`}>
      <div className={`w-2 h-2 rounded-full ${style.text} bg-current animate-pulse`} />
      <span className={style.text}>{rank}</span>
      {showTitle && <span className={`text-[10px] opacity-80 uppercase font-sans ${style.text}`}>RANK</span>}
    </div>
  );
}
