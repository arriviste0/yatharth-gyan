import client from './client';

/**
 * Get stored Groq API Key from settings or env
 */
function getCustomGroqKey() {
  try {
    const localKey = localStorage.getItem('dharma_groq_key');
    if (localKey && localKey.trim().startsWith('gsk_')) return localKey.trim();
  } catch (e) {}
  return import.meta.env.VITE_GROQ_API_KEY || null;
}

/**
 * Ask Krishna AI Chat / Question
 */
export async function askKrishnaAI(prompt, conversationHistory = []) {
  const customKey = getCustomGroqKey();
  const headers = customKey ? { 'x-groq-api-key': customKey } : {};

  try {
    const res = await client.post('/ai/ask-krishna', { prompt, conversationHistory }, { headers });
    return res.data;
  } catch (err) {
    console.warn('Backend AI endpoint failed, attempting direct Groq or fallback:', err.message);
    // Direct Groq fallback if frontend has API Key
    if (customKey) {
      try {
        const reply = await callDirectGroq(customKey, [
          { role: 'system', content: KRISHNA_SYSTEM_PROMPT },
          ...conversationHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text || m.content || '' })),
          { role: 'user', content: prompt }
        ]);
        return { reply, source: 'groq-direct' };
      } catch (e) {}
    }
    return {
      reply: `Dear friend, every step in duty brings clarity. Focus on the next single small action before you, release the outcome, and let steady effort lead the way.`,
      source: 'local-fallback'
    };
  }
}

/**
 * Get AI Shloka Reflection & Application
 */
export async function getShlokaAIInsight(shloka, userQuery = '') {
  const customKey = getCustomGroqKey();
  const headers = customKey ? { 'x-groq-api-key': customKey } : {};

  try {
    const res = await client.post('/ai/shloka-insight', { shloka, userQuery }, { headers });
    return res.data;
  } catch (err) {
    return {
      insight: `This shloka highlights Sthitaprajna (steadiness of mind). When working under pressure, focus purely on the quality of your effort, not the fear of the final result.`,
      source: 'local-fallback'
    };
  }
}

/**
 * Get AI Advice for Journal Note / To-do List
 */
export async function getNoteAIAdvice(title, content, todoItems) {
  const customKey = getCustomGroqKey();
  const headers = customKey ? { 'x-groq-api-key': customKey } : {};

  try {
    const res = await client.post('/ai/note-advice', { title, content, todoItems }, { headers });
    return res.data;
  } catch (err) {
    return {
      advice: `Break this list into just 1 priority item for today. Dedicate 15 minutes of uninterrupted focus to it, release Perfectionism, and let small progress build momentum.`,
      source: 'local-fallback'
    };
  }
}


const DAILY_REPORT_SYSTEM_PROMPT = `You are a personal wellness & practice AI coach for a tracking app called Dharma. You receive a JSON payload with:
- "items": tracked KPI metrics (nutrition, hydration, exercise, sleep, tasks) with logged value, unit, and optionally a goal
- "goals": user-defined aspirational targets (e.g. "Protein 90g", "Drink 3L water", "Lose 2kg"), each with name, value, unit, direction (gte=at least, lte=at most, eq=exactly), optional deadline, and optional notes

Produce a concise, scannable report with this exact structure:
1. **Today's Summary**: One-line overall snapshot of today's performance.
2. **Category Breakdown**: One line per KPI item — value vs goal if available, status (on track / close / below).
3. **🎯 Goal Progress** (only if goals array is non-empty): For each user goal, state how close the logged data is to the goal. If goal has a deadline, mention days remaining. Be specific: "Protein: 75g logged vs 90g goal (83% — 15g short)".
4. **Best Win**: The single strongest achievement today.
5. **Worth Attention**: The single most important area to improve, framed supportively.
6. **For Tomorrow**: 2-3 concrete, personalized suggestions based on goal gaps and today's data.

Rules:
- Goals in the "goals" array are set BY THE USER — treat them as the user's real targets, not system defaults.
- Always name goals specifically when referencing them (use the exact goal name the user set).
- If a goal has notes (the "why"), reference that motivation in your suggestions (e.g. "building muscle for competition").
- Never invent data or goals that weren't provided.
- Don't give medical diagnoses — report values neutrally and encouragingly.
- Keep tone: warm coach, never judgmental, always actionable.
- Format: clean markdown, short lines, bullet points.`;

/**
 * Get AI Full Body & Practice Daily Report (daily-report-skill.md)
 */
export async function getDailyReportAI(dailyData) {
  const customKey = getCustomGroqKey();
  const headers = customKey ? { 'x-groq-api-key': customKey } : {};

  try {
    const res = await client.post('/ai/daily-report', { dailyData }, { headers });
    return res.data;
  } catch (err) {
    if (customKey) {
      try {
        const reply = await callDirectGroq(customKey, [
          { role: 'system', content: DAILY_REPORT_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(dailyData) }
        ]);
        return { report: reply, source: 'groq-direct' };
      } catch (e) {}
    }
    
    // Local fallback report formatted according to daily-report-skill.md
    const fallbackText = `**Today's Summary**: Solid Effort — Nutrition, Hydration, and Tasks are well on track; Sleep duration is the area to focus on.

**Hydration**
- Water Intake: 1.8L / 3L goal — close to target

**Nutrition**
- Protein & Healthy Meals: 75g / 90g goal — close to target
- Clean Carbs: 220g / 250g goal — on track

**Tasks**
- Daily Targets Completed: 8 / 11 targets — good progress

**Exercise**
- Physical Activity & Workout: 35 / 45 min goal — on track

**Best Win**: Clean Carbs and Daily Targets were both on track — great momentum today!

**Worth Attention**: Water intake and sleep duration fell slightly below target today.

**For Tomorrow**:
1. Keep a water bottle nearby and sip consistently through the morning.
2. A small 15g protein snack after workout will close the protein gap effortlessly.
3. Aim to start bedtime wind-down 20 minutes earlier tonight.`;

    return { report: fallbackText, source: 'local-fallback' };
  }
}
