/**
 * Main server file
 * 
 * This is the entry point for the backend API server.
 * It sets up Express, connects to the database, and registers all routes.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { initDatabase } = require('./database/init');
const { errorHandler } = require('./middleware/errorHandler');
// Import secrets to ensure they're generated on startup
require('./utils/secrets');

// Import routes
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const contactsRoutes = require('./routes/contacts');
const mailRoutes = require('./routes/mail');

// Create Express app
const app = express();

// Middleware
// CORS allows the frontend to make requests to the backend
// If CORS_ORIGIN is set to "*" or "true", allow all origins
app.use(cors({
  origin: (config.corsOrigin === '*' || config.corsOrigin === 'true') 
    ? true 
    : config.corsOrigin,
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/mail', mailRoutes);

// Serve static files from the React app (if public directory exists)
// This allows the same server to serve both API and frontend
const publicPath = path.join(__dirname, '../../public');
const fs = require('fs');

// Debug logging
console.log('Checking for public directory at:', publicPath);
console.log('Public directory exists:', fs.existsSync(publicPath));
console.log('Current __dirname:', __dirname);
console.log('Current working directory:', process.cwd());

if (fs.existsSync(publicPath)) {
  const indexPath = path.join(publicPath, 'index.html');
  console.log('Checking for index.html at:', indexPath);
  console.log('index.html exists:', fs.existsSync(indexPath));
  
  // List files in public directory for debugging
  try {
    const files = fs.readdirSync(publicPath);
    console.log('Files in public directory:', files.slice(0, 10)); // Show first 10 files
  } catch (err) {
    console.error('Error reading public directory:', err);
  }
  
  // Serve static files (JS, CSS, images, etc.)
  // Use express.static with index option to serve index.html for root
  app.use(express.static(publicPath, {
    index: 'index.html'
  }));
  
  // Explicitly handle root path to ensure index.html is served
  app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend index.html not found.');
    }
  });
  
  // For React Router: all non-API routes should serve index.html
  // This catch-all must come AFTER static middleware but BEFORE error handler
  app.get('*', (req, res, next) => {
    // Skip API routes - let error handler deal with 404
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    // For all other routes, serve index.html (React Router handles routing)
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error sending index.html:', err);
          next(err);
        }
      });
    } else {
      console.error('index.html not found at:', indexPath);
      res.status(404).send('Frontend not found. Please rebuild the Docker image.');
    }
  });
} else {
  console.error('Public directory not found at:', publicPath);
  console.error('This means the frontend was not built or copied correctly.');
  
  // Fallback: serve a helpful error message
  app.get('/', (req, res) => {
    res.status(500).send(`
      <h1>Frontend Not Found</h1>
      <p>The public directory was not found at: ${publicPath}</p>
      <p>Please ensure the Docker image was built correctly with the frontend build output.</p>
      <p>Check Docker logs for more information.</p>
    `);
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized');
    
    // Start listening
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.env}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
