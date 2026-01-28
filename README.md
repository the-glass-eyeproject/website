# The Glass Eye Project

A curated photography gallery with a refined, editorial aesthetic. Built with Next.js, Supabase, and DigitalOcean Spaces.

## Features

- **Beautiful Masonry Gallery** - Images displayed at their natural aspect ratios
- **Tag-based Filtering** - Organize and filter photos by categories
- **Public/Private Visibility** - Control which photos are visible to visitors
- **Admin Dashboard** - Upload, edit, and manage your photo collection
- **Supabase Authentication** - Secure email/password login for administrators
- **DigitalOcean Spaces Storage** - Reliable, scalable image storage
- **Light/Dark Mode** - Elegant theme switching

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: DigitalOcean Spaces (S3-compatible)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account
- A DigitalOcean account with Spaces enabled

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd the-glasseye-project
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project
2. Go to the SQL Editor and run the migration in `supabase/migrations/001_initial_schema.sql`
3. Go to Authentication > Users and create your admin user (email/password)
4. Get your API keys from Project Settings > API Keys:
   - Click **Create new API Keys** if you don't have the new keys yet
   - Copy the **Publishable key** (`sb_publishable_...`) for client-side use
   - Copy the **Secret key** (`sb_secret_...`) for server-side use
   - Note: The legacy `anon` and `service_role` keys still work but are being phased out

### 3. Set Up DigitalOcean Spaces

1. Create a new Space in your DigitalOcean control panel
2. Go to API > Spaces Keys and generate new keys
3. Note your Space name, region, and endpoint

### 4. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
# Supabase (use the new API keys system)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx  # Safe for client-side
SUPABASE_SECRET_KEY=sb_secret_xxxxx                        # Server-side only, bypasses RLS

# DigitalOcean Spaces
DO_SPACES_REGION=lon1
DO_SPACES_BUCKET=glasseye-project
DO_SPACES_ENDPOINT=https://lon1.digitaloceanspaces.com
DO_SPACES_CDN_ENDPOINT=https://glasseye-project.lon1.cdn.digitaloceanspaces.com
DO_SPACES_ACCESS_KEY=your-access-key
DO_SPACES_SECRET_KEY=your-secret-key
```

> **Note on Supabase API Keys**: This project uses the new publishable (`sb_publishable_...`) and secret (`sb_secret_...`) keys. The legacy `anon` and `service_role` JWT-based keys still work but are being deprecated. See [Supabase API Keys documentation](https://supabase.com/docs/guides/api/api-keys) for more details.

### 5. Configure DO Spaces CORS (Important!)

In your DigitalOcean Space settings, add a CORS configuration:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the gallery.

## Usage

### Public Gallery

- Visit the home page to see all public photos
- Filter by tags using the tag pills
- Hover over images to see descriptions
- Download images (watermark included)

### Admin Dashboard

1. Navigate to `/login`
2. Sign in with your Supabase user credentials
3. Access the admin dashboard at `/admin`
4. Upload new photos at `/admin/upload`
5. Click "Edit" on any photo to update title, description, tags, or visibility

## Project Structure

```
the-glasseye-project/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── photos/       # Photo CRUD endpoints
│   │   ├── tags/         # Tags endpoint
│   │   └── upload/       # File upload endpoint
│   ├── admin/            # Admin pages
│   ├── login/            # Login page
│   └── page.tsx          # Public gallery
├── components/           # React components
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase clients and types
│   ├── auth.ts           # Auth utilities
│   ├── storage.ts        # DO Spaces storage
│   └── tags.ts           # Predefined tags
└── supabase/
    └── migrations/       # Database schema
```

## Customization

### Tags

Edit `lib/tags.ts` to customize the predefined tags. After changing, update the database:

```sql
-- Add new tags
INSERT INTO tags (name, slug) VALUES ('Your Tag', 'your-tag');
```

### Styling

The design system is defined in:
- `app/globals.css` - CSS variables and base styles
- `tailwind.config.ts` - Tailwind theme extensions

### Fonts

Currently using:
- **Display**: Cormorant Garamond (elegant serif)
- **Body**: Instrument Sans (refined humanist sans)

Change fonts in `app/globals.css` and `tailwind.config.ts`.

## License

MIT
