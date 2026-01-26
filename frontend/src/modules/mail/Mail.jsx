/**
 * Mail module
 * 
 * Basic email client
 */

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { mailAPI } from '../../services/api';
import { mailStorage } from '../../services/storage';
import MailConfig from './MailConfig';
import MailList from './MailList';
import MailView from './MailView';
import './Mail.css';

function Mail() {
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    checkConfig();
    loadFolders();
  }, []);

  useEffect(() => {
    if (hasConfig && currentFolder) {
      loadMessages();
    }
  }, [currentFolder, hasConfig]);

  const checkConfig = async () => {
    try {
      await mailAPI.getConfig();
      setHasConfig(true);
    } catch (error) {
      setHasConfig(false);
    }
  };

  const loadFolders = async () => {
    try {
      const apiFolders = await mailAPI.getFolders();
      setFolders(apiFolders);
      await mailStorage.setFolders(apiFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
      try {
        const cachedFolders = await mailStorage.getFolders();
        setFolders(cachedFolders);
      } catch (cacheError) {
        console.error('Error loading cached folders:', cacheError);
      }
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const apiMessages = await mailAPI.getMessages(currentFolder);
      setMessages(apiMessages);
      await mailStorage.setMessages(currentFolder, apiMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      try {
        const cachedMessages = await mailStorage.getMessages(currentFolder);
        setMessages(cachedMessages);
      } catch (cacheError) {
        console.error('Error loading cached messages:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await mailAPI.sync();
      await loadMessages();
      alert('Email sync completed');
    } catch (error) {
      alert('Error syncing email: ' + error.message);
    }
  };

  const handleMessageClick = async (messageId) => {
    try {
      const message = await mailAPI.getMessage(messageId);
      setSelectedMessage(message);
    } catch (error) {
      alert('Error loading message: ' + error.message);
    }
  };

  if (!hasConfig) {
    return (
      <Layout>
        <div className="mail-container">
          <div className="card">
            <h2>Email Configuration Required</h2>
            <p>Please configure your email settings to use the mail module.</p>
            <button onClick={() => setShowConfig(true)} className="btn-primary">
              Configure Email
            </button>
          </div>
          {showConfig && (
            <MailConfig
              onSave={() => {
                setShowConfig(false);
                setHasConfig(true);
                loadFolders();
              }}
              onCancel={() => setShowConfig(false)}
            />
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mail-container">
        <div className="mail-header">
          <h1>Mail</h1>
          <div className="mail-actions">
            <button onClick={handleSync} className="btn-secondary">
              Sync
            </button>
            <button onClick={() => setShowConfig(true)} className="btn-secondary">
              Settings
            </button>
          </div>
        </div>

        {showConfig && (
          <MailConfig
            onSave={() => {
              setShowConfig(false);
              checkConfig();
            }}
            onCancel={() => setShowConfig(false)}
          />
        )}

        <div className="mail-layout">
          <div className="mail-sidebar">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setCurrentFolder(folder.name)}
                className={`folder-button ${currentFolder === folder.name ? 'active' : ''}`}
              >
                {folder.name}
              </button>
            ))}
          </div>

          <div className="mail-content">
            {selectedMessage ? (
              <MailView
                message={selectedMessage}
                onBack={() => setSelectedMessage(null)}
              />
            ) : (
              <MailList
                messages={messages}
                loading={loading}
                onMessageClick={handleMessageClick}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Mail;
