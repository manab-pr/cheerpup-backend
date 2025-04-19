const mongoose = require('mongoose');
const ExerciseSchema = require('./Exercise');
const ApiChatHistorySchema = require('./ApiChatHistory');
const MoodSchema = require('./Mood');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phoneNumber: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  profileImage: { type: String },
  age: { type: Number },
  gender: { type: String },
  isPhysicalHelpBefore: { type: Boolean },
  isPhysicalDistress: { type: Boolean },
  medicines: [{ type: String }],
  seriousAlertCount: { type: Number, default: 0 },
  exercises: [ExerciseSchema],
  apiChatHistory: [ApiChatHistorySchema],
  moods: [MoodSchema], 
  isAdmin: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false }
}, { timestamps: true }); 

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
