/**
 * Secrets management
 * 
 * Handles automatic generation and persistence of secrets.
 * Secrets are stored in /data/secrets.env (persistent volume).
 * 
 * On first run:
 * - Generates strong random secrets
 * - Saves to persistent volume
 * - Returns generated secrets
 * 
 * On subsequent runs:
 * - Loads secrets from persistent volume
 * - Returns existing secrets
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const SECRETS_FILE = '/data/secrets.env';
const DATA_DIR = '/data';

/**
 * Generate a cryptographically secure random string
 * 
 * @param {number} length - Length of the string (default: 64)
 * @returns {string} - Random hex string
 */
function generateSecret(length = 64) {
  return crypto.randomBytes(length / 2).toString('hex');
}

/**
 * Load secrets from file
 * 
 * @returns {Object|null} - Secrets object or null if file doesn't exist
 */
function loadSecretsFromFile() {
  try {
    if (!fs.existsSync(SECRETS_FILE)) {
      return null;
    }
    
    const content = fs.readFileSync(SECRETS_FILE, 'utf8');
    const secrets = {};
    
    // Parse key=value format
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          secrets[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return Object.keys(secrets).length > 0 ? secrets : null;
  } catch (error) {
    console.error('Error loading secrets from file:', error);
    return null;
  }
}

/**
 * Save secrets to file
 * 
 * @param {Object} secrets - Secrets object
 */
function saveSecretsToFile(secrets) {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Write secrets to file
    const lines = [
      '# Auto-generated secrets file',
      '# DO NOT EDIT MANUALLY',
      '# Backup this file securely!',
      '#',
      `JWT_SECRET=${secrets.jwtSecret}`,
      `JWT_REFRESH_SECRET=${secrets.jwtRefreshSecret}`,
      `ENCRYPTION_KEY=${secrets.encryptionKey}`,
      '',
      '# Generated on: ' + new Date().toISOString(),
    ];
    
    fs.writeFileSync(SECRETS_FILE, lines.join('\n'), { mode: 0o600 }); // Read/write for owner only
    
    console.log('✓ Secrets saved to persistent storage:', SECRETS_FILE);
  } catch (error) {
    console.error('Error saving secrets to file:', error);
    throw error;
  }
}

/**
 * Get or generate secrets
 * 
 * Priority:
 * 1. Environment variables (if set, use those - allows override)
 * 2. Persistent file (if exists, use those)
 * 3. Generate new secrets and save to file
 * 
 * @returns {Object} - { jwtSecret, jwtRefreshSecret, encryptionKey }
 */
function getOrGenerateSecrets() {
  // Check environment variables first (allows override)
  const envSecrets = {
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
  };
  
  // If all env vars are set, use them
  if (envSecrets.jwtSecret && envSecrets.jwtRefreshSecret && envSecrets.encryptionKey) {
    console.log('✓ Using secrets from environment variables');
    return envSecrets;
  }
  
  // Try to load from persistent file
  const fileSecrets = loadSecretsFromFile();
  if (fileSecrets && fileSecrets.JWT_SECRET && fileSecrets.JWT_REFRESH_SECRET && fileSecrets.ENCRYPTION_KEY) {
    console.log('✓ Using secrets from persistent storage');
    return {
      jwtSecret: fileSecrets.JWT_SECRET,
      jwtRefreshSecret: fileSecrets.JWT_REFRESH_SECRET,
      encryptionKey: fileSecrets.ENCRYPTION_KEY,
    };
  }
  
  // Generate new secrets (first run)
  console.log('⚠️  First run detected - generating new secrets...');
  const newSecrets = {
    jwtSecret: generateSecret(64),
    jwtRefreshSecret: generateSecret(64),
    encryptionKey: generateSecret(32), // 32 bytes = 64 hex chars
  };
  
  // Save to persistent file
  saveSecretsToFile(newSecrets);
  
  console.log('✓ New secrets generated and saved');
  console.log('⚠️  IMPORTANT: Backup the secrets file at:', SECRETS_FILE);
  
  return newSecrets;
}

/**
 * Get secrets for backup/download
 * 
 * @returns {Object|null} - Secrets object or null
 */
function getSecretsForBackup() {
  const secrets = getOrGenerateSecrets();
  return {
    jwtSecret: secrets.jwtSecret,
    jwtRefreshSecret: secrets.jwtRefreshSecret,
    encryptionKey: secrets.encryptionKey,
    secretsFile: SECRETS_FILE,
    generatedAt: fs.existsSync(SECRETS_FILE) 
      ? fs.statSync(SECRETS_FILE).mtime.toISOString()
      : new Date().toISOString(),
  };
}

module.exports = {
  getOrGenerateSecrets,
  getSecretsForBackup,
  SECRETS_FILE,
};
