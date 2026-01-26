/**
 * Mail service
 * 
 * Business logic for email:
 * - Email configuration
 * - Fetching emails from IMAP
 * - Sending emails via SMTP
 * 
 * This is intentionally simple - polling-based, no real-time sync
 */

const Imap = require('imap');
const nodemailer = require('nodemailer');
const { getDatabase } = require('../database/init');
const crypto = require('crypto');
const config = require('../config');

// Encryption key from config (auto-generated on first run, stored in persistent volume)
const ENCRYPTION_KEY = config.encryptionKey;
const ALGORITHM = 'aes-256-cbc';

// Ensure encryption key is exactly 32 bytes for AES-256
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters. This should be auto-generated on first run.');
}

/**
 * Encrypt a string
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt a string
 */
function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Get or create default folders for a user
 */
function ensureDefaultFolders(userId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Check if folders exist
    db.get('SELECT COUNT(*) as count FROM mail_folders WHERE user_id = ?', [userId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row.count > 0) {
        // Folders already exist
        resolve();
        return;
      }
      
      // Create default folders
      const folders = [
        { name: 'inbox', imapPath: 'INBOX' },
        { name: 'sent', imapPath: 'Sent' },
        { name: 'trash', imapPath: 'Trash' },
      ];
      
      let completed = 0;
      folders.forEach(folder => {
        db.run(
          'INSERT INTO mail_folders (user_id, name, imap_path) VALUES (?, ?, ?)',
          [userId, folder.name, folder.imapPath],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            completed++;
            if (completed === folders.length) {
              resolve();
            }
          }
        );
      });
    });
  });
}

/**
 * Get email configuration for a user
 */
function getEmailConfig(userId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM email_configs WHERE user_id = ?', [userId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        resolve(null);
        return;
      }
      
      // Decrypt password
      const decryptedPassword = decrypt(row.password_encrypted);
      
      resolve({
        imapHost: row.imap_host,
        imapPort: row.imap_port,
        imapSecure: row.imap_secure === 1,
        smtpHost: row.smtp_host,
        smtpPort: row.smtp_port,
        smtpSecure: row.smtp_secure === 1,
        username: row.username,
        password: decryptedPassword,
      });
    });
  });
}

/**
 * Save email configuration for a user
 */
function saveEmailConfig(userId, config) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const {
      imapHost,
      imapPort,
      imapSecure,
      smtpHost,
      smtpPort,
      smtpSecure,
      username,
      password,
    } = config;
    
    // Encrypt password before storing
    const encryptedPassword = encrypt(password);
    
    // Check if config exists
    db.get('SELECT id FROM email_configs WHERE user_id = ?', [userId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row) {
        // Update existing config
        db.run(
          `UPDATE email_configs 
           SET imap_host = ?, imap_port = ?, imap_secure = ?,
               smtp_host = ?, smtp_port = ?, smtp_secure = ?,
               username = ?, password_encrypted = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [imapHost, imapPort, imapSecure ? 1 : 0, smtpHost, smtpPort, smtpSecure ? 1 : 0, username, encryptedPassword, userId],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            ensureDefaultFolders(userId).then(resolve).catch(reject);
          }
        );
      } else {
        // Insert new config
        db.run(
          `INSERT INTO email_configs 
           (user_id, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure, username, password_encrypted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, imapHost, imapPort, imapSecure ? 1 : 0, smtpHost, smtpPort, smtpSecure ? 1 : 0, username, encryptedPassword],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            ensureDefaultFolders(userId).then(resolve).catch(reject);
          }
        );
      }
    });
  });
}

/**
 * Get all folders for a user
 */
function getFolders(userId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM mail_folders WHERE user_id = ? ORDER BY name', [userId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(rows.map(row => ({
        id: row.id,
        name: row.name,
        imapPath: row.imap_path,
      })));
    });
  });
}

/**
 * Get folder ID by name
 */
function getFolderId(userId, folderName) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM mail_folders WHERE user_id = ? AND name = ?', [userId, folderName], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row ? row.id : null);
    });
  });
}

/**
 * Sync emails from IMAP server
 * 
 * This is a simple polling-based sync - fetches new emails and stores them
 */
