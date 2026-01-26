# Persistent Storage Guide

## What is Persistent Storage?

All data in this system is stored in **persistent Docker volumes**. This means:

✅ **Data survives container restarts**  
✅ **Data survives container updates**  
✅ **Data survives Docker Compose down/up**  
✅ **Data is stored on your host machine** (in `./data` directory)

## What Gets Stored Persistently?

### 1. Database (`/data/database.sqlite`)
- All user accounts
- All calendar events
- All contacts
- All email messages
- All email configurations
- All sessions

### 2. Secrets (`/data/secrets.env`)
- JWT signing secrets
- Encryption keys
- **Auto-generated on first run**
- **Must be backed up!**

### 3. Future Storage (when implemented)
- Email attachments (`/data/email/attachments/`)
- User uploads (`/data/uploads/`)
- Other module data

## Location on Host Machine

All persistent data is stored in:
```
./data/
```

This directory is created automatically on first run.

## Backup Strategy

### What to Backup:

1. **Entire `./data` directory** - Contains everything:
   ```bash
   # Backup
   tar -czf backup-$(date +%Y%m%d).tar.gz ./data
   
   # Restore
   tar -xzf backup-YYYYMMDD.tar.gz
   ```

2. **Just the secrets file** (minimum):
   ```bash
   # Backup
   cp ./data/secrets.env ./backup-secrets.env
   
   # Restore
   cp ./backup-secrets.env ./data/secrets.env
   ```

### When to Backup:

- **Before updates**: `docker compose down` → backup → update → `docker compose up`
- **Regularly**: Weekly or monthly automated backups
- **Before major changes**: Always backup before significant updates

## Restore Process

### Full Restore:

1. Stop containers: `docker compose down`
2. Restore `./data` directory from backup
3. Start containers: `docker compose up -d`

### Secrets Only Restore:

If you lose secrets but have database:

1. Stop containers: `docker compose down`
2. Restore `./data/secrets.env` from backup
3. Start containers: `docker compose up -d`
4. All users will need to login again (tokens invalidated)

### Database Only Restore:

If you lose database but have secrets:

1. Stop containers: `docker compose down`
2. Restore `./data/database.sqlite` from backup
3. Start containers: `docker compose up -d`
4. Users can login normally

## Container Updates

### Safe Update Process:

```bash
# 1. Backup
tar -czf backup-$(date +%Y%m%d).tar.gz ./data

# 2. Stop containers
docker compose down

# 3. Pull new code (if using git)
git pull

# 4. Rebuild and start
docker compose up -d --build

# 5. Verify everything works
docker compose logs -f
```

**Your data is safe!** The `./data` volume persists across all of this.

## Volume Management

### View Volume Contents:

```bash
# List files in data directory
ls -la ./data/

# Check database size
du -h ./data/database.sqlite

# Check total data size
du -sh ./data/
```

### Clean Start (⚠️ Deletes All Data):

```bash
# Stop containers
docker compose down

# Remove data directory
rm -rf ./data/

# Start fresh
docker compose up -d
```

## Multi-Instance Setup

If running multiple backend instances (scaling):

- **Shared volume**: All instances must access the same `./data` directory
- **Network storage**: Use NFS, CIFS, or similar for shared access
- **Database**: SQLite works for single instance. For multiple, consider PostgreSQL migration

## Troubleshooting

### "Permission denied" errors:

```bash
# Fix permissions
sudo chown -R $USER:$USER ./data/
chmod -R 755 ./data/
```

### "Database locked" errors:

- Only one process can write to SQLite at a time
- Ensure only one backend container is running
- Check for stuck processes: `docker compose ps`

### Data not persisting:

1. Check volume mount: `docker compose config`
2. Verify `./data` exists on host
3. Check container logs: `docker compose logs backend`

## Best Practices

1. **Regular backups**: Automate if possible
2. **Test restores**: Periodically test that backups work
3. **Monitor disk space**: SQLite database grows over time
4. **Separate backups**: Keep backups separate from server
5. **Version control**: Never commit `./data` to git (already in `.gitignore`)

## Summary

✅ All data is in `./data/` directory  
✅ Survives container restarts  
✅ Survives container updates  
✅ Easy to backup (just copy the directory)  
✅ Easy to restore (just restore the directory)  

**Your data is safe!** 🎉
