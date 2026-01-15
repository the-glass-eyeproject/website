# Google Drive + Supabase Integration

## Overview

This setup uses a **single shared Google Drive account** that's always connected. All users share the same Google Drive storage, and tokens are automatically refreshed when needed.

## Key Features

✅ **Single Shared Account** - One Google Drive account for all users  
✅ **Auto-Refresh** - Tokens automatically refresh when expiring  
✅ **Supabase Storage** - Tokens stored securely in Supabase database  
✅ **Always Connected** - Once connected, stays connected indefinitely  

## How It Works

### Token Storage

- Tokens are stored in Supabase `google_drive_tokens` table
- Only **one row** exists (singleton pattern)
- Service role key required to read/write tokens (secure)

### Auto-Refresh

When `getDriveClient()` is called:
1. Checks if token expires in < 5 minutes
2. If yes, automatically uses refresh_token to get new access_token
3. Updates tokens in Supabase
4. Returns authenticated Drive client

### Connection Flow

1. User clicks "Connect Google Drive" button
2. Redirected to Google OAuth consent screen
3. After consent, callback receives authorization code
4. Exchanges code for tokens
5. Stores tokens in Supabase (single row)
6. All future requests use these tokens

## Database Schema

The `google_drive_tokens` table has:
- `id` - Fixed UUID (00000000-0000-0000-0000-000000000000)
- `access_token` - OAuth access token
- `refresh_token` - OAuth refresh token (for auto-refresh)
- `expiry_date` - When access token expires
- `token_type`, `scope` - OAuth metadata

**Constraint**: Only one row allowed (singleton pattern)

## Security

- ✅ Tokens only accessible via service role key
- ✅ RLS policies prevent direct user access
- ✅ Helper functions for safe token checks
- ✅ Auto-refresh happens server-side only

## API Endpoints

### Check Connection Status
```
GET /api/auth/google/token-status
```
Returns: `{ hasTokens: boolean }`

### Check Connection (Authenticated)
```
GET /api/auth/google/status
```
Returns: `{ connected: boolean }`

### Disconnect
```
POST /api/auth/google/disconnect
```
Clears tokens from Supabase

## Usage in Code

### Get Drive Client (with auto-refresh)
```typescript
import { getDriveClient } from '@/lib/google-drive-supabase';

const drive = await getDriveClient();
// Token automatically refreshed if needed
```

### Check if Connected
```typescript
import { isGoogleDriveConnected } from '@/lib/google-drive-supabase';

const connected = await isGoogleDriveConnected();
```

### Store Tokens (after OAuth)
```typescript
import { storeTokens } from '@/lib/google-drive-supabase';

await storeTokens(oauthTokens);
```

## Migration

Run the migration:
```sql
-- File: supabase/migrations/002_single_google_drive_token.sql
```

This will:
1. Drop old per-user token table
2. Create new singleton token table
3. Add helper functions
4. Set up RLS policies

## Benefits

1. **Simpler** - No per-user token management
2. **Reliable** - Auto-refresh ensures always connected
3. **Secure** - Tokens stored in database, not files
4. **Scalable** - Works in serverless environments
5. **Persistent** - Tokens survive deployments

## Notes

- First connection requires OAuth consent
- After that, tokens auto-refresh indefinitely
- All users share the same Google Drive storage
- Photos organized in `photos/<tag>/` folders
