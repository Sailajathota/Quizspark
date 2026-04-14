const mongoose = require('mongoose');

const PlayerResultSchema = new mongoose.Schema({
  name: String,
  srn: String,
  score: Number
});

const QuizResultSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  quizTitle: String,
  hostSrn: String,
  date: { type: Date, default: Date.now },
  players: [PlayerResultSchema]
});

module.exports = mongoose.model('QuizResult', QuizResultSchema);
