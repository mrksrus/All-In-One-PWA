# Architecture Documentation

## High-Level Overview

This system is a **self-hosted personal data platform** built with a simple, modular architecture. It consists of:

1. **Backend API** (Node.js/Express) - Handles all data storage and business logic
2. **Frontend PWA** (React) - User interface that works offline
3. **SQLite Database** - Stores all user data
4. **Docker Containers** - Easy deployment and isolation

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Device                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │         PWA (React App Shell)                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │ Calendar │  │ Contacts │  │   Mail   │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘       │  │
│  │                                                  │  │
│  │  Service Worker ──> IndexedDB (Offline Cache)  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Docker Container                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Backend API (Node.js/Express)            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │   Auth   │  │ Calendar │  │ Contacts │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘       │  │
│  │                                                  │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │         Mail Service (IMAP/SMTP)         │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │         SQLite Database                          │  │
│  │  - users                                         │  │
│  │  - sessions                                      │  │
│  │  - calendar_events                               │  │
│  │  - contacts                                      │  │
│  │  - mail_messages                                 │  │
│  │  - mail_folders                                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow

1. User registers → Backend creates user with hashed password
2. User logs in → Backend verifies password + 2FA
3. Backend returns JWT access token + refresh token
4. Frontend stores tokens in memory (not localStorage for security)
5. Frontend includes access token in all API requests
6. When access token expires, frontend uses refresh token to get new one

### Data Sync Flow

1. **App Opens**:
   - Frontend checks if user is logged in
   - If logged in, fetches all data from API
   - Stores data in IndexedDB for offline access
   - Schedules local notifications for calendar reminders

2. **While App is Open**:
   - Periodic sync every 5 minutes
   - New data fetched and cached
   - Notifications updated

3. **Offline Usage**:
   - App reads from IndexedDB cache
   - Changes queued for sync when online
   - Service worker handles background sync

### Mail Sync Flow

1. User configures email settings (IMAP/SMTP)
2. Backend stores credentials (encrypted)
3. Backend periodically polls IMAP server
4. New emails stored in database
5. Frontend fetches emails from API
6. Frontend caches emails in IndexedDB

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  two_factor_secret TEXT,  -- TOTP secret
  two_factor_enabled INTEGER DEFAULT 0,  -- 0 or 1 (boolean)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,  -- Unique device identifier
  refresh_token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Calendar Events Table
```sql
CREATE TABLE calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  reminder_time DATETIME,  -- When to send reminder
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Contacts Table
```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone_numbers TEXT,  -- JSON array: ["+1234567890", "+0987654321"]
  email_addresses TEXT,  -- JSON array: ["email1@example.com"]
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Mail Folders Table
```sql
CREATE TABLE mail_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,  -- "inbox", "sent", "trash"
  imap_path TEXT,  -- IMAP folder path
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);
```

### Mail Messages Table
```sql
CREATE TABLE mail_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder_id INTEGER NOT NULL,
  message_id TEXT NOT NULL,  -- IMAP message ID
  subject TEXT,
  from_address TEXT,
  to_address TEXT,
  cc_address TEXT,
  bcc_address TEXT,
  body_text TEXT,
  body_html TEXT,
  date_received DATETIME NOT NULL,
  read INTEGER DEFAULT 0,  -- 0 or 1 (boolean)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES mail_folders(id) ON DELETE CASCADE,
  UNIQUE(user_id, message_id)
);
```

### Email Configurations Table
```sql
CREATE TABLE email_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL,
  imap_secure INTEGER DEFAULT 1,  -- 0 or 1 (boolean)
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_secure INTEGER DEFAULT 1,  -- 0 or 1 (boolean)
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,  -- Encrypted password
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Security Architecture

### Password Security
- **Minimum 24 characters** required
- **Argon2 hashing** - Industry standard, resistant to GPU attacks
- Passwords never stored in plain text
- Passwords never sent in API responses

### Two-Factor Authentication (2FA)
- **TOTP (Time-based One-Time Password)** - Works with apps like Google Authenticator
- Mandatory for all users
- Secret stored encrypted in database
- QR code generated for easy setup

### JWT Tokens
- **Access Token**: Short-lived (15 minutes), contains user ID
- **Refresh Token**: Long-lived (7 days), stored in database
- Tokens signed with secret keys
- Refresh tokens can be revoked (logout)

### Data Isolation
- All database queries filtered by `user_id`
- Users cannot access other users' data
- API middleware enforces user isolation
- No shared data between users

### HTTPS
- All communication over HTTPS (required for PWA)
- Self-signed certificates OK for local development
- Production should use Let's Encrypt

## Module Architecture

### Module Structure

Each module follows the same pattern:

**Backend:**
```
routes/
  calendar.js    # API endpoints
services/
  calendar.js    # Business logic
```

**Frontend:**
```
modules/
  calendar/
    Calendar.jsx      # Main component
    EventForm.jsx     # Create/edit form
    EventList.jsx    # List view
```

### Adding a New Module

1. **Database**: Add tables to schema
2. **Backend**: Create routes and services
3. **Frontend**: Create module folder with components
4. **Routing**: Add route to app shell
5. **Navigation**: Add to dashboard

## PWA Architecture

### Service Worker
- Caches app shell (HTML, CSS, JS)
- Caches API responses
- Handles offline fallbacks
- Shows notification if app not opened for 24 hours

### IndexedDB
- Stores user data for offline access
- Separate databases per user (if needed)
- Syncs with server when online
- Queues changes when offline

### Local Notifications
- Scheduled when calendar events are synced
- Work without internet connection
- Triggered by service worker
- Platform-specific (Android works best)

## Deployment Architecture

### Docker Setup

```
docker-compose.yml
├── backend (Node.js container)
│   ├── Port: 3000
│   ├── Volume: /data (database, email storage)
│   └── Environment: Secrets, config
│
└── frontend (Nginx container)
    ├── Port: 80
    ├── Serves React build
    └── Proxies API to backend
```

### Volumes
- `/data/database.sqlite` - SQLite database file
- `/data/email/` - Email attachments (future)
- `/data/uploads/` - User uploads (future)

### Environment Variables
- `JWT_SECRET` - Signing key for access tokens
- `JWT_REFRESH_SECRET` - Signing key for refresh tokens
- `DB_PATH` - Path to SQLite database
- `CORS_ORIGIN` - Allowed frontend origin
- `PORT` - Backend port

## Extension Points

### Adding New Modules

1. Create database tables
2. Add backend routes (`/api/newmodule`)
3. Add backend service
4. Create frontend module folder
5. Add route to app shell
6. Add navigation item

### Adding Features to Existing Modules

1. Add database columns (migration)
2. Update backend service
3. Update frontend components
4. Update API client

## Performance Considerations

- **SQLite**: Fast for single-user or small groups (< 100 users)
- **Indexing**: All foreign keys indexed
- **Caching**: Frontend caches aggressively
- **Pagination**: Large lists paginated
- **Lazy Loading**: Modules loaded on demand

## Limitations

- **SQLite**: Not ideal for high concurrency (but fine for personal use)
- **Email Polling**: Not real-time (polls every 5 minutes)
- **Notifications**: iOS has limitations
- **Single Server**: No horizontal scaling (by design)

## Future Enhancements (Not Implemented)

- Notes module
- Tasks/Todos module
- File storage
- Photo gallery
- Music player
- AI assistant integration
- External API integrations

All designed to be pluggable into the existing architecture.
