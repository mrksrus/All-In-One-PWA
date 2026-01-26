/**
 * Authentication service
 * 
 * Business logic for user authentication:
 * - User registration
 * - User login
 * - Session management
 * - 2FA setup and verification
 */

const { hashPassword, verifyPassword, validatePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateSecret, verifyToken } = require('../utils/2fa');
const { getDatabase } = require('../database/init');

/**
 * Check if any admin exists
 */
function hasAdmin() {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users WHERE is_admin = 1', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row.count > 0);
    });
  });
}

/**
 * Register a new user
 * 
 * @param {string} username - Username
 * @param {string} email - Email address
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} - User object (without password)
 */
async function registerUser(username, email, password) {
  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.error);
  }
  
  const db = getDatabase();
  
  return new Promise(async (resolve, reject) => {
    // Check if this is the first user (becomes admin)
    const adminExists = await hasAdmin();
    const isAdmin = !adminExists; // First user becomes admin
    
    // Hash password before storing
    hashPassword(password).then((passwordHash) => {
      // Insert user into database
      db.run(
        'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)',
        [username, email, passwordHash, isAdmin ? 1 : 0],
        function(err) {
          if (err) {
            // Check if username or email already exists
            if (err.message.includes('UNIQUE constraint failed')) {
              reject(new Error('Username or email already exists'));
            } else {
              reject(err);
            }
            return;
          }
          
          // Return user without password
          resolve({
            id: this.lastID,
            username,
            email,
            twoFactorEnabled: false,
            isAdmin: isAdmin,
          });
        }
      );
    }).catch(reject);
  });
}

/**
 * Login user
 * 
 * @param {string} username - Username or email
 * @param {string} password - Plain text password
 * @param {string} twoFactorCode - 2FA code from authenticator app
 * @param {string} deviceId - Unique device identifier
 * @returns {Promise<Object>} - { user, accessToken, refreshToken }
 */
async function loginUser(username, password, twoFactorCode, deviceId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Find user by username or email
    db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username],
      async (err, user) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!user) {
          reject(new Error('Invalid username or password'));
          return;
        }
        
        // Verify password
        const passwordValid = await verifyPassword(password, user.password_hash);
        if (!passwordValid) {
          reject(new Error('Invalid username or password'));
          return;
        }
        
        // Check if 2FA is enabled
        if (user.two_factor_enabled) {
          if (!twoFactorCode) {
            reject(new Error('2FA code required'));
            return;
          }
          
          // Verify 2FA code
          const twoFactorValid = verifyToken(user.two_factor_secret, twoFactorCode);
          if (!twoFactorValid) {
            reject(new Error('Invalid 2FA code'));
            return;
          }
        } else {
          // 2FA not enabled yet - user must set it up
          reject(new Error('2FA must be enabled. Please complete 2FA setup.'));
          return;
        }
        
        // Generate tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        
        // Calculate expiration date (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        // Store refresh token in database
        db.run(
          'INSERT INTO sessions (user_id, device_id, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
          [user.id, deviceId, refreshToken, expiresAt.toISOString()],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            
            resolve({
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                twoFactorEnabled: user.two_factor_enabled === 1,
                isAdmin: user.is_admin === 1,
              },
              accessToken,
              refreshToken,
            });
          }
        );
      }
    );
  });
}

/**
 * Setup 2FA for a user
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - { secret, qrCode }
 */
async function setup2FA(userId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Get user
    db.get('SELECT username FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!user) {
        reject(new Error('User not found'));
        return;
      }
      
      // Generate 2FA secret
      const { secret, qrCode } = await generateSecret(user.username);
      
      // Store secret in database (but don't enable yet)
      db.run(
        'UPDATE users SET two_factor_secret = ? WHERE id = ?',
        [secret, userId],
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve({ secret, qrCode });
        }
      );
    });
  });
}

/**
 * Verify and enable 2FA
 * 
 * @param {number} userId - User ID
 * @param {string} code - 2FA code from authenticator app
 * @returns {Promise<boolean>} - True if verified and enabled
 */
async function verifyAndEnable2FA(userId, code) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Get user's 2FA secret
    db.get('SELECT two_factor_secret FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!user || !user.two_factor_secret) {
        reject(new Error('2FA secret not found. Please setup 2FA first.'));
        return;
      }
      
      // Verify code
      const isValid = verifyToken(user.two_factor_secret, code);
      
      if (!isValid) {
        reject(new Error('Invalid 2FA code'));
        return;
      }
      
      // Enable 2FA
      db.run(
        'UPDATE users SET two_factor_enabled = 1 WHERE id = ?',
        [userId],
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(true);
        }
      );
    });
  });
}

/**
 * Refresh access token using refresh token
 * 
 * @param {string} refreshToken - Refresh token
 * @param {string} deviceId - Device ID
 * @returns {Promise<Object>} - { accessToken, refreshToken }
 */
async function refreshAccessToken(refreshToken, deviceId) {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw new Error('Invalid refresh token');
  }
  
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Check if refresh token exists in database and is valid
    db.get(
      'SELECT * FROM sessions WHERE refresh_token = ? AND device_id = ? AND expires_at > datetime("now")',
      [refreshToken, deviceId],
      (err, session) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!session) {
          reject(new Error('Invalid or expired refresh token'));
          return;
        }
        
        // Generate new tokens
        const newAccessToken = generateAccessToken(session.user_id);
        const newRefreshToken = generateRefreshToken(session.user_id);
        
        // Update session with new refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        db.run(
          'UPDATE sessions SET refresh_token = ?, expires_at = ? WHERE id = ?',
          [newRefreshToken, expiresAt.toISOString(), session.id],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            
            resolve({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            });
          }
        );
      }
    );
  });
}

/**
 * Logout user (delete session)
 * 
 * @param {string} refreshToken - Refresh token to invalidate
 * @param {string} deviceId - Device ID
 */
async function logout(refreshToken, deviceId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM sessions WHERE refresh_token = ? AND device_id = ?',
      [refreshToken, deviceId],
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
}

module.exports = {
  registerUser,
  loginUser,
  setup2FA,
  verifyAndEnable2FA,
  refreshAccessToken,
  logout,
};
