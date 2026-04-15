import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminView() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('quizspark_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    const user = JSON.parse(savedUser);
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const token = localStorage.getItem('quizspark_token');
      const res = await fetch(`${backendUrl}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setStatus("Failed to load users");
      }
    } catch(e) {
      setStatus("Server connection error");
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const token = localStorage.getItem('quizspark_token');
      const res = await fetch(`${backendUrl}/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const token = localStorage.getItem('quizspark_token');
      const res = await fetch(`${backendUrl}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
      } else {
        alert("Failed to delete user");
      }
    } catch(e) {
      alert("Error deleting user");
    }
  };

  return (
    <div className="center-screen" style={{ justifyContent: 'flex-start', padding: '2rem', overflowY: 'auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>
      {status && <div style={{ color: 'red', marginBottom: '1rem' }}>{status}</div>}

      <div className="card" style={{ maxWidth: '800px', width: '100%' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc' }}>
              <th style={{ padding: '1rem 0' }}>Name</th>
              <th>Employee ID / SRN</th>
              <th>Current Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem 0', fontWeight: 600 }}>{u.name}</td>
                <td>{u.srn}</td>
                <td>
                  <span style={{ 
                    background: u.role === 'admin' ? '#333' : u.role === 'teacher' ? 'var(--shape-green)' : 'var(--shape-blue)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase'
                  }}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select 
                      value={u.role} 
                      onChange={e => updateRole(u._id, e.target.value)}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button 
                      onClick={() => handleDeleteUser(u._id)}
                      style={{ 
                        background: '#fee2e2', color: '#ef4444', border: 'none', 
                        padding: '8px 12px', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-secondary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>Back Home</button>
    </div>
  );
}
