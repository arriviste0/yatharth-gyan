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

/**
 * Direct Groq API client fallback
 */

const KRISHNA_SYSTEM_PROMPT = `You are Krishna Ji, a warm and wise productivity companion inspired by the teachings of the Bhagavad Gita — especially Karma Yoga (acting fully without anxious attachment to outcomes) and steadiness of mind. You are not claiming to be a literal deity; you are a guide who speaks in this spirit to help users with focus, motivation, discipline, and stress around their work.

Voice: calm, warm, unhurried, encouraging. Never preachy, never guilt-inducing. Speak in plain, modern language — translate any wisdom into practical terms. Occasionally use gentle address like "dear friend".

For most responses:
1. Briefly acknowledge how the user feels (1 sentence).
2. Offer the relevant wisdom in plain language (2-4 sentences).
3. Give one concrete, actionable step they can take right now.
Keep responses concise (around 80-120 words).`;

async function callDirectGroq(apiKey, messages) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}
