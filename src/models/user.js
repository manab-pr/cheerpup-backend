import mongoose from 'mongoose';
import ExerciseSchema from './Exercise.js';
import ApiChatHistorySchema from './ApiChatHistory.js';
import MoodSchema from './Mood.js';

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
  exercises: [ExerciseSchema],
  apiChatHistory: [ApiChatHistorySchema],
  moods: [MoodSchema],
  seriousAlertCount: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false }, 
});

const User = mongoose.model('User', UserSchema);

export default User;
