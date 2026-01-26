/**
 * Contacts module
 * 
 * Main contacts component
 */

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { contactsAPI } from '../../services/api';
import { contactsStorage } from '../../services/storage';
import ContactList from './ContactList';
import ContactForm from './ContactForm';
import './Contacts.css';

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadContacts();
    
    // Sync every 5 minutes
    const syncInterval = setInterval(loadContacts, 5 * 60 * 1000);
    
    return () => clearInterval(syncInterval);
  }, []);

  const loadContacts = async () => {
    try {
      const apiContacts = await contactsAPI.getContacts();
      setContacts(apiContacts);
      await contactsStorage.setAll(apiContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      try {
        const cachedContacts = await contactsStorage.getAll();
        setContacts(cachedContacts);
      } catch (cacheError) {
        console.error('Error loading cached contacts:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = () => {
    setEditingContact(null);
    setShowForm(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await contactsAPI.deleteContact(contactId);
      await loadContacts();
    } catch (error) {
      alert('Error deleting contact: ' + error.message);
    }
  };

  const handleSaveContact = async (contactData) => {
    try {
      if (editingContact) {
        await contactsAPI.updateContact(editingContact.id, contactData);
      } else {
        await contactsAPI.createContact(contactData);
      }
      setShowForm(false);
      setEditingContact(null);
      await loadContacts();
    } catch (error) {
      alert('Error saving contact: ' + error.message);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumbers.some(phone => phone.includes(searchQuery)) ||
    contact.emailAddresses.some(email => email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <Layout>
        <div className="container">Loading contacts...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="contacts-container">
        <div className="contacts-header">
          <h1>Contacts</h1>
          <button onClick={handleCreateContact} className="btn-primary">
            + New Contact
          </button>
        </div>

        <div className="contacts-search">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {showForm && (
          <ContactForm
            contact={editingContact}
            onSave={handleSaveContact}
            onCancel={() => {
              setShowForm(false);
              setEditingContact(null);
            }}
          />
        )}

        <ContactList
          contacts={filteredContacts}
          onEdit={handleEditContact}
          onDelete={handleDeleteContact}
        />
      </div>
    </Layout>
  );
}

export default Contacts;
