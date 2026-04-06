const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  correctOption: Number,
  timeLimit: { type: Number, default: 20 }
});

const QuizSchema = new mongoose.Schema({
  title: String,
  questions: [QuestionSchema]
});

module.exports = mongoose.model('Quiz', QuizSchema);
