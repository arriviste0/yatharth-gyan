import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles, Send, RefreshCw, Wand2, Plus, Edit2, RotateCcw,
  Check, X, ChevronRight, Layers, Target as TargetIcon, Zap,
  Bot, User, Lightbulb, Dumbbell, BookOpen, Flame
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { createAIPlan, askKrishnaAI } from '../api/ai';

const QUICK_PROMPTS = [
  { label: '💪 Muscle & Protein', prompt: 'Build a 30-day muscle building, 100g protein and daily workout Sadhana plan' },
  { label: '🧘 Morning Meditation', prompt: 'Design a 15-minute morning pranayama, meditation and calm focus routine' },
  { label: '💧 Hydration & Recovery', prompt: 'Optimize my daily hydration (3L), 8hr sleep, and active recovery targets' },
  { label: '📚 Deep Work & Study', prompt: 'Structure a daily 3-hour deep work, reading and skill-building Sadhana' },
];

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

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: `Namaste! 🙏 Welcome to **Sadhana AI Architect**.

💬 **Chat & Ask Anything**: Ask any question about habits, Bhagavad Gita wisdom, wellness, or daily discipline.

🪄 **Create Pillars & Goals**: Whenever you ask me to *"build a 30-day workout plan"*, *"suggest protein targets"*, or *"create a morning routine"*, I will generate an interactive protocol card for you!

✏️ **Edit Before Adding**: You can edit any pillar name, target value, or goal before clicking **Add to My Sadhana**, with 1-click Undo safety anytime!`,
      plan: null,
    }
  ]);
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

  async function handleSendMessage(customText = null) {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg = { id: userMsgId, role: 'user', text: textToSend };

    setMessages(prev => [...prev, newMsg]);
    if (!customText) setInputPrompt('');
    setLoading(true);

    const wantsPlan = isPlanRequest(textToSend);

    try {
      let generatedPlan = null;

      if (wantsPlan) {
        generatedPlan = await createAIPlan(
          { periodLabel: 'Custom AI Request', prompt: textToSend },
          pillars,
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
      setMessages(prev => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          text: conversationalReplyText,
          plan: generatedPlan,
          selectedPillars: generatedPlan ? (generatedPlan.recommendedPillars || []).reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {}) : {},
          selectedGoals: generatedPlan ? (generatedPlan.recommendedGoals || []).reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {}) : {},
        }
      ]);
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

  // Toggle selection checkbox for pillar/goal in message
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

  // Save inline edit to message's plan
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

  // Add selected & edited Pillars/Goals to app storage + trigger UNDO
  function handleAddPlanToSadhana(msg) {
    if (!msg.plan) return;

    const prevPillars = JSON.parse(JSON.stringify(pillars));
    const prevGoals = JSON.parse(JSON.stringify(goals));

    let newPillars = [...pillars];
    let newGoals = [...goals];

    let addedPillarsCount = 0;
    let addedGoalsCount = 0;

    (msg.plan.recommendedPillars || []).forEach((p, idx) => {
      if (msg.selectedPillars[idx]) {
        addedPillarsCount++;
        const existingIdx = newPillars.findIndex(ep => (ep.english || '').toLowerCase() === (p.english || '').toLowerCase());
        if (existingIdx >= 0) {
          const existingPillar = newPillars[existingIdx];
          const combinedTargets = [...(existingPillar.targets || [])];
          (p.targets || []).forEach(t => {
            if (!combinedTargets.some(ct => (ct.name || '').toLowerCase() === (t.name || '').toLowerCase())) {
              combinedTargets.push({
                ...t,
                id: t.id || `target-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
              });
            }
          });
          newPillars[existingIdx] = { ...existingPillar, targets: combinedTargets };
        } else {
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
    });

    (msg.plan.recommendedGoals || []).forEach((g, idx) => {
      if (msg.selectedGoals[idx]) {
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
    setToastMessage(`✨ Added ${addedPillarsCount} Pillars & ${addedGoalsCount} Goals to your Sadhana!`);
    setTimeout(() => setToastMessage(null), 8000);
  }

  function handleUndo() {
    if (!undoState) return;
    setPillars(undoState.prevPillars);
    setGoals(undoState.prevGoals);
    setUndoState(null);
    setToastMessage('🔄 Undone! Restored previous Pillars and Goals.');
    setTimeout(() => setToastMessage(null), 4000);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 px-4 sm:px-6 pt-4">
      
      {/* Header Banner */}
      <div className="card-bento p-5 sm:p-6 bg-gradient-to-r from-accent/15 via-amber-500/10 to-teal-500/15 border border-accent/25 relative overflow-hidden">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-amber-500 text-white flex items-center justify-center shadow-lg shadow-accent/30 shrink-0">
            <Wand2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#18191E] dark:text-white tracking-tight">
                Sadhana AI Architect™
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-accent text-white shadow-xs">
                PRO AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium mt-0.5">
              Conversational AI studio to design personalized Pillars, Habit Trackers & Goals with 1-click addition & live editing!
            </p>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification with UNDO option */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 rounded-2xl bg-[#181926] text-white border border-white/20 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
          <span className="text-xs font-bold flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400 shrink-0" />
            {toastMessage}
          </span>
          {undoState && (
            <button
              onClick={handleUndo}
              className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-accent text-white hover:bg-accent/90 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <RotateCcw size={14} />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* Quick Starter Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-extrabold text-stone-400 shrink-0 flex items-center gap-1">
          <Lightbulb size={13} /> Quick Prompts:
        </span>
        {QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(qp.prompt)}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-extrabold text-stone-700 dark:text-stone-300 hover:border-accent hover:text-accent transition-all shrink-0"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-stone-800 dark:bg-stone-700' : 'bg-accent'
              }`}
            >
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>

            {/* Message Content Container */}
            <div className={`space-y-3 max-w-[85%] sm:max-w-[78%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              {/* Text Bubble */}
              <div
                className={`p-4 rounded-3xl text-xs sm:text-sm font-medium leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-accent text-white rounded-tr-xs'
                    : 'bg-white dark:bg-[#181926] text-[#18191E] dark:text-stone-200 border border-black/5 dark:border-white/10 rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>

              {/* Render AI Proposed Sadhana Plan Card if available */}
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

                  {/* Recommended Pillars List with Checkbox & Inline Edit */}
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
                                /* Inline Pillar Edit Form */
                                <div className="space-y-2 text-xs">
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={editingItem.data.english}
                                      onChange={(e) => setEditingItem(prev => ({ ...prev, data: { ...prev.data, english: e.target.value } }))}
                                      placeholder="Pillar English Name"
                                      className="p-1.5 rounded-xl border border-accent bg-transparent text-[#18191E] dark:text-white font-bold outline-none"
                                    />
                                    <input
                                      type="text"
                                      value={editingItem.data.sanskrit}
                                      onChange={(e) => setEditingItem(prev => ({ ...prev, data: { ...prev.data, sanskrit: e.target.value } }))}
                                      placeholder="Sanskrit Name"
                                      className="p-1.5 rounded-xl border border-accent bg-transparent text-[#18191E] dark:text-white font-bold outline-none"
                                    />
                                  </div>
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
                                      checked={!!msg.selectedPillars[pIdx]}
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
                                    title="Edit Pillar & Targets"
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

                  {/* Recommended Goals List with Checkbox & Inline Edit */}
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
                                /* Inline Goal Edit Form */
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
                                /* Normal View with Checkbox & Edit button */
                                <div className="flex items-start justify-between gap-2">
                                  <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={!!msg.selectedGoals[gIdx]}
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

                  {/* Add to Sadhana Action Button */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleAddPlanToSadhana(msg)}
                      className="px-4 py-2 text-xs font-extrabold rounded-2xl bg-accent text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Add Selected Pillars & Goals to My Sadhana</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 p-4 rounded-3xl bg-white dark:bg-[#181926] border border-black/5 dark:border-white/10 text-xs font-bold text-stone-500 animate-pulse">
            <RefreshCw size={16} className="animate-spin text-accent" />
            <span>Sadhana AI Architect is constructing your protocol…</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Prompt Box */}
      <div className="fixed bottom-16 lg:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2 p-2 rounded-2xl bg-white/90 dark:bg-[#181926]/90 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-2xl"
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
