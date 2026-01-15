# Environment Variables Setup

## Required Environment Variables

Add these to your `.env.local` file in the project root:

```env
# Supabase Configuration (REQUIRED for Google Drive + Supabase features)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_MSBxnA5Eee_104QKhj2BMw_sINaz5TQ
SUPABASE_SERVICE_ROLE_KEY=sb_secret_ehR7uI754mC5jS8oP01X6w_SWO4Hpnh

# Google Drive OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Storage Provider
STORAGE_PROVIDER=google-drive

# Authentication (optional - if not using Supabase Auth)
SECRET_CODE=your-secret-code

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## How to Get Supabase Values

1. **Go to your Supabase project**: https://app.supabase.com
2. **Navigate to**: Settings → API
3. **Copy these values**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

## Quick Setup

1. Create `.env.local` file in project root (if it doesn't exist)
2. Copy the template above
3. Replace placeholder values with your actual keys
4. Restart your dev server: `npm run dev`

## Verification

After setting up, test the connection:

```bash
# Should return connection status
curl http://localhost:3000/api/auth/google/token-status
```

## Troubleshooting

### Error: "Supabase environment variables are missing"

**Solution**: Make sure `.env.local` exists and has all required variables.

### Error: "Your project's URL and Key are required"

**Solution**: 
1. Check `.env.local` file exists
2. Verify variable names are correct (no typos)
3. Restart dev server after adding variables

### Variables not loading?

- ✅ Make sure file is named `.env.local` (not `.env`)
- ✅ Restart dev server after changes
- ✅ Check for typos in variable names
- ✅ Ensure no spaces around `=` sign

## Security Notes

⚠️ **Never commit `.env.local`** - It's already in `.gitignore`  
⚠️ **Service Role Key** - Only use in server-side code, never expose to client  
✅ **Anon Key** - Safe for client-side (protected by RLS)  

## Production Setup

For production (Vercel, etc.):
1. Go to your deployment platform's environment variables
2. Add all the same variables
3. Use production URLs (not localhost)
