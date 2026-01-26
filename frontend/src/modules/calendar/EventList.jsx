/**
 * Event list component
 * 
 * Displays events in different views (month/week/day)
 */

import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import './EventList.css';

function EventList({ events, view, selectedDate, onEdit, onDelete }) {
  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  if (view === 'month') {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const weekStart = startOfWeek(monthStart);
    const weekEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="calendar-month-view">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {days.map(day => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            
            return (
              <div 
                key={day.toISOString()} 
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''}`}
              >
                <div className="calendar-day-number">{format(day, 'd')}</div>
                <div className="calendar-day-events">
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id} 
                      className="calendar-event"
                      onClick={() => onEdit(event)}
                      title={event.title}
                    >
                      {event.startTime ? format(new Date(`2000-01-01T${event.startTime}`), 'HH:mm') : ''} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="calendar-event-more">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'week') {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="calendar-week-view">
        {days.map(day => {
          const dayEvents = getEventsForDate(day);
          return (
            <div key={day.toISOString()} className="calendar-week-day">
              <h3>{format(day, 'EEEE, MMMM d')}</h3>
              {dayEvents.length === 0 ? (
                <p className="no-events">No events</p>
              ) : (
                <div className="event-list">
                  {dayEvents.map(event => (
                    <div key={event.id} className="event-item">
                      <div className="event-item-header">
                        <strong>{event.title}</strong>
                        <div className="event-item-actions">
                          <button onClick={() => onEdit(event)} className="btn-secondary btn-sm">Edit</button>
                          <button onClick={() => onDelete(event.id)} className="btn-danger btn-sm">Delete</button>
                        </div>
                      </div>
                      {event.startTime && <div>Time: {event.startTime} - {event.endTime || 'No end time'}</div>}
                      {event.location && <div>Location: {event.location}</div>}
                      {event.description && <div>{event.description}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Day view
  const dayEvents = getEventsForDate(selectedDate);
  
  return (
    <div className="calendar-day-view">
      <h2>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h2>
      {dayEvents.length === 0 ? (
        <p className="no-events">No events for this day</p>
      ) : (
        <div className="event-list">
          {dayEvents.map(event => (
            <div key={event.id} className="event-item">
              <div className="event-item-header">
                <strong>{event.title}</strong>
                <div className="event-item-actions">
                  <button onClick={() => onEdit(event)} className="btn-secondary btn-sm">Edit</button>
                  <button onClick={() => onDelete(event.id)} className="btn-danger btn-sm">Delete</button>
                </div>
              </div>
              {event.startTime && <div>Time: {event.startTime} - {event.endTime || 'No end time'}</div>}
              {event.location && <div>Location: {event.location}</div>}
              {event.description && <div>{event.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventList;
