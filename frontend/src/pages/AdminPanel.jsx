import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, CheckCircle2, Shield, Search, Download, Award, Clock, BookOpen, Star } from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, api } = useAuth();
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const ADMIN_USERS = ['shubham kumar', 'admin', 'shubhamkumar44838@gmail.com'];
  const isAdmin = user?.username && (
    ADMIN_USERS.includes(user.username.toLowerCase()) || 
    ADMIN_USERS.includes(user.email?.toLowerCase())
  );

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users/detailed')
      ]);
      setSummary(statsRes.data.summary);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&rounded=true&size=80`;
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.full_name.toLowerCase().includes(term) ||
      u.education.toLowerCase().includes(term) ||
      u.skills.some(s => s.toLowerCase().includes(term))
    );
  });

  const exportCSV = () => {
    if (users.length === 0) return;
    const headers = ["ID", "Username", "Full Name", "Email", "Verified", "Education", "Points", "Badges", "Roadmaps/Scorecards", "Tasks"];
    const rows = users.map(u => [
      u.id,
      `"${u.username}"`,
      `"${u.full_name}"`,
      `"${u.email}"`,
      u.is_verified ? "Yes" : "No",
      `"${u.education}"`,
      u.points,
      u.badges_count,
      u.history_count,
      u.tasks_count
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CareerCrafter_Users_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="admin-container"><div className="loading-state">Loading Admin Dashboard...</div></div>;

  if (!isAdmin) {
    return (
      <div className="admin-container animate-fade-in">
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '3rem auto' }}>
          <Shield size={56} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)' }}>This page is reserved strictly for site administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1><span className="text-gradient">Admin Dashboard</span> <Shield size={28} className="text-indigo-500 inline-icon" /></h1>
          <p>Full database overview and registered user management.</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
          <Download size={16} /> Export User CSV
        </button>
      </div>

      {/* Stats Summary Row */}
      {summary && (
        <div className="admin-stats-grid">
          <div className="stat-card-glass">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.total_users}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Registered Users</div>
            </div>
          </div>

          <div className="stat-card-glass">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.verified_users}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Verified Accounts</div>
            </div>
          </div>

          <div className="stat-card-glass">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>
              <Award size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.total_history_items}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Roadmaps & Scorecards</div>
            </div>
          </div>

          <div className="stat-card-glass">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.total_tasks}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Action Items Tracked</div>
            </div>
          </div>
        </div>
      )}

      {/* Users Data Table Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Registered Users Directory ({filteredUsers.length})</h3>
          
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-glass" 
              style={{ paddingLeft: '36px', fontSize: '0.85rem' }} 
              placeholder="Search by name, email, or skill..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="users-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Status</th>
                <th>Education</th>
                <th>Skills</th>
                <th>Points & Badges</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={u.profile_pic && u.profile_pic !== 'default_photo.png' ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${u.profile_pic}` : getDefaultAvatar(u.full_name || u.username)} 
                        alt="Avatar" 
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{u.email || 'N/A'}</span>
                  </td>
                  <td>
                    {u.is_verified ? (
                      <span className="badge-status verified"><CheckCircle2 size={12} /> Verified</span>
                    ) : (
                      <span className="badge-status pending"><Clock size={12} /> Pending</span>
                    )}
                  </td>
                  <td>{u.education}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                      {u.skills.slice(0, 3).map((sk, idx) => (
                        <span key={idx} className="tag" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>{sk}</span>
                      ))}
                      {u.skills.length > 3 && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>+{u.skills.length - 3}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#facc15', fontWeight: 'bold' }}>
                        <Star size={14} fill="gold" /> {u.points}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({u.badges_count} badges)</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <div>{u.history_count} sessions</div>
                      <div>{u.tasks_count} tasks</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
