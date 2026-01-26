/**
 * Contacts service
 * 
 * Business logic for contacts
 */

const { getDatabase } = require('../database/init');

/**
 * Get all contacts for a user
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of contacts
 */
function getContacts(userId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM contacts WHERE user_id = ? ORDER BY name',
      [userId],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Parse JSON fields and convert to contact objects
        const contacts = rows.map(row => ({
          id: row.id,
          name: row.name,
          phoneNumbers: row.phone_numbers ? JSON.parse(row.phone_numbers) : [],
          emailAddresses: row.email_addresses ? JSON.parse(row.email_addresses) : [],
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        
        resolve(contacts);
      }
    );
  });
}

/**
 * Get a single contact by ID
 * 
 * @param {number} userId - User ID
 * @param {number} contactId - Contact ID
 * @returns {Promise<Object|null>} - Contact object or null
 */
function getContact(userId, contactId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
      [contactId, userId],
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
          name: row.name,
          phoneNumbers: row.phone_numbers ? JSON.parse(row.phone_numbers) : [],
          emailAddresses: row.email_addresses ? JSON.parse(row.email_addresses) : [],
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    );
  });
}

/**
 * Create a new contact
 * 
 * @param {number} userId - User ID
 * @param {Object} contactData - Contact data
 * @returns {Promise<Object>} - Created contact
 */
function createContact(userId, contactData) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const {
      name,
      phoneNumbers = [],
      emailAddresses = [],
      notes,
    } = contactData;
    
    if (!name) {
      reject(new Error('Name is required'));
      return;
    }
    
    // Convert arrays to JSON strings for storage
    const phoneNumbersJson = JSON.stringify(phoneNumbers);
    const emailAddressesJson = JSON.stringify(emailAddresses);
    
    db.run(
      `INSERT INTO contacts (user_id, name, phone_numbers, email_addresses, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, name, phoneNumbersJson, emailAddressesJson, notes || null],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Return the created contact
        getContact(userId, this.lastID).then(resolve).catch(reject);
      }
    );
  });
}

/**
 * Update a contact
 * 
 * @param {number} userId - User ID
 * @param {number} contactId - Contact ID
 * @param {Object} contactData - Updated contact data
 * @returns {Promise<Object>} - Updated contact
 */
function updateContact(userId, contactId, contactData) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const {
      name,
      phoneNumbers,
      emailAddresses,
      notes,
    } = contactData;
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phoneNumbers !== undefined) {
      updates.push('phone_numbers = ?');
      values.push(JSON.stringify(phoneNumbers));
    }
    if (emailAddresses !== undefined) {
      updates.push('email_addresses = ?');
      values.push(JSON.stringify(emailAddresses));
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    
    if (updates.length === 0) {
      getContact(userId, contactId).then(resolve).catch(reject);
      return;
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(contactId, userId);
    
    db.run(
      `UPDATE contacts 
       SET ${updates.join(', ')} 
       WHERE id = ? AND user_id = ?`,
      values,
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('Contact not found'));
          return;
        }
        
        getContact(userId, contactId).then(resolve).catch(reject);
      }
    );
  });
}

/**
 * Delete a contact
 * 
 * @param {number} userId - User ID
 * @param {number} contactId - Contact ID
 * @returns {Promise<boolean>} - True if deleted
 */
function deleteContact(userId, contactId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM contacts WHERE id = ? AND user_id = ?',
      [contactId, userId],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('Contact not found'));
          return;
        }
        
        resolve(true);
      }
    );
  });
}

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
};
