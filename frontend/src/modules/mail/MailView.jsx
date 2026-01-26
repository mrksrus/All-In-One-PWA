/**
 * Mail view component
 * 
 * Displays a single email message
 */

import { format } from 'date-fns';
import './MailView.css';

function MailView({ message, onBack }) {
  return (
    <div className="mail-view">
      <button onClick={onBack} className="btn-secondary">
        ← Back
      </button>
      
      <div className="mail-view-header">
        <h2>{message.subject || '(No subject)'}</h2>
        <div className="mail-view-meta">
          <div><strong>From:</strong> {message.from}</div>
          <div><strong>To:</strong> {message.to}</div>
          <div><strong>Date:</strong> {format(new Date(message.date), 'PPpp')}</div>
        </div>
      </div>
      
      <div className="mail-view-body">
        {message.bodyHtml ? (
          <div dangerouslySetInnerHTML={{ __html: message.bodyHtml }} />
        ) : (
          <pre style={{ whiteSpace: 'pre-wrap' }}>{message.bodyText}</pre>
        )}
      </div>
    </div>
  );
}

export default MailView;
