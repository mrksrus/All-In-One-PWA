/**
 * Configuration file
 * 
 * This file loads environment variables and provides configuration
 * for the entire backend application.
 * 
 * Secrets are automatically generated on first run and stored in
 * persistent volume (/data/secrets.env).
 */

require('dotenv').config();
const { getOrGenerateSecrets } = require('../utils/secrets.js');

// Get or generate secrets (auto-generated on first run)
const secrets = getOrGenerateSecrets();

module.exports = {
  // Server port - defaults to 3000 if not set
  port: process.env.PORT || 3000,
  
  // Environment (development, production, etc.)
  env: process.env.NODE_ENV || 'development',
  
  // JWT secrets - automatically generated on first run, stored in persistent volume
  // Can be overridden with environment variables if needed
  jwtSecret: secrets.jwtSecret,
  jwtRefreshSecret: secrets.jwtRefreshSecret,
  
  // Encryption key for email passwords - automatically generated on first run
  encryptionKey: secrets.encryptionKey,
  
  // JWT token expiration times
  jwtExpiration: '15m',  // Access tokens expire in 15 minutes
  jwtRefreshExpiration: '7d',  // Refresh tokens expire in 7 days
  
  // Database path - SQLite database file location (in persistent volume)
  dbPath: process.env.DB_PATH || '/data/database.sqlite',
  
  // CORS origin - which frontend URLs are allowed to access the API
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost',
  
  // Password requirements
  passwordMinLength: 24,  // Minimum password length
  
  // Argon2 settings (if we switch from bcrypt later)
  // For now, using bcrypt with cost factor 12
  bcryptRounds: 12,
};
