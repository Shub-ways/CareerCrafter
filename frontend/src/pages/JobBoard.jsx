import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Briefcase, MapPin, DollarSign, Search, Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import './JobBoard.css';

const JobBoard = () => {
  const { user, api } = useAuth();
  const [profile, setProfile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [location, setLocation] = useState('Remote');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/profiles/${user.username}`);
      setProfile(response.data);
      if (response.data.full_name) {
        // Just a default target role based on what they might be interested in, if we had a goal
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const searchJobs = async (e) => {
    e.preventDefault();
    if (!profile) return;
    if (!targetRole.trim()) {
      setError("Please enter a target role to search.");
      return;
    }
    
    setError(null);
    setLoading(true);
    setJobs([]);
    
    try {
      const response = await api.post(`/ai/jobs?username=${user.username}`, {
        target_role: targetRole,
        location: location,
        education: profile.education,
        skills: profile.skills.join(', ')
      });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError("Failed to fetch jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jobboard-container animate-fade-in">
      <div className="page-header">
        <h1><span className="text-gradient">AI Job Matcher</span> <Briefcase size={28} className="text-blue-500 inline-icon" /></h1>
        <p>Find hyper-relevant jobs specifically tailored to your skills and career goals.</p>
      </div>

      <div className="glass-panel search-panel">
        <form onSubmit={searchJobs} className="job-search-form">
          <div className="search-inputs">
            <div className="input-wrapper">
              <Search className="input-icon" size={20} />
              <input 
                type="text" 
                placeholder="Target Role (e.g. Frontend Developer)" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="input-glass"
              />
            </div>
            <div className="input-wrapper">
              <MapPin className="input-icon" size={20} />
              <input 
                type="text" 
                placeholder="Location (e.g. Remote, New York)" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-glass"
              />
            </div>
            <button type="submit" className="btn-primary search-btn" disabled={loading || !profile}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Searching...</> : 'Find Matches'}
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>

      <div className="jobs-results">
        {loading && (
          <div className="loading-state">
            <div className="pulse-circle"></div>
            <p>Our AI is scanning for the best opportunities matching your profile...</p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="jobs-grid">
            {jobs.map((job, idx) => (
              <div key={job.id || idx} className="glass-panel job-card animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
                <div className="job-header">
                  <div>
                    <h3>{job.title}</h3>
                    <p className="company-name">{job.company}</p>
                  </div>
                  <div className="match-score">
                    <span className="score-value">{job.match_score}%</span>
                    <span className="score-label">Match</span>
                  </div>
                </div>
                
                <div className="job-meta">
                  <span className="meta-item"><MapPin size={16} /> {job.location}</span>
                  <span className="meta-item"><DollarSign size={16} /> {job.salary}</span>
                </div>
                
                <p className="job-description">{job.description}</p>
                
                <div className="job-requirements">
                  <h4>Required Skills:</h4>
                  <div className="req-tags">
                    {job.requirements.map((req, i) => {
                      const hasSkill = profile?.skills?.some(s => s.toLowerCase() === req.toLowerCase());
                      return (
                        <span key={i} className={`req-tag ${hasSkill ? 'matched' : 'missing'}`}>
                          {hasSkill && <CheckCircle size={12} />} {req}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                <a href={job.apply_url} onClick={(e) => { e.preventDefault(); alert("This is a simulated job posting! In a real app, this would take you to the application page."); }} className="btn-primary apply-btn">
                  Apply Now <ExternalLink size={16} />
                </a>
              </div>
            ))}
          </div>
        )}

        {!loading && jobs.length === 0 && !error && targetRole && (
          <div className="glass-panel empty-state">
            <Briefcase size={48} className="empty-icon" />
            <h3>No jobs found</h3>
            <p>Try tweaking your target role or location.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobBoard;
