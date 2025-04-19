const User = require('../models/User');
const openai = require('../config/openai');

// ✅ Utility to validate if YouTube link is likely working
const isLikelyValidYouTubeLink = (link) => {
  if (!link || typeof link !== 'string') return false;
  return (
    link.includes('youtube.com/watch?v=') ||
    link.includes('youtu.be/')
  );
};

// ✅ Controller: Handle user emotion, send to GPT, store & respond
const handleUserEmotion = async (req, res) => {
  try {
    const { userId, feelingText } = req.body;

    if (!userId || !feelingText) {
      return res.status(400).json({ error: 'userId and feelingText are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Build GPT prompt from user info + message
    const prompt = buildPrompt(user, feelingText);

    const gptRes = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `
You are CheerPup, an emotionally intelligent wellness companion and trusted friend.

Your tone is warm, kind, and human. You're talking to someone who wants emotional support — be real and friendly.

Your tasks:
- Give a short, supportive message based on how the user feels
- Suggest 1 calming activity or mental exercise
- Recommend 1 music track (Hindi, English, Lo-fi, Mood-based)

⚠️ Music Rules (very important):
- The music **must** be on YouTube and **currently available**
- Do **not** suggest videos that are private, deleted, or restricted
- It must be **latest music** (from recent years)
- No defaulting to “Weightless - Marconi Union”
- You can use Hindi, English, or Lo-fi based on mood

Return the response as raw JSON only — NO markdown, NO code blocks.
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
        suggestedMusicLink: { title: null, link: null },
        mood: { mood: 'Okay', moodRating: 3 },
      };
    }

    // ✅ Validate music link
    const finalMusicLink = isLikelyValidYouTubeLink(parsed.suggestedMusicLink?.link)
      ? parsed.suggestedMusicLink
      : { title: null, link: null };

    // ✅ Save to chat history
    user.apiChatHistory.push({
      userMessage: feelingText,
      systemMessage: parsed.response,
      suggestedExercise: Array.isArray(parsed.suggestedExercise) ? parsed.suggestedExercise : [],
      suggestedActivity: Array.isArray(parsed.suggestedActivity) ? parsed.suggestedActivity : [],
      suggestedMusicLink: finalMusicLink,
    });

    // ✅ Save mood
    if (parsed.mood) {
      user.moods.push({
        mood: parsed.mood.mood,
        moodRating: parsed.mood.moodRating,
      });
    }

    await user.save();

    // ✅ Return to frontend
    res.json({
      response: parsed.response,
      suggestedActivity: parsed.suggestedActivity,
      suggestedExercise: parsed.suggestedExercise,
      suggestedMusicLink: finalMusicLink,
      mood: parsed.mood,
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ GPT Prompt Builder (includes user background)
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
  "response": "short & kind message",
  "suggestedActivity": ["..."],  // calming, doable now
  "suggestedExercise": ["..."],  // optional, mental/physical
  "suggestedMusicLink": {
    "title": "title of track",
    "link": "valid public YouTube URL"
  },
  "mood": {
    "mood": "Rough" | "Low" | "Okay" | "Good" | "Great",
    "moodRating": 1 to 5
  }
}

⚠️ Instructions:
- Music must be recent and working on YouTube
- NEVER return links that are deleted/private
- Prefer Hindi, English, Lo-fi songs — choose based on user mood
- Don’t suggest the same song again and again
- Return valid JSON only (no markdown or code blocks)`;
}

module.exports = { handleUserEmotion };
