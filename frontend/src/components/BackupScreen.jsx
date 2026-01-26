/**
 * Backup screen component
 * 
 * Shown after admin account creation to ensure secrets are backed up
 */

import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import './BackupScreen.css';

function BackupScreen({ onComplete }) {
  const [backupData, setBackupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    loadBackup();
  }, []);

  const loadBackup = async () => {
    try {
      const data = await authAPI.getBackup();
      setBackupData(data);
    } catch (error) {
      console.error('Error loading backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = () => {
    if (!backupData) return;

    const backup = {
      version: '1.0',
      generatedAt: backupData.generatedAt,
      secrets: {
        jwtSecret: backupData.jwtSecret,
        jwtRefreshSecret: backupData.jwtRefreshSecret,
        encryptionKey: backupData.encryptionKey,
      },
      instructions: {
        restore: 'To restore: Copy these secrets to /data/secrets.env or set as environment variables',
        warning: 'Keep this file secure! Anyone with this file can access your system.',
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-in-one-pwa-secrets-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="backup-screen">
        <div className="backup-card">
          <p>Loading backup information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backup-screen">
      <div className="backup-card">
        <div className="backup-header">
          <h1>⚠️ Important: Backup Your Secrets</h1>
          <p className="backup-subtitle">
            Your system secrets have been automatically generated. 
            You <strong>must</strong> back them up now.
          </p>
        </div>

        <div className="backup-warning">
          <h3>Why is this important?</h3>
          <ul>
            <li>If you lose these secrets, all users will be logged out</li>
            <li>Encrypted data (like email passwords) cannot be recovered</li>
            <li>You'll need these secrets if you restore from backup</li>
            <li>You'll need these secrets if you move to a new server</li>
          </ul>
        </div>

        <div className="backup-info">
          <h3>Secrets Location</h3>
          <p className="backup-path">{backupData?.secretsFile || '/data/secrets.env'}</p>
          <p className="backup-note">
            The secrets are stored in a persistent Docker volume. 
            However, you should still download a backup file.
          </p>
        </div>

        <div className="backup-actions">
          <button onClick={downloadBackup} className="btn-primary btn-large">
            📥 Download Backup File
          </button>
          <p className="backup-download-note">
            This file contains your secrets. Store it securely (password manager, encrypted drive, etc.)
          </p>
        </div>

        <div className="backup-acknowledge">
          <label>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>
              I understand that I must backup these secrets. 
              I have downloaded the backup file and stored it securely.
            </span>
          </label>
        </div>

        <div className="backup-continue">
          <button
            onClick={onComplete}
            className="btn-primary"
            disabled={!acknowledged}
          >
            I've Backed Up - Continue Setup
          </button>
        </div>

        <div className="backup-help">
          <h4>Need Help?</h4>
          <p>
            The backup file is a JSON file containing your secrets. 
            Store it in a secure location like:
          </p>
          <ul>
            <li>Password manager (1Password, Bitwarden, etc.)</li>
            <li>Encrypted USB drive</li>
            <li>Secure cloud storage (encrypted)</li>
            <li>Physical safe</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BackupScreen;
