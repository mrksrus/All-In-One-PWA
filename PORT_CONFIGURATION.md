# Port Configuration Guide

## Architecture Overview

This application uses a **single-container** setup:
- Frontend (React PWA) is built into static files
- Backend (Express/Node.js) serves both the API and static frontend files
- **No inter-container communication needed** - everything runs in one container

## Port Configuration

### Internal Container Port (Fixed)
- **Port: 3000** (inside the container)
- This is where the Express server listens
- **DO NOT CHANGE THIS** - it's hardcoded in the application
- Set via `PORT` environment variable (defaults to 3000)

### External Port (Configurable)
- **Port: Any port you want** (on your host machine)
- This is what you access from outside Docker
- **CHANGE THIS** to avoid conflicts with other services

### Port Mapping Format
```
EXTERNAL_PORT:3000
```

Example:
- `18988:3000` - Access via port 18988, container listens on 3000
- `3000:3000` - Access via port 3000, container listens on 3000
- `8080:3000` - Access via port 8080, container listens on 3000

## Configuration Files

### docker-compose.single.yml
```yaml
ports:
  - "${APP_HOST_PORT:-3000}:${APP_CONTAINER_PORT:-3000}"
environment:
  - PORT=${APP_CONTAINER_PORT:-3000}
```

**To change external port:**
1. Set `APP_HOST_PORT` in `.env` file (e.g., `APP_HOST_PORT=18988`)
2. Keep `APP_CONTAINER_PORT=3000` (don't change this)

### truenas-scale-app.yml
```yaml
ports:
  - "18988:3000"  # Change first number to your desired external port
environment:
  - PORT=3000      # Keep this as 3000
```

**To change external port:**
- Edit the first number in the ports mapping (e.g., change `18988` to `8080`)
- Keep the second number as `3000`

## How It Works

1. **Container starts** → Express listens on port 3000 (internal)
2. **Docker maps** → External port (e.g., 18988) → Container port 3000
3. **You access** → `http://your-server:18988`
4. **Frontend requests** → Use relative paths `/api/*` → Same server, same port

## Frontend API Configuration

The frontend uses **relative paths** (`/api/*`), which means:
- ✅ Works with any external port automatically
- ✅ No hardcoded URLs needed
- ✅ Same-origin requests (no CORS issues when served from same server)

## CORS Configuration

Since frontend and backend are on the same server:
- Set `CORS_ORIGIN=*` to allow all origins
- Or set specific origin: `CORS_ORIGIN=http://your-server:18988`

## Verification Checklist

- [ ] External port is set correctly in docker-compose.yml or truenas-scale-app.yml
- [ ] Internal port (PORT env var) is set to 3000
- [ ] Port mapping format is `EXTERNAL:3000`
- [ ] Dockerfile EXPOSE is 3000
- [ ] CORS_ORIGIN is set appropriately

## Troubleshooting

**Port already in use:**
- Change `APP_HOST_PORT` in `.env` or the first number in ports mapping

**Can't access the app:**
- Check external port is correct
- Verify container is running: `docker ps`
- Check logs: `docker logs all-in-one-pwa`

**API calls failing:**
- Frontend uses relative paths, so this shouldn't happen
- If using CORS_ORIGIN, ensure it matches your access URL
