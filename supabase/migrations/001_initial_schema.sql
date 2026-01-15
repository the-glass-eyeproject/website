-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PHOTOS TABLE
-- ============================================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE, -- Google Drive file ID
  storage_provider TEXT NOT NULL DEFAULT 'google-drive',
  storage_path TEXT, -- Path in Google Drive (e.g., "photos/Nature/photo.jpg")
  size BIGINT,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for photos
CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at DESC);
CREATE INDEX idx_photos_storage_key ON photos(storage_key);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX idx_photos_storage_provider ON photos(storage_provider);

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE, -- URL-friendly version
  color TEXT, -- Optional color for UI
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for tags
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_slug ON tags(slug);

-- ============================================
-- PHOTO_TAGS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE photo_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(photo_id, tag_id)
);

-- Indexes for photo_tags
CREATE INDEX idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX idx_photo_tags_tag_id ON photo_tags(tag_id);

-- ============================================
-- GOOGLE DRIVE TOKENS TABLE
-- ============================================
CREATE TABLE google_drive_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMPTZ,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for tokens
CREATE INDEX idx_google_drive_tokens_user_id ON google_drive_tokens(user_id);
CREATE INDEX idx_google_drive_tokens_expiry ON google_drive_tokens(expiry_date);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for photos
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for google_drive_tokens
CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON google_drive_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if token is expired or expiring soon
CREATE OR REPLACE FUNCTION is_token_expiring_soon(token_expiry TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN token_expiry IS NULL OR token_expiry <= NOW() + INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;

-- PHOTOS POLICIES
-- Anyone can view photos (public read)
CREATE POLICY "Photos are viewable by everyone"
  ON photos FOR SELECT
  USING (true);

-- Only authenticated users can insert photos
CREATE POLICY "Authenticated users can upload photos"
  ON photos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only the uploader or admin can update photos
CREATE POLICY "Users can update their own photos"
  ON photos FOR UPDATE
  USING (auth.uid() = uploaded_by OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- Only the uploader or admin can delete photos
CREATE POLICY "Users can delete their own photos"
  ON photos FOR DELETE
  USING (auth.uid() = uploaded_by OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- TAGS POLICIES
-- Anyone can view tags
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

-- Only authenticated users can create tags (or you can make this admin-only)
CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only admins can update/delete tags (optional - adjust as needed)
CREATE POLICY "Admins can update tags"
  ON tags FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Admins can delete tags"
  ON tags FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- PHOTO_TAGS POLICIES
-- Anyone can view photo_tags
CREATE POLICY "Photo tags are viewable by everyone"
  ON photo_tags FOR SELECT
  USING (true);

-- Authenticated users can create photo_tags
CREATE POLICY "Authenticated users can create photo tags"
  ON photo_tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update/delete tags for their own photos
CREATE POLICY "Users can manage tags for their photos"
  ON photo_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_tags.photo_id
      AND (photos.uploaded_by = auth.uid() OR auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
      ))
    )
  );

-- GOOGLE DRIVE TOKENS POLICIES
-- Users can only view their own tokens
CREATE POLICY "Users can view their own tokens"
  ON google_drive_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can create their own tokens"
  ON google_drive_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own tokens"
  ON google_drive_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own tokens"
  ON google_drive_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- INITIAL DATA (Predefined Tags)
-- ============================================
INSERT INTO tags (name, slug) VALUES
  ('Nature', 'nature'),
  ('Urban', 'urban'),
  ('Portrait', 'portrait'),
  ('Landscape', 'landscape'),
  ('Abstract', 'abstract'),
  ('Architecture', 'architecture'),
  ('Street', 'street'),
  ('Wildlife', 'wildlife'),
  ('Travel', 'travel'),
  ('Black & White', 'black-white'),
  ('Colour', 'colour'),
  ('Minimalist', 'minimalist'),
  ('Documentary', 'documentary'),
  ('Fine Art', 'fine-art'),
  ('Experimental', 'experimental')
ON CONFLICT (name) DO NOTHING;
