import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Award, Target, Compass, Users, CheckCircle, Circle, Trophy, Star, X } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, api } = useAuth();
  const [profile, setProfile] = useState({
    full_name: '', age: '', education: '', interests: [], skills: [], linkedin_url: '', github_url: '', gender: '', points: 0, badges: ''
  });
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get(`/tasks/${user.username}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/profiles/${user.username}`);
      setProfile(response.data);
      setFormData({
        ...response.data,
        interests: response.data.interests.join(', '),
        skills: response.data.skills.join(', ')
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updatedData = {
        full_name: formData.full_name,
        age: parseInt(formData.age) || 18,
        education: formData.education,
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i),
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        gender: formData.gender || '',
        linkedin_url: formData.linkedin_url || '',
        github_url: formData.github_url || ''
      };
      
      const response = await api.put(`/profiles/${user.username}`, updatedData);
      setProfile(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    try {
      const response = await api.post(`/profiles/${user.username}/avatar`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile({...profile, profile_pic: response.data.profile_pic});
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: response.data.profile_pic }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await api.delete(`/profiles/${user.username}/avatar`);
      setProfile({...profile, profile_pic: null});
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: null }));
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  const getDefaultAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&rounded=true&size=120`;
  };

  const toggleTask = async (taskId, currentStatus) => {
    try {
      const response = await api.put(`/tasks/${taskId}?is_completed=${!currentStatus}`);
      setTasks(tasks.map(t => t.id === taskId ? response.data : t));
      // Refetch profile to update points
      fetchProfile();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (e, taskId) => {
    e.stopPropagation();
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
      // Re-fetch profile in case points need to be synced (if they deleted a completed task, etc)
      fetchProfile();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="page-header">
        <h1>Welcome back, <span className="text-gradient">{profile.full_name || user.username}</span>!</h1>
        <p>Manage your profile and track your career progression.</p>
      </div>

      <div className="dashboard-grid">
        {/* Profile Card */}
        <div className="glass-panel profile-card" style={{ alignSelf: 'flex-start' }}>
          <div className="card-header">
            <h3>My Profile</h3>
            <button 
              className="btn-outline"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <div className="profile-edit-form">
              <div className="input-group">
                <label>Profile Picture</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="input-glass"
                    style={{ padding: '0.5rem', flex: 1 }}
                  />
                  {profile.profile_pic && (
                    <button type="button" onClick={handleAvatarRemove} className="btn-outline" style={{ borderColor: 'red', color: 'red' }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Age</label>
                <input 
                  type="number" 
                  className="input-glass" 
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Gender</label>
                <select 
                  className="input-glass"
                  value={formData.gender || ''}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="input-group">
                <label>Education</label>
                <select 
                  className="input-glass"
                  value={formData.education}
                  onChange={e => setFormData({...formData, education: e.target.value})}
                >
                  <option value="High School">High School</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="input-group">
                <label>LinkedIn URL</label>
                <input 
                  type="url" 
                  className="input-glass" 
                  value={formData.linkedin_url || ''}
                  onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="input-group">
                <label>GitHub URL</label>
                <input 
                  type="url" 
                  className="input-glass" 
                  value={formData.github_url || ''}
                  onChange={e => setFormData({...formData, github_url: e.target.value})}
                  placeholder="https://github.com/username"
                />
              </div>
              <div className="input-group">
                <label>Skills (comma separated)</label>
                <textarea 
                  className="input-glass" 
                  value={formData.skills}
                  onChange={e => setFormData({...formData, skills: e.target.value})}
                ></textarea>
              </div>
              <div className="input-group">
                <label>Career Interests (comma separated)</label>
                <textarea 
                  className="input-glass" 
                  value={formData.interests}
                  onChange={e => setFormData({...formData, interests: e.target.value})}
                ></textarea>
              </div>
            </div>
          ) : (
            <div className="profile-view">
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <img 
                  src={profile.profile_pic && profile.profile_pic !== 'default_photo.png' ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${profile.profile_pic}` : getDefaultAvatar(profile.full_name || user.username)} 
                  alt="Profile Avatar" 
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary)', backgroundColor: 'var(--bg-secondary)' }} 
                />
              </div>
              <div className="profile-stat-row">
                <div className="stat-icon bg-blue"><BookOpen size={20} /></div>
                <div className="stat-content">
                  <span className="stat-label">Education</span>
                  <span className="stat-value">{profile.education}</span>
                </div>
              </div>
              
              {(profile.linkedin_url || profile.github_url) && (
                <div className="profile-section">
                  <h4>Social Links</h4>
                  <div className="social-links" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.9rem' }}>
                        LinkedIn
                      </a>
                    )}
                    {profile.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.9rem' }}>
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="profile-section">
                <h4><Award size={16} /> Skills</h4>
                <div className="tag-container">
                  {profile.skills.length > 0 ? (
                    profile.skills.map((skill, idx) => (
                      <span key={idx} className="tag tag-primary">{skill}</span>
                    ))
                  ) : (
                    <span className="text-secondary">No skills added yet</span>
                  )}
                </div>
              </div>

              <div className="profile-section">
                <h4><Target size={16} /> Interests</h4>
                <div className="tag-container">
                  {profile.interests.length > 0 ? (
                    profile.interests.map((interest, idx) => (
                      <span key={idx} className="tag tag-secondary">{interest}</span>
                    ))
                  ) : (
                    <span className="text-secondary">No interests added yet</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Cards & Gamification */}
        <div className="action-cards-container" style={{ alignSelf: 'flex-start' }}>
          {/* Gamification Widget */}
          <div className="glass-panel gamification-card mb-4" style={{ padding: '1.5rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} color="var(--accent-primary)" /> Career Progress
              </h3>
              <div className="points-badge">
                <Star size={16} fill="gold" color="gold" /> {profile.points || 0} pts
              </div>
            </div>
            
            <div className="progress-section" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Roadmap Completion</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="progress-bar-bg" style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="progress-bar-fill" style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--gradient-primary)', transition: 'width 0.5s ease-out' }}></div>
              </div>
            </div>

            <div className="task-checklist">
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Your Action Items</h4>
              <div style={{ height: '180px', display: 'flex', flexDirection: 'column' }}>
                {tasks.length > 0 ? (
                  <ul className="custom-scrollbar" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', overflowY: 'auto', paddingRight: '10px' }}>
                    {tasks.map((task) => (
                      <li 
                        key={task.id} 
                        className={`task-item ${task.is_completed ? 'completed' : ''}`}
                        onClick={() => toggleTask(task.id, task.is_completed)}
                        style={{ 
                          display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px', 
                          background: task.is_completed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', 
                          borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                          opacity: task.is_completed ? 0.6 : 1,
                          flexShrink: 0
                        }}
                      >
                        <div style={{ marginTop: '2px', color: task.is_completed ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                          {task.is_completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                        </div>
                        <span style={{ textDecoration: task.is_completed ? 'line-through' : 'none', fontSize: '0.95rem', lineHeight: '1.4', flex: 1 }}>
                          {task.title}
                        </span>
                        <button 
                          onClick={(e) => deleteTask(e, task.id)}
                          className="btn-outline"
                          style={{ border: 'none', padding: '4px', color: 'var(--text-secondary)', opacity: 0.5 }}
                          title="Remove task"
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      Generate an AI roadmap to get personalized action items!
                    </p>
                    <button className="btn-primary btn-sm" onClick={() => navigate('/advisor')}>
                      Go to AI Advisor
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="glass-panel action-card hover-glow" style={{ flex: 1 }}>
              <div className="action-icon bg-gradient-1"><Compass size={16} /></div>
              <h3>Discover Paths</h3>
              <p>Use Gemini AI to analyze your profile and suggest tailored career roadmaps.</p>
              <button className="btn-primary mt-auto btn-sm" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => navigate('/advisor')}>Go to Advisor</button>
            </div>

            <div className="glass-panel action-card hover-glow" style={{ flex: 1 }}>
              <div className="action-icon bg-gradient-2"><Users size={16} /></div>
              <h3>Find Peers</h3>
              <p>Connect with people who share your skills and ambitions using semantic matching.</p>
              <button className="btn-primary mt-auto btn-sm" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => navigate('/peers')}>Find Matches</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
