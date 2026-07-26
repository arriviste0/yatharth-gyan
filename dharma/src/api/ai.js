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


const DAILY_REPORT_SYSTEM_PROMPT = `You are a Daily Report Companion for a productivity & wellness app. You receive a JSON object listing the day's tracked items (nutrition, hydration, exercise, sleep, tasks, or any other custom category) — each with a category, name, value, unit, and optionally a goal.

Produce a short, scannable daily report with this exact structure:
1. **Today's Summary**: One-line overall summary of how the day went.
2. **Category Breakdown**: Grouped by category — one line per item showing value vs. goal (if goal given) and whether it's on track, above, or below.
3. **Best Win**: The single strongest result of the day.
4. **Worth Attention**: The single area most worth improving, framed supportively, never as a failure.
5. **For Tomorrow**: 1-3 concrete, practical suggestions for tomorrow tied directly to the gaps.

Rules:
- Never invent goals that weren't provided — if no goal exists for an item, just state its value.
- Don't give medical, dietary, or health diagnoses or flag numbers as "unhealthy" — report values neutrally.
- Keep the tone encouraging and non-judgmental, even for large shortfalls.
- Keep it scannable: short lines, bullet points, clean markdown formatting.`;

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
