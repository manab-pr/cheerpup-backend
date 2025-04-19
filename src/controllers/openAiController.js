const User = require('../models/user');
const openai = require('../config/openai');

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
        { role: 'system', content: 'You are a supportive mental health assistant.' },
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
        suggestedActivity: null,
        suggestedExercise: null,
        suggestedMusicLink: { title: null, link: null },
        mood: { mood: 'Okay', moodRating: 3 },
      };
    }

    // ✅ Save chat + mood history
    user.apiChatHistory.push({
      userMessage: feelingText,
      systemMessage: parsed.response,
      suggestedExercise: parsed.suggestedExercise,
      suggestedActivity: parsed.suggestedActivity,
      suggestedMusicLink: parsed.suggestedMusicLink || { title: null, link: null },
    });

    if (parsed.mood) {
      user.moods.push({
        mood: parsed.mood.mood,
        moodRating: parsed.mood.moodRating,
      });
    }

    await user.save();

    res.json({
      response: parsed.response,
      suggestedActivity: parsed.suggestedActivity,
      suggestedExercise: parsed.suggestedExercise,
      suggestedMusicLink: parsed.suggestedMusicLink || { title: null, link: null },
      mood: parsed.mood,
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

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

  const background = qna.length
    ? `Here is some background info about the user:\n${qna.join('\n')}`
    : `The user hasn't provided much background info.`;

  return `${background}

The user just said: "${feelingText}"

Please respond supportively, and include:
- "response": the empathetic reply
- "suggestedActivity": something light and calming they can do right now
- "suggestedExercise": a helpful physical or mental exercise, or null if not needed
- "suggestedMusicLink": an object with a "title" and "link" to a relaxing track
- "mood": an object with:
  - "mood": one of ['Rough', 'Low', 'Okay', 'Good', 'Great']
  - "moodRating": number between 1 (lowest) and 5 (best)

Return strictly valid JSON. No code blocks or markdown.`;
}

module.exports = { handleUserEmotion };
