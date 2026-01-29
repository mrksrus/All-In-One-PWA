/**
 * API client
 * 
 * Handles all HTTP requests to the backend API.
 * Manages authentication tokens and error handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Store tokens in memory (more secure than localStorage)
let accessToken = null;
let refreshToken = null;
let deviceId = null;

/**
 * Get or generate device ID
 */
function getDeviceId() {
  if (!deviceId) {
    // Generate a unique device ID (stored in sessionStorage)
    deviceId = sessionStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('deviceId', deviceId);
    }
  }
  return deviceId;
}

/**
 * Set authentication tokens
 */
export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
}

/**
 * Clear authentication tokens
 */
export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

/**
 * Get access token
 */
export function getAccessToken() {
  return accessToken;
}

/**
 * Make an API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add access token if available
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  // Build request config
  const config = {
    method: options.method || 'GET',
    headers,
    credentials: 'include', // Include cookies/credentials for CORS
  };
  
  // Add body if provided (for POST, PUT, etc.)
  if (options.body) {
    config.body = options.body;
  }
  
  try {
    const response = await fetch(url, config);
    
    // Handle 401 (unauthorized) - try to refresh token
    if (response.status === 401 && refreshToken && endpoint !== '/auth/refresh' && endpoint !== '/auth/refresh-initial') {
      try {
        const newTokens = await refreshAccessToken();
        if (newTokens) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
          const retryResponse = await fetch(url, { ...config, headers });
          return await handleResponse(retryResponse);
        }
      } catch (error) {
        // Refresh failed - user needs to login again
        clearTokens();
        // Don't redirect on auth endpoints (register, login, etc.)
        if (!endpoint.startsWith('/auth/register') && !endpoint.startsWith('/auth/login')) {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please login again.');
      }
    }
    
    return await handleResponse(response);
  } catch (error) {
    // Handle network errors (CORS, connection refused, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check if the server is running.');
    }
    if (error.message === 'Session expired. Please login again.') {
      throw error;
    }
    // Re-throw if it's already our custom error
    if (error.message.startsWith('Network error:') || error.message.startsWith('Session expired')) {
      throw error;
    }
    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * Handle API response
 */
async function handleResponse(response) {
  // Check if response has content
  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (error) {
      // If JSON parsing fails, try to get text
      const text = await response.text();
      throw new Error(text || `Server error: ${response.status} ${response.statusText}`);
    }
  } else {
    // Not JSON response - get text
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `Server error: ${response.status} ${response.statusText}`);
    }
    return { message: text };
  }
  
  if (!response.ok) {
    throw new Error(data.error || `Server error: ${response.status} ${response.statusText}`);
  }
  
  return data;
}

/**
 * Refresh access token
 */
async function refreshAccessToken() {
  if (!refreshToken) {
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
        deviceId: getDeviceId(),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return data;
  } catch (error) {
    clearTokens();
    return null;
  }
}

// Authentication API
export const authAPI = {
  getSetupStatus: () => apiRequest('/auth/setup-status'),
  
  register: (username, email, password) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),
  
  getBackup: () => apiRequest('/auth/backup'),
  
  login: (username, password, twoFactorCode) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        twoFactorCode,
        deviceId: getDeviceId(),
      }),
    }).then(data => {
      setTokens(data.accessToken, data.refreshToken);
      return data;
    }),
  
  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken,
        deviceId: getDeviceId(),
      }),
    }).then(() => {
      clearTokens();
    }),
  
  setup2FA: () => apiRequest('/auth/2fa/setup', { method: 'POST' }),
  
  verify2FA: (code) => apiRequest('/auth/2fa/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }),
  
  // Initial 2FA setup (for newly registered users - no auth required)
  setup2FAInitial: (username, password) => apiRequest('/auth/2fa/setup-initial', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  
  verify2FAInitial: (username, password, code) => apiRequest('/auth/2fa/verify-initial', {
    method: 'POST',
    body: JSON.stringify({ username, password, code }),
  }),
};

// Calendar API
export const calendarAPI = {
  getEvents: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest(`/calendar/events?${params.toString()}`);
  },
  
  getEvent: (id) => apiRequest(`/calendar/events/${id}`),
  
  createEvent: (event) =>
    apiRequest('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  
  updateEvent: (id, event) =>
    apiRequest(`/calendar/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    }),
  
  deleteEvent: (id) =>
    apiRequest(`/calendar/events/${id}`, {
      method: 'DELETE',
    }),
};

// Contacts API
export const contactsAPI = {
  getContacts: () => apiRequest('/contacts'),
  
  getContact: (id) => apiRequest(`/contacts/${id}`),
  
  createContact: (contact) =>
    apiRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    }),
  
  updateContact: (id, contact) =>
    apiRequest(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    }),
  
  deleteContact: (id) =>
    apiRequest(`/contacts/${id}`, {
      method: 'DELETE',
    }),
};

// Mail API
export const mailAPI = {
  getConfig: () => apiRequest('/mail/config'),
  
  saveConfig: (config) =>
    apiRequest('/mail/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  
  getFolders: () => apiRequest('/mail/folders'),
  
  sync: () =>
    apiRequest('/mail/sync', {
      method: 'POST',
    }),
  
  getMessages: (folder, limit, offset) => {
    const params = new URLSearchParams();
    params.append('folder', folder);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);
    return apiRequest(`/mail/messages?${params.toString()}`);
  },
  
  getMessage: (id) => apiRequest(`/mail/messages/${id}`),
  
  sendEmail: (email) =>
    apiRequest('/mail/send', {
      method: 'POST',
      body: JSON.stringify(email),
    }),
};
