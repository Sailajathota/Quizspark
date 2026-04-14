import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function SignIn() {
  const [srn, setSrn] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!srn || !password) return setError("Please enter SRN and password");
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srn, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('quizspark_token', data.token);
        localStorage.setItem('quizspark_user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.error || "Failed to authenticate.");
      }
    } catch (err) {
      setError("Server error during login.");
    }
  };

  return (
    <div className="center-screen gradient-bg app-container">
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Sign In</h2>
        {error && <div style={{ color: 'red', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSignIn} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <input 
            type="text" 
            placeholder="SRN" 
            className="input-field"
            value={srn}
            onChange={(e) => setSrn(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn btn-dark" style={{ padding: '16px', fontSize: '1.25rem' }}>
            Sign In
          </button>
        </form>
        <div style={{ marginTop: '1rem' }}>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
