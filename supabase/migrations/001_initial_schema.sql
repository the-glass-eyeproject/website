-- The Glass Eye Project - Database Schema
-- Storage: DigitalOcean Spaces | Auth: Supabase Auth | Database: Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  title TEXT,
  description TEXT,
  filename TEXT NOT NULL,
  
  -- Storage info (DigitalOcean Spaces)
  storage_key TEXT NOT NULL UNIQUE,
  storage_url TEXT NOT NULL,
  
  -- Image metadata
  width INTEGER,
  height INTEGER,
  size BIGINT,
  mime_type TEXT,
  
  -- Visibility
  is_public BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Owner (single admin, but keeping for future extensibility)
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for photos
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_is_public ON photos(is_public);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for tags
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- ============================================
-- PHOTO_TAGS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS photo_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(photo_id, tag_id)
);

-- Indexes for photo_tags
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_id ON photo_tags(tag_id);

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
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public photos are viewable by everyone" ON photos;
DROP POLICY IF EXISTS "Authenticated users can view all photos" ON photos;
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON photos;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON photos;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON photos;

-- PHOTOS POLICIES

-- Public can only see photos marked as public
CREATE POLICY "Public photos are viewable by everyone"
  ON photos FOR SELECT
  USING (is_public = true);

-- Authenticated users can see all photos
CREATE POLICY "Authenticated users can view all photos"
  ON photos FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert photos
CREATE POLICY "Authenticated users can insert photos"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update photos
CREATE POLICY "Authenticated users can update photos"
  ON photos FOR UPDATE
  TO authenticated
  USING (true);

-- Only authenticated users can delete photos
CREATE POLICY "Authenticated users can delete photos"
  ON photos FOR DELETE
  TO authenticated
  USING (true);

-- TAGS POLICIES
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON tags;
DROP POLICY IF EXISTS "Authenticated users can manage tags" ON tags;

CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage tags"
  ON tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PHOTO_TAGS POLICIES
DROP POLICY IF EXISTS "Photo tags are viewable by everyone" ON photo_tags;
DROP POLICY IF EXISTS "Authenticated users can manage photo tags" ON photo_tags;

CREATE POLICY "Photo tags are viewable by everyone"
  ON photo_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage photo tags"
  ON photo_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

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
