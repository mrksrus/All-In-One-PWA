/**
 * JWT (JSON Web Token) utilities
 * 
 * JWT tokens are used for authentication.
 * They contain user information and are cryptographically signed.
 * 
 * We use two types of tokens:
 * 1. Access tokens - Short-lived (15 min), used for API requests
 * 2. Refresh tokens - Long-lived (7 days), used to get new access tokens
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate access token
 * 
 * Access tokens are short-lived and contain minimal user info
 * 
 * @param {number} userId - User ID
 * @returns {string} - JWT access token
 */
function generateAccessToken(userId) {
  // jwt.sign() creates a signed token
  // First parameter: payload (data to store in token)
  // Second parameter: secret key (used to sign the token)
  // Third parameter: options (expiration time, etc.)
  return jwt.sign(
    { userId },  // Payload - only store user ID for security
    config.jwtSecret,
    { expiresIn: config.jwtExpiration }
  );
}

/**
 * Generate refresh token
 * 
 * Refresh tokens are long-lived and stored in database
 * They're used to get new access tokens without re-login
 * 
 * @param {number} userId - User ID
 * @returns {string} - JWT refresh token
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiration }
  );
}

/**
 * Verify access token
 * 
 * @param {string} token - JWT access token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function verifyAccessToken(token) {
  try {
    // jwt.verify() checks the signature and expiration
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Verify refresh token
 * 
 * @param {string} token - JWT refresh token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwtRefreshSecret);
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
