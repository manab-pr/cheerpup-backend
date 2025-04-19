const User = require('../models/user');
const openai = require('../config/openai');

// ✅ Controller to handle user emotion and respond with GPT output
const handleUserEmotion = async (req, res) => {
  try {
    const { userId, feelingText } = req.body;

    if (!userId || !feelingText) {
      return res.status(400).json({ error: 'userId and feelingText are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const prompt = buildPrompt(user, feelingText);

    const gptRes = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `
You are CheerPup — a caring, emotionally intelligent wellness companion.

Always speak like a trusted friend — kind, relaxed, and supportive.

Your tasks:
- Comfort the user with a short, kind message
- Suggest a calming or grounding activity
- Recommend ONE recent music track (Hindi, English, Lo-fi) by **song title only** — NO YouTube link

⚠️ Music Rules:
- Only return the song **title** (no links)
- Must be released in 2012 or later
- Avoid repeated songs or generic answers like “Weightless”
- Pick music based on user's mood and emotion

Respond in raw JSON only. Do NOT use markdown or code blocks.
`.trim(),
        },
        { role: 'user', content: prompt },
      ],
    });

    const content = gptRes.data.choices[0].message.content;

    let parsed;
    try {
      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.warn('⚠️ GPT response not valid JSON.');
      parsed = {
        response: content,
        suggestedActivity: [],
        suggestedExercise: [],
        suggestedMusicLink: { title: null },
        mood: { mood: 'Okay', moodRating: 3 },
      };
    }

    // ✅ Save chat history with just the song title
    user.apiChatHistory.push({
      userMessage: feelingText,
      systemMessage: parsed.response,
      suggestedExercise: Array.isArray(parsed.suggestedExercise) ? parsed.suggestedExercise : [],
      suggestedActivity: Array.isArray(parsed.suggestedActivity) ? parsed.suggestedActivity : [],
      suggestedMusicLink: parsed.suggestedMusicLink?.title
        ? { title: parsed.suggestedMusicLink.title }
        : { title: null },
    });

    // ✅ Save mood if available
    if (parsed.mood) {
      user.moods.push({
        mood: parsed.mood.mood,
        moodRating: parsed.mood.moodRating,
      });
    }

    await user.save();

    // ✅ Respond to frontend
    res.json({
      response: parsed.response,
      suggestedActivity: parsed.suggestedActivity,
      suggestedExercise: parsed.suggestedExercise,
      suggestedMusicLink: parsed.suggestedMusicLink?.title
        ? { title: parsed.suggestedMusicLink.title }
        : { title: null },
      mood: parsed.mood,
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ Builds dynamic GPT prompt using user info and feeling
function buildPrompt(user, feelingText) {
  const qna = [];

  if (typeof user.isPhysicalHelpBefore === 'boolean') {
    qna.push(`- Has sought physical help before: ${user.isPhysicalHelpBefore}`);
  }

  if (typeof user.isPhysicalDistress === 'boolean') {
    qna.push(`- Currently in physical distress: ${user.isPhysicalDistress}`);
  }

  if (user.medicines?.length) {
    qna.push(`- Medicines: ${user.medicines.join(', ')}`);
  }

  if (user.age) {
    qna.push(`- Age: ${user.age}`);
  }

  if (user.gender) {
    qna.push(`- Gender: ${user.gender}`);
  }

  if (user.moods?.length) {
    const lastMood = user.moods[user.moods.length - 1];
    qna.push(`- Last Mood: ${lastMood.mood} (${lastMood.moodRating}/5)`);
  }

  if (user.apiChatHistory?.length) {
    const last = user.apiChatHistory[user.apiChatHistory.length - 1];
    if (last?.suggestedMusicLink?.title) {
      qna.push(`- Last Music Suggested: "${last.suggestedMusicLink.title}"`);
    }
  }

  const background = qna.length
    ? `Here is some background info about the user:\n${qna.join('\n')}`
    : `The user hasn't provided much background info.`;

  return `${background}

The user just said: "${feelingText}"

Please respond in this JSON format:

{
  "response": "short supportive message",
  "suggestedActivity": ["..."],
  "suggestedExercise": ["..."],
  "suggestedMusicLink": {
    "title": "Only the title of the song — no link"
  },
  "mood": {
    "mood": "Rough" | "Low" | "Okay" | "Good" | "Great",
    "moodRating": 1 to 5
  }
}

✅ Rules:
- Only give the song name (no link)
- Must be released in 2012 or after
- Be emotionally intelligent and human
- JSON only — no markdown`;
}

module.exports = { handleUserEmotion };
