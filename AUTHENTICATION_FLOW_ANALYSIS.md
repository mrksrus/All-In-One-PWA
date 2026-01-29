# Authentication & User Management Flow Analysis

## ✅ Verified: Admin Logic

**First User Registration:**
- `hasAdmin()` checks if any admin exists
- If no admin exists → `isAdmin = true` for first user
- Subsequent users → `isAdmin = false`
- ✅ **CORRECT**: Only first user becomes admin

**Admin Verification:**
- `/api/auth/backup` endpoint checks `is_admin` field
- Returns 403 if user is not admin
- ✅ **CORRECT**: Admin-only endpoints properly protected

## ✅ Verified: Data Separation

**All Services Filter by userId:**
- Calendar: `WHERE user_id = ?` ✅
- Contacts: `WHERE user_id = ?` ✅
- Mail: `WHERE user_id = ?` ✅
- Sessions: `WHERE user_id = ?` ✅

**Routes Protection:**
- All data routes use `authenticateToken` middleware
- `req.userId` is set by middleware
- All service functions receive `userId` parameter
- ✅ **CORRECT**: Complete data isolation between users

## ✅ Registration Flow (First Admin)

1. User fills registration form
2. `POST /api/auth/register` → Creates user with `is_admin = 1` (if first user)
3. Returns `{ user, isAdmin: true, backupInfo }`
4. Frontend calls `setup2FAInitial(username, password)` → No auth needed
5. Backend verifies password → Generates 2FA secret → Stores in DB
6. User scans QR code → Enters 6-digit code
7. Frontend calls `verify2FAInitial(username, password, code)` → No auth needed
8. Backend verifies password + code → Enables 2FA
9. If admin → Shows backup screen
10. User can now login normally

**Potential Issue:** Race condition between registration and setup2FAInitial - but SQLite handles this fine.

## ✅ Registration Flow (Subsequent Users)

1. User fills registration form
2. `POST /api/auth/register` → Creates user with `is_admin = 0`
3. Returns `{ user, isAdmin: false }`
4. Same 2FA setup flow (no auth needed)
5. After 2FA → Redirects to login (no backup screen)

**✅ CORRECT**: Subsequent users are not admins

## ✅ Login Flow

1. User enters username, password, 2FA code
2. `POST /api/auth/login` → Verifies password
3. Checks if 2FA is enabled → Verifies 2FA code
4. Generates access + refresh tokens
5. Stores session in database
6. Returns tokens to frontend
7. Frontend stores tokens → User is authenticated

**✅ CORRECT**: Login requires 2FA, tokens are generated correctly

## ⚠️ Issues Found & Fixed

### 1. Error Handling in API Client
**Problem:** Network errors not properly caught
**Fix:** Improved error handling to catch fetch failures and provide better error messages

### 2. JSON Parsing Error
**Problem:** `handleResponse` tries to parse JSON even on network errors
**Fix:** Check content-type before parsing, handle non-JSON responses

### 3. CORS Configuration
**Status:** ✅ Already fixed - supports wildcard (`*`) for all origins

## 🔍 Remaining Issue: "Failed to fetch"

This error typically means:
1. **Server not running** - Check if container is running
2. **Wrong URL** - API_BASE_URL might be incorrect
3. **CORS issue** - But we've configured it to allow all origins
4. **Network connectivity** - Firewall or routing issue

**To Debug:**
- Check browser console Network tab
- Check Docker logs: `docker logs all-in-one-pwa`
- Verify API_BASE_URL in frontend (should be `/api` for relative paths)
- Check if server is accessible: `curl http://your-server:port/health`
