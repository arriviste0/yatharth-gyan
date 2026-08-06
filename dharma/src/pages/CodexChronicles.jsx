import React, { useState, useMemo } from 'react';
import { Search, Bookmark, BookmarkCheck, CheckCircle2, ChevronDown, ChevronUp, BookOpen, Sparkles, Film, Calendar, Zap, Target } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import chapters from '../data/chapters.json';
import shlokas from '../data/shlokas.json';
import VerseCard from '../components/VerseCard';
import { useDailyVerse } from '../hooks/useDailyVerse';

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

export default function CodexChronicles() {
  const { state, toggleBookmark, markChapterRead } = useStorage();
  const { bookmarks = [], chapterProgress = [] } = state;
  const dailyVerse = useDailyVerse();
  const [activeTab, setActiveTab] = useState('codex'); // 'codex' | 'chronicles'
  const [search, setSearch] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('all');

  const filteredShlokas = useMemo(() => {
    return shlokas.filter((s) => {
      const matchSearch = search.trim() === '' || 
        s.english_translation.toLowerCase().includes(search.toLowerCase()) ||
        s.devanagari.includes(search) ||
        (s.id && s.id.toLowerCase().includes(search.toLowerCase()));
      const matchChapter = selectedChapter === 'all' || s.chapter === parseInt(selectedChapter, 10);
      return matchSearch && matchChapter;
    });
  }, [search, selectedChapter]);

  return (
    <div className="page-container page-transition space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold text-stone-700 dark:text-stone-300 tracking-wider uppercase px-2.5 py-0.5 bg-stone-200 dark:bg-white/10 rounded-full">
              System Archives
            </span>
            <span className="text-xs font-dev text-stone-500">ज्ञान कोश</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            System Codex & Chronicles
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Explore sacred Gita scripture, shloka codex, and content series episode chronicles.
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-2 p-1.5 rounded-full bg-stone-100 dark:bg-white/5">
        <button
          onClick={() => setActiveTab('codex')}
          className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'codex'
              ? 'bg-[#18191E] text-white dark:bg-[#00F0FF] dark:text-[#080C18] shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <BookOpen size={16} /> Wisdom Codex & Shlokas
        </button>
        <button
          onClick={() => setActiveTab('chronicles')}
          className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'chronicles'
              ? 'bg-[#18191E] text-white dark:bg-[#00F0FF] dark:text-[#080C18] shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Film size={16} /> Episode Chronicles ({EPISODE_DATA.length})
        </button>
      </div>

      {/* TAB 1: WISDOM CODEX & SHLOKAS */}
      {activeTab === 'codex' && (
        <div className="space-y-6">
          {/* Verse of the Day Card */}
          {dailyVerse && (
            <div className="card-ref p-6 bg-[#FEF3D6] text-[#855B14] space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles size={16} /> Daily Wisdom Shloka
              </div>
              <VerseCard
                shloka={dailyVerse}
                bookmarked={bookmarks.includes(dailyVerse.id)}
                onToggleBookmark={toggleBookmark}
              />
            </div>
          )}

          {/* Search & Chapter Filter */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shlokas, translations or keywords..."
                className="input-pill w-full pl-10"
              />
            </div>

            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="select-pill"
            >
              <option value="all">All Chapters (1-18)</option>
              {chapters.map((ch) => (
                <option key={ch.number} value={ch.number}>
                  Ch. {ch.number}: {ch.english_name}
                </option>
              ))}
            </select>
          </div>

          {/* Shlokas List */}
          <div className="space-y-4">
            {filteredShlokas.map((s) => (
              <VerseCard
                key={s.id}
                shloka={s}
                bookmarked={bookmarks.includes(s.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EPISODE CHRONICLES */}
      {activeTab === 'chronicles' && (
        <div className="space-y-4">
          {EPISODE_DATA.map((ep) => (
            <div key={ep.id} className="card-ref p-6 space-y-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap border-b border-stone-100 dark:border-white/5 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF3D6] text-[#855B14]">
                      Episode {ep.number}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">{ep.date}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-stone-900 dark:text-white tracking-tight">
                    {ep.title}
                  </h3>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-extrabold shrink-0">
                  +{ep.xpEarned} XP Earned
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
                {ep.desc}
              </p>

              {/* Stat Snapshot & Boss Achievements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-white/5 space-y-1 border border-stone-200/60 dark:border-white/5">
                  <span className="text-[10px] font-extrabold uppercase text-stone-400">Stat Gains</span>
                  <div className="flex gap-2 text-xs font-extrabold text-stone-800 dark:text-white">
                    <span>Mind: {ep.statGains.mind}</span> ·
                    <span>Health: {ep.statGains.health}</span> ·
                    <span>Wealth: {ep.statGains.wealth}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#EAE5FF] text-[#4A34A3] space-y-1">
                  <span className="text-[10px] font-extrabold uppercase opacity-80">Achievement</span>
                  <div className="text-xs font-extrabold truncate">
                    🏆 {ep.bossName}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
