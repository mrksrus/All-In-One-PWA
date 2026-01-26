/**
 * Contact list component
 * 
 * Displays list of contacts
 */

import './ContactList.css';

function ContactList({ contacts, onEdit, onDelete }) {
  const handlePhoneClick = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmailClick = (email) => {
    window.location.href = `mailto:${email}`;
  };

  if (contacts.length === 0) {
    return <p className="no-contacts">No contacts found</p>;
  }

  return (
    <div className="contact-list">
      {contacts.map(contact => (
        <div key={contact.id} className="contact-item">
          <div className="contact-header">
            <h3>{contact.name}</h3>
            <div className="contact-actions">
              <button onClick={() => onEdit(contact)} className="btn-secondary btn-sm">
                Edit
              </button>
              <button onClick={() => onDelete(contact.id)} className="btn-danger btn-sm">
                Delete
              </button>
            </div>
          </div>
          
          {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
            <div className="contact-section">
              <strong>Phone:</strong>
              {contact.phoneNumbers.map((phone, index) => (
                <a
                  key={index}
                  href={`tel:${phone}`}
                  className="contact-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePhoneClick(phone);
                  }}
                >
                  {phone}
                </a>
              ))}
            </div>
          )}
          
          {contact.emailAddresses && contact.emailAddresses.length > 0 && (
            <div className="contact-section">
              <strong>Email:</strong>
              {contact.emailAddresses.map((email, index) => (
                <a
                  key={index}
                  href={`mailto:${email}`}
                  className="contact-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEmailClick(email);
                  }}
                >
                  {email}
                </a>
              ))}
            </div>
          )}
          
          {contact.notes && (
            <div className="contact-section">
              <strong>Notes:</strong>
              <p>{contact.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ContactList;
