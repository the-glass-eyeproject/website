# Supabase Database Setup

This directory contains the database schema and migrations for The Glass Eye Project.

## Database Schema

### Tables

1. **photos** - Stores photo metadata
   - `id` (UUID) - Primary key
   - `filename` - Original filename
   - `url` - Public URL to view the photo
   - `storage_key` - Google Drive file ID (unique)
   - `storage_provider` - Always 'google-drive' in this setup
   - `storage_path` - Path in Google Drive (e.g., "photos/Nature/photo.jpg")
   - `size`, `width`, `height` - Image dimensions
   - `mime_type` - Image MIME type
   - `uploaded_by` - User who uploaded (references auth.users)
   - `uploaded_at`, `updated_at`, `created_at` - Timestamps

2. **tags** - Predefined tags for photos
   - `id` (UUID) - Primary key
   - `name` - Tag name (unique)
   - `slug` - URL-friendly version (unique)
   - `color` - Optional color for UI

3. **photo_tags** - Many-to-many relationship between photos and tags
   - `photo_id` - References photos.id
   - `tag_id` - References tags.id
   - Unique constraint on (photo_id, tag_id)

4. **google_drive_tokens** - Stores OAuth tokens per user
   - `id` (UUID) - Primary key
   - `user_id` - References auth.users (unique per user)
   - `access_token` - OAuth access token
   - `refresh_token` - OAuth refresh token
   - `expiry_date` - When the token expires
   - `token_type`, `scope` - OAuth metadata

## Row Level Security (RLS)

### Photos
- **View**: Everyone can view photos (public gallery)
- **Insert**: Only authenticated users
- **Update/Delete**: Only the uploader or admin

### Tags
- **View**: Everyone
- **Insert**: Authenticated users
- **Update/Delete**: Admins only

### Photo Tags
- **View**: Everyone
- **Create/Update/Delete**: Users can manage tags for their own photos

### Google Drive Tokens
- **All operations**: Users can only access their own tokens

## Setup Instructions

1. **Create a Supabase project** at https://supabase.com

2. **Run the migration**:
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or copy the SQL from migrations/001_initial_schema.sql
   # and run it in the Supabase SQL Editor
   ```

3. **Set up environment variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Configure Google OAuth**:
   - Set up Google OAuth credentials
   - Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Store credentials in Supabase project settings

## Token Auto-Refresh

The `is_token_expiring_soon()` function helps check if tokens need refreshing. You'll implement the refresh logic in your application code using the Google OAuth2 refresh token flow.

## Notes

- All timestamps use `TIMESTAMPTZ` (timezone-aware)
- UUIDs are used for all primary keys
- RLS policies ensure data security
- The schema supports multiple users with their own Google Drive connections
