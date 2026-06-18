import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { Compass, Sparkles, Loader2, Download, BookOpen, ExternalLink, PlayCircle, Plus, Check } from 'lucide-react';
import './CareerAdvisor.css';

const CareerAdvisor = () => {
  const { user, api } = useAuth();
  const [profile, setProfile] = useState(null);
  const [goal, setGoal] = useState('');
  const [prompt, setPrompt] = useState('What should be my next career step?');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [resources, setResources] = useState([]);
  const [recommendedTasks, setRecommendedTasks] = useState([]);
  const [addedTasks, setAddedTasks] = useState([]);
  const contentRef = React.useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchLatestHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/profiles/${user.username}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchLatestHistory = async () => {
    try {
      const response = await api.get(`/ai/history/${user.username}`);
      if (response.data && response.data.length > 0) {
        const latest = response.data[response.data.length - 1];
        setRoadmap(latest.response);
        
        try {
          if (latest.resources) {
            const parsed = JSON.parse(latest.resources);
            if (Array.isArray(parsed)) {
              setResources(parsed);
              setRecommendedTasks([]);
            } else {
              setResources(parsed.resources || []);
              setRecommendedTasks(parsed.tasks || []);
            }
          }
        } catch (err) {
          console.error("Failed to parse resources JSON", err);
        }
      }
    } catch (error) {
      console.error('Error fetching latest history:', error);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    setRoadmap(null);
    setResources([]);
    
    try {
      const response = await api.post(`/ai/recommend?username=${user.username}`, {
        education: profile.education,
        skills: profile.skills.join(', '),
        interests: profile.interests.join(', '),
        goal: goal,
        prompt: prompt
      });
      
      setRoadmap(response.data.response);
      
      try {
        if (response.data.resources) {
          const parsed = JSON.parse(response.data.resources);
          if (Array.isArray(parsed)) {
            setResources(parsed);
            setRecommendedTasks([]);
          } else {
            setResources(parsed.resources || []);
            setRecommendedTasks(parsed.tasks || []);
          }
        }
      } catch (err) {
        console.error("Failed to parse resources JSON", err);
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      setRoadmap("⚠️ Error connecting to Gemini AI. Please check the API key configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskTitle, index) => {
    try {
      await api.post(`/tasks/${user.username}`, {
        title: taskTitle,
        is_completed: false
      });
      setAddedTasks([...addedTasks, index]);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    const opt = {
      margin:       10,
      filename:     'Career_Roadmap.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(contentRef.current).set(opt).save();
  };

  return (
    <div className="advisor-container animate-fade-in">
      <div className="page-header">
        <h1><span className="text-gradient">AI Career Advisor</span> <Sparkles size={28} className="text-pink-500 inline-icon" /></h1>
        <p>Harness the power of Google Gemini to generate a personalized career roadmap.</p>
      </div>

      <div className="advisor-grid">
        <div className="glass-panel generator-card">
          <div className="card-header">
            <h3>Configuration</h3>
          </div>
          
          <form onSubmit={handleGenerate} className="generator-form">
            <div className="profile-context">
              <h4>Current Profile Context:</h4>
              {profile ? (
                <ul>
                  <li><strong>Education:</strong> {profile.education}</li>
                  <li><strong>Skills:</strong> {profile.skills.length} listed</li>
                  <li><strong>Interests:</strong> {profile.interests.length} listed</li>
                </ul>
              ) : (
                <p>Loading profile...</p>
              )}
            </div>

            <div className="input-group">
              <label>What is your ultimate career goal?</label>
              <input 
                type="text" 
                className="input-glass" 
                placeholder="e.g. Become a Senior Fullstack Engineer at a FAANG company"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Specific Prompt or Question</label>
              <textarea 
                className="input-glass" 
                rows="3"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="btn-primary generate-btn"
              disabled={loading || !profile}
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> Analyzing...</>
              ) : (
                <><Compass size={20} /> Generate Roadmap</>
              )}
            </button>
          </form>
        </div>

        <div className="glass-panel roadmap-card">
          {loading ? (
            <div className="loading-state">
              <div className="pulse-circle"></div>
              <p>Gemini is crafting your personalized career journey...</p>
            </div>
          ) : roadmap ? (
            <div className="roadmap-result-container animate-fade-in">
              <div className="roadmap-header-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <button onClick={handleDownloadPDF} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={16} /> Download PDF
                </button>
              </div>
              <div className="markdown-content" ref={contentRef} style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                <ReactMarkdown>{roadmap}</ReactMarkdown>
              </div>
              
              {resources && resources.length > 0 && (
                <div className="resources-section">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <BookOpen size={20} className="text-pink-500" /> Recommended Resources
                  </h3>
                  <div className="resources-grid">
                    {resources.map((resource, index) => (
                      <div key={index} className="resource-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="resource-header">
                          {resource.platform.toLowerCase().includes('youtube') ? (
                            <PlayCircle size={20} color="#ff0000" />
                          ) : (
                            <BookOpen size={20} color="var(--accent-primary)" />
                          )}
                          <span className="platform-badge">{resource.platform}</span>
                        </div>
                        <h4>{resource.title}</h4>
                        <p>{resource.description}</p>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn-course">
                          View Course <ExternalLink size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendedTasks && recommendedTasks.length > 0 && (
                <div className="resources-section" style={{ marginTop: '2rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <Compass size={20} className="text-blue-500" /> Recommended Action Items
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recommendedTasks.map((task, idx) => {
                      const isAdded = addedTasks.includes(idx);
                      return (
                        <li key={idx} style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                          background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)'
                        }}>
                          <span style={{ fontSize: '0.95rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>{task}</span>
                          <button 
                            className={isAdded ? "btn-outline" : "btn-primary btn-sm"} 
                            onClick={() => !isAdded && handleAddTask(task, idx)}
                            disabled={isAdded}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '6px 12px', opacity: isAdded ? 0.6 : 1, flexShrink: 0 }}
                          >
                            {isAdded ? <><Check size={16} /> Added</> : <><Plus size={16} /> Add to Progress</>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <Compass size={48} className="empty-icon" />
              <h3>Ready to explore?</h3>
              <p>Fill out the configuration and generate your roadmap to see AI insights here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerAdvisor;
