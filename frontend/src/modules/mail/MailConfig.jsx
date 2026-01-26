/**
 * Mail configuration component
 * 
 * Form for configuring email settings (IMAP/SMTP)
 */

import { useState } from 'react';
import { mailAPI } from '../../services/api';
import './MailConfig.css';

function MailConfig({ onSave, onCancel }) {
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [imapSecure, setImapSecure] = useState(true);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('465');
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await mailAPI.saveConfig({
        imapHost,
        imapPort: parseInt(imapPort),
        imapSecure,
        smtpHost,
        smtpPort: parseInt(smtpPort),
        smtpSecure,
        username,
        password,
      });
      onSave();
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
      setLoading(false);
    }
  };

  return (
    <div className="mail-config-overlay">
      <div className="mail-config">
        <h2>Email Configuration</h2>
        <p className="mail-config-note">
          Enter your IMAP and SMTP server settings. No auto-discovery - manual configuration only.
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <h3>IMAP Settings (Incoming Mail)</h3>
          <div className="form-group">
            <label htmlFor="imapHost">IMAP Host *</label>
            <input
              type="text"
              id="imapHost"
              value={imapHost}
              onChange={(e) => setImapHost(e.target.value)}
              placeholder="imap.example.com"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="imapPort">IMAP Port *</label>
              <input
                type="number"
                id="imapPort"
                value={imapPort}
                onChange={(e) => setImapPort(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={imapSecure}
                  onChange={(e) => setImapSecure(e.target.checked)}
                />
                Use SSL/TLS
              </label>
            </div>
          </div>
          
          <h3>SMTP Settings (Outgoing Mail)</h3>
          <div className="form-group">
            <label htmlFor="smtpHost">SMTP Host *</label>
            <input
              type="text"
              id="smtpHost"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.example.com"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="smtpPort">SMTP Port *</label>
              <input
                type="number"
                id="smtpPort"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                />
                Use SSL/TLS
              </label>
            </div>
          </div>
          
          <h3>Credentials</h3>
          <div className="form-group">
            <label htmlFor="username">Username/Email *</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MailConfig;
