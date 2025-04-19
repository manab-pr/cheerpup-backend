const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: { type: String },
  durationInDays: { type: Number },
  streak: [{ type: Number, enum: [0, 1] }],
});

module.exports = ExerciseSchema;
