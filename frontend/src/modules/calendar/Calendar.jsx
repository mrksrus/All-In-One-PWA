/**
 * Calendar module
 * 
 * Main calendar component with monthly/weekly/daily views
 */

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { calendarAPI } from '../../services/api';
import { calendarStorage } from '../../services/storage';
import { scheduleEventReminders } from '../../services/notifications';
import EventList from './EventList';
import EventForm from './EventForm';
import './Calendar.css';

function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // month, week, day
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Load events on mount and sync
  useEffect(() => {
    loadEvents();
    
    // Sync every 5 minutes while app is open
    const syncInterval = setInterval(loadEvents, 5 * 60 * 1000);
    
    return () => clearInterval(syncInterval);
  }, []);

  const loadEvents = async () => {
    try {
      // Try to load from API
      const apiEvents = await calendarAPI.getEvents();
      setEvents(apiEvents);
      
      // Cache in IndexedDB
      await calendarStorage.setAll(apiEvents);
      
      // Schedule notifications
      scheduleEventReminders(apiEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to cached data
      try {
        const cachedEvents = await calendarStorage.getAll();
        setEvents(cachedEvents);
      } catch (cacheError) {
        console.error('Error loading cached events:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await calendarAPI.deleteEvent(eventId);
      await loadEvents();
    } catch (error) {
      alert('Error deleting event: ' + error.message);
    }
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (editingEvent) {
        await calendarAPI.updateEvent(editingEvent.id, eventData);
      } else {
        await calendarAPI.createEvent(eventData);
      }
      setShowForm(false);
      setEditingEvent(null);
      await loadEvents();
    } catch (error) {
      alert('Error saving event: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container">Loading calendar...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="calendar-container">
        <div className="calendar-header">
          <h1>Calendar</h1>
          <div className="calendar-actions">
            <select value={view} onChange={(e) => setView(e.target.value)}>
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
            <button onClick={handleCreateEvent} className="btn-primary">
              + New Event
            </button>
          </div>
        </div>

        {showForm && (
          <EventForm
            event={editingEvent}
            onSave={handleSaveEvent}
            onCancel={() => {
              setShowForm(false);
              setEditingEvent(null);
            }}
          />
        )}

        <EventList
          events={events}
          view={view}
          selectedDate={selectedDate}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      </div>
    </Layout>
  );
}

export default Calendar;
