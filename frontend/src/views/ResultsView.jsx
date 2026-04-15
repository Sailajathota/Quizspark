import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ChevronDown, ChevronRight, Search, ArrowUpDown, Download, ArrowLeft } from 'lucide-react';

export default function ResultsView() {
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('Loading...');
  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'title'
  const [sortOrder, setSortOrder] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('quizspark_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    const user = JSON.parse(savedUser);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchResults();
  }, [navigate]);

  const fetchResults = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('quizspark_token')}`
        }
      });
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

  const handleDeleteEntireQuiz = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete ALL results for this quiz session?')) return;
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/results/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('quizspark_token')}`
        }
      });
      if (res.ok) {
        setResults(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      alert("Error deleting results");
    }
  };

  const handleDeletePlayer = async (quizId, playerSrn, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this player\'s result?')) return;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/results/${quizId}/player/${playerSrn}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('quizspark_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(prev => prev.map(r => r._id === quizId ? { ...r, players: data.players } : r));
      }
    } catch (err) {
      alert("Error deleting student result");
    }
  };

  const filteredAndSortedResults = useMemo(() => {
    let list = [...results];
    
    // Filter
    if (searchTerm) {
      list = list.filter(r => 
        r.quizTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.srn.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (sortBy === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else if (sortBy === 'title') {
        valA = (a.quizTitle || '').toLowerCase();
        valB = (b.quizTitle || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [results, searchTerm, sortBy, sortOrder]);

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Quiz Title,Date,Rank,Player Name,Employee ID/SRN,Score\n";
    
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

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="center-screen" style={{ justifyContent: 'flex-start', padding: '1.5rem', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '1000px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 600 }}>
              <ArrowLeft size={18} /> Back Home
            </button>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>Quiz Reports</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
             <button className="btn btn-primary" style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={exportCSV}>
               <Download size={20} /> Export All CSV
             </button>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
            <input 
              type="text" 
              placeholder="Search by quiz title or student name/ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => toggleSort('date')} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', background: sortBy === 'date' ? '#f1f5f9' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              Date <ArrowUpDown size={16} />
            </button>
            <button onClick={() => toggleSort('title')} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', background: sortBy === 'title' ? '#f1f5f9' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              Name <ArrowUpDown size={16} />
            </button>
          </div>
        </div>

        {status && <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#64748b', padding: '2rem' }}>{status}</div>}

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAndSortedResults.map((result) => {
            const isExpanded = expandedQuizId === result._id;
            return (
              <div key={result._id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {/* Quiz Header Row */}
                <div 
                  onClick={() => setExpandedQuizId(isExpanded ? null : result._id)}
                  style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isExpanded ? <ChevronDown size={24} color="#64748b" /> : <ChevronRight size={24} color="#64748b" />}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{result.quizTitle || 'Custom Quiz'}</h3>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {new Date(result.date).toLocaleString()} • {result.players.length} Students
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleDeleteEntireQuiz(result._id, e)}
                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
                    title="Delete Session Results"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Expanded Player List */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #e2e8f0', background: '#fafafa', padding: '0 1.25rem 1.25rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 700, textAlign: 'left', fontSize: '0.9rem' }}>
                          <th style={{ padding: '12px 8px' }}>Rank</th>
                          <th style={{ padding: '12px 8px' }}>Student Name</th>
                          <th style={{ padding: '12px 8px' }}>Employee ID / SRN</th>
                          <th style={{ padding: '12px 8px' }}>Score</th>
                          <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...result.players].sort((a,b) => b.score - a.score).map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                            <td style={{ padding: '12px 8px', fontWeight: 700 }}>
                              {idx + 1 === 1 ? '🥇' : idx + 1 === 2 ? '🥈' : idx + 1 === 3 ? '🥉' : idx + 1}
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 600 }}>{p.name}</td>
                            <td style={{ padding: '12px 8px', color: '#64748b' }}>{p.srn}</td>
                            <td style={{ padding: '12px 8px', fontWeight: 900, color: '#0ea5e9' }}>{p.score.toLocaleString()}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <button 
                                onClick={(e) => handleDeletePlayer(result._id, p.srn, e)}
                                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', transition: 'color 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#cbd5e1'}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {result.players.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>No player results recorded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
