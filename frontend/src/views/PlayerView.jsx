import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PlayerView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('lobby'); // lobby, question, answered, feedback, leaderboard, finished
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);

  const { pin, name, initialGameState } = location.state || {};

  useEffect(() => {
    if (!pin) {
      navigate('/');
      return;
    }

    if (initialGameState) {
      setGameState(initialGameState);
    }

    socket.on('question-started', ({ question }) => {
      setQuestion(question);
      setGameState('question');
      setFeedback(null);
    });

    socket.on('leaderboard', () => {
      setGameState('leaderboard');
    });

    socket.on('game-finished', () => {
      setGameState('finished');
    });

    return () => {
      socket.off('question-started');
      socket.off('leaderboard');
      socket.off('game-finished');
    };
  }, [pin, navigate, initialGameState]);

  const submitAnswer = (index) => {
    setGameState('answered');
    socket.emit('submit-answer', { pin, answerIndex: index }, (res) => {
      if (res.success) {
        setFeedback(res.isCorrect);
        setScore(res.score);
        setTimeout(() => setGameState('feedback'), 500); // show feedback straight away or wait
      }
    });
  };

  if (gameState === 'lobby') {
    return (
      <div className="center-screen gradient-bg">
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>You're in!</h2>
        <p style={{ fontSize: '1.25rem' }}>See your nickname on screen</p>
      </div>
    );
  }

  if (gameState === 'question' && question) {
    return (
      <div className="app-container" style={{ padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 800 }}>
          {question.text || "Choose an answer"}
        </div>
        <div className="question-grid" style={{ flexGrow: 1 }}>
          {question.options.map((opt, i) => (
            <div key={i} className={`answer-option opt-${i}`} onClick={() => submitAnswer(i)}>
              {/* Optional: Add shapes here instead of text if just shapes wanted */}
              {opt}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'answered') {
    return (
      <div className="center-screen gradient-bg">
        <h2>Waiting for others...</h2>
      </div>
    );
  }

  if (gameState === 'feedback') {
    return (
      <div className={`feedback-screen ${feedback ? 'feedback-correct' : 'feedback-wrong'}`}>
        <div style={{ marginBottom: '1rem' }}>{feedback ? 'Correct!' : 'Incorrect'}</div>
        <div className="status-badge">Score: {score}</div>
      </div>
    );
  }

  if (gameState === 'leaderboard') {
    return (
      <div className="center-screen gradient-bg">
        <h2>Waiting for next question...</h2>
        <div className="status-badge" style={{ marginTop: '1rem' }}>Current Score: {score}</div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="center-screen gradient-bg">
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Game Over!</h1>
        <div className="status-badge" style={{ fontSize: '2rem', padding: '1rem 2rem' }}>Final Score: {score}</div>
      </div>
    );
  }

  return <div className="center-screen">Loading...</div>;
}
