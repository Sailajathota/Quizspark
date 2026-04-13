import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 20 }
  ]);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('quizspark_user');
    if (!savedUser) return navigate('/');
    const user = JSON.parse(savedUser);
    if (user.role !== 'teacher') return navigate('/');
  }, [navigate]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 20 }]);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQ = [...questions];
    newQ[qIndex].options[optIndex] = value;
    setQuestions(newQ);
  };

  const handleImageUpload = (qIndex, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > 800) {
          height = Math.round((height * 800) / width);
          width = 800;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        const newQ = [...questions];
        newQ[qIndex].image = dataUrl;
        setQuestions(newQ);
      }
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!title) return setStatus('Please add a title!');
    try {
      setStatus('Saving...');
      const token = localStorage.getItem('quizspark_token');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/quizzes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
          <textarea 
            className="input-field" 
            placeholder="Type your question (you can use enter for new lines)..." 
            value={q.text}
            style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
            onChange={(e) => {
              const newQ = [...questions];
              newQ[qIndex].text = e.target.value;
              setQuestions(newQ);
            }}
          />
          
          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Attach Image (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(qIndex, e.target.files[0])} />
            {q.image && <img src={q.image} alt="preview" style={{ marginTop: '1rem', maxHeight: '150px', display: 'block', borderRadius: '4px' }} />}
          </div>
          
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
