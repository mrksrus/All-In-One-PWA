/**
 * Password utilities
 * 
 * Handles password hashing and validation
 * Uses bcrypt for secure password hashing
 */

const bcrypt = require('bcrypt');
const config = require('../config');

/**
 * Hash a password
 * 
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  // bcrypt.hash() creates a secure hash of the password
  // The second parameter (12) is the "cost factor" - higher = more secure but slower
  // 12 is a good balance for security vs performance
  return await bcrypt.hash(password, config.bcryptRounds);
}

/**
 * Verify a password against a hash
 * 
 * @param {string} password - Plain text password to check
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(password, hash) {
  // bcrypt.compare() securely compares the password to the hash
  // It handles timing attacks automatically
  return await bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * 
 * @param {string} password - Password to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < config.passwordMinLength) {
    return { 
      valid: false, 
      error: `Password must be at least ${config.passwordMinLength} characters long` 
    };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
}

module.exports = {
  hashPassword,
  verifyPassword,
  validatePassword,
};
