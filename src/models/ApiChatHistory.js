const mongoose = require('mongoose');

const ApiChatHistorySchema = new mongoose.Schema({
  userMessage: { type: String, required: true },
  systemMessage: { type: String, required: true },
  suggestedExercise: { type: String },
  suggestedActivity: { type: String },
});

module.exports = ApiChatHistorySchema;
