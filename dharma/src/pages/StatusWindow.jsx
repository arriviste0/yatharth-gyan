import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Activity, Flame, Shield, Award, Zap, ChevronRight, TrendingUp } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSystemStats } from '../hooks/useSystemStats';
import RankBadge from '../components/RankBadge';
import LevelUpModal from '../components/LevelUpModal';

export default function StatusWindow() {
  const { user } = useAuth();
  const system = useSystemStats();

  const [customStats, setCustomStats] = useState([
    { key: 'mind', name: 'Mind / Wisdom', nameDev: 'ज्ञान', val: system.stats.gyaan || 32, xp: 450, xpReq: 750, color: '#A855F7' },
    { key: 'health', name: 'Health / Fitness', nameDev: 'साधना', val: system.stats.sadhana || 30, xp: 620, xpReq: 750, color: '#10B981' },
    { key: 'wealth', name: 'Wealth / Mastery', nameDev: 'धर्म', val: system.stats.dharma || 28, xp: 380, xpReq: 750, color: '#F59E0B' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStatName, setNewStatName] = useState('');
  const [newStatColor, setNewStatColor] = useState('#00F0FF');

  const radarData = customStats.map((s) => ({
    subject: s.name.split('/')[0].trim(),
    value: s.val,
    fullMark: 100,
  }));

  const activityFeed = [
    { id: 'act-1', text: 'Completed Daily Quest: Morning Meditation', xp: '+250 XP', stat: 'MIND', time: '10m ago', color: '#A855F7' },
    { id: 'act-2', text: 'Achieved Goal: 5km Sprint Challenge', xp: '+400 XP', stat: 'HEALTH', time: '2h ago', color: '#10B981' },
    { id: 'act-3', text: 'Completed Daily Quest: Deep Work Focus Session', xp: '+300 XP', stat: 'WEALTH', time: '5h ago', color: '#F59E0B' },
    { id: 'act-4', text: 'Leveled Up: Overall Rank Promotion to ' + system.currentRank.name, xp: 'LEVEL UP', stat: 'SYSTEM', time: '1d ago', color: '#00F0FF' },
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
    <div className="page-container page-transition">
      {system.levelUpData && (
        <LevelUpModal data={system.levelUpData} onClose={system.dismissLevelUp} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap sm:flex-nowrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-display font-extrabold text-[#00F0FF] tracking-widest uppercase px-2 py-0.5 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xs">
              ASCEND SYSTEM
            </span>
            <span className="text-[11px] font-dev text-[#00F0FF]/70">आत्म स्थिति</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-black text-white tracking-wider text-glow-cyan">
            PLAYER STATUS WINDOW
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-system-primary text-xs flex items-center gap-1.5 shadow-md shrink-0 uppercase tracking-wider"
        >
          <Plus size={14} /> ADD DYNAMIC STAT
        </button>
      </div>

      {/* Main HUD Window Container */}
      <div className="hud-panel hud-brackets p-6 text-white space-y-6 mb-8">
        
        {/* Top Header Card */}
        <div className="flex items-center justify-between border-b border-[#00F0FF]/25 pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-black tracking-wider text-white">
              {user?.name ? user.name.toUpperCase() : 'AWAKENED SEEKER'}
            </h2>
            <p className="text-xs text-white/60 font-sans">
              CURRENT TITLE: <span className="text-[#A855F7] font-semibold">{system.currentRank.title}</span> <span className="font-dev text-purple-300/80">({system.currentRank.titleDev})</span>
            </p>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <RankBadge rank={system.currentRank.name[0]} size="lg" />
            <div className="font-display font-black text-3xl text-glow-cyan">
              LV. {system.level}
            </div>
          </div>
        </div>

        {/* Overall XP Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-display">
            <span className="text-white/70 tracking-wider">OVERALL CAPACITY EXP</span>
            <span className="text-[#00F0FF] font-bold tabular-nums">
              {system.currentLevelXp} / {system.xpNeeded} XP ({system.progressPct}%)
            </span>
          </div>
          <div className="h-4 rounded-xs xp-bar-container">
            <div className="xp-bar-fill rounded-xs" style={{ width: `${system.progressPct}%` }} />
          </div>
        </div>

        {/* Stat Bars Grid & Recharts Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Stat Bars List */}
          <div className="space-y-4">
            <h3 className="text-xs font-display font-extrabold uppercase tracking-widest text-[#00F0FF]">
              CORE ATTRIBUTE CAPACITY (MIND · HEALTH · WEALTH)
            </h3>

            {customStats.map((st) => {
              const pct = Math.round((st.xp / st.xpReq) * 100);
              return (
                <div key={st.key} className="p-3.5 bg-[#080C18]/90 border border-white/10 rounded-xs space-y-2 hover:border-[#00F0FF]/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color, boxShadow: `0 0 10px ${st.color}` }} />
                      <span className="font-display font-bold text-sm text-white">{st.name}</span>
                      <span className="text-xs font-dev text-white/50">({st.nameDev})</span>
                    </div>
                    <div className="font-display font-extrabold text-sm" style={{ color: st.color }}>
                      LV. {st.val}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-display text-white/60">
                      <span>PROGRESS</span>
                      <span>{st.xp} / {st.xpReq} XP ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-xs bg-slate-900 overflow-hidden border border-white/10">
                      <div className="h-full rounded-xs transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: st.color, boxShadow: `0 0 10px ${st.color}` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recharts Radar Visualization */}
          <div className="p-4 bg-[#080C18]/90 border border-white/10 rounded-xs flex flex-col justify-between">
            <h3 className="text-xs font-display font-extrabold uppercase tracking-widest text-[#A855F7] mb-2">
              ATTRIBUTE BALANCE RADAR
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#00F0FF', fontSize: 11, fontFamily: 'Orbitron' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" />
                  <Radar name="Attributes" dataKey="value" stroke="#00F0FF" fill="#00F0FF" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ backgroundColor: '#0D1224', borderColor: '#00F0FF', borderRadius: '4px', fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Recent Activity Log */}
        <div className="pt-4 border-t border-[#00F0FF]/20 space-y-3">
          <h3 className="text-xs font-display font-extrabold uppercase tracking-widest text-[#00F0FF] flex items-center gap-2">
            <Activity size={14} /> RECENT SYSTEM ACTIVITY FEED
          </h3>

          <div className="space-y-2">
            {activityFeed.map((act) => (
              <div key={act.id} className="flex items-center justify-between p-3 bg-[#080C18]/80 border border-white/5 hover:border-[#00F0FF]/30 transition-all rounded-xs text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-xs font-display text-[10px] font-bold" style={{ backgroundColor: `${act.color}20`, color: act.color, border: `1px solid ${act.color}40` }}>
                    {act.stat}
                  </span>
                  <span className="text-white/80 font-sans font-medium">{act.text}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-[#00F0FF]">{act.xp}</span>
                  <span className="text-[10px] text-white/40">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add Custom Stat Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm p-5 bg-[#0D1224] border-2 border-[#00F0FF] rounded-xs hud-brackets text-white space-y-4">
            <h3 className="font-display font-bold text-sm text-[#00F0FF] uppercase tracking-wider">
              CREATE DYNAMIC STAT ATTRIBUTE
            </h3>
            <form onSubmit={handleAddStat} className="space-y-3">
              <div>
                <label className="block text-[10px] font-display text-white/60 uppercase mb-1">Stat Name</label>
                <input
                  type="text"
                  value={newStatName}
                  onChange={(e) => setNewStatName(e.target.value)}
                  placeholder="e.g. Creativity, Code Mastery, Vitality..."
                  className="w-full p-2.5 bg-[#080C18] border border-white/20 rounded-xs text-xs text-white focus:border-[#00F0FF] outline-none font-sans"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-display text-white/60 uppercase mb-1">Color Token</label>
                <input
                  type="color"
                  value={newStatColor}
                  onChange={(e) => setNewStatColor(e.target.value)}
                  className="w-full h-10 bg-transparent border border-white/20 rounded-xs cursor-pointer"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 btn-system-primary py-2 text-xs font-display font-bold uppercase">
                  ADD STAT
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-system-outline py-2 px-4 text-xs font-display">
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
