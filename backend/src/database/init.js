/**
 * Database initialization
 * 
 * This file creates the SQLite database and all tables
 * if they don't already exist.
 * 
 * SQLite is a file-based database - perfect for self-hosted apps.
 * No separate database server needed!
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config');

/**
 * Get database connection
 * Creates the database file if it doesn't exist
 */
function getDatabase() {
  // Ensure data directory exists
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  return new sqlite3.Database(config.dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      throw err;
    }
    console.log('Connected to SQLite database:', config.dbPath);
  });
}

/**
 * Initialize database schema
 * Creates all tables if they don't exist
 */
function initSchema(db) {
  return new Promise((resolve, reject) => {
    // Enable foreign keys (important for data integrity)
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          two_factor_secret TEXT,
          two_factor_enabled INTEGER DEFAULT 0,
          is_admin INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✓ Users table created');
        
        // Add is_admin column if it doesn't exist (migration for existing databases)
        // SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we check first
        db.all("PRAGMA table_info(users)", (pragmaErr, columns) => {
          if (pragmaErr) {
            console.warn('Could not check users table schema:', pragmaErr);
            return;
          }
          
          const hasAdminColumn = columns.some(col => col.name === 'is_admin');
          if (!hasAdminColumn) {
            db.run('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0', (alterErr) => {
              if (alterErr) {
                console.warn('Could not add is_admin column:', alterErr.message);
              } else {
                console.log('✓ Added is_admin column to users table (migration)');
              }
            });
          }
        });
      });
      
      // Create sessions table
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          device_id TEXT NOT NULL,
          refresh_token TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✓ Sessions table created');
      });
      
      // Create calendar_events table
      db.run(`
        CREATE TABLE IF NOT EXISTS calendar_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          start_time TIME,
          end_time TIME,
          location TEXT,
          reminder_time DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✓ Calendar events table created');
      });
      
      // Create contacts table
      db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          phone_numbers TEXT,
          email_addresses TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✓ Contacts table created');
      });
      
      // Create email_configs table
      db.run(`
        CREATE TABLE IF NOT EXISTS email_configs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          imap_host TEXT NOT NULL,
          imap_port INTEGER NOT NULL,
          imap_secure INTEGER DEFAULT 1,
          smtp_host TEXT NOT NULL,
          smtp_port INTEGER NOT NULL,
          smtp_secure INTEGER DEFAULT 1,
          username TEXT NOT NULL,
          password_encrypted TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✓ Email configs table created');
      });
      
      // Create mail_folders table
      db.run(`
        CREATE TABLE IF NOT EXISTS mail_folders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          imap_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, name)
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✓ Mail folders table created');
      });
      
      // Create mail_messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS mail_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          folder_id INTEGER NOT NULL,
          message_id TEXT NOT NULL,
          subject TEXT,
          from_address TEXT,
          to_address TEXT,
          cc_address TEXT,
          bcc_address TEXT,
          body_text TEXT,
          body_html TEXT,
          date_received DATETIME NOT NULL,
          read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (folder_id) REFERENCES mail_folders(id) ON DELETE CASCADE,
          UNIQUE(user_id, message_id)
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✓ Mail messages table created');
        
        // Create indexes for better performance
        db.run('CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_events(user_id, date)', () => {});
        db.run('CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id)', () => {});
        db.run('CREATE INDEX IF NOT EXISTS idx_mail_user_folder ON mail_messages(user_id, folder_id)', () => {});
        db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)', () => {});
        
        console.log('✓ Database indexes created');
        resolve();
      });
    });
  });
}

/**
 * Initialize database
 * Call this when the server starts
 */
async function initDatabase() {
  const db = getDatabase();
  await initSchema(db);
  return db;
}

module.exports = {
  getDatabase,
  initDatabase,
};
