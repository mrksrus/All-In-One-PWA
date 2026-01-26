/**
 * Register component
 * 
 * Handles new user registration
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import BackupScreen from './BackupScreen';
import './Login.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showBackup, setShowBackup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 24) {
      setError('Password must be at least 24 characters long');
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.register(username, email, password);
      
      // Check if this is the first admin
      if (result.isAdmin) {
        setIsAdmin(true);
      }
      
      // Setup 2FA
      const setup = await authAPI.setup2FA();
      setTwoFactorSetup(setup);
    } catch (err) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.verify2FA(twoFactorCode);
      
      // If admin, show backup screen
      if (isAdmin) {
        setShowBackup(true);
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || '2FA verification failed');
      setLoading(false);
    }
  };

  const handleBackupComplete = () => {
    navigate('/login');
  };

  // Show backup screen after admin 2FA setup
  if (showBackup) {
    return <BackupScreen onComplete={handleBackupComplete} />;
  }

  if (twoFactorSetup) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Setup 2FA</h1>
          {isAdmin && (
            <p className="auth-subtitle" style={{ color: 'var(--error)', fontWeight: 'bold' }}>
              You are creating the first admin account. After 2FA setup, you'll need to backup your secrets.
            </p>
          )}
          <p className="auth-subtitle">Scan the QR code with your authenticator app</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <img 
              src={twoFactorSetup.qrCode} 
              alt="2FA QR Code" 
              style={{ maxWidth: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
            />
          </div>
          
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: 'var(--spacing-md)' }}>
            Scan this QR code with an authenticator app like Google Authenticator, 
            Authy, or Microsoft Authenticator. Then enter the 6-digit code below.
          </p>
          
          <form onSubmit={handleVerify2FA}>
            <div className="form-group">
              <label htmlFor="twoFactorCode">2FA Code</label>
              <input
                type="text"
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify and Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Register</h1>
        <p className="auth-subtitle">Create a new account</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={24}
            />
            <small>Minimum 24 characters, must include letters, numbers, and special characters</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={24}
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
