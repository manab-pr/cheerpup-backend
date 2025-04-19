const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  moodRating: { type: Number, min: 1, max: 5 },
  mood: {
    type: String,
    enum: ['Very Bad', 'Bad', 'Neutral', 'Good', 'Excellent'],
  },
});

module.exports = MoodSchema;
