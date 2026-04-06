import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

export default function Landing() {
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!pin || !name) {
      setError("Please enter a PIN and nickname");
      return;
    }
    
    socket.emit('join-room', { pin, name }, (res) => {
      if (res.error) {
        setError(res.error);
      } else {
        navigate('/play', { state: { pin, name, initialGameState: res.state } });
      }
    });
  };

  return (
    <div className="center-screen gradient-bg app-container">
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, fontStyle: 'italic', color: 'white' }}>QuizSpark</h1>
      </div>

      <div className="card">
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column' }}>
          <input 
            type="text" 
            placeholder="Game PIN" 
            className="input-field"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Nickname" 
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-dark" style={{ padding: '16px', fontSize: '1.25rem' }}>
            Enter
          </button>
        </form>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>Are you a teacher?</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => navigate('/host')} className="btn btn-secondary">
            Host a Quiz
          </button>
          <button onClick={() => navigate('/create')} className="btn btn-primary" style={{ background: 'var(--shape-blue)' }}>
            Create New Quiz
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button onClick={() => navigate('/results')} className="btn" style={{ background: 'var(--shape-green)', color: 'white', width: '100%', maxWidth: '300px' }}>
            View Past Results
          </button>
        </div>
      </div>
    </div>
  );
}
