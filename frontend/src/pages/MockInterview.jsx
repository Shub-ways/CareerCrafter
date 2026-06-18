import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mic, Send, Bot, User as UserIcon, XCircle, Volume2, VolumeX, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './MockInterview.css';

const MockInterview = () => {
  const { api } = useAuth();
  const [jobTitle, setJobTitle] = useState('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTTSMuted, setIsTTSMuted] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = useRef(SpeechRecognition ? new SpeechRecognition() : null);

  useEffect(() => {
    if (recognition.current) {
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      
      recognition.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
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
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition.current) {
      alert("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
      return;
    }
    
    if (isRecording) {
      recognition.current.stop();
      setIsRecording(false);
    } else {
      // Clear current message if starting fresh recording
      if (!currentMessage) {
        setCurrentMessage('');
      }
      recognition.current.start();
      setIsRecording(true);
    }
  };

  const speakText = (text) => {
    if (isTTSMuted || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel(); // Stop any current speech
    
    // Strip markdown for speech
    const cleanText = text.replace(/[*#_`]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.name.includes('Female')) || 
                         voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
       utterance.voice = englishVoice;
    }
    
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

  const endInterview = () => {
    if (window.confirm('Are you sure you want to end this interview?')) {
      if (recognition.current && isRecording) recognition.current.stop();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsInterviewStarted(false);
      setIsRecording(false);
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
          
          <form onSubmit={startInterview}>
            <div className="input-group" style={{ textAlign: 'left' }}>
              <label>Target Job Title</label>
              <input 
                type="text" 
                className="input-glass" 
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <Mic size={18} /> Start Interview
            </button>
          </form>
        </div>
      ) : (
        <div className="chat-container animate-fade-in">
          <div className="chat-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Interviewing for: <span className="text-gradient">{jobTitle}</span></h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              
              <button onClick={endInterview} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <XCircle size={16} /> End Interview
              </button>
            </div>
          </div>

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
              <button 
                type="button" 
                className={`send-btn btn-record ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                title="Hold to speak"
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <textarea
                className="chat-textarea"
                placeholder={isRecording ? "Listening..." : "Type your answer here... (Press Enter to send)"}
                value={currentMessage}
                onChange={e => setCurrentMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (isRecording) toggleRecording();
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
    </div>
  );
};

export default MockInterview;
