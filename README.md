# The Glass Eye Project

A refined photography gallery built with Next.js and Supabase.

## What the project uses

- **Website:** Next.js 16
- **Database and sign-in:** Supabase
- **Image storage:** Supabase Storage (private bucket with time-limited image links)
- **Styling:** Tailwind CSS

## Supabase setup

The project has an existing database. Do not run the original `001_initial_schema.sql` against that database.

When ready, run `supabase/migrations/002_align_existing_schema_and_storage.sql` once in the Supabase SQL Editor. This migration adds the fields the application needs, preserves the existing tables and data, tightens photo permissions, and creates the private `gallery` storage bucket.

### Give the first account administrator access

After the migration, replace the email below with the email address used for the administrator account, then run this statement in the Supabase SQL Editor:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'YOUR-ADMIN-EMAIL';
```

This sets a trusted application role. Do not use user-editable profile metadata for administrator permissions. Sign out and sign back in after changing the role so the new role is included in the session token.

## Environment variables

Configure these in the hosting provider's environment-variable settings. Never commit secrets to GitHub.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

The application uses the signed-in administrator's Supabase session for database and Storage operations. It does not require a Supabase secret/service-role key or a DigitalOcean account.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Gallery workflow

1. Sign in using the administrator account at `/login`.
2. Open `/admin/upload` to add a photograph.
3. Photographs are private by default. Mark one public when you are ready to show it.
4. Public gallery images are delivered using short-lived signed URLs. Private originals remain in the private Storage bucket.

## Important security notes

- Administrator access is granted only by the trusted `app_metadata.role = admin` claim.
- The Supabase publishable key is designed for browser use; never expose a secret/service-role key.
- The Storage bucket is private. Do not change it to public.
- Keep original uploads and database visibility in sync. Deleting a gallery record also removes its stored image.


This branch includes an automated GitHub Actions type-check and production-build check.
