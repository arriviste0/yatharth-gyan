import React, { useState } from 'react';
import { Sparkles, Plus, Activity, Flame, Shield, Award, Zap, ChevronRight, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSystemStats } from '../hooks/useSystemStats';
import { useStorage } from '../hooks/useStorage';
import { getTodayCompletedCount, getCurrentStreak } from '../utils/streakUtils';
import RankBadge from '../components/RankBadge';
import LevelUpModal from '../components/LevelUpModal';

export default function StatusWindow() {
  const { user } = useAuth();
  const system = useSystemStats();
  const { state } = useStorage();
  const pillars = state?.pillars || [];
  const logs = state?.logs || {};

  const { done, total } = getTodayCompletedCount(logs, pillars);
  const streak = getCurrentStreak(logs, pillars);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const [customStats, setCustomStats] = useState([
    { key: 'mind', name: 'Mind / Wisdom', nameDev: 'ज्ञान', val: system.stats.gyaan || 32, xp: 450, xpReq: 750, color: '#A855F7' },
    { key: 'health', name: 'Health / Fitness', nameDev: 'साधना', val: system.stats.sadhana || 30, xp: 620, xpReq: 750, color: '#10B981' },
    { key: 'wealth', name: 'Wealth / Mastery', nameDev: 'धर्म', val: system.stats.dharma || 28, xp: 380, xpReq: 750, color: '#F59E0B' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStatName, setNewStatName] = useState('');
  const [newStatColor, setNewStatColor] = useState('#3B82F6');

  const radarData = customStats.map((s) => ({
    subject: s.name.split('/')[0].trim(),
    value: s.val,
    fullMark: 100,
  }));

  const activityFeed = [
    { id: 'act-1', text: 'Completed Daily Quest: Morning Meditation', xp: '+250 XP', stat: 'MIND', time: '10m ago', color: '#A855F7' },
    { id: 'act-2', text: 'Achieved Goal: 5km Sprint Challenge', xp: '+400 XP', stat: 'HEALTH', time: '2h ago', color: '#10B981' },
    { id: 'act-3', text: 'Completed Daily Quest: Deep Work Focus Session', xp: '+300 XP', stat: 'WEALTH', time: '5h ago', color: '#F59E0B' },
    { id: 'act-4', text: 'Leveled Up: Overall Rank Promotion to ' + system.currentRank.name, xp: 'LEVEL UP', stat: 'SYSTEM', time: '1d ago', color: '#3B82F6' },
  ];

  function handleAddStat(e) {
    e.preventDefault();
    if (!newStatName.trim()) return;
    const key = newStatName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setCustomStats([
      ...customStats,
      {
        key,
        name: newStatName.trim(),
        nameDev: 'तपस्',
        val: 15,
        xp: 100,
        xpReq: 750,
        color: newStatColor,
      },
    ]);
    setNewStatName('');
    setShowAddModal(false);
  }

  return (
    <div className="page-container page-transition space-y-6">
      {system.levelUpData && (
        <LevelUpModal data={system.levelUpData} onClose={system.dismissLevelUp} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold text-stone-700 dark:text-stone-300 tracking-wider uppercase px-2.5 py-0.5 bg-stone-200 dark:bg-white/10 rounded-full">
              Status HUD
            </span>
            <span className="text-xs font-dev text-stone-500">आत्म स्थिति</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            Player Status Window
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-pill-dark text-xs flex items-center gap-1.5 shadow-sm shrink-0 uppercase tracking-wider"
        >
          <Plus size={14} /> Add Dynamic Stat
        </button>
      </div>

      {/* 4 Pastel Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-pastel-yellow p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase">Completion</span>
            <Target size={18} />
          </div>
          <div className="text-2xl font-black">{pct}%</div>
          <div className="text-[11px] font-bold opacity-80">{total - done} targets remaining</div>
        </div>

        <div className="card-pastel-mint p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase">Tasks Done</span>
            <CheckCircle2 size={18} />
          </div>
          <div className="text-2xl font-black">{done}/{total}</div>
          <div className="text-[11px] font-bold opacity-80">Daily practice cleared</div>
        </div>

        <div className="card-pastel-purple p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase">Streak</span>
            <Flame size={18} />
          </div>
          <div className="text-2xl font-black">{streak} Days</div>
          <div className="text-[11px] font-bold opacity-80">Continuous practice</div>
        </div>

        <div className="card-pastel-blue p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase">Pillars</span>
            <Activity size={18} />
          </div>
          <div className="text-2xl font-black">{pillars.length} Active</div>
          <div className="text-[11px] font-bold opacity-80">{total} targets tracked</div>
        </div>
      </div>

      {/* Main Status Sheet Card */}
      <div className="card-ref p-6 space-y-6">
        
        {/* Top Profile Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
              {user?.name ? user.name : 'Awakened Seeker'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Current Title: <span className="text-purple-600 font-bold dark:text-purple-400">{system.currentRank.title}</span> <span className="font-dev text-stone-400">({system.currentRank.titleDev})</span>
            </p>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <RankBadge rank={system.currentRank.name[0]} size="lg" />
            <div className="font-extrabold text-2xl text-stone-900 dark:text-white">
              Lv. {system.level}
            </div>
          </div>
        </div>

        {/* Overall XP Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
            <span>Overall Capacity EXP</span>
            <span className="tabular-nums">
              {system.currentLevelXp} / {system.xpNeeded} XP ({system.progressPct}%)
            </span>
          </div>
          <div className="h-3 rounded-full xp-bar-container">
            <div className="xp-bar-fill rounded-full" style={{ width: `${system.progressPct}%` }} />
          </div>
        </div>

        {/* Stat Bars Grid & Recharts Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Stat Bars List */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Core Attribute Capacity (Mind · Health · Wealth)
            </h3>

            {customStats.map((st) => {
              const stPct = Math.round((st.xp / st.xpReq) * 100);
              return (
                <div key={st.key} className="p-4 bg-stone-50 dark:bg-white/[0.02] border border-stone-200/60 dark:border-white/5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }} />
                      <span className="font-bold text-sm text-stone-900 dark:text-white">{st.name}</span>
                      <span className="text-xs font-dev text-stone-400">({st.nameDev})</span>
                    </div>
                    <div className="font-extrabold text-sm" style={{ color: st.color }}>
                      Lv. {st.val}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
                      <span>Progress</span>
                      <span>{st.xp} / {st.xpReq} XP ({stPct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stPct}%`, backgroundColor: st.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recharts Radar Balance Chart */}
          <div className="p-4 bg-stone-50 dark:bg-white/[0.02] border border-stone-200/60 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              Attribute Balance Overview
            </h3>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E5E7EB" opacity={0.6} />
                  <PolarAngleAxis dataKey="subject" stroke="#6B7280" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 50]} stroke="#9CA3AF" tick={{ fontSize: 9 }} />
                  <Radar name="Attributes" dataKey="value" stroke="#18191E" fill="#18191E" fillOpacity={0.2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Activity Feed */}
        <div className="pt-4 border-t border-stone-100 dark:border-white/5 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <Activity size={14} /> Recent Activity Feed
          </h3>

          <div className="space-y-2">
            {activityFeed.map((act) => (
              <div key={act.id} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-white/[0.02] border border-stone-200/60 dark:border-white/5 rounded-2xl text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold" style={{ backgroundColor: `${act.color}15`, color: act.color }}>
                    {act.stat}
                  </span>
                  <span className="text-stone-800 dark:text-white font-medium">{act.text}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-stone-900 dark:text-white">{act.xp}</span>
                  <span className="text-[10px] text-stone-400">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add Custom Stat Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm p-6 bg-white dark:bg-[#181A26] border border-stone-100 dark:border-white/10 rounded-[32px] shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-stone-900 dark:text-white tracking-tight">
              Create Dynamic Stat Attribute
            </h3>
            <form onSubmit={handleAddStat} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 uppercase mb-1">Stat Name</label>
                <input
                  type="text"
                  value={newStatName}
                  onChange={(e) => setNewStatName(e.target.value)}
                  placeholder="e.g. Creativity, Focus, Vitality..."
                  className="input-pill w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 uppercase mb-1">Color Token</label>
                <input
                  type="color"
                  value={newStatColor}
                  onChange={(e) => setNewStatColor(e.target.value)}
                  className="w-full h-10 bg-transparent border border-stone-200 dark:border-white/10 rounded-full cursor-pointer"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 btn-pill-dark py-2.5 text-xs">
                  Add Stat
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-white/10 hover:bg-stone-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
