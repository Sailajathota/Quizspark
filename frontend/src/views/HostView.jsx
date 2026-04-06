import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { useNavigate } from 'react-router-dom';

export default function HostView() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [pin, setPin] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState('select'); // select, lobby, question, leaderboard, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answersCount, setAnswersCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('get-quizzes', (res) => {
      if (res.quizzes) setQuizzes(res.quizzes);
    });

    socket.on('player-joined', (player) => {
      setPlayers(prev => [...prev, player]);
    });

    socket.on('question-started', ({ question }) => {
      setCurrentQuestion(question);
      setGameState('question');
      setAnswersCount(0);
    });

    socket.on('player-answered', ({ answersCount }) => {
      setAnswersCount(answersCount);
    });

    socket.on('leaderboard', ({ players, correctAnswer }) => {
      setLeaderboard(players);
      setCorrectAnswer(correctAnswer);
      setGameState('leaderboard');
    });

    socket.on('game-finished', ({ players }) => {
      setLeaderboard(players);
      setGameState('finished');
    });

    return () => {
      socket.off('player-joined');
      socket.off('question-started');
      socket.off('player-answered');
      socket.off('leaderboard');
      socket.off('game-finished');
    };
  }, []);

  const handleStartHost = (quizId) => {
    socket.emit('create-room', { quizId }, (res) => {
      if (res.success) {
        setPin(res.pin);
        setGameState('lobby');
      }
    });
  };

  const handleStartGame = () => {
    socket.emit('start-game', { pin });
  };

  const handleShowLeaderboard = () => {
    socket.emit('show-leaderboard', { pin });
  };

  const handleNextQuestion = () => {
    socket.emit('next-question', { pin });
  };

  if (gameState === 'select') {
    return (
      <div className="center-screen">
        <h1 style={{ marginBottom: '2rem' }}>Select a Quiz to Host</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {quizzes.map(q => (
            <div key={q.id} className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleStartHost(q.id)}>
              <h2 style={{ marginBottom: '1rem' }}>{q.title}</h2>
              <button className="btn btn-primary">Select</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'lobby') {
    return (
      <div className="center-screen gradient-bg">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2>Join at <span style={{fontWeight: 900}}>localhost:5173</span> with Game PIN:</h2>
          <div className="pin-display">{pin}</div>
        </div>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>Players: {players.length}</div>
          <button className="btn btn-dark" onClick={handleStartGame}>Start Game</button>
        </div>
        <div className="players-grid">
          {players.map((p, i) => (
            <div key={i} className="player-bubble">{p.name}</div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="center-screen" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 2rem' }}>
          <h3>Answers: {answersCount} / {players.length}</h3>
          <button className="btn btn-primary" onClick={handleShowLeaderboard}>Skip / Show Results</button>
        </div>
        <div className="host-question-text">{currentQuestion.text}</div>
        <div className="question-grid">
          {currentQuestion.options.map((opt, i) => (
            <div key={i} className={`answer-option opt-${i}`} style={{ cursor: 'default' }}>
              {opt}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'leaderboard') {
    return (
      <div className="center-screen">
        <h1 style={{ marginBottom: '2rem' }}>Leaderboard</h1>
        <ul className="leaderboard-list">
          {leaderboard.map((p, i) => (
            <li key={i} className="leaderboard-item">
              <span>{i + 1}. {p.name}</span>
              <span>{p.score} pts</span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: '2rem' }}>
          <button className="btn btn-primary" onClick={handleNextQuestion}>Next Question</button>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="center-screen gradient-bg">
        <h1 style={{ fontSize: '4rem', marginBottom: '2rem' }}>Podium</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: '300px' }}>
          {/* VERY simple podium - assuming at least 3 players if available */}
          {leaderboard[1] && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{leaderboard[1].name}</div>
              <div style={{ width: '100px', height: '150px', background: 'silver', display: 'flex', justifyContent: 'center', paddingTop: '1rem', fontSize: '2rem', fontWeight: 900 }}>2</div>
            </div>
          )}
          {leaderboard[0] && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{leaderboard[0].name}</div>
              <div style={{ width: '100px', height: '200px', background: 'gold', display: 'flex', justifyContent: 'center', paddingTop: '1rem', fontSize: '2rem', fontWeight: 900 }}>1</div>
            </div>
          )}
          {leaderboard[2] && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{leaderboard[2].name}</div>
              <div style={{ width: '100px', height: '100px', background: '#cd7f32', display: 'flex', justifyContent: 'center', paddingTop: '1rem', fontSize: '2rem', fontWeight: 900 }}>3</div>
            </div>
          )}
        </div>
        <button className="btn btn-light" style={{ marginTop: '3rem', color: 'black', background: 'white' }} onClick={() => navigate('/')}>Home</button>
      </div>
    );
  }

  return null;
}
