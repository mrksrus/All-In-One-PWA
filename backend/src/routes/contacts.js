/**
 * Contacts routes
 * 
 * API endpoints for contacts
 */

const express = require('express');
const router = express.Router();
const contactsService = require('../services/contactsService');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/contacts
 * Get all contacts for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const contacts = await contactsService.getContacts(req.userId);
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/contacts/:id
 * Get a single contact by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const contactId = parseInt(req.params.id);
    const contact = await contactsService.getContact(req.userId, contactId);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/contacts
 * Create a new contact
 * 
 * Body: { name, phoneNumbers, emailAddresses, notes }
 */
router.post('/', async (req, res, next) => {
  try {
    const contact = await contactsService.createContact(req.userId, req.body);
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/contacts/:id
 * Update a contact
 * 
 * Body: { name, phoneNumbers, emailAddresses, notes }
 */
router.put('/:id', async (req, res, next) => {
  try {
    const contactId = parseInt(req.params.id);
    const contact = await contactsService.updateContact(req.userId, contactId, req.body);
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const contactId = parseInt(req.params.id);
    await contactsService.deleteContact(req.userId, contactId);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
