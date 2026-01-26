/**
 * Mail routes
 * 
 * API endpoints for email
 */

const express = require('express');
const router = express.Router();
const mailService = require('../services/mailService');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/mail/config
 * Save email configuration
 * 
 * Body: { imapHost, imapPort, imapSecure, smtpHost, smtpPort, smtpSecure, username, password }
 */
router.post('/config', async (req, res, next) => {
  try {
    await mailService.saveEmailConfig(req.userId, req.body);
    res.json({ message: 'Email configuration saved successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mail/config
 * Get email configuration (without password)
 */
router.get('/config', async (req, res, next) => {
  try {
    const config = await mailService.getEmailConfig(req.userId);
    
    if (!config) {
      return res.status(404).json({ error: 'Email configuration not found' });
    }
    
    // Don't send password
    res.json({
      imapHost: config.imapHost,
      imapPort: config.imapPort,
      imapSecure: config.imapSecure,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpSecure: config.smtpSecure,
      username: config.username,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mail/folders
 * Get all mail folders
 */
router.get('/folders', async (req, res, next) => {
  try {
    const folders = await mailService.getFolders(req.userId);
    res.json(folders);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mail/sync
 * Trigger email sync from IMAP server
 */
router.post('/sync', async (req, res, next) => {
  try {
    const result = await mailService.syncEmails(req.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mail/messages
 * Get messages in a folder
 * 
 * Query params:
 * - folder: Folder name (default: 'inbox')
 * - limit: Number of messages (default: 50)
 * - offset: Offset for pagination (default: 0)
 */
router.get('/messages', async (req, res, next) => {
  try {
    const folder = req.query.folder || 'inbox';
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const messages = await mailService.getMessages(req.userId, folder, limit, offset);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mail/messages/:id
 * Get a single message by ID
 */
router.get('/messages/:id', async (req, res, next) => {
  try {
    const messageId = parseInt(req.params.id);
    const message = await mailService.getMessage(req.userId, messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mail/send
 * Send an email
 * 
 * Body: { to, subject, text, html, cc, bcc }
 */
router.post('/send', async (req, res, next) => {
  try {
    const { to, subject, text, html, cc, bcc } = req.body;
    
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'To, subject, and text/html are required' });
    }
    
    const result = await mailService.sendEmail(req.userId, { to, subject, text, html, cc, bcc });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
