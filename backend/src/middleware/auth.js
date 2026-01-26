/**
 * Authentication middleware
 * 
 * This middleware protects API routes - only authenticated users can access them.
 * 
 * How it works:
 * 1. Extract JWT token from request header
 * 2. Verify token signature and expiration
 * 3. Add user ID to request object
 * 4. Continue to next middleware/route handler
 */

const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT access token
 * 
 * Expects token in Authorization header: "Bearer <token>"
 * 
 * If token is valid, adds userId to req.userId
 * If token is invalid, returns 401 Unauthorized
 */
function authenticateToken(req, res, next) {
  // Get token from Authorization header
  // Format: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // Split and get token part
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // Verify token
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  
  // Add user ID to request object
  // This allows route handlers to know which user made the request
  req.userId = decoded.userId;
  
  // Continue to next middleware/route handler
  next();
}

module.exports = {
  authenticateToken,
};
