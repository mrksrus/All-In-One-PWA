/**
 * IndexedDB storage service
 * 
 * Handles offline data storage using IndexedDB.
 * Stores user data for offline access.
 */

import { openDB } from 'idb';

const DB_NAME = 'all-in-one-pwa';
const DB_VERSION = 1;

/**
 * Initialize database
 */
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Calendar events store
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath: 'id' });
      }
      
      // Contacts store
      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'id' });
      }
      
      // Mail messages store
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'id' });
      }
      
      // Mail folders store
      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'id' });
      }
    },
  });
}

/**
 * Calendar storage
 */
export const calendarStorage = {
  async getAll() {
    const db = await initDB();
    return db.getAll('events');
  },
  
  async setAll(events) {
    const db = await initDB();
    const tx = db.transaction('events', 'readwrite');
    await tx.store.clear();
    for (const event of events) {
      await tx.store.put(event);
    }
    await tx.done;
  },
  
  async add(event) {
    const db = await initDB();
    await db.add('events', event);
  },
  
  async update(event) {
    const db = await initDB();
    await db.put('events', event);
  },
  
  async delete(id) {
    const db = await initDB();
    await db.delete('events', id);
  },
};

/**
 * Contacts storage
 */
export const contactsStorage = {
  async getAll() {
    const db = await initDB();
    return db.getAll('contacts');
  },
  
  async setAll(contacts) {
    const db = await initDB();
    const tx = db.transaction('contacts', 'readwrite');
    await tx.store.clear();
    for (const contact of contacts) {
      await tx.store.put(contact);
    }
    await tx.done;
  },
  
  async add(contact) {
    const db = await initDB();
    await db.add('contacts', contact);
  },
  
  async update(contact) {
    const db = await initDB();
    await db.put('contacts', contact);
  },
  
  async delete(id) {
    const db = await initDB();
    await db.delete('contacts', id);
  },
};

/**
 * Mail storage
 */
export const mailStorage = {
  async getMessages(folder) {
    const db = await initDB();
    const all = await db.getAll('messages');
    return all.filter(msg => msg.folder === folder);
  },
  
  async setMessages(folder, messages) {
    const db = await initDB();
    const tx = db.transaction('messages', 'readwrite');
    
    // Remove old messages from this folder
    const all = await tx.store.getAll();
    for (const msg of all) {
      if (msg.folder === folder) {
        await tx.store.delete(msg.id);
      }
    }
    
    // Add new messages
    for (const msg of messages) {
      await tx.store.put({ ...msg, folder });
    }
    
    await tx.done;
  },
  
  async getFolders() {
    const db = await initDB();
    return db.getAll('folders');
  },
  
  async setFolders(folders) {
    const db = await initDB();
    const tx = db.transaction('folders', 'readwrite');
    await tx.store.clear();
    for (const folder of folders) {
      await tx.store.put(folder);
    }
    await tx.done;
  },
};
