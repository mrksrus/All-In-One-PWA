/**
 * Event form component
 * 
 * Form for creating/editing calendar events
 */

import { useState, useEffect } from 'react';
import './EventForm.css';

function EventForm({ event, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setDate(event.date || '');
      setStartTime(event.startTime || '');
      setEndTime(event.endTime || '');
      setLocation(event.location || '');
      setReminderTime(event.reminderTime ? new Date(event.reminderTime).toISOString().slice(0, 16) : '');
    } else {
      // Default to today
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
  }, [event]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const eventData = {
      title,
      description,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      location: location || null,
      reminderTime: reminderTime ? new Date(reminderTime).toISOString() : null,
    };
    
    onSave(eventData);
  };

  return (
    <div className="event-form-overlay">
      <div className="event-form">
        <h2>{event ? 'Edit Event' : 'New Event'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="reminderTime">Reminder Time</label>
            <input
              type="datetime-local"
              id="reminderTime"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
            <small>When to send a notification reminder</small>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {event ? 'Update' : 'Create'} Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventForm;
