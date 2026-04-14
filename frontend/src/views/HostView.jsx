import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

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
  const [timeLeft, setTimeLeft] = useState(20);
  const timerRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('quizspark_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    const user = JSON.parse(savedUser);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchQuizzes = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const token = localStorage.getItem('quizspark_token');
        const res = await fetch(`${backendUrl}/api/quizzes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setQuizzes(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchQuizzes();

    socket.on('player-joined', (player) => {
      setPlayers(prev => [...prev, player]);
    });

    socket.on('question-started', ({ question }) => {
      setCurrentQuestion(question);
      setGameState('question');
      setAnswersCount(0);
      setTimeLeft(question.timeLimit || 20);
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
      // Trigger confetti on finish
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    });

    return () => {
      socket.off('player-joined');
      socket.off('question-started');
      socket.off('player-answered');
      socket.off('leaderboard');
      socket.off('game-finished');
    };
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (gameState === 'question' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'question' && timeLeft === 0) {
      handleShowLeaderboard();
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  const handleStartHost = (quizId) => {
    const user = JSON.parse(localStorage.getItem('quizspark_user'));
    socket.emit('create-room', { quizId, hostSrn: user.srn }, (res) => {
      if (res.success) {
        setPin(res.pin);
        setGameState('lobby');
      }
    });
  };

  const handleDeleteQuiz = async (quizId, e) => {
    e.stopPropagation(); // prevent triggering handleStartHost
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const token = localStorage.getItem('quizspark_token');
      const res = await fetch(`${backendUrl}/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== quizId));
      } else {
        alert("Failed to delete quiz");
      }
    } catch (err) {
      alert("Error connecting to server");
    }
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
            <div key={q.id} className="card" style={{ cursor: 'pointer', textAlign: 'center', position: 'relative' }} onClick={() => handleStartHost(q.id)}>
              <button 
                onClick={(e) => handleDeleteQuiz(q.id, e)}
                style={{ 
                  position: 'absolute', top: '10px', right: '10px', background: 'red', color: 'white', 
                  border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}
                title="Delete Quiz"
              >
                X
              </button>
              <h2 style={{ marginBottom: '1rem', marginTop: '1rem' }}>{q.title}</h2>
              <button className="btn btn-primary" style={{ pointerEvents: 'none' }}>Select</button>
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
      <div className="center-screen" style={{ background: '#f0f0f0', justifyContent: 'flex-start', paddingTop: '2rem' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 3rem', alignItems: 'center' }}>
          <div className="timer-circle" style={{ borderColor: timeLeft <= 5 ? '#ff4444' : '#1368ce' }}>
            {timeLeft}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, background: 'white', padding: '10px 25px', borderRadius: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
             🚀 {answersCount} / {players.length}
          </div>
        </div>

        <div className="host-question-text" style={{ fontSize: '2.5rem', textAlign: 'center', maxWidth: '85%', marginBottom: '2rem' }}>{currentQuestion.text}</div>
        
        {currentQuestion.image && (
          <img src={currentQuestion.image} alt="Question" style={{ maxHeight: '35vh', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }} />
        )}
        
        <div className="question-grid" style={{ width: '90%', maxWidth: '1100px' }}>
          {currentQuestion.options.map((opt, i) => (
            <div key={i} className={`answer-option opt-${i}`} style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', borderRadius: '10px' }}>
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
        <h1 style={{ marginBottom: '2rem', fontStyle: 'italic', fontWeight: 900 }}>Leaderboard</h1>
        <ul className="leaderboard-list" style={{ width: '85%', maxWidth: '700px' }}>
          {leaderboard.map((p, i) => (
            <li key={i} className="leaderboard-item" style={{ 
              display: 'flex', justifyContent: 'space-between', padding: '15px 25px', 
              background: 'white', 
              borderLeft: `12px solid ${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'transparent'}`,
              marginBottom: '10px', borderRadius: '10px', fontSize: '1.4rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
              <span style={{ fontWeight: 800 }}>{i + 1}. {p.name}</span>
              <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{p.score} pts</span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: '2.5rem' }}>
          <button className="btn btn-secondary" style={{ padding: '15px 40px', fontSize: '1.3rem' }} onClick={handleNextQuestion}>Next Question</button>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="center-screen gradient-bg">
        <h1 style={{ fontSize: '5rem', marginBottom: '0', fontStyle: 'italic', fontWeight: 900 }}>WINNERS</h1>
        
        <div className="podium-container">
          {leaderboard[1] && (
            <div className="podium-pillar silver">
              <div className="podium-name">{leaderboard[1].name}</div>
              <div className="podium-bar">
                <span className="podium-rank">2</span>
              </div>
            </div>
          )}
          
          {leaderboard[0] && (
            <div className="podium-pillar gold">
              <div className="podium-name">{leaderboard[0].name}</div>
              <div className="podium-bar">
                <span className="podium-rank">1</span>
              </div>
            </div>
          )}
          
          {leaderboard[2] && (
            <div className="podium-pillar bronze">
              <div className="podium-name">{leaderboard[2].name}</div>
              <div className="podium-bar">
                <span className="podium-rank">3</span>
              </div>
            </div>
          )}
        </div>

        <button 
          className="btn btn-secondary" 
          style={{ marginTop: '3rem', padding: '18px 60px', borderRadius: '40px', fontSize: '1.4rem' }} 
          onClick={() => navigate('/')}
        >
          Return Home
        </button>
      </div>
    );
  }

  return null;
}
