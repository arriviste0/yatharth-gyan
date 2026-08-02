import { useState, useEffect, useCallback } from 'react';

export const RANK_TIERS = {
  E: { name: 'E-Rank', title: 'Awakened Initiate', titleDev: 'आरंभिक साधक', minLevel: 1, color: '#94A3B8', border: 'border-slate-400', glow: 'shadow-slate-500/30' },
  D: { name: 'D-Rank', title: 'Disciplined Seeker', titleDev: 'नियमनिष्ठ साधक', minLevel: 5, color: '#10B981', border: 'border-emerald-400', glow: 'shadow-emerald-500/40' },
  C: { name: 'C-Rank', title: 'Truth Collector', titleDev: 'सत्य अन्वेषक', minLevel: 12, color: '#06B6D4', border: 'border-cyan-400', glow: 'shadow-cyan-500/50' },
  B: { name: 'B-Rank', title: 'Dharma Knight', titleDev: 'धर्म योद्धा', minLevel: 25, color: '#3B82F6', border: 'border-blue-500', glow: 'shadow-blue-500/60' },
  A: { name: 'A-Rank', title: 'Shadow Master', titleDev: 'तपोनिष्ठ ज्ञानी', minLevel: 40, color: '#A855F7', border: 'border-purple-500', glow: 'shadow-purple-500/70' },
  S: { name: 'S-Rank', title: 'Monarch of Mind', titleDev: 'सत्य सम्राट', minLevel: 60, color: '#F59E0B', border: 'border-amber-400', glow: 'shadow-amber-500/90' },
};

export function getRankForLevel(level) {
  if (level >= 60) return 'S';
  if (level >= 40) return 'A';
  if (level >= 25) return 'B';
  if (level >= 12) return 'C';
  if (level >= 5)  return 'D';
  return 'E';
}

function useLocalStorageState(key, defaultValue) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);

  return [val, setVal];
}

export function useSystemStats() {
  const [xp, setXp] = useLocalStorageState('ascend_system_xp', 1850);
  const [level, setLevel] = useLocalStorageState('ascend_system_level', 4);
  const [stats, setStats] = useLocalStorageState('ascend_system_attributes', {
    tapas: 24,   // STR / Discipline
    gyaan: 32,   // INT / Wisdom
    dharma: 28,  // AGI / Alignment
    sadhana: 30, // VIT / Energy
  });

  const [levelUpData, setLevelUpData] = useState(null);

  const xpNeeded = level * 750;
  const currentLevelXp = xp % (xpNeeded || 1);
  const progressPct = Math.min(100, Math.round((currentLevelXp / (xpNeeded || 1)) * 100));

  const rankKey = getRankForLevel(level);
  const currentRank = RANK_TIERS[rankKey] || RANK_TIERS.E;

  const addXp = useCallback((amount, statType = null) => {
    setXp((prevXp) => {
      const newXp = prevXp + amount;
      const currentReq = level * 750;
      
      if (newXp >= currentReq) {
        const newLevel = level + 1;
        const oldRank = getRankForLevel(level);
        const newRank = getRankForLevel(newLevel);
        
        setLevel(newLevel);
        setLevelUpData({
          oldLevel: level,
          newLevel: newLevel,
          oldRank: RANK_TIERS[oldRank] || RANK_TIERS.E,
          newRank: RANK_TIERS[newRank] || RANK_TIERS.E,
          isRankUp: oldRank !== newRank,
        });

        setStats((prev) => ({
          tapas: (prev?.tapas || 20) + 2,
          gyaan: (prev?.gyaan || 20) + 2,
          dharma: (prev?.dharma || 20) + 2,
          sadhana: (prev?.sadhana || 20) + 2,
        }));
      }

      if (statType && stats[statType] !== undefined) {
        setStats((prev) => ({
          ...prev,
          [statType]: (prev[statType] || 20) + Math.max(1, Math.floor(amount / 100)),
        }));
      }

      return newXp;
    });
  }, [level, setLevel, setStats, stats, setXp]);

  const dismissLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  return {
    xp,
    level,
    xpNeeded,
    currentLevelXp,
    progressPct,
    currentRank,
    rankKey,
    stats,
    addXp,
    levelUpData,
    dismissLevelUp,
  };
}
