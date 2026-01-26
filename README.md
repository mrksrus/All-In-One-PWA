# All-in-One PWA - Self-Hosted Personal Data Platform

A minimal, modular, self-hosted personal data platform that runs entirely on your own server.

!!! WARNING !!!

This Code was 100% AI generated!

I have 0 coding and web-development experience, and even less security experience. 

App may be complete security failure and I would not even know it. Im just testing things and seeing how they look. 

And soon I'll replace Microsoft.

!!! WARNING !!!
## 🎯 Core Principles

- **100% Self-Hosted** - No cloud services, no external dependencies
- **Docker-First** - One command to get everything running
- **SQLite Database** - Simple, file-based database (no separate database server needed)
- **Secure by Default** - Strong passwords, mandatory 2FA, JWT authentication
- **Modular Architecture** - Easy to extend with new modules
- **Beginner-Friendly** - Well-commented code, simple structure

## 📦 What's Included

### Modules

1. **Calendar** - Create, edit, and manage events with reminders
2. **Contacts** - Store and manage your contacts
3. **Mail** - Basic email client (IMAP/SMTP)

### Features

- Multi-user support with complete data isolation
- PWA (Progressive Web App) - Install on your phone
- Offline support - Works without internet connection
- Local notifications - Reminders work without Google services
- Mobile-first responsive design

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- A domain name (or use localhost for testing)
- Email server credentials (for mail module)

### Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd All-in-One-PWA
```

2. (Optional) Set your domain in `.env`:
```bash
cp .env.example .env
# Edit .env and set CORS_ORIGIN to your domain (or leave as localhost for testing)
```

3. Start the system:
```bash
docker compose up -d
```

4. Open your browser:
```
http://localhost
```

5. Create your first admin account:
   - Click "Register"
   - Fill in username, email, and password (24+ characters)
   - Scan QR code with authenticator app
   - **IMPORTANT**: Download and backup the secrets file when prompted
   - Complete setup

**That's it!** Secrets are auto-generated and stored in persistent volume.

## 📁 Project Structure

```
/
├── backend/          # Node.js API server
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── database/    # Database setup and migrations
│   │   ├── middleware/  # Auth middleware, error handling
│   │   ├── routes/      # API route handlers
│   │   ├── services/    # Business logic (email, calendar, etc.)
│   │   └── utils/       # Helper functions
│   └── Dockerfile
│
├── frontend/        # React PWA
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── modules/     # Feature modules (calendar, contacts, mail)
│   │   ├── services/    # API client, IndexedDB, notifications
│   │   └── App.jsx      # Main app shell
│   └── Dockerfile
│
└── docker-compose.yml  # Docker orchestration
```

## 🔐 Security Features

- **Strong Password Requirements**: Minimum 24 characters
- **Password Hashing**: Argon2 (industry-standard secure hashing)
- **Mandatory 2FA**: TOTP (Time-based One-Time Password) required for all users
- **JWT Authentication**: Secure token-based authentication
- **Refresh Tokens**: Long-lived tokens for staying logged in
- **Device Sessions**: Track and manage device sessions
- **Data Isolation**: Complete separation between users

## 📱 PWA Features

- **Installable**: Add to home screen on Android/iOS
- **Offline Support**: Cached data works without internet
- **Local Notifications**: Reminders work without Google services
- **Background Sync**: Syncs data when app is opened
- **Service Worker**: Handles caching and offline functionality

## 🔄 How Sync Works

1. **On App Open**: Data syncs from server automatically
2. **While App is Open**: Periodic sync every few minutes
3. **After Sync**: Local notifications are scheduled for reminders
4. **If App Not Opened for 24 Hours**: Service worker shows notification to open app

## 🛠️ Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA code

### Calendar
- `GET /api/calendar/events` - Get all events
- `POST /api/calendar/events` - Create event
- `PUT /api/calendar/events/:id` - Update event
- `DELETE /api/calendar/events/:id` - Delete event

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Mail
- `GET /api/mail/folders` - Get mail folders
- `GET /api/mail/messages` - Get messages in folder
- `POST /api/mail/sync` - Trigger mail sync
- `POST /api/mail/send` - Send email
- `GET /api/mail/messages/:id` - Get message details

## 🗄️ Database Schema

See `ARCHITECTURE.md` for detailed database schema documentation.

## 🔧 Configuration

### Email Configuration

Each user configures their own email settings:
- IMAP server and port
- SMTP server and port
- Username and password
- SSL/TLS settings

No auto-discovery - manual configuration only for security and reliability.

## 📚 Architecture Documentation

See `ARCHITECTURE.md` for detailed architecture explanation.

## 🤝 Contributing

This is a personal project designed to be simple and understandable. If you want to extend it:

1. Follow the modular architecture
2. Keep code simple and well-commented
3. Maintain security standards
4. Test thoroughly

## 📄 License

MIT License - Use freely for personal projects.

## ⚠️ Important Notes

- This is NOT a replacement for Nextcloud
- Designed for personal use and small groups
- Email module requires manual server configuration
- Notifications work best on Android (iOS has limitations)
- Always keep backups of your database file

## 🆘 Troubleshooting

### Can't access the app
- Check if containers are running: `docker compose ps`
- Check logs: `docker compose logs`
- Verify port 3000 is not in use

### Email not syncing
- Verify IMAP/SMTP credentials are correct
- Check firewall allows connections to your email server
- Review backend logs for connection errors

### Notifications not working
- Ensure you've granted notification permissions
- Check browser supports notifications
- Verify service worker is registered

## 📞 Support

For issues and questions, please check the code comments - everything is documented for beginners.
