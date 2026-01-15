# Migration to Supabase + Single Google Drive Account

## What Changed

### ✅ Single Shared Google Drive Account
- Changed from per-user tokens to **one shared Google Drive account**
- All users share the same Google Drive storage
- Tokens stored in Supabase database (not files)

### ✅ Automatic Token Refresh
- Tokens automatically refresh when expiring (< 5 minutes)
- No manual intervention needed
- Once connected, stays connected forever

### ✅ Supabase Integration
- All Google Drive functions now use Supabase for token storage
- New file: `lib/google-drive-supabase.ts`
- Old file: `lib/google-drive.ts` (kept for reference, can be removed later)

## Files Changed

### New Files
1. `lib/google-drive-supabase.ts` - New Supabase-based Google Drive integration
2. `supabase/migrations/002_single_google_drive_token.sql` - Database migration
3. `GOOGLE_DRIVE_SUPABASE.md` - Documentation

### Updated Files
1. `app/api/auth/google/callback/route.ts` - Uses Supabase token storage
2. `app/api/auth/google/status/route.ts` - Uses Supabase check
3. `app/api/auth/google/token-status/route.ts` - Uses Supabase check
4. `app/api/auth/google/disconnect/route.ts` - Clears Supabase tokens
5. `app/api/upload/route.ts` - Uses Supabase Google Drive functions
6. `app/api/photos/route.ts` - Uses Supabase Google Drive functions

## Setup Steps

### 1. Run Database Migration

Go to Supabase SQL Editor and run:
```sql
-- Copy contents from: supabase/migrations/002_single_google_drive_token.sql
```

This will:
- Create singleton `google_drive_tokens` table
- Add helper functions
- Set up RLS policies

### 2. Connect Google Drive (First Time)

1. Go to `/upload` page
2. Click "Connect Google Drive"
3. Authorize with Google
4. Tokens stored in Supabase
5. Done! Now auto-refreshes forever

### 3. Verify Setup

Test the connection:
```bash
# Check if connected
curl http://localhost:3000/api/auth/google/token-status
# Should return: {"hasTokens": true}
```

## How Auto-Refresh Works

1. **Every API call** that uses Google Drive calls `getDriveClient()`
2. Function checks if token expires in < 5 minutes
3. If yes, uses `refresh_token` to get new `access_token`
4. Updates tokens in Supabase
5. Returns authenticated Drive client
6. **No user action needed!**

## Benefits

✅ **Always Connected** - Once set up, never disconnects  
✅ **Auto-Refresh** - Tokens refresh automatically  
✅ **Secure** - Tokens in database, not files  
✅ **Serverless-Friendly** - Works in Vercel/serverless  
✅ **Simple** - One account, no per-user management  

## Important Notes

⚠️ **Single Account**: All users share the same Google Drive  
⚠️ **First Connection**: Requires OAuth consent (one-time)  
⚠️ **Service Role Key**: Required for token operations (server-side only)  

## Troubleshooting

### "Google Drive not connected"
- Run the migration SQL
- Connect Google Drive via `/upload` page
- Check Supabase `google_drive_tokens` table has data

### "Token refresh failed"
- Check `refresh_token` exists in database
- Verify Google OAuth credentials are correct
- Check Supabase service role key is set

### "RLS policy violation"
- Ensure using service role key for token operations
- Check RLS policies in migration are applied

## Next Steps

1. ✅ Run migration SQL
2. ✅ Connect Google Drive (one-time)
3. ✅ Test upload functionality
4. ⏭️ Remove old `lib/google-drive.ts` file (optional)
5. ⏭️ Implement Supabase database for photos (replace JSON file)
