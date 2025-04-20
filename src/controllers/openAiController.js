const User = require('../models/UserModel');
const openai = require('../config/openai');

//  Handle user's emotional input and generate a friendly,
//  caring response using OpenAI GPT, personalized with their data.


const handleUserEmotion = async (req, res) => {
  try {
    // User ID is pulled from the token (auth middleware already validated it)
    const userId = req.user.id;
    const { feelingText } = req.body;

    if (!feelingText) {
      return res.status(400).json({ error: 'feelingText is required' });
    }

    // Fetch the full user from the database
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Construct a personalized prompt using user history
    const prompt = buildPrompt(user, feelingText);

    // Send prompt to OpenAI GPT
    const gptRes = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `
You are CheerPup — a warm, emotionally intelligent companion and the user's safe space.

You're not a therapist or coach — you're like a trusted best friend: compassionate, emotionally present, and uplifting.

When someone shares how they're feeling, you:
- Respond like a real friend would
- Use supportive, friendly, natural tone (avoid robotic or generic language)
- Validate their feelings warmly
- Suggest one calming, low-effort activity or mindfulness practice
- Recommend one recent, emotionally fitting **song title** (no links)

 MUSIC RULES:
- Must be released in 2012 or later
- Must match the user's emotional state (happy, anxious, down, relaxed, etc.)
- Avoid repeating songs or overused choices like "Weightless"
- Only return the song **title** (no YouTube links)

 OUTPUT FORMAT:
Respond with a **JSON object only** — no markdown, no formatting.

You’ll be given:
- User's mood history, medication, background, and most recent message

Be emotionally present. Write from the heart like a real friend would.
          `.trim(),
        },
        {
          role: 'user',
          content: prompt, // ← includes user background + feelingText
        },
      ],
    });

    // Parse GPT response and ensure valid structure
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
      // If GPT didn't return valid JSON, fallback to raw content as response
      console.warn(' GPT response not valid JSON.');
      parsed = {
        response: content,
        suggestedActivity: [],
        suggestedExercise: [],
        suggestedMusicLink: { title: null },
        mood: { mood: 'Okay', moodRating: 3 },
      };
    }

    //  Add GPT response to user’s chat history
    user.apiChatHistory.push({
      userMessage: feelingText,
      systemMessage: parsed.response,
      suggestedExercise: Array.isArray(parsed.suggestedExercise) ? parsed.suggestedExercise : [],
      suggestedActivity: Array.isArray(parsed.suggestedActivity) ? parsed.suggestedActivity : [],
      suggestedMusicLink: parsed.suggestedMusicLink?.title
        ? { title: parsed.suggestedMusicLink.title }
        : { title: null },
    });

    //  Save user's interpreted mood snapshot from GPT
    if (parsed.mood) {
      user.moods.push({
        mood: parsed.mood.mood,
        moodRating: parsed.mood.moodRating,
      });
    }

    await user.save();

    //  Send GPT reply back to the client
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
    console.error(' Chat error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//  buildPrompt(user, feelingText)
//  Creates a context-rich prompt with personalized data:
//  - mood history
//  - medication
//  - last song
//  - basic demographic info

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

  //  Final full prompt for GPT
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

 Rules:
- Only return the song name (no link)
- Song must be released in 2012 or later
- Match the user's mood
- JSON only — no markdown or formatting`;
}

module.exports = { handleUserEmotion };