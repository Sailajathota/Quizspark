const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { quizzes } = require('./quizData');
const mongoose = require('mongoose');
require('dotenv').config();

const Quiz = require('./models/Quiz');
const QuizResult = require('./models/QuizResult');

let useDB = false;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      useDB = true;
    })
    .catch(err => console.error('MongoDB connection error:', err));
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/quizzes', async (req, res) => {
  if (!useDB) return res.status(500).json({error: "Database not configured"});
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.json(quiz);
  } catch(e) {
    res.status(400).json({error: e.message});
  }
});

app.get('/api/results', async (req, res) => {
  if (!useDB) return res.json([]);
  try {
    const results = await QuizResult.find().sort({ date: -1 }).limit(50);
    res.json(results);
  } catch(e) {
    res.status(400).json({error: e.message});
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

function generatePIN() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Fetch quizzes
  socket.on('get-quizzes', async (callback) => {
    if (typeof callback !== 'function') return;
    if (useDB) {
      try {
        const dbQuizzes = await Quiz.find({}, 'title _id');
        callback({ quizzes: dbQuizzes.map(q => ({ id: q._id.toString(), title: q.title })) });
      } catch (e) {
        callback({ error: "Failed to fetch from DB" });
      }
    } else {
      callback({ quizzes: quizzes.map(q => ({ id: q.id, title: q.title })) });
    }
  });

  // Host creates room
  socket.on('create-room', async ({ quizId }, callback) => {
    if (typeof callback !== 'function') return;
    let quiz;
    if (useDB) {
      try {
        const doc = await Quiz.findById(quizId);
        if (doc) {
          quiz = {
            id: doc._id.toString(),
            title: doc.title,
            questions: doc.questions.map(q => ({
              text: q.text,
              options: q.options,
              correctOption: q.correctOption,
              timeLimit: q.timeLimit
            }))
          };
        }
      } catch(e) { console.error(e) }
    } else {
      quiz = quizzes.find(q => q.id === quizId);
    }
    
    if (!quiz) return callback({ error: "Quiz not found" });

    let pin = generatePIN();
    while (rooms.has(pin)) {
      pin = generatePIN();
    }

    const room = {
      pin,
      quiz,
      hostId: socket.id,
      players: [],
      currentQuestionIndex: -1,
      state: 'lobby', 
      answersThisRound: 0,
      questionStartTime: 0
    };
    rooms.set(pin, room);
    socket.join(pin);
    if (typeof callback === 'function') callback({ success: true, pin, quiz });
  });

  // Player joins room
  socket.on('join-room', ({ pin, name }, callback) => {
    const room = rooms.get(pin);
    if (!room) return typeof callback === 'function' && callback({ error: "Room not found" });
    if (room.state !== 'lobby') return typeof callback === 'function' && callback({ error: "Game already started" });

    const player = {
      id: socket.id,
      name: name || "Anonymous",
      score: 0,
    };
    room.players.push(player);
    socket.join(pin);

    io.to(room.hostId).emit('player-joined', player);
    if (typeof callback === 'function') callback({ success: true, pin, state: room.state });
  });

  // Host starts game
  socket.on('start-game', ({ pin }) => {
    const room = rooms.get(pin);
    if (room && room.hostId === socket.id) {
      room.state = 'question';
      room.currentQuestionIndex = 0;
      room.answersThisRound = 0;
      room.questionStartTime = Date.now();
      const currentQ = room.quiz.questions[0];
      io.to(pin).emit('question-started', {
        questionIndex: room.currentQuestionIndex,
        question: {
          text: currentQ.text,
          options: currentQ.options,
          timeLimit: currentQ.timeLimit
        }
      });
    }
  });

  // Player answers
  socket.on('submit-answer', ({ pin, answerIndex }, callback) => {
    const room = rooms.get(pin);
    if (!room || room.state !== 'question') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    let isCorrect = (answerIndex === currentQ.correctOption);
    
    if (isCorrect) {
      const timeTaken = (Date.now() - room.questionStartTime) / 1000;
      const timeLimit = currentQ.timeLimit;
      const scoreAdd = Math.max(10, Math.round(1000 * (1 - (timeTaken / (timeLimit * 2)))));
      player.score += scoreAdd;
    }

    room.answersThisRound++;
    
    io.to(room.hostId).emit('player-answered', { answersCount: room.answersThisRound });
    
    if (typeof callback === 'function') callback({ success: true, isCorrect, score: player.score });
  });

  // Host shows leaderboard
  socket.on('show-leaderboard', ({ pin }) => {
    const room = rooms.get(pin);
    if (room && room.hostId === socket.id) {
      room.state = 'leaderboard';
      const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
      const correctAnswer = room.quiz.questions[room.currentQuestionIndex].correctOption;
      io.to(pin).emit('leaderboard', { players: sortedPlayers, correctAnswer });
    }
  });

  // Host moves to next question
  socket.on('next-question', ({ pin }) => {
    const room = rooms.get(pin);
    if (room && room.hostId === socket.id) {
      room.currentQuestionIndex++;
      if (room.currentQuestionIndex >= room.quiz.questions.length) {
        room.state = 'finished';
        const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
        io.to(pin).emit('game-finished', { players: sortedPlayers });
        
        if (useDB && room.quiz.id && room.players.length > 0) {
          try {
            const isValidId = mongoose.Types.ObjectId.isValid(room.quiz.id);
            if (isValidId) {
               QuizResult.create({
                 quizId: room.quiz.id,
                 quizTitle: room.quiz.title,
                 players: sortedPlayers.map(p => ({name: p.name, score: p.score}))
               });
            }
          } catch (e) {
             console.error("Failed to save results:", e);
          }
        }
      } else {
        room.state = 'question';
        room.answersThisRound = 0;
        room.questionStartTime = Date.now();
        const currentQ = room.quiz.questions[room.currentQuestionIndex];
        io.to(pin).emit('question-started', {
          questionIndex: room.currentQuestionIndex,
          question: {
            text: currentQ.text,
            options: currentQ.options,
            timeLimit: currentQ.timeLimit
          }
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
