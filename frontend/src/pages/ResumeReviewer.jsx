import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Sparkles, UploadCloud } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './CareerAdvisor.css'; // We can reuse the CareerAdvisor CSS for layout

const ResumeReviewer = () => {
  const { api } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        setResumeFile(null);
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  const handleReview = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      setError('Please upload your resume PDF and provide the target job description.');
      return;
    }
    
    setLoading(true);
    setError('');
    setReview('');

    try {
      const formData = new FormData();
      formData.append('resume_file', resumeFile);
      formData.append('job_description', jobDescription);

      const response = await api.post('/ai/resume-review', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setReview(response.data.review);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred while analyzing your resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="advisor-container animate-fade-in">
      <div className="page-header">
        <h1><span className="text-gradient">AI Resume Reviewer</span> <FileText size={28} className="text-indigo-500 inline-icon" /></h1>
        <p>Paste your resume and target job description to get instant ATS optimization feedback.</p>
      </div>

      <div className="advisor-grid">
        {/* Left Side: Inputs */}
        <div className="generator-card glass-panel">
          <h3 className="section-title">Resume Details</h3>
          
          {error && <div className="error-message" style={{marginBottom: '1rem'}}>{error}</div>}

          <div className="input-group">
            <label>Target Job Description or Goal</label>
            <textarea 
              className="input-glass prompt-input"
              style={{ minHeight: '120px' }}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="e.g., Software Engineer at Google. Requirements: React, Python, AWS..."
            />
          </div>

          <div className="input-group">
            <label>Upload Your Resume (PDF)</label>
            <div className="file-upload-container" style={{ 
              border: '2px dashed var(--border-glass)', 
              borderRadius: 'var(--radius-md)', 
              padding: '2rem', 
              textAlign: 'center',
              background: 'rgba(0,0,0,0.2)',
              cursor: 'pointer',
              position: 'relative'
            }}>
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileChange}
                style={{ 
                  position: 'absolute', 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  opacity: 0, cursor: 'pointer' 
                }}
              />
              <UploadCloud size={40} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
              {resumeFile ? (
                <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{resumeFile.name}</p>
              ) : (
                <>
                  <p style={{ fontWeight: '500' }}>Click to upload or drag and drop</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>PDF files only (max 5MB)</p>
                </>
              )}
            </div>
          </div>

          <button 
            className="btn-primary" 
            onClick={handleReview}
            disabled={loading}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? (
              'Analyzing...'
            ) : (
              <>
                <Sparkles size={18} />
                Analyze Resume
              </>
            )}
          </button>
        </div>

        {/* Right Side: Results */}
        <div className="roadmap-card glass-panel" style={{ overflowY: 'auto' }}>
          <h3 className="section-title">Analysis & Feedback</h3>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Gemini is reviewing your resume against the target job...</p>
            </div>
          ) : review ? (
            <div className="markdown-content animate-fade-in">
              <ReactMarkdown>{review}</ReactMarkdown>
            </div>
          ) : (
            <div className="empty-state">
              <p>Enter your resume and target job description on the left to receive personalized, actionable feedback.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeReviewer;
