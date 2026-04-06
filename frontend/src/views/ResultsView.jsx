import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResultsView() {
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('Loading...');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const res = await fetch(`${backendUrl}/api/results`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setStatus(data.length === 0 ? 'No quiz results found yet!' : '');
        } else {
          setStatus('Failed to fetch results.');
        }
      } catch (err) {
        setStatus('Could not connect to server.');
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="center-screen" style={{ justifyContent: 'flex-start', padding: '2rem', overflowY: 'auto' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '3rem' }}>Past Quiz Results</h1>
      
      {status && <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{status}</div>}

      <div style={{ width: '100%', maxWidth: '800px' }}>
        {results.map((result, i) => (
          <div key={i} className="card" style={{ marginBottom: '2rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0 }}>{result.quizTitle || 'Custom Quiz'}</h2>
              <div style={{ color: '#666', fontWeight: 600 }}>
                {new Date(result.date).toLocaleString()}
              </div>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {result.players.map((p, j) => (
                <li key={j} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem 0',
                  borderBottom: j !== result.players.length - 1 ? '1px solid #eee' : 'none',
                  fontSize: '1.2rem',
                  fontWeight: j === 0 ? 900 : 600,
                  color: j === 0 ? 'gold' : 'inherit',
                  textShadow: j === 0 ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                }}>
                  <span>{j + 1}. {p.name}</span>
                  <span>{p.score} pts</span>
                </li>
              ))}
              {result.players.length === 0 && (
                <li style={{ color: '#999', fontStyle: 'italic' }}>No players joined this match.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
      
      <button className="btn btn-secondary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>
        Go Back Home
      </button>
    </div>
  );
}
