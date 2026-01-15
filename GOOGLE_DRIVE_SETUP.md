# Google Drive Setup Guide

## Step 1: Create OAuth Credentials in Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "Glass Eye Project")

3. **Enable Google Drive API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click on it and press "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" (unless you have a Google Workspace)
     - Fill in required fields (App name, User support email, Developer contact)
     - Add scopes: `../auth/drive.file` and `../auth/drive.readonly`
     - Save and continue through the steps

5. **Create OAuth Client ID**
   - Application type: **Web application**
   - Name: "Glass Eye Project" (or any name)
   - **Authorized redirect URIs**: 
     - For local development: `http://localhost:3000/api/auth/google/callback`
     - For production: `https://yourdomain.com/api/auth/google/callback`
   - Click "Create"

6. **Copy Your Credentials**
   - You'll see a popup with your **Client ID** and **Client Secret**
   - Copy both values (you won't see the secret again!)

## Step 2: Configure Environment Variables

Create or update your `.env.local` file:

```env
# Secret code for authentication
SECRET_CODE=your-secret-code-here

# Google Drive Configuration
STORAGE_PROVIDER=google-drive
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**For Production:**
```env
STORAGE_PROVIDER=google-drive
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Step 3: Connect Google Drive from the App

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Login to the app:**
   - Go to http://localhost:3000/upload
   - Enter your secret code (from `SECRET_CODE` in `.env.local`)
   - Click "Login"

3. **Connect Google Drive:**
   - On the upload page, you'll see "Google Drive Connection" section
   - Click "Connect Drive" button
   - You'll be redirected to Google's login page
   - Sign in with your Google account
   - Review and accept the permissions
   - You'll be redirected back to the upload page
   - You should see "Connected - Photos will be uploaded to your Drive"

## Step 4: Upload Your First Photo

1. **Select a photo** from your computer
2. **Choose one or more tags** (e.g., "Nature", "Portrait")
3. **Click "Upload Photo"**
4. The photo will be:
   - Uploaded to your Google Drive
   - Placed in a folder named after the first tag (e.g., "Nature")
   - If the folder doesn't exist, it will be created automatically

## Troubleshooting

### "Failed to connect" error
- Check that your redirect URI matches exactly in Google Cloud Console
- Make sure `GOOGLE_REDIRECT_URI` in `.env.local` matches
- Restart the dev server after changing `.env.local`

### "Invalid client" error
- Double-check your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Make sure there are no extra spaces or quotes

### "Redirect URI mismatch" error
- The redirect URI in Google Cloud Console must match exactly
- Include the full path: `/api/auth/google/callback`
- For local: `http://localhost:3000/api/auth/google/callback`
- For production: `https://yourdomain.com/api/auth/google/callback`

### Photos not showing in gallery
- Make sure `STORAGE_PROVIDER=google-drive` in `.env.local`
- Check that you're connected (status should show "Connected")
- Try refreshing the gallery page

### "Access blocked: The Glass Eye Project has not completed the Google verification process" (Error 403: access_denied)
This error occurs when your OAuth app is in "Testing" mode and the user trying to access it isn't added as a test user. Here's how to fix it:

**Option 1: Add Test Users (Quick Fix for Development)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project ("the-glass-eye")
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Scroll down to the **Test users** section
5. Click **+ ADD USERS**
6. Add the email address that's trying to access the app (e.g., `theglasseyeproject1@gmail.com`)
7. Click **ADD**
8. The user should now be able to access the app

**Option 2: Complete Google Verification (For Production)**
If you want to make your app available to all users without adding them individually:
1. Go to **APIs & Services** → **OAuth consent screen**
2. Click **PUBLISH APP** button
3. You'll need to complete Google's verification process:
   - Provide app information (privacy policy, terms of service)
   - Complete security assessment
   - This process can take several days to weeks
4. Once verified, your app will be available to all users

**Note:** For development and testing, Option 1 (adding test users) is the fastest solution.

## What Happens After Connection?

- ✅ **One-time setup**: You only need to connect once
- ✅ **Automatic token refresh**: Tokens are refreshed automatically
- ✅ **Persistent connection**: Stays connected across sessions
- ✅ **Tag-based folders**: Photos are organized by tags in your Drive
- ✅ **Gallery sync**: All photos from your Drive appear in the gallery

## Disconnecting

If you want to disconnect:
- Go to the upload page
- Click "Disconnect" in the Google Drive Connection section
- Your tokens will be removed
- You'll need to reconnect to upload/view photos from Drive
