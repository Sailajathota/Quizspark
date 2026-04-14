import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResultsView() {
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('Loading...');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('quizspark_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    const user = JSON.parse(savedUser);
    if (user.role !== 'teacher') {
      navigate('/');
      return;
    }

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
  }, [navigate]);

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Quiz Title,Date,Rank,Player Name,Player SRN,Score\n";
    
    results.forEach(result => {
      const title = `"${(result.quizTitle || 'Custom Quiz').replace(/"/g, '""')}"`;
      const date = `"${new Date(result.date).toLocaleString().replace(/"/g, '""')}"`;
      result.players.forEach((p, index) => {
        const name = `"${p.name.replace(/"/g, '""')}"`;
        const srn = `"${(p.srn || '').replace(/"/g, '""')}"`;
        const score = p.score;
        const rank = index + 1;
        csvContent += `${title},${date},${rank},${name},${srn},${score}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "quiz_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="center-screen" style={{ justifyContent: 'flex-start', padding: '2rem', overflowY: 'auto' }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '3rem' }}>Past Quiz Results</h1>
      
      {results.length > 0 && (
        <button className="btn btn-primary" style={{ marginBottom: '2rem', background: '#26890C' }} onClick={exportCSV}>
          Download Results (CSV)
        </button>
      )}

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
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: j !== result.players.length - 1 ? '1px solid #eee' : 'none',
                  fontSize: '1.2rem',
                  fontWeight: j === 0 ? 900 : 600,
                  color: j === 0 ? 'gold' : 'inherit',
                  textShadow: j === 0 ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{j + 1}. {p.name}</span>
                    {p.srn && <span style={{ fontSize: '0.9rem', color: '#666', textShadow: 'none', fontWeight: 'normal' }}>{p.srn}</span>}
                  </div>
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
