import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mic, Send, Bot, User as UserIcon, XCircle, Volume2, VolumeX, MicOff, FileText, UserCheck, Upload, Award, CheckCircle2, AlertCircle, Download, RefreshCw, Loader2, Video, VideoOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import './MockInterview.css';

const MockInterview = () => {
  const { user, api } = useAuth();
  const [jobTitle, setJobTitle] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTTSMuted, setIsTTSMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = useRef(SpeechRecognition ? new SpeechRecognition() : null);
  const isInterviewStartedRef = useRef(isInterviewStarted);
  const isAISpeakingRef = useRef(false);

  useEffect(() => {
    isInterviewStartedRef.current = isInterviewStarted;
    if (isInterviewStarted) {
      startContinuousListening();
    } else {
      stopContinuousListening();
    }
  }, [isInterviewStarted]);

  const startContinuousListening = () => {
    if (!recognition.current || !isInterviewStartedRef.current || isAISpeakingRef.current) return;
    try {
      recognition.current.start();
      setIsRecording(true);
    } catch (e) {
      // Recognition already running or starting
    }
  };

  const stopContinuousListening = () => {
    if (recognition.current) {
      try {
        recognition.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  useEffect(() => {
    if (recognition.current) {
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      
      recognition.current.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
           setCurrentMessage(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      
      recognition.current.onend = () => {
        setIsRecording(false);
        // Auto-restart if interview is active and AI is not speaking
        if (isInterviewStartedRef.current && !isAISpeakingRef.current) {
          setTimeout(() => {
            startContinuousListening();
          }, 300);
        }
      };
    }
  }, []);

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    
    stopContinuousListening();
    isAISpeakingRef.current = true;
    window.speechSynthesis.cancel();
    
    if (isTTSMuted) {
      isAISpeakingRef.current = false;
      startContinuousListening();
      return;
    }
    
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.name.includes('Female')) || 
                         voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
       utterance.voice = englishVoice;
    }
    
    utterance.onend = () => {
      isAISpeakingRef.current = false;
      startContinuousListening();
    };

    utterance.onerror = () => {
      isAISpeakingRef.current = false;
      startContinuousListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Ensure voices are loaded
  useEffect(() => {
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
            // Voices are loaded
        };
    }
  }, []);

  const loadProfileData = async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const res = await api.get(`/profiles/${user.username}`);
      const p = res.data;
      const formatted = `Candidate Name: ${p.full_name || ''}\nEducation: ${p.education || ''}\nSkills: ${p.skills ? p.skills.join(', ') : ''}\nInterests: ${p.interests ? p.interests.join(', ') : ''}`;
      setResumeText(formatted);
      setUploadedFileName('Loaded from Profile');
    } catch (err) {
      console.error("Error loading profile data:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume_file', file);

    setUploadingResume(true);
    try {
      const res = await api.post('/ai/parse-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResumeText(res.data.resume_text);
      setUploadedFileName(file.name);
    } catch (err) {
      console.error("Error parsing resume file:", err);
      alert("Failed to parse resume. Please make sure to upload a valid text PDF or TXT file.");
    } finally {
      setUploadingResume(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const startInterview = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    setIsInterviewStarted(true);
    setHistory([]);
    
    // Auto-send the first hidden message to trigger the AI
    const initialPrompt = `I am ready to start the mock interview for the ${jobTitle} position. Please ask me the first question.`;
    
    await sendMessage(initialPrompt, [], true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading) return;

    const userText = currentMessage;
    setCurrentMessage(''); // Clear input
    
    const newHistory = [...history, { role: 'user', text: userText }];
    setHistory(newHistory);
    
    await sendMessage(userText, history, false);
  };

  const sendMessage = async (messageText, currentHistory, isInitial = false) => {
    setIsLoading(true);
    
    try {
      const response = await api.post('/ai/mock-interview', {
        job_title: jobTitle,
        resume_text: resumeText,
        history: currentHistory,
        message: messageText
      });

      const aiReply = response.data.reply;

      setHistory(prev => [
        ...(isInitial ? [] : prev),
        { role: 'assistant', text: aiReply }
      ]);
      
      // Read out the AI's response
      speakText(aiReply);
      
    } catch (error) {
      console.error("Error communicating with AI:", error);
      setHistory(prev => [
        ...prev,
        { role: 'assistant', text: "⚠️ I'm sorry, I encountered an error connecting to the server. Let's try that again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAndEvaluate = async () => {
    if (history.length < 2) {
      alert("Please complete at least one Q&A response with the AI before requesting feedback.");
      return;
    }
    if (recognition.current && isRecording) recognition.current.stop();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsRecording(false);
    setIsEvaluating(true);

    try {
      const res = await api.post('/ai/mock-interview/evaluate', {
        job_title: jobTitle,
        resume_text: resumeText,
        history: history
      });
      setEvaluation(res.data.evaluation);
      setShowScorecardModal(true);
    } catch (err) {
      console.error("Error evaluating interview:", err);
      alert("Failed to evaluate interview performance. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDownloadScorecardPDF = () => {
    const element = document.getElementById('scorecard-report-content');
    if (!element) return;
    const opt = {
      margin:       10,
      filename:     `Interview_Scorecard_${jobTitle.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  const toggleCamera = async () => {
    if (isVideoEnabled) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsVideoEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
        streamRef.current = stream;
        setIsVideoEnabled(true);
        setTimeout(() => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        }, 150);
      } catch (err) {
        console.error("Camera access error:", err);
        alert("Could not access webcam. Please check your browser permissions.");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const endInterview = () => {
    if (window.confirm('Are you sure you want to end this interview?')) {
      if (recognition.current && isRecording) recognition.current.stop();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsVideoEnabled(false);
      setIsInterviewStarted(false);
      setIsRecording(false);
      setShowScorecardModal(false);
      setEvaluation(null);
      setHistory([]);
      setJobTitle('');
    }
  };

  return (
    <div className="interview-container animate-fade-in">
      <div className="page-header" style={{ marginBottom: isInterviewStarted ? '1rem' : '2rem' }}>
        <h1><span className="text-gradient">Interactive Mock Interview</span> <Mic size={28} className="text-purple-500 inline-icon" /></h1>
        {!isInterviewStarted && <p>Select a job title and practice your interview skills with an AI recruiter.</p>}
      </div>

      {!isInterviewStarted ? (
        <div className="glass-panel setup-card animate-fade-in">
          <Bot size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--accent-primary)' }} />
          <h3>Ready to practice?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Enter the exact job title you are applying for, and our AI will conduct a realistic technical and behavioral interview with you.
          </p>
          
          <form onSubmit={startInterview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group" style={{ textAlign: 'left' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Target Job Role *</label>
              <input 
                type="text" 
                className="input-glass" 
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Data Analyst, Full Stack Developer, ML Engineer"
                required
              />
            </div>

            <div className="input-group" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600 }}>Upload Resume / Experience</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.38rem 0.7rem', display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <Upload size={14} /> {uploadingResume ? 'Extracting...' : 'Upload PDF / TXT'}
                    <input type="file" accept=".pdf,.txt" hidden onChange={handleFileUpload} disabled={uploadingResume} />
                  </label>
                  <button 
                    type="button" 
                    onClick={loadProfileData} 
                    disabled={loadingProfile}
                    className="btn-secondary" 
                    style={{ fontSize: '0.8rem', padding: '0.38rem 0.7rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <UserCheck size={14} /> {loadingProfile ? 'Loading...' : 'Autofill Profile'}
                  </button>
                </div>
              </div>

              {uploadedFileName && (
                <div style={{ fontSize: '0.85rem', color: '#4ade80', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> Attached: {uploadedFileName}
                </div>
              )}

              <textarea 
                className="input-glass" 
                rows={4}
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Upload your resume PDF above or preview/edit your extracted background & skills here..."
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Mic size={18} /> Start AI Mock Interview
            </button>
          </form>
        </div>
      ) : (
        <div className="chat-container animate-fade-in">
          <div className="chat-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Interviewing for: <span className="text-gradient">{jobTitle}</span></h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                className={`btn-icon-small ${isVideoEnabled ? 'active' : ''}`} 
                onClick={toggleCamera}
                title={isVideoEnabled ? "Turn Off Webcam" : "Turn On Webcam"}
                style={isVideoEnabled ? { background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderColor: '#22c55e' } : {}}
              >
                {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button 
                className={`btn-icon-small ${!isTTSMuted ? 'active' : ''}`} 
                onClick={() => {
                   setIsTTSMuted(!isTTSMuted);
                   if (!isTTSMuted && window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                title={isTTSMuted ? "Unmute AI Voice" : "Mute AI Voice"}
              >
                {isTTSMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <button 
                onClick={handleFinishAndEvaluate} 
                disabled={isEvaluating}
                className="btn-primary" 
                style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
              >
                {isEvaluating ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                {isEvaluating ? 'Evaluating...' : 'Get Scorecard'}
              </button>

              <button onClick={endInterview} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <XCircle size={16} /> Exit
              </button>
            </div>
          </div>

          {isVideoEnabled && (
            <div className="webcam-preview-box animate-fade-in" style={{
              position: 'relative',
              width: '100%',
              maxHeight: '220px',
              backgroundColor: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '1rem',
              border: '2px solid var(--accent-primary)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
              />
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(4px)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span> LIVE CAMERA
              </div>
            </div>
          )}

          <div className="chat-messages">
            {history.map((msg, index) => (
              <div key={index} className={`message ${msg.role} animate-fade-in`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'assistant' ? <Bot size={14} color="var(--accent-primary)" /> : <UserIcon size={14} />}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {msg.role === 'assistant' ? 'Interviewer' : 'You'}
                  </span>
                </div>
                <div className={`message-bubble ${msg.role === 'assistant' ? 'markdown-content' : ''}`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Bot size={14} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Interviewer</span>
                </div>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: isRecording ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: isRecording ? '#4ade80' : 'var(--text-secondary)',
                  border: `1px solid ${isRecording ? 'rgba(34, 197, 94, 0.4)' : 'var(--border-glass)'}`,
                  whiteSpace: 'nowrap'
                }}
                title={isRecording ? "Hands-free mode active: speak freely" : "Mic paused while AI is responding"}
              >
                <Mic size={16} color={isRecording ? "#22c55e" : "currentColor"} />
                {isRecording ? "Listening Live..." : "Mic Paused"}
              </div>

              <textarea
                className="chat-textarea"
                placeholder={isRecording ? "Speak freely or type your answer here... (Press Enter to send)" : "Type your answer here..."}
                value={currentMessage}
                onChange={e => setCurrentMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                disabled={isLoading}
              />
              <button type="submit" className="btn-primary send-btn" disabled={isLoading || !currentMessage.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {showScorecardModal && evaluation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-glass)'
          }}>
            <div id="scorecard-report-content" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={24} className="text-yellow-400" /> Interview Performance Scorecard
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Candidate Evaluation for <strong>{jobTitle}</strong>
                  </p>
                </div>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  background: evaluation.overall_score >= 80 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: evaluation.overall_score >= 80 ? '#4ade80' : '#facc15',
                  border: `1px solid ${evaluation.overall_score >= 80 ? '#22c55e' : '#eab308'}`
                }}>
                  {evaluation.verdict || 'Evaluation Complete'}
                </div>
              </div>

              {/* Score Meters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#818cf8' }}>{evaluation.overall_score}/100</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Overall Score</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa' }}>{evaluation.technical_score}/100</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Technical Depth</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c084fc' }}>{evaluation.communication_score}/100</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Communication</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f472b6' }}>{evaluation.problem_solving_score}/100</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Problem Solving</div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.05)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={16} /> Key Strengths
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {evaluation.strengths?.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <AlertCircle size={16} /> Areas for Improvement
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {evaluation.improvements?.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              </div>

              {/* Summary */}
              {evaluation.summary && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>📝 Executive Summary Feedback</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {evaluation.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
              <button 
                onClick={handleDownloadScorecardPDF} 
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <Download size={16} /> Export PDF Report
              </button>
              <button 
                onClick={() => setShowScorecardModal(false)} 
                className="btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                Back to Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterview;
