/**
 * Contact form component
 * 
 * Form for creating/editing contacts
 */

import { useState, useEffect } from 'react';
import './ContactForm.css';

function ContactForm({ contact, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState(['']);
  const [emailAddresses, setEmailAddresses] = useState(['']);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhoneNumbers(contact.phoneNumbers && contact.phoneNumbers.length > 0 ? contact.phoneNumbers : ['']);
      setEmailAddresses(contact.emailAddresses && contact.emailAddresses.length > 0 ? contact.emailAddresses : ['']);
      setNotes(contact.notes || '');
    }
  }, [contact]);

  const handleAddPhone = () => {
    setPhoneNumbers([...phoneNumbers, '']);
  };

  const handleRemovePhone = (index) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (index, value) => {
    const newPhones = [...phoneNumbers];
    newPhones[index] = value;
    setPhoneNumbers(newPhones);
  };

  const handleAddEmail = () => {
    setEmailAddresses([...emailAddresses, '']);
  };

  const handleRemoveEmail = (index) => {
    setEmailAddresses(emailAddresses.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...emailAddresses];
    newEmails[index] = value;
    setEmailAddresses(newEmails);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const contactData = {
      name,
      phoneNumbers: phoneNumbers.filter(phone => phone.trim() !== ''),
      emailAddresses: emailAddresses.filter(email => email.trim() !== ''),
      notes: notes || null,
    };
    
    onSave(contactData);
  };

  return (
    <div className="contact-form-overlay">
      <div className="contact-form">
        <h2>{contact ? 'Edit Contact' : 'New Contact'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Phone Numbers</label>
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="form-array-item">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  placeholder="+1234567890"
                />
                {phoneNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(index)}
                    className="btn-danger btn-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPhone}
              className="btn-secondary btn-sm"
            >
              + Add Phone
            </button>
          </div>
          
          <div className="form-group">
            <label>Email Addresses</label>
            {emailAddresses.map((email, index) => (
              <div key={index} className="form-array-item">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder="email@example.com"
                />
                {emailAddresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(index)}
                    className="btn-danger btn-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddEmail}
              className="btn-secondary btn-sm"
            >
              + Add Email
            </button>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {contact ? 'Update' : 'Create'} Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactForm;
