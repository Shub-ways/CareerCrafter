import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Link2, Mail, X } from 'lucide-react';
import './PeerMatching.css';

const PeerMatching = () => {
  const { user, api } = useAuth();
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchPeers();
  }, []);

  const fetchPeers = async () => {
    try {
      const response = await api.get(`/peers/${user.username}`);
      setPeers(response.data);
    } catch (error) {
      console.error('Error fetching peers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectClick = (peer) => {
    setSelectedPeer(peer);
    setShowModal(true);
    setEmailStatus('');
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    setEmailStatus('');
    try {
      const response = await api.post('/peers/connect', {
        sender_username: user.username,
        target_username: selectedPeer.username
      });
      if (response.data.success) {
        setEmailStatus('success');
      } else {
        setEmailStatus('error');
      }
    } catch (error) {
      setEmailStatus('error');
    }
    setIsSending(false);
  };

  return (
    <div className="peers-container animate-fade-in">
      <div className="page-header">
        <h1><span className="text-gradient">Peer Matching</span> <Users size={28} className="inline-icon text-blue-500" /></h1>
        <p>Discover and connect with like-minded professionals who share your ambitions and skills.</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading peers...</div>
      ) : peers.length === 0 ? (
        <div className="glass-panel empty-state">
          <Users size={48} className="empty-icon" />
          <h3>No matches found yet</h3>
          <p>Add more skills and interests to your profile to find better matches.</p>
        </div>
      ) : (
        <div className="peers-grid">
          {peers.map((peer, idx) => (
            <div key={idx} className="glass-panel peer-card hover-glow animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
              <div className="peer-header">
                <div className="peer-avatar">
                  {peer.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="peer-info">
                  <h3>{peer.full_name}</h3>
                  <span className="peer-username">@{peer.username}</span>
                </div>
                <div className="match-score">
                  <div className="score-ring">
                    <span>{peer.score}</span>
                  </div>
                  <span className="score-label">Score</span>
                </div>
              </div>

              <div className="peer-body">
                {peer.interests_overlap.length > 0 && (
                  <div className="match-section">
                    <h4>Shared Interests</h4>
                    <div className="tag-container">
                      {peer.interests_overlap.map((interest, i) => (
                        <span key={i} className="tag tag-secondary">{interest}</span>
                      ))}
                    </div>
                  </div>
                )}

                {peer.skills_overlap.length > 0 && (
                  <div className="match-section">
                    <h4>Shared Skills</h4>
                    <div className="tag-container">
                      {peer.skills_overlap.map((skill, i) => (
                        <span key={i} className="tag tag-primary">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button className="btn-outline connect-btn" onClick={() => handleConnectClick(peer)}>
                <Link2 size={16} /> Connect
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Connection Modal */}
      {showModal && selectedPeer && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Connect with {selectedPeer.full_name}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {selectedPeer.linkedin_url && (
                <a href={selectedPeer.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                  View LinkedIn Profile
                </a>
              )}
              {selectedPeer.github_url && (
                <a href={selectedPeer.github_url} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                  View GitHub Profile
                </a>
              )}
              {!selectedPeer.linkedin_url && !selectedPeer.github_url && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>This user hasn't added any social links yet.</p>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
              <p style={{ textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Or, let CareerCrafter introduce you! We will send a warm email to both of you.
              </p>
              <button 
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleSendEmail}
                disabled={isSending || emailStatus === 'success'}
              >
                <Mail size={18} />
                {isSending ? 'Sending...' : emailStatus === 'success' ? 'Introduction Sent!' : 'Send Email Introduction'}
              </button>
              {emailStatus === 'error' && (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' }}>Failed to send email. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerMatching;
