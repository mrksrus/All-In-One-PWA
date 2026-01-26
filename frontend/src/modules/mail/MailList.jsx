/**
 * Mail list component
 * 
 * Displays list of email messages
 */

import { format } from 'date-fns';
import './MailList.css';

function MailList({ messages, loading, onMessageClick }) {
  if (loading) {
    return <div className="mail-loading">Loading messages...</div>;
  }

  if (messages.length === 0) {
    return <div className="no-messages">No messages</div>;
  }

  return (
    <div className="mail-list">
      {messages.map(message => (
        <div
          key={message.id}
          className={`mail-item ${!message.read ? 'unread' : ''}`}
          onClick={() => onMessageClick(message.id)}
        >
          <div className="mail-item-header">
            <strong>{message.from || 'Unknown'}</strong>
            <span className="mail-date">
              {format(new Date(message.date), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="mail-subject">{message.subject || '(No subject)'}</div>
          {message.bodyText && (
            <div className="mail-preview">
              {message.bodyText.substring(0, 100)}...
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MailList;
