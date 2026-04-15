import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function SignUp() {
  const [name, setName] = useState('');
  const [srn, setSrn] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role');

  if (!role) {
      return (
        <div className="center-screen gradient-bg app-container">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Sign Up As...</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/signup?role=student" className="btn btn-primary" style={{ background: 'var(--shape-blue)' }}>Student</Link>
              <Link to="/signup?role=teacher" className="btn btn-primary" style={{ background: 'var(--shape-green)' }}>Teacher</Link>
            </div>
            <div style={{ marginTop: '2rem' }}>
              Already have an account? <Link to="/signin">Sign In</Link>
            </div>
          </div>
        </div>
      );
  }

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name || !srn || !password) return setError("Please fill all fields");
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, srn, password, role })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('quizspark_token', data.token);
        localStorage.setItem('quizspark_user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.error || "Failed to sign up.");
      }
    } catch (err) {
      setError("Server error during sign up.");
    }
  };

  return (
    <div className="center-screen gradient-bg app-container">
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', textTransform: 'capitalize' }}>Sign Up ({role})</h2>
        {error && <div style={{ color: 'red', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSignUp} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <input 
            type="text" 
            placeholder="Full Name" 
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input 
            type="text" 
            placeholder={role === 'teacher' ? "Employee ID" : "SRN"} 
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
            Register
          </button>
        </form>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/signup">Go Back</Link> | <Link to="/signin">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
