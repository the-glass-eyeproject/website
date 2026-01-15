-- Migration to change google_drive_tokens to a single global token
-- Instead of per-user tokens, we'll have one shared Google Drive account

-- Drop the existing table and recreate with singleton pattern
DROP TABLE IF EXISTS google_drive_tokens CASCADE;

CREATE TABLE google_drive_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Remove user_id, make it a singleton (only one row allowed)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL, -- Required for auto-refresh
  expiry_date TIMESTAMPTZ,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraint to ensure only one row exists
  CONSTRAINT single_token CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Insert a single row with fixed ID
INSERT INTO google_drive_tokens (id, access_token, refresh_token)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, '', '')
ON CONFLICT (id) DO NOTHING;

-- Index for expiry check
CREATE INDEX idx_google_drive_tokens_expiry ON google_drive_tokens(expiry_date);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON google_drive_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get the single token (helper function)
CREATE OR REPLACE FUNCTION get_google_drive_token()
RETURNS TABLE (
  id UUID,
  access_token TEXT,
  refresh_token TEXT,
  expiry_date TIMESTAMPTZ,
  token_type TEXT,
  scope TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gdt.id,
    gdt.access_token,
    gdt.refresh_token,
    gdt.expiry_date,
    gdt.token_type,
    gdt.scope
  FROM google_drive_tokens gdt
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update the single token
CREATE OR REPLACE FUNCTION update_google_drive_token(
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expiry_date TIMESTAMPTZ DEFAULT NULL,
  p_token_type TEXT DEFAULT 'Bearer',
  p_scope TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE google_drive_tokens
  SET 
    access_token = p_access_token,
    refresh_token = p_refresh_token,
    expiry_date = p_expiry_date,
    token_type = p_token_type,
    scope = p_scope,
    updated_at = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for google_drive_tokens
ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write tokens (for security)
-- Regular users cannot access tokens directly
CREATE POLICY "Service role can manage tokens"
  ON google_drive_tokens FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow authenticated users to check if token exists (read-only status check)
CREATE POLICY "Users can check token status"
  ON google_drive_tokens FOR SELECT
  USING (
    -- Allow checking if token exists (but not the actual token values)
    -- We'll use a function for this instead
    false
  );

-- Function to check if Google Drive is connected (without exposing tokens)
CREATE OR REPLACE FUNCTION is_google_drive_connected()
RETURNS BOOLEAN AS $$
DECLARE
  token_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO token_count
  FROM google_drive_tokens
  WHERE access_token IS NOT NULL 
    AND access_token != ''
    AND refresh_token IS NOT NULL
    AND refresh_token != '';
  
  RETURN token_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_google_drive_token() TO authenticated;
GRANT EXECUTE ON FUNCTION update_google_drive_token(TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_google_drive_connected() TO anon, authenticated;
