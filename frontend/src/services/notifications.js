/**
 * Notification service
 * 
 * Handles local notifications for calendar reminders.
 * Works without Google services.
 */

/**
 * Request notification permission
 */
export async function requestPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Check if notifications are supported
 */
export function isSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Schedule a notification
 * 
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 * @param {Date} scheduleTime - When to show the notification
 */
export function scheduleNotification(title, options, scheduleTime) {
  if (!isSupported()) {
    console.warn('Notifications not supported');
    return;
  }
  
  // For immediate notifications
  if (scheduleTime <= new Date()) {
    showNotification(title, options);
    return;
  }
  
  // For future notifications, we'll use the service worker
  // Store notification data for service worker to handle
  const delay = scheduleTime.getTime() - Date.now();
  
  setTimeout(() => {
    showNotification(title, options);
  }, delay);
}

/**
 * Show a notification immediately
 */
export function showNotification(title, options = {}) {
  if (!isSupported() || Notification.permission !== 'granted') {
    return;
  }
  
  // Use service worker if available, otherwise use regular notification
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    });
  } else {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      ...options,
    });
  }
}

/**
 * Schedule calendar event reminders
 * 
 * @param {Array} events - Array of calendar events
 */
export function scheduleEventReminders(events) {
  // Clear existing reminders (in a real app, you'd track these)
  // For simplicity, we'll just schedule new ones
  
  events.forEach(event => {
    if (event.reminderTime) {
      const reminderTime = new Date(event.reminderTime);
      const now = new Date();
      
      // Only schedule if reminder is in the future
      if (reminderTime > now) {
        scheduleNotification(
          event.title,
          {
            body: event.description || `Event at ${event.startTime || 'all day'}`,
            tag: `event-${event.id}`,
            data: { eventId: event.id },
          },
          reminderTime
        );
      }
    }
  });
}

/**
 * Show daily reminder notification
 * (Shown if app hasn't been opened in 24 hours)
 */
export function showDailyReminder() {
  showNotification('Open app to sync your data', {
    body: 'It\'s been a while since you last opened the app. Open it to sync your calendar, contacts, and mail.',
    tag: 'daily-reminder',
    requireInteraction: false,
  });
}