async function syncEmails(userId) {
  const config = await getEmailConfig(userId);
  
  if (!config) {
    throw new Error('Email configuration not found');
  }
  
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.username,
      password: config.password,
      host: config.imapHost,
      port: config.imapPort,
      tls: config.imapSecure,
    });
    
    imap.once('ready', () => {
      // Open INBOX
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }
        
        // Search for unseen messages
        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            imap.end();
            reject(err);
            return;
          }
          
          if (results.length === 0) {
            imap.end();
            resolve({ synced: 0 });
            return;
          }
          
          // Fetch messages
          const fetch = imap.fetch(results, {
            bodies: '',
            struct: true,
          });
          
          let synced = 0;
          
          fetch.on('message', (msg, seqno) => {
            let messageData = {
              messageId: null,
              subject: '',
              from: '',
              to: '',
              date: null,
              bodyText: '',
              bodyHtml: '',
            };
            
            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                // Simple email parsing (in production, use a proper email parser)
                const lines = buffer.split('\n');
                let inHeaders = true;
                let bodyStart = false;
                
                for (let line of lines) {
                  if (inHeaders) {
                    if (line.toLowerCase().startsWith('message-id:')) {
                      messageData.messageId = line.substring(11).trim();
                    } else if (line.toLowerCase().startsWith('subject:')) {
                      messageData.subject = line.substring(8).trim();
                    } else if (line.toLowerCase().startsWith('from:')) {
                      messageData.from = line.substring(5).trim();
                    } else if (line.toLowerCase().startsWith('to:')) {
                      messageData.to = line.substring(3).trim();
                    } else if (line.toLowerCase().startsWith('date:')) {
                      messageData.date = new Date(line.substring(5).trim());
                    } else if (line.trim() === '') {
                      inHeaders = false;
                      bodyStart = true;
                    }
                  } else if (bodyStart) {
                    messageData.bodyText += line + '\n';
                  }
                }
              });
            });
            
            msg.once('end', () => {
              // Save message to database
              saveMessage(userId, 'inbox', messageData).then(() => {
                synced++;
                if (synced === results.length) {
                  imap.end();
                  resolve({ synced });
                }
              }).catch((err) => {
                console.error('Error saving message:', err);
                synced++;
                if (synced === results.length) {
                  imap.end();
                  resolve({ synced });
                }
              });
            });
          });
          
          fetch.once('error', (err) => {
            imap.end();
            reject(err);
          });
        });
      });
    });
    
    imap.once('error', (err) => {
      reject(err);
    });
    
    imap.connect();
  });
}

/**
 * Save a message to the database
 */
function saveMessage(userId, folderName, messageData) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    getFolderId(userId, folderName).then(folderId => {
      if (!folderId) {
        reject(new Error('Folder not found'));
        return;
      }
      
      // Check if message already exists
      db.get(
        'SELECT id FROM mail_messages WHERE user_id = ? AND message_id = ?',
        [userId, messageData.messageId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            // Message already exists, skip
            resolve();
            return;
          }
          
          // Insert new message
          db.run(
            `INSERT INTO mail_messages 
             (user_id, folder_id, message_id, subject, from_address, to_address, 
              body_text, body_html, date_received)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              folderId,
              messageData.messageId || `msg-${Date.now()}`,
              messageData.subject || '',
              messageData.from || '',
              messageData.to || '',
              messageData.bodyText || '',
              messageData.bodyHtml || '',
              messageData.date ? messageData.date.toISOString() : new Date().toISOString(),
            ],
            (err) => {
              if (err) {
                reject(err);
                return;
              }
              resolve();
            }
          );
        }
      );
    }).catch(reject);
  });
}

/**
 * Get messages in a folder
 */
function getMessages(userId, folderName, limit = 50, offset = 0) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    getFolderId(userId, folderName).then(folderId => {
      if (!folderId) {
        reject(new Error('Folder not found'));
        return;
      }
      
      db.all(
        `SELECT * FROM mail_messages 
         WHERE user_id = ? AND folder_id = ? 
         ORDER BY date_received DESC 
         LIMIT ? OFFSET ?`,
        [userId, folderId, limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(rows.map(row => ({
            id: row.id,
            subject: row.subject,
            from: row.from_address,
            to: row.to_address,
            date: row.date_received,
            read: row.read === 1,
            bodyText: row.body_text,
            bodyHtml: row.body_html,
          })));
        }
      );
    }).catch(reject);
  });
}

/**
 * Get a single message by ID
 */
function getMessage(userId, messageId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM mail_messages WHERE id = ? AND user_id = ?',
      [messageId, userId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        // Mark as read
        db.run('UPDATE mail_messages SET read = 1 WHERE id = ?', [messageId]);
        
        resolve({
          id: row.id,
          subject: row.subject,
          from: row.from_address,
          to: row.to_address,
          cc: row.cc_address,
          bcc: row.bcc_address,
          date: row.date_received,
          read: true,
          bodyText: row.body_text,
          bodyHtml: row.body_html,
        });
      }
    );
  });
}

/**
 * Send an email
 */
async function sendEmail(userId, emailData) {
  const config = await getEmailConfig(userId);
  
  if (!config) {
    throw new Error('Email configuration not found');
  }
  
  const {
    to,
    subject,
    text,
    html,
    cc,
    bcc,
  } = emailData;
  
  // Create SMTP transporter
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
  
  // Send email
  const info = await transporter.sendMail({
    from: config.username,
    to,
    cc,
    bcc,
    subject,
    text,
    html,
  });
  
  // Save to sent folder
  await saveMessage(userId, 'sent', {
    messageId: info.messageId,
    subject,
    from: config.username,
    to,
    date: new Date(),
    bodyText: text || '',
    bodyHtml: html || '',
  });
  
  return { messageId: info.messageId };
}

module.exports = {
  getEmailConfig,
  saveEmailConfig,
  getFolders,
  syncEmails,
  getMessages,
  getMessage,
  sendEmail,
};
