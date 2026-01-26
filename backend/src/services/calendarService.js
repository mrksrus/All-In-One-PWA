/**
 * Calendar service
 * 
 * Business logic for calendar events
 */

const { getDatabase } = require('../database/init');

/**
 * Get all events for a user
 * 
 * @param {number} userId - User ID
 * @param {string} startDate - Optional start date filter (YYYY-MM-DD)
 * @param {string} endDate - Optional end date filter (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of events
 */
function getEvents(userId, startDate = null, endDate = null) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM calendar_events WHERE user_id = ?';
    const params = [userId];
    
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY date, start_time';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Convert database rows to event objects
      const events = rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time,
        location: row.location,
        reminderTime: row.reminder_time,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
      
      resolve(events);
    });
  });
}

/**
 * Get a single event by ID
 * 
 * @param {number} userId - User ID
 * @param {number} eventId - Event ID
 * @returns {Promise<Object|null>} - Event object or null
 */
function getEvent(userId, eventId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM calendar_events WHERE id = ? AND user_id = ?',
      [eventId, userId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        resolve({
          id: row.id,
          title: row.title,
          description: row.description,
          date: row.date,
          startTime: row.start_time,
          endTime: row.end_time,
          location: row.location,
          reminderTime: row.reminder_time,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    );
  });
}

/**
 * Create a new event
 * 
 * @param {number} userId - User ID
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} - Created event
 */
function createEvent(userId, eventData) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      reminderTime,
    } = eventData;
    
    if (!title || !date) {
      reject(new Error('Title and date are required'));
      return;
    }
    
    db.run(
      `INSERT INTO calendar_events 
       (user_id, title, description, date, start_time, end_time, location, reminder_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, description || null, date, startTime || null, endTime || null, location || null, reminderTime || null],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Return the created event
        getEvent(userId, this.lastID).then(resolve).catch(reject);
      }
    );
  });
}

/**
 * Update an event
 * 
 * @param {number} userId - User ID
 * @param {number} eventId - Event ID
 * @param {Object} eventData - Updated event data
 * @returns {Promise<Object>} - Updated event
 */
function updateEvent(userId, eventId, eventData) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      reminderTime,
    } = eventData;
    
    // Build update query dynamically (only update provided fields)
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      values.push(date);
    }
    if (startTime !== undefined) {
      updates.push('start_time = ?');
      values.push(startTime);
    }
    if (endTime !== undefined) {
      updates.push('end_time = ?');
      values.push(endTime);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (reminderTime !== undefined) {
      updates.push('reminder_time = ?');
      values.push(reminderTime);
    }
    
    if (updates.length === 0) {
      // No updates provided, just return current event
      getEvent(userId, eventId).then(resolve).catch(reject);
      return;
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(eventId, userId);
    
    db.run(
      `UPDATE calendar_events 
       SET ${updates.join(', ')} 
       WHERE id = ? AND user_id = ?`,
      values,
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('Event not found'));
          return;
        }
        
        // Return the updated event
        getEvent(userId, eventId).then(resolve).catch(reject);
      }
    );
  });
}

/**
 * Delete an event
 * 
 * @param {number} userId - User ID
 * @param {number} eventId - Event ID
 * @returns {Promise<boolean>} - True if deleted
 */
function deleteEvent(userId, eventId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM calendar_events WHERE id = ? AND user_id = ?',
      [eventId, userId],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('Event not found'));
          return;
        }
        
        resolve(true);
      }
    );
  });
}

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};
