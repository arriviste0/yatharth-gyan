const express = require('express');
const router  = express.Router();

const KRISHNA_SYSTEM_PROMPT = `You are Krishna Ji, a warm and wise productivity companion inspired by the teachings of the Bhagavad Gita — especially Karma Yoga (acting fully without anxious attachment to outcomes) and steadiness of mind. You are not claiming to be a literal deity; you are a guide who speaks in this spirit to help users with focus, motivation, discipline, and stress around their work.

Voice: calm, warm, unhurried, encouraging. Never preachy, never guilt-inducing. Speak in plain, modern language — translate any wisdom into practical terms. Occasionally (not always) use gentle address like "dear friend" or "seeker".

For most responses:
1. Briefly acknowledge how the user feels (1 sentence).
2. Offer the relevant wisdom in plain language (2-4 sentences).
3. Give one concrete, actionable step they can take right now.
Keep responses concise (around 80-150 words) unless the user asks for more depth.

Do not quote scripture verbatim — paraphrase ideas in your own words. Do not claim religious authority or encourage any specific religious practice. Respect users of all backgrounds. If a user seems to be in real emotional distress beyond ordinary lack of motivation, gently encourage them to also talk to someone they trust or a professional, alongside your encouragement.`;

/**
 * Call Groq Cloud API (OpenAI compatible endpoint)
 */
async function callGroqAPI(apiKey, messages, temperature = 0.7) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Smart fallback persona generator if Groq API key is missing or fails
 */
function getFallbackKrishnaResponse(userText, type = 'ask') {
  const text = (userText || '').toLowerCase();

  if (type === 'shloka') {
    return `Dear friend, this shloka teaches us the essence of Sthitaprajna (steady wisdom). Whatever work you are facing today, approach it with a calm mind. Release the fear of the final result, and dedicate your full presence to the immediate step before you.`;
  }

  if (type === 'note') {
    return `I see the tasks you have assembled. When a list feels long, the mind naturally feels heavy. Do not try to conquer the entire mountain in one breath. Choose the single most meaningful item, focus on it for just 15 minutes without distraction, and let the rest rest. Action brings clarity.`;
  }

  if (type === 'focus') {
    return `Bring your attention fully to this single effort. Let go of past delays and future anxieties. This present moment is your sacred altar of work.`;
  }

  if (text.includes('procrastinat') || text.includes('delay') || text.includes('lazy')) {
    return `Dear friend, it is natural for the mind to seek ease when a task feels heavy. Often we procrastinate not from laziness, but because we fear the outcome won't be perfect. Try this right now: break your task into a tiny 5-minute action. Do only that step, and release the weight of the rest.`;
  }

  if (text.includes('stress') || text.includes('anxious') || text.includes('overwhelm') || text.includes('fear')) {
    return `Breathe deeply. Anxiety arises when the mind leaves the present moment to fight imaginary battles in the future. Remember: you control your effort, never the final result. Focus on the next single step in front of you, and let peace return to your work.`;
  }

  if (text.includes('focus') || text.includes('distract') || text.includes('mind')) {
    return `The mind is restless by nature, like the wind. Do not fight it with anger; gently guide it back to your task each time it wanders. Turn off notifications, pick one duty, and spend 20 unbroken minutes with it.`;
  }

  return `Greetings, seeker. Remember that every step taken with sincerity is progress. Whatever challenge is before you, approach it with dedication to the process, not obsession over the outcome. What specific effort would you like to focus on right now?`;
}

/* ── 1. POST /api/ai/ask-krishna ───────────────────────────────── */
router.post('/ask-krishna', async (req, res) => {
  try {
    const { prompt, conversationHistory = [] } = req.body;
    const apiKey = req.headers['x-groq-api-key'] || process.env.GROQ_API_KEY;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (apiKey && apiKey !== 'gsk_your_groq_api_key_here' && apiKey.startsWith('gsk_')) {
      try {
        const messages = [
          { role: 'system', content: KRISHNA_SYSTEM_PROMPT },
          ...conversationHistory.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text || m.content || '',
          })),
          { role: 'user', content: prompt.trim() },
        ];

        const aiReply = await callGroqAPI(apiKey, messages);
        return res.json({ reply: aiReply, source: 'groq-ai' });
      } catch (groqErr) {
        console.warn('Groq API Call failed, falling back to local persona:', groqErr.message);
      }
    }

    // Fallback response
    const fallbackReply = getFallbackKrishnaResponse(prompt, 'ask');
    return res.json({ reply: fallbackReply, source: 'krishna-fallback' });
  } catch (err) {
    console.error('Ask Krishna Error:', err);
    res.status(500).json({ error: 'Failed to process Krishna AI request' });
  }
});

