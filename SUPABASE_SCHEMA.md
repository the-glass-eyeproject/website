# Supabase Database Schema

## Tables Overview

### 1. `photos` - Photo Metadata
Stores information about each photo. The actual files are stored in Google Drive.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `filename` | TEXT | Original filename |
| `url` | TEXT | Public URL to view photo (Google Drive link) |
| `storage_key` | TEXT | Google Drive file ID (unique) |
| `storage_provider` | TEXT | Always 'google-drive' |
| `storage_path` | TEXT | Path in Drive (e.g., "photos/Nature/photo.jpg") |
| `size` | BIGINT | File size in bytes |
| `width` | INTEGER | Image width in pixels |
| `height` | INTEGER | Image height in pixels |
| `mime_type` | TEXT | Image MIME type (e.g., "image/jpeg") |
| `uploaded_by` | UUID | User ID who uploaded (FK to auth.users) |
| `uploaded_at` | TIMESTAMPTZ | When photo was uploaded |
| `updated_at` | TIMESTAMPTZ | Last update time (auto-updated) |
| `created_at` | TIMESTAMPTZ | Record creation time |

**Indexes:**
- `uploaded_at` (DESC) - For sorting by newest first
- `storage_key` - For quick lookups by Drive ID
- `uploaded_by` - For filtering by user
- `storage_provider` - For filtering by provider

**RLS Policies:**
- ✅ **SELECT**: Everyone can view (public gallery)
- ✅ **INSERT**: Authenticated users only
- ✅ **UPDATE/DELETE**: Only uploader or admin

---

### 2. `tags` - Photo Tags
Predefined tags for categorizing photos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Tag name (unique, e.g., "Nature") |
| `slug` | TEXT | URL-friendly version (unique, e.g., "nature") |
| `color` | TEXT | Optional hex color for UI |
| `created_at` | TIMESTAMPTZ | Creation time |

**Predefined Tags:**
- Nature, Urban, Portrait, Landscape, Abstract
- Architecture, Street, Wildlife, Travel
- Black & White, Colour, Minimalist
- Documentary, Fine Art, Experimental

**RLS Policies:**
- ✅ **SELECT**: Everyone can view
- ✅ **INSERT**: Authenticated users
- ✅ **UPDATE/DELETE**: Admins only

---

### 3. `photo_tags` - Photo-Tag Relationships
Many-to-many relationship table linking photos to tags.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `photo_id` | UUID | Foreign key to photos.id |
| `tag_id` | UUID | Foreign key to tags.id |
| `created_at` | TIMESTAMPTZ | When tag was added |
| UNIQUE(photo_id, tag_id) | - | Prevents duplicate tag assignments |

**RLS Policies:**
- ✅ **SELECT**: Everyone can view
- ✅ **INSERT/UPDATE/DELETE**: Users can manage tags for their own photos

---

### 4. `google_drive_tokens` - OAuth Tokens
Stores Google Drive OAuth tokens per user for auto-refresh.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users (unique) |
| `access_token` | TEXT | OAuth access token |
| `refresh_token` | TEXT | OAuth refresh token (for auto-refresh) |
| `expiry_date` | TIMESTAMPTZ | When access token expires |
| `token_type` | TEXT | Usually "Bearer" |
| `scope` | TEXT | OAuth scopes granted |
| `created_at` | TIMESTAMPTZ | When token was created |
| `updated_at` | TIMESTAMPTZ | Last update time (auto-updated) |

**RLS Policies:**
- ✅ **All operations**: Users can only access their own tokens

**Auto-Refresh:**
- Use `is_token_expiring_soon(expiry_date)` function to check if refresh is needed
- Refresh tokens are stored securely and can be used to get new access tokens
- Implement refresh logic in your API routes

---

## Relationships

```
auth.users (Supabase Auth)
  ├── photos.uploaded_by (1-to-many)
  └── google_drive_tokens.user_id (1-to-1)

photos
  └── photo_tags.photo_id (1-to-many)

tags
  └── photo_tags.tag_id (1-to-many)
```

## Key Features

1. **Public Gallery**: Anyone can view photos (no auth required)
2. **Authenticated Upload**: Only logged-in users can upload
3. **User Ownership**: Users can edit/delete their own photos
4. **Admin Access**: Admins can manage all photos and tags
5. **Token Security**: Each user's Google Drive tokens are private
6. **Auto-Refresh Ready**: Token expiry tracking for automatic refresh

## Example Queries

### Get all photos with tags
```sql
SELECT 
  p.*,
  COALESCE(
    json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug))
    FILTER (WHERE t.id IS NOT NULL),
    '[]'
  ) as tags
FROM photos p
LEFT JOIN photo_tags pt ON p.id = pt.photo_id
LEFT JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id
ORDER BY p.uploaded_at DESC;
```

### Get user's Google Drive token
```sql
SELECT * FROM google_drive_tokens
WHERE user_id = auth.uid()
AND (expiry_date IS NULL OR expiry_date > NOW());
```

### Check if token needs refresh
```sql
SELECT * FROM google_drive_tokens
WHERE user_id = auth.uid()
AND is_token_expiring_soon(expiry_date);
```

## Next Steps

1. Run the migration SQL in your Supabase project
2. Install Supabase client library: `npm install @supabase/supabase-js`
3. Set up environment variables
4. Implement API routes using Supabase client
5. Replace current JSON file storage with Supabase queries
