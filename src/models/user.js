const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  moodRating: { type: Number, min: 1, max: 5 },
  mood: {
    type: String,
    enum: ['Very Bad', 'Bad', 'Neutral', 'Good', 'Excellent'], 
  },
});

const ExerciseSchema = new mongoose.Schema({
  name: { type: String },
  durationInDays: { type: Number },
  streak: [{ type: Number, enum: [0, 1] }] 
});

const ApiChatHistorySchema = new mongoose.Schema({
  userMessage: { type: String, required: true },
  systemMessage: { type: String, required: true },
  suggestedExercise: { type: String },
  suggestedActivity: { type: String },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, unique: true },
  profileImage: {type: String},
  age: { type: Number },
  gender: { type: String },
  isPhysicalHelpBefore: { type: Boolean },
  isPhysicalDistress: { type: Boolean },
  medicines: [{ type: String }],
  exercises: [ExerciseSchema],
  apiChatHistory: [ApiChatHistorySchema],
  moods: [MoodSchema],
  seriousAlertCount: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', UserSchema);
