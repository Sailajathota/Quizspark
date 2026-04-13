import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';

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

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('Importing CSV...');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        const importedQuestions = results.data.map(row => {
          const qText = row.Question || row.question || row.text || '';
          if (!qText) return null;
          
          const opt1 = row['Option 1'] || row.option1 || row['Option A'] || '';
          const opt2 = row['Option 2'] || row.option2 || row['Option B'] || '';
          const opt3 = row['Option 3'] || row.option3 || row['Option C'] || '';
          const opt4 = row['Option 4'] || row.option4 || row['Option D'] || '';
          
          const correctObj = row['Correct Option'] || row.correctOption || row.correct || '0';
          let correctIndex = parseInt(correctObj);
          if (isNaN(correctIndex)) correctIndex = 0;
          if (correctIndex >= 1 && correctIndex <= 4) correctIndex -= 1;
          else if (correctIndex < 0 || correctIndex > 3) correctIndex = 0;

          const time = row['Time'] || row['Time Limit'] || row.time || '20';

          return {
            text: qText,
            options: [opt1, opt2, opt3, opt4],
            correctOption: correctIndex,
            timeLimit: parseInt(time) || 20
          };
        }).filter(q => q !== null);

        if (importedQuestions.length > 0) {
          setQuestions(importedQuestions);
          setStatus(`Successfully imported ${importedQuestions.length} questions!`);
        } else {
          setStatus('Failed to detect valid questions. Check CSV formatting.');
        }
      }
    });
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
          style={{ fontSize: '2rem', textAlign: 'left', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#eee', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600 }}>Or Import Question Bank (CSV):</div>
          <input type="file" accept=".csv" onChange={handleCSVUpload} />
        </div>
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
