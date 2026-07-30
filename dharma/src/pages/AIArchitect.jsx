import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles, Send, RefreshCw, Wand2, Plus, Edit2, RotateCcw,
  Check, X, ChevronRight, Layers, Target as TargetIcon, Zap,
  Bot, User, Lightbulb, Dumbbell, BookOpen, Flame, History, Trash2, MessageSquare
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { createAIPlan, askKrishnaAI } from '../api/ai';
import { DEFAULT_PILLARS } from '../data/defaultPillars';

const QUICK_PROMPTS = [
  { label: '💪 What can you do?', prompt: 'What can you do to help me design my daily Sadhana, fitness and habit trackers?' },
  { label: '🧘 Teach me a routine', prompt: 'Build a 15-minute morning pranayama, meditation and calm focus routine' },
  { label: '💧 Track 100g Protein', prompt: 'Structure a daily 100g protein, 3L water hydration and workout Sadhana plan' },
];

const CHAT_STORAGE_KEY = 'sadhana_ai_chat_threads_v2';

function loadChatThreads() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load chat history:', e);
  }
  return [];
}

function saveChatThreads(threads) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(threads));
  } catch (e) {
    console.error('Failed to save chat history:', e);
  }
}

/**
 * Smart matching algorithm to find existing pillar by assigned ID, title, or domain keywords
 */
function findMatchingPillarIndex(existingPillars, p) {
  if (!p || !existingPillars || existingPillars.length === 0) return -1;

  // 1. If assignedPillarId was explicitly selected in the edit dropdown
  if (p.assignedPillarId && p.assignedPillarId !== 'new') {
    const idx = existingPillars.findIndex(ep => ep.id === p.assignedPillarId);
    if (idx >= 0) return idx;
  }

  const pTitle = (p.english || '').toLowerCase();

  // 2. Exact or partial title match
  let matchedIdx = existingPillars.findIndex(ep => {
    const epTitle = (ep.english || '').toLowerCase();
    return epTitle === pTitle || epTitle.includes(pTitle) || pTitle.includes(epTitle);
  });
  if (matchedIdx >= 0) return matchedIdx;

  // 3. Smart domain keyword matching
  const categoryKeywords = {
    body: ['body', 'workout', 'protein', 'hydration', 'fitness', 'gym', 'health', 'sleep', 'diet', 'water', 'exercise', 'muscle', 'run', 'steps'],
    mind: ['mind', 'meditation', 'pranayama', 'mental', 'peace', 'calm', 'focus', 'spirit', 'spiritual', 'soul', 'dharma', 'wisdom', 'gita', 'journal'],
    work: ['work', 'study', 'deep work', 'code', 'reading', 'career', 'vocation', 'task', 'project', 'skill', 'learn', 'writing']
  };

  for (const [_, keywords] of Object.entries(categoryKeywords)) {
    const pHasKeyword = keywords.some(kw => pTitle.includes(kw));
    if (pHasKeyword) {
      const idx = existingPillars.findIndex(ep => {
        const epTitle = (ep.english || '').toLowerCase();
        return keywords.some(kw => epTitle.includes(kw));
      });
      if (idx >= 0) return idx;
    }
  }

  return -1;
}

/**
 * Formats AI output text cleanly without raw markdown characters (*, **, #, `)
 */
