/**
 * Calendar routes
 * 
 * API endpoints for calendar events
 */

const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendarService');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/calendar/events
 * Get all events for the authenticated user
 * 
 * Query params:
 * - startDate: Filter events from this date (YYYY-MM-DD)
 * - endDate: Filter events until this date (YYYY-MM-DD)
 */
router.get('/events', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const events = await calendarService.getEvents(req.userId, startDate, endDate);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/events/:id
 * Get a single event by ID
 */
router.get('/events/:id', async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await calendarService.getEvent(req.userId, eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/calendar/events
 * Create a new event
 * 
 * Body: { title, description, date, startTime, endTime, location, reminderTime }
 */
router.post('/events', async (req, res, next) => {
  try {
    const event = await calendarService.createEvent(req.userId, req.body);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/calendar/events/:id
 * Update an event
 * 
 * Body: { title, description, date, startTime, endTime, location, reminderTime }
 */
router.put('/events/:id', async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await calendarService.updateEvent(req.userId, eventId, req.body);
    res.json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/calendar/events/:id
 * Delete an event
 */
router.delete('/events/:id', async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id);
    await calendarService.deleteEvent(req.userId, eventId);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
