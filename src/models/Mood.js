const mongoose = require('mongoose');

// Mood schema

const MoodSchema = new mongoose.Schema({
  moodRating: { type: Number, min: 1, max: 5, required: true },
  mood: {
    type: String,
    enum: ['Rough', 'Low', 'Okay', 'Good', 'Great'],
  },
}, { timestamps: true }); 

module.exports = MoodSchema;
