/**
 * Error handling middleware
 * 
 * Catches errors from route handlers and sends appropriate responses
 * 
 * This ensures errors are handled consistently across the API
 */

/**
 * Error handler middleware
 * 
 * Should be added last in the middleware chain
 * Catches all errors and sends JSON error response
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Default error status and message
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Send error response
  res.status(status).json({
    error: message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = {
  errorHandler,
};
