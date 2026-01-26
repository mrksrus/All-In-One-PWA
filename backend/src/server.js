/**
 * Main server file
 * 
 * This is the entry point for the backend API server.
 * It sets up Express, connects to the database, and registers all routes.
 */

const express = require('express');
const cors = require('cors');
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
app.use(cors({
  origin: config.corsOrigin,
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