/* ── 2. POST /api/ai/shloka-insight ────────────────────────────── */
router.post('/shloka-insight', async (req, res) => {
  try {
    const { shloka, userQuery } = req.body;
    const apiKey = req.headers['x-groq-api-key'] || process.env.GROQ_API_KEY;

    if (!shloka) {
      return res.status(400).json({ error: 'Shloka details are required' });
    }

    const shlokaContext = `Shloka: Chapter ${shloka.chapter}, Verse ${shloka.verse}.\nSanskrit: "${shloka.sanskrit}"\nEnglish Translation: "${shloka.english}"\nTheme: ${shloka.theme || 'General Wisdom'}`;
    const userPrompt = userQuery
      ? `Explain how this specific Shloka applies to my situation: "${userQuery}". ${shlokaContext}`
      : `Give a practical, warm 3-sentence productivity reflection on how this Shloka helps me stay focused and calm in daily work. ${shlokaContext}`;

    if (apiKey && apiKey !== 'gsk_your_groq_api_key_here' && apiKey.startsWith('gsk_')) {
      try {
        const messages = [
          { role: 'system', content: KRISHNA_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ];
        const reply = await callGroqAPI(apiKey, messages);
        return res.json({ insight: reply, source: 'groq-ai' });
      } catch (err) {
        console.warn('Groq Shloka insight failed, using fallback:', err.message);
      }
    }

    const fallback = getFallbackKrishnaResponse(shloka.english, 'shloka');
    return res.json({ insight: fallback, source: 'krishna-fallback' });
  } catch (err) {
    console.error('Shloka Insight Error:', err);
    res.status(500).json({ error: 'Failed to generate shloka insight' });
  }
});

/* ── 3. POST /api/ai/note-advice ───────────────────────────────── */
router.post('/note-advice', async (req, res) => {
  try {
    const { title, content, todoItems = [] } = req.body;
    const apiKey = req.headers['x-groq-api-key'] || process.env.GROQ_API_KEY;

    const todoText = todoItems.map(t => `- ${t.text} (${t.done ? 'Done' : 'Pending'})`).join('\n');
    const userPrompt = `Here is my note/task list titled "${title || 'Untitled'}":\n\nContent:\n${content || '(No additional text)'}\n\nTasks:\n${todoText || '(No checklists)'}\n\nPlease give me Krishna Ji's calm guidance on how to prioritize and overcome friction with these tasks today.`;

    if (apiKey && apiKey !== 'gsk_your_groq_api_key_here' && apiKey.startsWith('gsk_')) {
      try {
        const messages = [
          { role: 'system', content: KRISHNA_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ];
        const reply = await callGroqAPI(apiKey, messages);
        return res.json({ advice: reply, source: 'groq-ai' });
      } catch (err) {
        console.warn('Groq Note advice failed, using fallback:', err.message);
      }
    }

    const fallback = getFallbackKrishnaResponse(title + ' ' + content, 'note');
    return res.json({ advice: fallback, source: 'krishna-fallback' });
  } catch (err) {
    console.error('Note Advice Error:', err);
    res.status(500).json({ error: 'Failed to generate note advice' });
  }
});

/* ── 4. POST /api/ai/daily-report (daily-report-skill.md) ────── */
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

router.post('/daily-report', async (req, res) => {
  try {
    const { dailyData } = req.body;
    const apiKey = req.headers['x-groq-api-key'] || process.env.GROQ_API_KEY;

    if (apiKey && apiKey !== 'gsk_your_groq_api_key_here' && apiKey.startsWith('gsk_')) {
      try {
        const messages = [
          { role: 'system', content: DAILY_REPORT_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(dailyData) },
        ];
        const reply = await callGroqAPI(apiKey, messages);
        return res.json({ report: reply, source: 'groq-ai' });
      } catch (err) {
        console.warn('Groq Daily Report failed, using fallback:', err.message);
      }
    }

    const fallbackReport = `**Today's Summary**: Solid effort — nutrition, hydration, and tasks are on track; sleep is the area worth attention.

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

    return res.json({ report: fallbackReport, source: 'daily-report-fallback' });
  } catch (err) {
    console.error('Daily Report Error:', err);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

module.exports = router;
