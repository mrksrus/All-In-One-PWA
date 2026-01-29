/**
 * Authentication routes
 * 
 * Handles user registration, login, logout, and 2FA setup
 */

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticateToken } = require('../middleware/auth');
const { getSecretsForBackup } = require('../utils/secrets');
const { getDatabase } = require('../database/init');

/**
 * GET /api/auth/setup-status
 * Check if admin exists (for first-time setup)
 */
router.get('/setup-status', async (req, res, next) => {
  try {
    const db = getDatabase();
    db.get('SELECT COUNT(*) as count FROM users WHERE is_admin = 1', (err, row) => {
      if (err) {
        return next(err);
      }
      res.json({ 
        adminExists: row.count > 0,
        needsSetup: row.count === 0,
      });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register
 * Register a new user
 * 
 * Body: { username, email, password }
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    const user = await authService.registerUser(username, email, password);
    
    // If this is the first admin, include backup info
    let backupInfo = null;
    if (user.isAdmin) {
      backupInfo = getSecretsForBackup();
    }
    
    res.status(201).json({ 
      message: 'User registered successfully. Please setup 2FA.',
      user,
      isAdmin: user.isAdmin,
      backupInfo: backupInfo ? {
        secretsFile: backupInfo.secretsFile,
        generatedAt: backupInfo.generatedAt,
        // Don't send actual secrets in response - user must download backup
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/backup
 * Get secrets backup (admin only, after 2FA setup)
 */
router.get('/backup', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    db.get('SELECT is_admin FROM users WHERE id = ?', [req.userId], (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const backupInfo = getSecretsForBackup();
      res.json(backupInfo);
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 * 
 * Body: { username, password, twoFactorCode, deviceId }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password, twoFactorCode, deviceId } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    const result = await authService.loginUser(username, password, twoFactorCode, deviceId);
    
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 * 
 * Requires authentication
 * Body: { refreshToken, deviceId }
 */
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const { refreshToken, deviceId } = req.body;
    
    if (!refreshToken || !deviceId) {
      return res.status(400).json({ error: 'Refresh token and device ID are required' });
    }
    
    await authService.logout(refreshToken, deviceId);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 * 
 * Body: { refreshToken, deviceId }
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken, deviceId } = req.body;
    
    if (!refreshToken || !deviceId) {
      return res.status(400).json({ error: 'Refresh token and device ID are required' });
    }
    
    const tokens = await authService.refreshAccessToken(refreshToken, deviceId);
    
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/auth/2fa/setup
 * Setup 2FA (generate secret and QR code)
 * 
 * Requires authentication
 */
router.post('/2fa/setup', authenticateToken, async (req, res, next) => {
  try {
    const { secret, qrCode } = await authService.setup2FA(req.userId);
    
    res.json({ secret, qrCode });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/2fa/verify
 * Verify and enable 2FA
 * 
 * Requires authentication
 * Body: { code }
 */
router.post('/2fa/verify', authenticateToken, async (req, res, next) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '2FA code is required' });
    }
    
    await authService.verifyAndEnable2FA(req.userId, code);
    
    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/2fa/setup-initial
 * Setup 2FA for newly registered users (no auth required)
 * Verifies username/password instead of token
 * 
 * Body: { username, password }
 */
router.post('/2fa/setup-initial', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const { secret, qrCode } = await authService.setup2FAInitial(username, password);
    
    res.json({ secret, qrCode });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/auth/2fa/verify-initial
 * Verify and enable 2FA for newly registered users (no auth required)
 * Verifies username/password instead of token
 * 
 * Body: { username, password, code }
 */
router.post('/2fa/verify-initial', async (req, res, next) => {
  try {
    const { username, password, code } = req.body;
    
    if (!username || !password || !code) {
      return res.status(400).json({ error: 'Username, password, and 2FA code are required' });
    }
    
    // Validate code format (should be 6 digits)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: '2FA code must be 6 digits' });
    }
    
    console.log(`2FA verify-initial request for user: ${username}`);
    await authService.verifyAndEnable2FAInitial(username, password, code);
    
    console.log(`2FA verify-initial successful for user: ${username}`);
    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verify-initial error:', error);
    res.status(400).json({ error: error.message || '2FA verification failed' });
  }
});

module.exports = router;
