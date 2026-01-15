# Supabase Setup Guide

## Step 1: Install Dependencies

Already installed! ✅
- `@supabase/supabase-js`
- `@supabase/ssr`

## Step 2: Get Your Supabase Project URL

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find your **Project URL** (e.g., `https://xxxxx.supabase.co`)

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_
SUPABASE_SERVICE_ROLE_KEY=sb_secret_

# Google Drive OAuth (keep your existing values)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Storage Provider
STORAGE_PROVIDER=google-drive

# Other existing variables...
SECRET_CODE=your-secret-code
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Step 4: Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL in the editor
5. Verify tables were created in **Table Editor**

## Step 5: Verify Setup

The Supabase client is configured in:
- `lib/supabase/client.ts` - For client-side components
- `lib/supabase/server.ts` - For server-side API routes

## Important Notes

### Key Usage:

1. **Publishable/Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`):
   - ✅ Safe to use in browser/client-side code
   - ✅ Protected by Row Level Security (RLS)
   - ✅ Use this for most operations

2. **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`):
   - ⚠️ **SECRET** - Never expose in client-side code
   - ⚠️ Bypasses RLS - use only in server-side API routes
   - ⚠️ Use sparingly for admin operations only

### Security Best Practices:

- ✅ Always use the anon key in client-side code
- ✅ Use service role key only in secure server-side routes
- ✅ RLS policies protect your data even with public anon key
- ✅ Never commit `.env.local` to git (already in `.gitignore`)

## Next Steps

1. ✅ Environment variables configured
2. ✅ Database migration ready
3. ⏭️ Implement Supabase database functions (replace JSON file storage)
4. ⏭️ Set up Supabase Auth (or keep current secret code auth)
5. ⏭️ Implement Google Drive token storage in Supabase

## Testing the Connection

You can test the connection by creating a simple API route:

```typescript
// app/api/test-supabase/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('tags').select('*')
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ tags: data })
}
```

Then visit `http://localhost:3000/api/test-supabase` to verify the connection works!
