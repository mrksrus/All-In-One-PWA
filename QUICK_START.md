# Quick Start Guide

## For Beginners

This guide assumes you have basic knowledge of:
- Using a terminal/command line
- Basic HTML/CSS concepts (as mentioned in requirements)

## What You Need

1. **Docker Desktop** - Download from https://www.docker.com/products/docker-desktop
2. **A text editor** - VS Code, Notepad++, or any text editor
3. **A web browser** - Chrome, Firefox, or Edge

## Step 1: Install Docker

1. Download Docker Desktop for your operating system
2. Install it
3. Start Docker Desktop
4. Wait until it says "Docker is running"

## Step 2: Get the Code

If you downloaded this as a ZIP file:
1. Extract it to a folder (e.g., `C:\Users\YourName\All-in-One-PWA`)
2. Open a terminal/command prompt in that folder

If you're using Git:
```bash
git clone <repository-url>
cd All-in-One-PWA
```

## Step 3: Start the System

**No configuration needed!** Secrets are auto-generated on first run.

Open a terminal in the project folder and run:

```bash
docker compose up -d
```

This will:
- Download required images (first time only, takes a few minutes)
- Build the application
- Start the servers

Wait until you see:
```
all-in-one-backend  started
all-in-one-frontend started
```

## Step 4: Access the App

Open your browser and go to:
```
http://localhost
```

You'll be redirected to registration (first-time setup).

## Step 5: Create Admin Account

1. Fill in:
   - **Username**: Choose any username
   - **Email**: Your email address
   - **Password**: Must be at least 24 characters, include letters, numbers, and special characters
     Example: `MySecurePassword123!@#$%`
2. Click "Register"
3. You'll see a QR code - scan it with:
   - Google Authenticator (Android/iOS)
   - Authy (Android/iOS/Desktop)
   - Microsoft Authenticator
4. Enter the 6-digit code from your app
5. Click "Verify and Complete Registration"
6. **IMPORTANT**: You'll see a backup screen
   - Click "Download Backup File"
   - Save it securely (password manager, encrypted drive, etc.)
   - Check the box to acknowledge you've backed it up
   - Click "I've Backed Up - Continue Setup"
7. You'll be redirected to login
8. Login with your username and password + 2FA code

## Step 6: Use the App

You now have access to:
- **Calendar** - Create and manage events
- **Contacts** - Store contacts
- **Mail** - Configure email (optional)

## Common Issues

### "Port already in use"
Something else is using port 80 or 3000. Stop other web servers or change ports in `docker-compose.yml`.

### "Cannot connect to Docker"
Make sure Docker Desktop is running.

### "Permission denied"
On Linux/Mac, you might need `sudo` or to add your user to the docker group.

### Can't see the app
1. Check Docker is running: `docker compose ps`
2. Check logs: `docker compose logs`
3. Try: `http://localhost:80` or `http://127.0.0.1`

## Stopping the App

```bash
docker compose down
```

## Starting Again

```bash
docker compose up -d
```

## Getting Help

1. Check `SETUP.md` for detailed setup
2. Check `ARCHITECTURE.md` for how it works
3. Check `PERSISTENT_STORAGE.md` for backup/restore info
4. Check logs: `docker compose logs`
5. All code has comments explaining what it does

## Data Persistence

✅ All data is stored in `./data` directory  
✅ Survives container restarts  
✅ Survives container updates  
✅ Easy to backup (just copy `./data` directory)  

See `PERSISTENT_STORAGE.md` for backup strategies.

## Next Steps

- Configure email in the Mail module
- Add calendar events
- Add contacts
- Explore the code (it's all commented for beginners!)
