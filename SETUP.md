# Setup Instructions

## Prerequisites

- Docker and Docker Compose installed
- A domain name (optional, for production)
- Email server credentials (for mail module)

## Step-by-Step Setup

### 1. Clone or Download the Project

```bash
cd All-in-One-PWA
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your secrets:

```env
# Generate random secrets (use: openssl rand -hex 32)
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key-here
CORS_ORIGIN=http://localhost
```

**Important**: Change these values! Use strong, random strings.

### 3. Create Data Directory

```bash
mkdir -p data
```

This directory will store:
- SQLite database
- Email attachments (future)
- User uploads (future)

### 4. Start the System

```bash
docker compose up -d
```

This will:
- Build the backend and frontend Docker images
- Start both containers
- Create the database automatically

### 5. Access the Application

Open your browser:
- Frontend: http://localhost
- Backend API: http://localhost:3000

### 6. Create Your First User

1. Go to http://localhost
2. Click "Register"
3. Fill in:
   - Username
   - Email
   - Password (minimum 24 characters, must include letters, numbers, and special characters)
4. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)
5. Enter the 6-digit code to complete registration
6. Login with your credentials

### 7. Configure Email (Optional)

1. Go to the Mail module
2. Click "Configure Email"
3. Enter your IMAP/SMTP settings:
   - IMAP Host (e.g., imap.gmail.com)
   - IMAP Port (usually 993 for SSL)
   - SMTP Host (e.g., smtp.gmail.com)
   - SMTP Port (usually 465 for SSL)
   - Username and Password
4. Click "Save Configuration"
5. Click "Sync" to fetch emails

## Troubleshooting

### Containers won't start

Check logs:
```bash
docker compose logs
```

### Can't access the app

1. Check if containers are running:
```bash
docker compose ps
```

2. Check if ports are available:
```bash
# Windows
netstat -an | findstr :80
netstat -an | findstr :3000

# Linux/Mac
lsof -i :80
lsof -i :3000
```

### Database errors

The database is created automatically. If you see errors:
1. Check that the `data` directory exists and is writable
2. Check Docker logs: `docker compose logs backend`

### Email not syncing

1. Verify your IMAP/SMTP credentials are correct
2. Check firewall allows connections to your email server
3. Review backend logs: `docker compose logs backend`

### Notifications not working

1. Ensure you've granted notification permissions in your browser
2. Check browser supports notifications (Chrome, Firefox, Edge work best)
3. Verify service worker is registered (check browser DevTools > Application > Service Workers)

## Production Deployment

### 1. Use HTTPS

PWAs require HTTPS (except for localhost). Set up:
- Reverse proxy (nginx, Traefik)
- SSL certificate (Let's Encrypt)

### 2. Update CORS_ORIGIN

In `.env`:
```env
CORS_ORIGIN=https://yourdomain.com
```

### 3. Use Strong Secrets

Generate strong random secrets:
```bash
openssl rand -hex 32
```

### 4. Backup Database

Regularly backup the `data/database.sqlite` file:
```bash
cp data/database.sqlite data/database.sqlite.backup
```

### 5. Monitor Logs

```bash
docker compose logs -f
```

## Stopping the System

```bash
docker compose down
```

To also remove volumes (deletes database):
```bash
docker compose down -v
```

## Updating

1. Pull latest code
2. Rebuild containers:
```bash
docker compose up -d --build
```

## Security Notes

- Never commit `.env` file
- Use strong passwords (24+ characters)
- Enable 2FA for all users
- Keep Docker and system updated
- Use HTTPS in production
- Regularly backup your database

## Support

For issues:
1. Check the logs: `docker compose logs`
2. Review the code comments (everything is documented)
3. Check the ARCHITECTURE.md for system design
