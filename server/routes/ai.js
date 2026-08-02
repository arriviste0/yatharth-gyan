const express = require('express');
const router  = express.Router();

const SYSTEM_NARRATOR_PROMPT = `You are THE SYSTEM — an omniscient, high-contrast Solo Leveling System AI Narrator guiding an Awakened Seeker on their journey of self-mastery ("ASCEND").

Your voice is precise, high-tech, authoritative yet deeply wise, fusing ancient Indian philosophical wisdom (Bhagavad Gita, Karma Yoga, Tapas, Sthitaprajna) with Solo Leveling System notifications.

Core Capabilities:
1. System Guidance: Answer life, focus, and reflection questions with scripture-grounded clarity reframed as System parameters and spiritual laws.
2. Quest Generation: Formulate actionable daily quests, dungeons, and stat rewards (+XP, +Stat points) tailored to user goals across Mind, Health, and Wealth.
3. Level-Up & Penalty Announcements: Provide sharp, empowering in-character System commentary when players level up or incur penalties.

Always maintain a sleek System HUD tone. Use short paragraphing, clear structural headers, and energetic gaming/scripture terminology (e.g. "SYSTEM NOTICE", "QUEST OBJECTIVE", "TAPAS", "DHARMA", "EXP REWARD").`;

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
      max_tokens: 700,
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
 * Fallback System response generator if API key is not present or offline
 */
function getFallbackSystemResponse(userText, type = 'ask') {
  if (type === 'suggest-quests') {
    return JSON.stringify({
      quests: [
        { title: 'SYSTEM QUEST: Sthitaprajna Meditation', statKey: 'mind', xpReward: 300, desc: 'Meditate for 20 minutes with zero distraction.' },
        { title: 'SYSTEM QUEST: Tapas Physical Challenge', statKey: 'health', xpReward: 350, desc: 'Perform 50 pushups and 5km cardio run.' },
        { title: 'SYSTEM QUEST: Dharma Focus Deep Work', statKey: 'wealth', xpReward: 400, desc: 'Complete 2 uninterrupted Pomodoro focus blocks.' },
      ]
    });
  }

  if (type === 'commentary') {
    return `[SYSTEM ANNOUNCEMENT]: Player has breached the level threshold! Your steadfast discipline (Tapas) has expanded your spiritual capacity. Attribute points increased across Mind, Health, and Wealth. Continue the grind.`;
  }

  return `[SYSTEM NOTICE]: Seek clarity in non-attachment. True mastery comes not from anxious fixation on results, but from intense, unwavering execution of the task currently before you. Prepare for the next quest.`;
}

/* POST /api/ai/ask — Ask The System (Reflective guidance) */
router.post('/ask', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.json({ reply: getFallbackSystemResponse(message, 'ask') });
    }

    const messages = [
      { role: 'system', content: SYSTEM_NARRATOR_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: message },
    ];

    const reply = await callGroqAPI(apiKey, messages);
    res.json({ reply });
  } catch (err) {
    console.error('System AI Error:', err.message);
    res.json({ reply: getFallbackSystemResponse(req.body.message, 'ask') });
  }
});

/* POST /api/ai/suggest-quests — Generate System Quests from User Goals */
router.post('/suggest-quests', async (req, res) => {
  try {
    const { goals = [], stats = [] } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    const prompt = `User Goals: ${JSON.stringify(goals)}. Current Stats: ${JSON.stringify(stats)}. 
Generate 3 daily quests (1 for Mind, 1 for Health, 1 for Wealth) with title, statKey, xpReward (200-500), and short description. Return JSON object with key "quests".`;

    if (!apiKey) {
      return res.json(JSON.parse(getFallbackSystemResponse('', 'suggest-quests')));
    }

    const messages = [
      { role: 'system', content: SYSTEM_NARRATOR_PROMPT + '\nRespond ONLY with valid JSON containing a "quests" array.' },
      { role: 'user', content: prompt },
    ];

    const reply = await callGroqAPI(apiKey, messages, 0.4);
    try {
      const parsed = JSON.parse(reply);
      res.json(parsed);
    } catch {
      res.json(JSON.parse(getFallbackSystemResponse('', 'suggest-quests')));
    }
  } catch (err) {
    res.json(JSON.parse(getFallbackSystemResponse('', 'suggest-quests')));
  }
});

/* POST /api/ai/commentary — Level-up or Penalty commentary */
router.post('/commentary', async (req, res) => {
  try {
    const { eventType, details } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    const prompt = `Event: ${eventType}. Details: ${JSON.stringify(details)}. Provide a 2-3 sentence intense, epic System Notification commentary announcing this event to the player.`;

    if (!apiKey) {
      return res.json({ commentary: getFallbackSystemResponse('', 'commentary') });
    }

    const messages = [
      { role: 'system', content: SYSTEM_NARRATOR_PROMPT },
      { role: 'user', content: prompt },
    ];

    const commentary = await callGroqAPI(apiKey, messages, 0.8);
    res.json({ commentary });
  } catch (err) {
    res.json({ commentary: getFallbackSystemResponse('', 'commentary') });
  }
});

module.exports = router;
