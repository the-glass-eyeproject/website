-- Align the existing Glass Eye database with the application.
-- Safe for the current database: keeps existing columns and data.
begin;

alter table public.photos
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists storage_url text,
  add column if not exists is_public boolean not null default false;

-- The previous schema called the URL column "url".
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'photos' and column_name = 'url'
  ) then
    execute 'update public.photos set storage_url = url where storage_url is null';
  end if;
end $;

alter table public.photos alter column storage_url set not null;

-- Keep existing storage metadata, but use Supabase Storage for new uploads.
alter table public.photos alter column storage_provider set default 'supabase';
-- The legacy URL field is retained for compatibility but is no longer required.
alter table public.photos alter column url drop not null;

create index if not exists idx_photos_created_at on public.photos(created_at desc);
create index if not exists idx_photos_is_public on public.photos(is_public);
create index if not exists idx_photos_uploaded_by on public.photos(uploaded_by);

alter table public.photos enable row level security;
alter table public.tags enable row level security;
alter table public.photo_tags enable row level security;

-- Remove permissive policies created by the earlier implementation.
drop policy if exists "Photos are viewable by everyone" on public.photos;
drop policy if exists "Authenticated users can upload photos" on public.photos;
drop policy if exists "Users can update their own photos" on public.photos;
drop policy if exists "Users can delete their own photos" on public.photos;
drop policy if exists "Authenticated users can view all photos" on public.photos;
drop policy if exists "Public photos are viewable by everyone" on public.photos;
drop policy if exists "Authenticated users can insert photos" on public.photos;
drop policy if exists "Authenticated users can update photos" on public.photos;
drop policy if exists "Authenticated users can delete photos" on public.photos;

create policy "Public photos are viewable by everyone"
  on public.photos for select to anon, authenticated
  using (is_public = true);

create policy "Admins can view all photos"
  on public.photos for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can insert photos"
  on public.photos for insert to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update photos"
  on public.photos for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can delete photos"
  on public.photos for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public can read tags and photo-tag links; only admins can change them.
drop policy if exists "Authenticated users can create tags" on public.tags;
drop policy if exists "Admins can update tags" on public.tags;
drop policy if exists "Admins can delete tags" on public.tags;
drop policy if exists "Authenticated users can manage tags" on public.tags;
drop policy if exists "Tags are viewable by everyone" on public.tags;

create policy "Tags are viewable by everyone"
  on public.tags for select to anon, authenticated using (true);
create policy "Admins can manage tags"
  on public.tags for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Authenticated users can create photo tags" on public.photo_tags;
drop policy if exists "Users can manage tags for their photos" on public.photo_tags;
drop policy if exists "Photo tags are viewable by everyone" on public.photo_tags;
drop policy if exists "Authenticated users can manage photo tags" on public.photo_tags;

create policy "Photo tags are viewable by everyone"
  on public.photo_tags for select to anon, authenticated using (true);
create policy "Admins can manage photo tags"
  on public.photo_tags for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- A private bucket prevents anyone from bypassing the photo visibility setting.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', false, 20971520, array['image/jpeg','image/png','image/gif','image/webp'])
on conflict (id) do update set public = false,
  file_size_limit = 20971520,
  allowed_mime_types = array['image/jpeg','image/png','image/gif','image/webp'];

drop policy if exists "Admins can upload gallery images" on storage.objects;
drop policy if exists "Admins can read gallery images" on storage.objects;
drop policy if exists "Admins can delete gallery images" on storage.objects;

create policy "Admins can upload gallery images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Public photos can read gallery images"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'gallery'
    and exists (
      select 1 from public.photos
      where photos.storage_key = storage.objects.name
        and photos.is_public = true
    )
  );
create policy "Admins can read all gallery images"
  on storage.objects for select to authenticated
  using (bucket_id = 'gallery' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Admins can delete gallery images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

commit;
