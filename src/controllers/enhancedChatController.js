const User = require('../models/UserModel');
const openai = require('../config/openai');

/**
 * POST /api/V1enhanced-chat
 * Description: Enhanced GPT interaction using rich user context and serious concern detection.
 */
const handleEnhancedChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { feelingText } = req.body;

    if (!feelingText) {
      return res.status(400).json({ error: 'feelingText is required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 📦 Build GPT prompt from user context
    const prompt = buildEnhancedPrompt(user, feelingText);

    // 🤖 GPT request
    const gptRes = await openai.createChatCompletion({
        model: 'gpt-4o', // good quality and fast
        messages: [
          {
            role: 'system',
            content: `
      You are CheerPup — an emotionally intelligent, deeply empathetic AI friend trained to support users through emotional ups and downs.
      
      You are not a therapist, but you are wise, warm, and safe — like the best friend who truly listens. Adapt your tone to match the user's emotional state.
      
      CONTEXT UTILIZATION:
      - Reference their recent activities, exercises, and past conversations when relevant
      - Acknowledge patterns in their mood history if provided
      - Tailor your response to their specific demographics and situation
      - Show continuity by occasionally mentioning previous interactions
      
      Your goals:
      - Offer a short, heartfelt, supportive message that feels personalized to their situation
      - Suggest 1 calming activity based on their history and preferences
      - Optionally suggest 1 light physical or mental exercise that builds on their existing routines
      - Recommend 1 recent, emotionally relevant music track (song title only)
      
      ⚠️ Detect SERIOUS messages (e.g., mentions of suicidal thoughts, hopelessness, giving up, self-harm).
      Signs include:
      - Direct statements of harm or hopelessness
      - Sudden negative shift from previous mood patterns
      - Reference to ending things or giving up
      - Explicit mentions of not wanting to continue
      
      If ANY of these are present, add:
      "serious": true
      
      🎵 MUSIC RULES:
      - Only return the **song title** (no link or artist)
      - Must be released after 2012
      - Match the emotional tone of your response
      - Consider user's previous music recommendations
      - Avoid defaulting to "Weightless" unless highly relevant
      
      📦 RESPONSE FORMAT:
      Return STRICT JSON only (no markdown, no extra formatting):
      
      {
        "response": "short kind message",
        "suggestedActivity": ["..."],
        "suggestedExercise": ["..."],
        "suggestedMusicLink": { "title": "..." },
        "mood": {
          "mood": "Rough" | "Low" | "Okay" | "Good" | "Great",
          "moodRating": 1 to 5
        },
        "serious": true | false
      }
      `.trim(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

    const content = gptRes.data.choices[0].message.content;

    // 🧼 Parse GPT JSON safely
    let parsed;
    try {
      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.warn('⚠️ GPT returned non-JSON.');
      parsed = {
        response: content,
        suggestedActivity: [],
        suggestedExercise: [],
        suggestedMusicLink: { title: null },
        mood: { mood: 'Okay', moodRating: 3 },
        serious: false,
      };
    }

    // 🚨 If serious concern is detected, flag it and increment count
    let alertMessage = null;
    if (parsed.serious === true) {
      user.seriousAlertCount = (user.seriousAlertCount || 0) + 1;
      alertMessage = `🚨 We're here for you. If you're feeling overwhelmed or in danger, please reach out to a mental health professional or someone you trust. You're not alone.`;
    }

    // 🧠 Save chat in history
    user.apiChatHistory.push({
      userMessage: feelingText,
      systemMessage: parsed.response,
      suggestedExercise: Array.isArray(parsed.suggestedExercise) ? parsed.suggestedExercise : [],
      suggestedActivity: Array.isArray(parsed.suggestedActivity) ? parsed.suggestedActivity : [],
      suggestedMusicLink: parsed.suggestedMusicLink?.title
        ? { title: parsed.suggestedMusicLink.title }
        : { title: null },
    });

    // 💾 Save mood
    if (parsed.mood) {
      user.moods.push({
        mood: parsed.mood.mood,
        moodRating: parsed.mood.moodRating,
      });
    }

    await user.save();

    // ✅ Final response
    res.json({
      response: parsed.response,
      suggestedActivity: parsed.suggestedActivity,
      suggestedExercise: parsed.suggestedExercise,
      suggestedMusicLink: parsed.suggestedMusicLink?.title
        ? { title: parsed.suggestedMusicLink.title }
        : { title: null },
      mood: parsed.mood,
      serious: parsed.serious || false,
      alert: alertMessage,
    });

  } catch (err) {
    console.error('💥 Enhanced Chat Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * 🔧 Builds prompt with rich user context (profile + last 10 exercises + chats)
 */
function buildEnhancedPrompt(user, feelingText) {
  const lines = [];

  // Basic profile
  if (user.age) lines.push(`- Age: ${user.age}`);
  if (user.gender) lines.push(`- Gender: ${user.gender}`);
  if (user.medicines?.length) lines.push(`- Medicines: ${user.medicines.join(', ')}`);
  if (typeof user.isPhysicalHelpBefore === 'boolean') {
    lines.push(`- Has sought physical help before: ${user.isPhysicalHelpBefore}`);
  }
  if (typeof user.isPhysicalDistress === 'boolean') {
    lines.push(`- Currently in physical distress: ${user.isPhysicalDistress}`);
  }

  if (user.moods?.length) {
    const lastMood = user.moods[user.moods.length - 1];
    lines.push(`- Last Mood: ${lastMood.mood} (${lastMood.moodRating}/5)`);
  }

  // Recent exercises
  if (user.exercises?.length) {
    const last10 = user.exercises.slice(-10);
    lines.push(`\n🧘 Recent Exercises (last 10):`);
    last10.forEach((ex, i) => {
      lines.push(`${i + 1}. ${ex.name} — ${ex.durationInDays} days, Streak: ${ex.streak?.join(',')}`);
    });
  }

  // Chat history
  if (user.apiChatHistory?.length) {
    const last10 = user.apiChatHistory.slice(-10);
    lines.push(`\n💬 Recent Conversations (last 10):`);
    last10.forEach((entry, i) => {
      lines.push(`${i + 1}. User: "${entry.userMessage}" → CheerPup: "${entry.systemMessage}"`);
    });
  }

  return `${lines.join('\n')}

The user just said: "${feelingText}"

Please respond in the strict JSON format described above.
`;
}

module.exports = { handleEnhancedChat };
