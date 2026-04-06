const mongoose = require('mongoose');

const PlayerResultSchema = new mongoose.Schema({
  name: String,
  score: Number
});

const QuizResultSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  quizTitle: String,
  date: { type: Date, default: Date.now },
  players: [PlayerResultSchema]
});

module.exports = mongoose.model('QuizResult', QuizResultSchema);
