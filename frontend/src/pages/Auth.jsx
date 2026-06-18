import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Briefcase, Users, Zap } from 'lucide-react';
import './Auth.css'; // We will add specific CSS for Auth

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, requestOtp, verifyOtp, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (username.length < 3 || password.length < 6) {
      setError('Username must be at least 3 chars, password 6 chars.');
      setIsLoading(false);
      return;
    }

    if (isLogin) {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error);
      } else {
        navigate('/dashboard');
      }
    } else {
      if (!email.includes('@')) {
        setError('Please enter a valid email.');
        setIsLoading(false);
        return;
      }
      const result = await requestOtp(username, email);
      if (!result.success) {
        setError(result.error);
      } else {
        setStep('otp');
      }
    }
    setIsLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      setIsLoading(false);
      return;
    }

    const result = await verifyOtp(username, email, password, otp);
    if (!result.success) {
      setError(result.error);
    } else {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      setIsLoading(false);
      return;
    }
    
    const result = await forgotPassword(email);
    if (!result.success) {
      setError(result.error);
    } else {
      setStep('reset_password');
    }
    setIsLoading(false);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    const result = await resetPassword(email, otp, password);
    if (!result.success) {
      setError(result.error);
    } else {
      setStep('credentials');
      setIsLogin(true);
      setOtp('');
      setPassword('');
      setError('Password successfully reset! You can now log in.'); // using error state to show success temporarily or handle it properly
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      {/* Dynamic Background Elements */}
      <div className="bg-shape shape-1 animate-float"></div>
      <div className="bg-shape shape-2 animate-float-delayed"></div>
      
      <div className="auth-wrapper">
        <div className="auth-info animate-fade-in-left">
          <div className="logo-container">
            <div className="logo-icon">
              <Compass size={32} color="white" />
            </div>
            <h1 className="text-gradient">CareerCrafter</h1>
          </div>
          <h2 className="auth-tagline">Navigate Your Career with AI Precision</h2>
          <p className="auth-description">
            Discover personalized career paths, connect with like-minded peers, and 
            get real-time mentorship powered by Google Gemini AI.
          </p>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon"><Zap size={20} /></div>
              <span>Smart AI Recommendations</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Users size={20} /></div>
              <span>Semantic Peer Matching</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Briefcase size={20} /></div>
              <span>Actionable Roadmaps</span>
            </div>
          </div>
        </div>

        <div className="auth-form-container glass-panel animate-fade-in-right">
          <h3 className="form-title">
            {step === 'forgot_password' ? 'Reset Password' : 
             step === 'reset_password' ? 'New Password' :
             isLogin ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="form-subtitle">
            {step === 'forgot_password' ? 'Enter your email to receive a reset code' :
             step === 'reset_password' ? 'Enter the OTP and your new password' :
             isLogin ? 'Enter your details to access your dashboard' : 'Join CareerCrafter and unlock your potential'}
          </p>
          
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="auth-form">
              {error && <div className="error-message">{error}</div>}
              
              <div className="input-group">
                <label>Username</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              {!isLogin && (
                <div className="input-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="input-glass" 
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="input-group">
                <label>Password</label>
                <input 
                  type="password" 
                  className="input-glass" 
                  placeholder="Enter a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {isLogin && (
                  <div 
                    style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
                    className="text-gradient"
                    onClick={() => { setStep('forgot_password'); setError(''); setEmail(''); }}
                  >
                    Forgot Password?
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn-primary auth-submit"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Continue')}
              </button>
            </form>
          ) : step === 'otp' ? (
            <form onSubmit={handleOtpSubmit} className="auth-form">
              {error && <div className="error-message">{error}</div>}
              <div className="success-message" style={{ color: 'var(--accent-1)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                We've sent a 6-digit verification code to <strong>{email}</strong>.
              </div>
              
              <div className="input-group">
                <label>Verification Code</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary auth-submit"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
              
              <button 
                type="button" 
                className="btn-outline auth-submit"
                style={{ marginTop: '1rem' }}
                onClick={() => { setStep('credentials'); setError(''); }}
                disabled={isLoading}
              >
                Back
              </button>
            </form>
          ) : step === 'forgot_password' ? (
            <form onSubmit={handleForgotPasswordSubmit} className="auth-form">
              {error && <div className="error-message" style={error.includes('successfully') ? {backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.5)'} : {}}>{error}</div>}
              
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="input-glass" 
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary auth-submit"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
              
              <button 
                type="button" 
                className="btn-outline auth-submit"
                style={{ marginTop: '1rem' }}
                onClick={() => { setStep('credentials'); setError(''); }}
                disabled={isLoading}
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="auth-form">
              {error && <div className="error-message">{error}</div>}
              <div className="success-message" style={{ color: 'var(--accent-1)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                We've sent a 6-digit reset code to <strong>{email}</strong>.
              </div>
              
              <div className="input-group">
                <label>Reset Code</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              <div className="input-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  className="input-glass" 
                  placeholder="Enter a new secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary auth-submit"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Set New Password'}
              </button>
            </form>
          )}

          <div className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span 
              className="toggle-link text-gradient" 
              onClick={() => { setIsLogin(!isLogin); setStep('credentials'); setError(''); }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
