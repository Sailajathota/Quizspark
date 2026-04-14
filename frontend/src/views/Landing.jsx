import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { socket } from '../socket';

export default function Landing() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });
    
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
    
    // Using srn instead of email
    socket.emit('join-room', { pin, name: user.name, email: user.srn }, (res) => {
      if (res.error) {
        setError(res.error);
      } else {
        navigate('/play', { state: { pin, name: user.name, email: user.srn, initialGameState: res.state } });
      }
    });
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
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Welcome to QuizSpark</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <Link to="/signin" className="btn btn-dark" style={{ textAlign: 'center' }}>Sign In</Link>
            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>or</div>
            <Link to="/signup" className="btn btn-secondary" style={{ textAlign: 'center' }}>Sign Up</Link>
          </div>
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

          {(user.role === 'teacher' || user.role === 'admin') && (
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

          {user.role === 'admin' && (
             <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
               <button onClick={() => navigate('/admin')} className="btn btn-dark" style={{ width: '100%', maxWidth: '300px' }}>
                 Admin Dashboard
               </button>
             </div>
          )}
        </>
      )}
    </div>
  );
}
