/**
 * Two-Factor Authentication (2FA) utilities
 * 
 * Uses TOTP (Time-based One-Time Password) - same as Google Authenticator
 * 
 * How it works:
 * 1. Generate a secret key for the user
 * 2. User scans QR code with authenticator app
 * 3. User enters code from app to verify
 * 4. On login, user must provide code from app
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Generate a 2FA secret for a user
 * 
 * @param {string} username - Username (for QR code label)
 * @param {string} serviceName - Service name (for QR code label)
 * @returns {Object} - { secret, qrCode }
 */
async function generateSecret(username, serviceName = 'All-in-One PWA') {
  // Generate a secret key
  const secret = speakeasy.generateSecret({
    name: `${serviceName} (${username})`,
    length: 32,  // Secret key length
  });
  
  // Generate QR code image (as data URL)
  // Users scan this with their authenticator app
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  return {
    secret: secret.base32,  // Base32 encoded secret (safe to store)
    qrCode,  // QR code image as data URL
  };
}

/**
 * Verify a TOTP code
 * 
 * @param {string} secret - User's 2FA secret (base32)
 * @param {string} token - Code from user's authenticator app
 * @returns {boolean} - True if code is valid
 */
function verifyToken(secret, token) {
  // speakeasy.totp.verify() checks if the code is correct
  // window: 2 means codes valid 2 time steps before/after current time
  // This accounts for clock drift between devices
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2,  // Allow codes from ±2 time steps (60 seconds each)
  });
}

module.exports = {
  generateSecret,
  verifyToken,
};