function FormattedMessageText({ text }) {
  if (!text) return null;

  const lines = text
    .replace(/\\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const isBullet = line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line);
        const cleanedText = line
          .replace(/^[-*\d\.\s]+/, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/#/g, '')
          .replace(/`/g, '')
          .replace(/_/g, '')
          .trim();

        if (!cleanedText) return null;

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>{cleanedText}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs sm:text-sm leading-relaxed">
            {cleanedText}
          </p>
        );
      })}
    </div>
  );
}

function isPlanRequest(text = '') {
  const lower = text.toLowerCase().trim();
  const greetings = ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening', 'who are you', 'how are you', 'what can you do', 'help', 'thanks', 'thank you'];
  if (greetings.includes(lower) || lower.length <= 3) {
    return false;
  }
  const planKeywords = [
    'plan', 'routine', 'schedule', 'build', 'create', 'suggest', 'design',
    'pillar', 'target', 'goal', 'habit', 'workout', 'protein', 'hydration',
    'sleep', 'meditation', 'study', 'diet', 'protocol', 'track', 'set up'
  ];
  return planKeywords.some(kw => lower.includes(kw));
}

export default function AIArchitect() {
  const { state, setPillars, setGoals } = useStorage();
  const pillars = state.pillars || [];
  const goals = state.goals || [];

  // Chat threads history state
  const [chatThreads, setChatThreads] = useState(loadChatThreads);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const initialWelcomeMsg = useMemo(() => ({
    id: 'welcome-1',
    role: 'assistant',
    text: 'Namaste! Welcome to Sadhana AI Architect. How can I assist your practice, habit design, or fitness goals today?',
    plan: null,
  }), []);

  const [messages, setMessages] = useState([initialWelcomeMsg]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  // Undo state & toast
  const [undoState, setUndoState] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Inline editing state for active plans in chat
  const [editingItem, setEditingItem] = useState(null); // { msgId, type: 'pillar'|'goal', idx, data }

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Sync messages to active thread in storage
  useEffect(() => {
    if (!activeThreadId) return;
    setChatThreads(prev => {
      const updated = prev.map(t => {
        if (t.id === activeThreadId) {
          return { ...t, messages, updatedAt: Date.now() };
        }
        return t;
      });
      saveChatThreads(updated);
      return updated;
    });
  }, [messages, activeThreadId]);

  function handleStartNewChat() {
    setActiveThreadId(null);
    setMessages([initialWelcomeMsg]);
    setInputPrompt('');
    setShowHistoryDrawer(false);
  }

  function handleSelectThread(thread) {
    setActiveThreadId(thread.id);
    setMessages(thread.messages || [initialWelcomeMsg]);
    setShowHistoryDrawer(false);
  }

  function handleDeleteThread(e, threadId) {
    e.stopPropagation();
    const updated = chatThreads.filter(t => t.id !== threadId);
    setChatThreads(updated);
    saveChatThreads(updated);
    if (activeThreadId === threadId) {
      handleStartNewChat();
    }
  }

  async function handleSendMessage(customText = null) {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg = { id: userMsgId, role: 'user', text: textToSend };

    let currentThreadId = activeThreadId;

    if (!currentThreadId) {
      const newThreadId = `thread-${Date.now()}`;
      const title = textToSend.length > 32 ? textToSend.slice(0, 32) + '...' : textToSend;
      const newThread = {
        id: newThreadId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [initialWelcomeMsg, newMsg]
      };
      currentThreadId = newThreadId;
      setActiveThreadId(newThreadId);
      setChatThreads(prev => {
        const next = [newThread, ...prev];
        saveChatThreads(next);
        return next;
      });
    }

    setMessages(prev => [...prev, newMsg]);
    if (!customText) setInputPrompt('');
    setLoading(true);

    const wantsPlan = isPlanRequest(textToSend);

    try {
      let generatedPlan = null;

      if (wantsPlan) {
        generatedPlan = await createAIPlan(
          { periodLabel: 'Custom AI Request', prompt: textToSend },
          pillars.length > 0 ? pillars : DEFAULT_PILLARS,
          goals
        );
      }

      const conversationalReply = await askKrishnaAI(
        wantsPlan
          ? `User requested a Sadhana plan for: "${textToSend}". Provide encouraging guidance and introduce the proposed plan below.`
          : textToSend,
        messages.slice(-4)
      );

      const conversationalReplyText = conversationalReply.reply || (generatedPlan ? generatedPlan.summary : "Hello! How can I assist your practice, habit design, or fitness targets today?");

      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg = {
        id: aiMsgId,
        role: 'assistant',
        text: conversationalReplyText,
        plan: generatedPlan,
        selectedPillars: generatedPlan ? (generatedPlan.recommendedPillars || []).reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {}) : {},
        selectedGoals: generatedPlan ? (generatedPlan.recommendedGoals || []).reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {}) : {},
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error in AI Architect chat:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          text: 'Namaste! How can I assist your practice or habit design today?',
          plan: null,
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function togglePillarSelect(msgId, pIdx) {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      return {
        ...m,
        selectedPillars: { ...m.selectedPillars, [pIdx]: !m.selectedPillars[pIdx] }
      };
    }));
  }

  function toggleGoalSelect(msgId, gIdx) {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      return {
        ...m,
        selectedGoals: { ...m.selectedGoals, [gIdx]: !m.selectedGoals[gIdx] }
      };
    }));
  }

  function handleSaveItemEdit(msgId, type, idx, updatedData) {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.plan) return m;
      const updatedPlan = { ...m.plan };

      if (type === 'pillar') {
        const updatedPillars = [...(updatedPlan.recommendedPillars || [])];
        updatedPillars[idx] = { ...updatedPillars[idx], ...updatedData };
        updatedPlan.recommendedPillars = updatedPillars;
      } else if (type === 'goal') {
        const updatedGoals = [...(updatedPlan.recommendedGoals || [])];
        updatedGoals[idx] = { ...updatedGoals[idx], ...updatedData };
        updatedPlan.recommendedGoals = updatedGoals;
      }

      return { ...m, plan: updatedPlan };
    }));
    setEditingItem(null);
  }

  // Add selected & edited Pillars/Goals to app storage + smart matching + trigger UNDO
  function handleAddPlanToSadhana(msg, replaceMode = false) {
    if (!msg.plan) return;

    const currentPillars = (pillars && pillars.length > 0) ? pillars : DEFAULT_PILLARS;
    const currentGoals = goals || [];

    const prevPillars = JSON.parse(JSON.stringify(currentPillars));
    const prevGoals = JSON.parse(JSON.stringify(currentGoals));

    let newPillars = replaceMode ? [] : JSON.parse(JSON.stringify(currentPillars));
    let newGoals = replaceMode ? [] : JSON.parse(JSON.stringify(currentGoals));

    let addedPillarsCount = 0;
    let addedGoalsCount = 0;

    const selectedPMap = msg.selectedPillars || {};
    const selectedGMap = msg.selectedGoals || {};

    (msg.plan.recommendedPillars || []).forEach((p, idx) => {
      if (selectedPMap[idx] !== false) {
        addedPillarsCount++;

        if (replaceMode) {
          // In replace mode, create new pillar directly
          newPillars.push({
            id: p.id || `pillar-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            english: p.english,
            sanskrit: p.sanskrit || 'सधना',
            color: p.color || '#E8843C',
            icon: p.icon || 'dumbbell',
            targets: (p.targets || []).map(t => ({
              ...t,
              id: t.id || `target-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
            }))
          });
        } else {
          // Smart Match: Check assignedPillarId or smart domain keyword matching
          const matchingIdx = findMatchingPillarIndex(newPillars, p);

          if (matchingIdx >= 0) {
            // Merge targets into existing matching pillar
            const existingPillar = newPillars[matchingIdx];
            const combinedTargets = [...(existingPillar.targets || [])];
            (p.targets || []).forEach(t => {
              if (!combinedTargets.some(ct => (ct.name || '').toLowerCase() === (t.name || '').toLowerCase())) {
                combinedTargets.push({
                  ...t,
                  id: t.id || `target-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                });
              }
            });
            newPillars[matchingIdx] = { ...existingPillar, targets: combinedTargets };
          } else {
            // Create new pillar if no match found
            newPillars.push({
              id: p.id || `pillar-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              english: p.english,
              sanskrit: p.sanskrit || 'सधना',
              color: p.color || '#E8843C',
              icon: p.icon || 'dumbbell',
              targets: (p.targets || []).map(t => ({
                ...t,
                id: t.id || `target-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
              }))
            });
          }
        }
      }
    });

    (msg.plan.recommendedGoals || []).forEach((g, idx) => {
      if (selectedGMap[idx] !== false) {
        if (!newGoals.some(eg => (eg.name || '').toLowerCase() === (g.name || '').toLowerCase())) {
          addedGoalsCount++;
          newGoals.push({
            id: g.id || `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: g.name,
            value: g.value,
            unit: g.unit,
            direction: g.direction || 'gte',
            deadline: g.deadline || null,
            notes: g.notes || 'Added via Sadhana AI Architect',
            createdAt: Date.now(),
          });
        }
      }
    });

    setPillars(newPillars);
    setGoals(newGoals);

    setUndoState({ prevPillars, prevGoals });
    setToastMessage(
      replaceMode
        ? `Replaced existing setup with ${addedPillarsCount} Pillars & ${addedGoalsCount} Goals!`
        : `Merged ${addedPillarsCount} Pillars & ${addedGoalsCount} Goals into your Sadhana!`
    );
    setTimeout(() => setToastMessage(null), 8000);
  }

  function handleUndo() {
    if (!undoState) return;
    setPillars(undoState.prevPillars);
    setGoals(undoState.prevGoals);
    setUndoState(null);
    setToastMessage('Restored previous Pillars and Goals.');
    setTimeout(() => setToastMessage(null), 4000);
  }

  const hasUserMessages = messages.some(m => m.role === 'user');
  const availablePillarsList = (pillars && pillars.length > 0) ? pillars : DEFAULT_PILLARS;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl w-full mx-auto px-3 sm:px-6 pt-2 pb-20 lg:pb-6 overflow-hidden relative">
      
      {/* Studio Header Bar */}
      <div className="shrink-0 mb-2 flex items-center justify-between gap-2 p-3 rounded-2xl bg-white dark:bg-[#181926] border border-black/5 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
            <Wand2 size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black text-[#18191E] dark:text-white leading-none">
              Sadhana AI Architect™
            </h1>
            <span className="text-[10px] font-bold text-stone-400">
              Personalized AI Practice Guide
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History Drawer Toggle Button */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-extrabold text-stone-700 dark:text-stone-300 hover:border-accent hover:text-accent transition-all flex items-center gap-1.5 relative"
            title="Saved Chats History"
          >
            <History size={14} />
            <span className="hidden sm:inline">Saved Chats</span>
            {chatThreads.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-accent text-white text-[9px] font-black flex items-center justify-center">
                {chatThreads.length}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleStartNewChat}
            className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            title="Start New Chat"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* History Drawer Overlay Panel */}
      {showHistoryDrawer && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto sm:w-80 z-50 p-4 rounded-3xl bg-white dark:bg-[#181926] border border-black/10 dark:border-white/15 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
            <span className="text-xs font-black text-[#18191E] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} className="text-accent" /> Saved Chat Threads
            </span>
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {chatThreads.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4 font-medium">
                No saved chat history yet. Start chatting below!
              </p>
            ) : (
              chatThreads.map(thread => (
                <div
                  key={thread.id}
                  onClick={() => handleSelectThread(thread)}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    activeThreadId === thread.id
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-black/5 dark:bg-white/5 border-transparent text-stone-700 dark:text-stone-300 hover:border-accent/40'
                  }`}
                >
                  <span className="truncate flex-1">{thread.title}</span>
                  <button
                    onClick={(e) => handleDeleteThread(e, thread.id)}
                    className="p-1 rounded-lg text-stone-400 hover:text-red-500 transition-colors shrink-0"
                    title="Delete Chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toast Notification with UNDO option */}
      {toastMessage && (
        <div className="shrink-0 mb-2 p-3 rounded-2xl bg-[#181926] text-white border border-white/20 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
          <span className="text-xs font-bold flex items-center gap-2">
            <Sparkles size={15} className="text-amber-400 shrink-0" />
            {toastMessage}
          </span>
          {undoState && (
            <button
              onClick={handleUndo}
              className="px-3 py-1 text-xs font-extrabold rounded-xl bg-accent text-white hover:bg-accent/90 transition-all flex items-center gap-1 shrink-0 shadow-sm"
            >
              <RotateCcw size={13} />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1 scroll-smooth">
        
        {/* Fresh Chat Hero Center State */}
        {!hasUserMessages ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400 via-emerald-500 to-accent flex items-center justify-center text-white shadow-2xl shadow-accent/40 animate-pulse">
                <Bot size={42} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-md">
                <Sparkles size={14} />
              </div>
            </div>

            <div className="space-y-1.5 max-w-md">
              <h2 className="text-2xl sm:text-3xl font-black text-[#18191E] dark:text-white tracking-tight">
                Your smart AI buddy for all things Sadhana
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-300 font-medium leading-relaxed">
                Ask anything about habit building, workout routines, Gita wisdom, or custom target tracking.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg pt-2">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qp.prompt)}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#181926] border border-black/10 dark:border-white/15 text-xs font-extrabold text-stone-800 dark:text-stone-200 hover:border-accent hover:text-accent shadow-xs hover:scale-105 active:scale-95 transition-all"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Messages Stream */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-stone-800 dark:bg-stone-700' : 'bg-accent'
                }`}
              >
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className={`space-y-3 max-w-[88%] sm:max-w-[82%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-accent text-white rounded-tr-xs'
                      : 'bg-white dark:bg-[#181926] text-[#18191E] dark:text-stone-200 border border-black/5 dark:border-white/10 rounded-tl-xs'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <FormattedMessageText text={msg.text} />
                  )}
                </div>

                {/* Render AI Proposed Plan Card */}
                {msg.plan && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-accent/10 to-teal-500/10 border-2 border-accent/30 shadow-md space-y-4 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-black uppercase tracking-wider">
                          🪄 AI Proposed Plan
                        </span>
                        <h4 className="text-xs sm:text-sm font-extrabold text-[#18191E] dark:text-white">
                          {msg.plan.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                      {msg.plan.summary}
                    </p>

                    {/* Recommended Pillars List */}
                    {msg.plan.recommendedPillars?.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-extrabold text-accent uppercase tracking-wider block">
                          Recommended Pillars & Sub-tasks
                        </span>
                        <div className="space-y-2">
                          {msg.plan.recommendedPillars.map((p, pIdx) => {
                            const isEditingThis = editingItem?.msgId === msg.id && editingItem?.type === 'pillar' && editingItem?.idx === pIdx;
                            return (
                              <div key={pIdx} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2 shadow-xs">
                                {isEditingThis ? (
                                  /* Inline Pillar Edit Form with Target Pillar Selector */
                                  <div className="space-y-2.5 text-xs">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Title (English):</label>
                                        <input
                                          type="text"
                                          value={editingItem.data.english}
                                          onChange={(e) => setEditingItem(prev => ({ ...prev, data: { ...prev.data, english: e.target.value } }))}
                                          placeholder="Pillar English Name"
                                          className="w-full p-1.5 rounded-xl border border-accent bg-transparent text-[#18191E] dark:text-white font-bold outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Sanskrit:</label>
                                        <input
                                          type="text"
                                          value={editingItem.data.sanskrit}
                                          onChange={(e) => setEditingItem(prev => ({ ...prev, data: { ...prev.data, sanskrit: e.target.value } }))}
                                          placeholder="Sanskrit Name"
                                          className="w-full p-1.5 rounded-xl border border-accent bg-transparent text-[#18191E] dark:text-white font-bold outline-none"
                                        />
                                      </div>
                                    </div>

                                    {/* Select Existing Target Pillar */}
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
                                        Assign Target to Existing Pillar:
                                      </label>
                                      <select
                                        value={editingItem.data.assignedPillarId || 'new'}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, data: { ...prev.data, assignedPillarId: e.target.value } }))}
                                        className="w-full p-2 rounded-xl border border-accent bg-white dark:bg-[#181926] text-xs font-bold text-[#18191E] dark:text-white outline-none"
                                      >
                                        <option value="new">➕ Create New Pillar ({editingItem.data.english})</option>
                                        {availablePillarsList.map(ep => (
                                          <option key={ep.id} value={ep.id}>
                                            📂 Merge into {ep.english} ({ep.sanskrit || 'Sadhana'})
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Edit Targets */}
                                    {(editingItem.data.targets || []).map((t, tidx) => (
                                      <div key={tidx} className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={t.name}
                                          onChange={(e) => {
                                            const newTargets = [...editingItem.data.targets];
                                            newTargets[tidx] = { ...newTargets[tidx], name: e.target.value };
                                            setEditingItem(prev => ({ ...prev, data: { ...prev.data, targets: newTargets } }));
                                          }}
                                          className="flex-1 p-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent text-xs font-bold"
                                        />
                                        <input
                                          type="number"
                                          value={t.targetValue}
                                          onChange={(e) => {
                                            const newTargets = [...editingItem.data.targets];
                                            newTargets[tidx] = { ...newTargets[tidx], targetValue: parseFloat(e.target.value) || 0 };
                                            setEditingItem(prev => ({ ...prev, data: { ...prev.data, targets: newTargets } }));
                                          }}
                                          className="w-16 p-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent text-xs font-bold text-center"
                                        />
                                        <input
                                          type="text"
                                          value={t.unit}
                                          onChange={(e) => {
                                            const newTargets = [...editingItem.data.targets];
                                            newTargets[tidx] = { ...newTargets[tidx], unit: e.target.value };
                                            setEditingItem(prev => ({ ...prev, data: { ...prev.data, targets: newTargets } }));
                                          }}
                                          className="w-14 p-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent text-xs font-bold text-center"
                                        />
                                      </div>
                                    ))}
                                    <div className="flex justify-end gap-2 pt-1">
                                      <button
                                        onClick={() => setEditingItem(null)}
                                        className="px-2.5 py-1 text-[11px] font-bold text-stone-500"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSaveItemEdit(msg.id, 'pillar', pIdx, editingItem.data)}
                                        className="px-3 py-1 text-[11px] font-extrabold rounded-lg bg-accent text-white shadow-xs"
                                      >
                                        Save Edit
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Normal View with Checkbox & Edit button */
                                  <div className="flex items-start justify-between gap-2">
                                    <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={msg.selectedPillars?.[pIdx] !== false}
                                        onChange={() => togglePillarSelect(msg.id, pIdx)}
                                        className="mt-1 accent-accent w-4 h-4 rounded cursor-pointer shrink-0"
                                      />
                                      <div className="space-y-0.5 min-w-0">
                                        <span className="text-xs font-bold text-[#18191E] dark:text-white block truncate">
                                          {p.english} {p.sanskrit ? `(${p.sanskrit})` : ''}
                                        </span>
                                        {(p.targets || []).map((t, tidx) => (
                                          <span key={tidx} className="text-[10px] text-stone-500 dark:text-stone-400 block font-semibold">
                                            + {t.name}: {t.targetValue} {t.unit}
                                          </span>
                                        ))}
                                      </div>
                                    </label>
                                    <button
                                      onClick={() => setEditingItem({ msgId: msg.id, type: 'pillar', idx: pIdx, data: JSON.parse(JSON.stringify(p)) })}
                                      className="p-1 rounded-lg text-stone-400 hover:text-accent hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                                      title="Edit Pillar & Target Assignment"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recommended Goals List */}
                    {msg.plan.recommendedGoals?.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-extrabold text-amber-500 uppercase tracking-wider block">
                          Recommended Goals
                        </span>
                        <div className="space-y-2">
                          {msg.plan.recommendedGoals.map((g, gIdx) => {
                            const isEditingThisGoal = editingItem?.msgId === msg.id && editingItem?.type === 'goal' && editingItem?.idx === gIdx;
                            return (
                              <div key={gIdx} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2 shadow-xs">
                                {isEditingThisGoal ? (
                                  <div className="space-y-2 text-xs">
                                    <input
                                      type="text"
                                      value={editingItem.data.name}
                                      onChange={(e) => setEditingItem(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                                      placeholder="Goal Name"
                                      className="w-full p-1.5 rounded-xl border border-accent bg-transparent text-[#18191E] dark:text-white font-bold outline-none"
                                    />
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-stone-400">Target Value:</span>
                                      <input
                                        type="number"
                                        value={editingItem.data.value}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, data: { ...prev.data, value: parseFloat(e.target.value) || 0 } }))}
                                        className="w-20 p-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent text-xs font-bold text-center"
                                      />
                                      <input
                                        type="text"
                                        value={editingItem.data.unit}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, data: { ...prev.data, unit: e.target.value } }))}
                                        className="w-16 p-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent text-xs font-bold text-center"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                      <button
                                        onClick={() => setEditingItem(null)}
                                        className="px-2.5 py-1 text-[11px] font-bold text-stone-500"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSaveItemEdit(msg.id, 'goal', gIdx, editingItem.data)}
                                        className="px-3 py-1 text-[11px] font-extrabold rounded-lg bg-accent text-white shadow-xs"
                                      >
                                        Save Goal Edit
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between gap-2">
                                    <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={msg.selectedGoals?.[gIdx] !== false}
                                        onChange={() => toggleGoalSelect(msg.id, gIdx)}
                                        className="mt-1 accent-accent w-4 h-4 rounded cursor-pointer shrink-0"
                                      />
                                      <div className="space-y-0.5 min-w-0">
                                        <span className="text-xs font-bold text-[#18191E] dark:text-white block truncate">
                                          {g.name} (≥ {g.value} {g.unit})
                                        </span>
                                        <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-semibold">
                                          {g.notes}
                                        </span>
                                      </div>
                                    </label>
                                    <button
                                      onClick={() => setEditingItem({ msgId: msg.id, type: 'goal', idx: gIdx, data: JSON.parse(JSON.stringify(g)) })}
                                      className="p-1 rounded-lg text-stone-400 hover:text-accent hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                                      title="Edit Goal Target"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons: Dismiss, Merge with Existing, Replace All */}
                    <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
                      <button
                        onClick={() => {
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, plan: null } : m));
                        }}
                        className="px-3.5 py-2 text-xs font-bold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white transition-colors"
                      >
                        Dismiss
                      </button>

                      <button
                        onClick={() => handleAddPlanToSadhana(msg, false)}
                        className="px-4 py-2 text-xs font-extrabold rounded-2xl bg-accent text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                        title="Add selected items while matching with existing pillars or creating new ones"
                      >
                        <Plus size={14} />
                        <span>Merge with Existing</span>
                      </button>

                      <button
                        onClick={() => handleAddPlanToSadhana(msg, true)}
                        className="px-4 py-2 text-xs font-extrabold rounded-2xl bg-black/10 dark:bg-white/10 text-stone-800 dark:text-white border border-black/10 dark:border-white/15 hover:border-amber-500 hover:text-amber-500 transition-all flex items-center gap-1.5"
                        title="Replace your current pillars and goals with these selected items"
                      >
                        <RotateCcw size={13} />
                        <span>Replace All</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-3 p-4 rounded-3xl bg-white dark:bg-[#181926] border border-black/5 dark:border-white/10 text-xs font-bold text-stone-500 animate-pulse">
            <RefreshCw size={16} className="animate-spin text-accent" />
            <span>Sadhana AI Architect is constructing your protocol…</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Input Prompt Box */}
      <div className="shrink-0 pt-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#181926] border border-black/10 dark:border-white/15 shadow-xl"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask AI to design a workout, hydration, protein, or mindfulness Sadhana..."
            className="flex-1 px-3 py-2 text-xs sm:text-sm font-semibold bg-transparent text-[#18191E] dark:text-white outline-none placeholder:text-stone-400"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-40 shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  );
}
