const mongoose = require('mongoose');
const ExerciseSchema = require('./Exercise');
const ApiChatHistorySchema = require('./ApiChatHistory');
const MoodSchema = require('./Mood');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phoneNumber: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  age: { type: Number },
  gender: { type: String },
  isPhysicalHelpBefore: { type: Boolean },
  isPhysicalDistress: { type: Boolean },
  medicines: [{ type: String }],
  seriousAlertCount: { type: Number, default: 0 },
  exercises: [ExerciseSchema],
  apiChatHistory: [ApiChatHistorySchema],
  moods: [MoodSchema], // ✅ we're keeping this
  isAdmin: { type: Boolean, default: false },
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
