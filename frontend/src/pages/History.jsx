import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { Clock, History as HistoryIcon, Target, BookOpen, Download, ExternalLink, PlayCircle, Trash2 } from 'lucide-react';
import './History.css';

const History = () => {
  const { user, api } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/ai/history/${user.username}`);
      setHistory(response.data.reverse()); // Show newest first
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  const handleDownloadPDF = (id) => {
    const element = document.getElementById(`history-content-${id}`);
    if (!element) return;
    const opt = {
      margin:       10,
      filename:     `Career_Roadmap_History_${id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this history item?")) return;
    try {
      await api.delete(`/ai/history/${user.username}/${id}`);
      setHistory(history.filter(h => h.id !== id));
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  const parseResources = (resStr) => {
    if (!resStr) return { resources: [], tasks: [] };
    try {
      const parsed = JSON.parse(resStr);
      if (Array.isArray(parsed)) return { resources: parsed, tasks: [] };
      return { resources: parsed.resources || [], tasks: parsed.tasks || [] };
    } catch { 
      return { resources: [], tasks: [] }; 
    }
  };

  return (
    <div className="history-container">
      <div className="page-header">
        <h1><span className="text-gradient">Your History</span> <HistoryIcon size={28} className="inline-icon text-yellow-500" /></h1>
        <p>Review your past career roadmaps and track how your goals have evolved over time.</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="glass-panel empty-state">
          <Clock size={48} className="empty-icon" />
          <h3>No history found</h3>
          <p>Head over to the AI Career Advisor to generate your first roadmap.</p>
        </div>
      ) : (
        <div className="timeline">
          {history.map((entry, idx) => (
            <div key={entry.id} className="timeline-item animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
              <div className="timeline-marker"></div>
              
              <div className={`glass-panel timeline-content ${expandedId === entry.id ? 'expanded' : ''}`}>
                <div className="timeline-header" onClick={() => toggleExpand(entry.id)}>
                  <div className="header-left">
                    <h3>Goal: {entry.goal || 'General Career Advice'}</h3>
                    <div className="context-badges">
                      <span className="badge"><BookOpen size={14} /> {entry.education}</span>
                      <span className="badge"><Target size={14} /> {entry.skills.split(',').length} Skills</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      onClick={(e) => handleDelete(e, entry.id)} 
                      className="btn-outline" 
                      style={{ border: 'none', color: 'red', padding: '5px' }}
                      title="Delete this history"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button className="expand-btn">
                      {expandedId === entry.id ? 'Collapse' : 'View Full Roadmap'}
                    </button>
                  </div>
                </div>
                
                {expandedId === entry.id && (
                  <div className="timeline-body">
                    <hr className="divider" />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleDownloadPDF(entry.id); }} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px', fontSize: '12px' }}>
                        <Download size={14} /> Export PDF
                      </button>
                    </div>
                    <div id={`history-content-${entry.id}`} className="markdown-content" style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderRadius: '8px' }}>
                      <ReactMarkdown>{entry.response}</ReactMarkdown>
                    </div>
                    
                    {(() => {
                      const { resources, tasks } = parseResources(entry.resources);
                      return (
                        <>
                          {resources.length > 0 && (
                            <div className="resources-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-glass)' }}>
                              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontSize: '1.25rem' }}>
                                <BookOpen size={20} className="text-pink-500" /> Recommended Resources
                              </h3>
                              <div className="resources-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {resources.map((resource, idx) => (
                                  <div key={idx} className="resource-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div className="resource-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                      {resource.platform.toLowerCase().includes('youtube') ? (
                                        <PlayCircle size={20} color="#ff0000" />
                                      ) : (
                                        <BookOpen size={20} color="var(--accent-primary)" />
                                      )}
                                      <span className="platform-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                        {resource.platform}
                                      </span>
                                    </div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{resource.title}</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>{resource.description}</p>
                                    <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                                      View Course <ExternalLink size={14} />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {tasks.length > 0 && (
                            <div className="tasks-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-glass)' }}>
                              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontSize: '1.25rem' }}>
                                <Target size={20} className="text-blue-500" /> Recommended Action Items
                              </h3>
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {tasks.map((task, idx) => (
                                  <li key={idx} style={{ padding: '10px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-glass)', fontSize: '0.95rem' }}>
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
