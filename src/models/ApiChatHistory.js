const mongoose = require('mongoose');

const ApiChatHistorySchema = new mongoose.Schema({
  userMessage: { type: String, required: true },
  systemMessage: { type: String, required: false },
  suggestedExercise: [{ type: String }],
  suggestedActivity: [{ type: String }],
  suggestedMusicLinks: [
    {
      title: { type: String },
      link: { type: String },
    },
  ],
}, { timestamps: true }); 

module.exports = ApiChatHistorySchema;
