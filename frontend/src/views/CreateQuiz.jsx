import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 20 }
  ]);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 20 }]);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQ = [...questions];
    newQ[qIndex].options[optIndex] = value;
    setQuestions(newQ);
  };

  const handleCreate = async () => {
    if (!title) return setStatus('Please add a title!');
    try {
      setStatus('Saving...');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, questions })
      });
      if (res.ok) {
        setStatus('Saved! Taking you back to host...');
        setTimeout(() => navigate('/host'), 2000);
      } else {
        const error = await res.json();
        setStatus(`Error: ${error.error}`);
      }
    } catch(err) {
      setStatus('Failed to connect to backend.');
    }
  };

  return (
    <div className="center-screen" style={{ justifyContent: 'flex-start', padding: '2rem', overflowY: 'auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Create a New Quiz</h1>
      
      {status && <div className="status-badge" style={{ background: '#333', color: 'white' }}>{status}</div>}

      <div className="card" style={{ maxWidth: '800px', marginBottom: '2rem' }}>
        <input 
          className="input-field" 
          placeholder="Quiz Title" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          style={{ fontSize: '2rem', textAlign: 'left' }}
        />
      </div>

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="card" style={{ maxWidth: '800px', marginBottom: '2rem', background: '#f9f9f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Question {qIndex + 1}</h3>
          </div>
          <input 
            className="input-field" 
            placeholder="Type your question..." 
            value={q.text}
            onChange={(e) => {
              const newQ = [...questions];
              newQ[qIndex].text = e.target.value;
              setQuestions(newQ);
            }}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            {q.options.map((opt, optIndex) => (
              <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="radio" 
                  name={`correct-${qIndex}`} 
                  checked={q.correctOption === optIndex}
                  onChange={() => {
                    const newQ = [...questions];
                    newQ[qIndex].correctOption = optIndex;
                    setQuestions(newQ);
                  }}
                  title="Mark as correct"
                />
                <input 
                  className="input-field" 
                  style={{ marginBottom: 0, padding: '10px', fontSize: '1rem' }}
                  placeholder={`Option ${optIndex + 1}`} 
                  value={opt}
                  onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '1rem', paddingBottom: '4rem' }}>
        <button className="btn btn-secondary" onClick={handleAddQuestion}>+ Add Another Question</button>
        <button className="btn btn-primary" onClick={handleCreate}>Save Quiz</button>
      </div>
    </div>
  );
}
