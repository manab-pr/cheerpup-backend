const mongoose = require('mongoose');

const ApiChatHistorySchema = new mongoose.Schema({
  userMessage: { type: String, required: true },
  systemMessage: { type: String, required: false },
  suggestedExercise: [{ type: String }],
  suggestedActivity: [{ type: String }],
  suggestedMusicLink: {
    title: { type: String },
  },
});

module.exports = ApiChatHistorySchema;
