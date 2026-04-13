import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { GoogleLogin } from '@react-oauth/google';

export default function Landing() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });
    
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem('quizspark_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!pin) {
      setError("Please enter a PIN");
      return;
    }
    
    socket.emit('join-room', { pin, name: user.name }, (res) => {
      if (res.error) {
        setError(res.error);
      } else {
        navigate('/play', { state: { pin, name: user.name, initialGameState: res.state } });
      }
    });
  };

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      if (data.token) {
        setUser(data.user);
        localStorage.setItem('quizspark_token', data.token);
        localStorage.setItem('quizspark_user', JSON.stringify(data.user));
      } else {
        setError("Failed to authenticate.");
      }
    } catch (err) {
      setError("Server error during login.");
    }
  };

  const logout = () => {
    localStorage.removeItem('quizspark_token');
    localStorage.removeItem('quizspark_user');
    setUser(null);
  };

  return (
    <div className="center-screen gradient-bg app-container">
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, fontStyle: 'italic', color: 'white' }}>QuizSpark</h1>
      </div>

      {!user ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Login to Continue</h2>
          {error && <div style={{ color: 'red', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => setError('Login Failed')}
            useOneTap
          />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
            <span>Logged in as <b>{user.name}</b> ({user.role})</span>
            <button onClick={logout} style={{ background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}>Logout</button>
          </div>

          <div className="card" style={{ marginBottom: '2rem' }}>
            {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Join a Quiz</h3>
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column' }}>
              <input 
                type="text" 
                placeholder="Game PIN" 
                className="input-field"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <button type="submit" className="btn btn-dark" style={{ padding: '16px', fontSize: '1.25rem' }}>
                Enter
              </button>
            </form>
          </div>

          {user.role === 'teacher' && (
            <div>
              <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>Teacher Actions</p>
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
          )}
        </>
      )}
    </div>
  );
}
