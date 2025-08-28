/*
  # API Keys System Migration
  
  This migration adds a permanent API key system for MCP tools, replacing the
  need for constantly refreshing JWT tokens.
  
  Features:
  - User-generated permanent API keys
  - Key rotation and revocation
  - Scoped permissions
  - Usage tracking
  - Security controls
*/

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Key identification
  name text NOT NULL, -- User-friendly name like "MCP Tool - Claude Code"
  key_prefix text NOT NULL, -- First 8 chars for display (e.g., "refb_abc")
  key_hash text NOT NULL, -- Hashed version of the full key for security
  
  -- Permissions and scoping
  permissions jsonb DEFAULT '["read", "write"]'::jsonb, -- ["read", "write", "admin"]
  scopes text[] DEFAULT ARRAY['conversations', 'bugs', 'features', 'documents'], -- Which endpoints
  
  -- Key lifecycle
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT NULL, -- NULL means never expires
  last_used_at timestamptz DEFAULT NULL,
  usage_count integer DEFAULT 0,
  
  -- Security metadata
  created_from_ip inet,
  user_agent text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT api_keys_name_length CHECK (length(name) >= 1 AND length(name) <= 100),
  CONSTRAINT api_keys_key_prefix_format CHECK (key_prefix ~ '^refb_[a-f0-9]{8}$'),
  CONSTRAINT api_keys_permissions_valid CHECK (
    jsonb_typeof(permissions) = 'array' AND 
    permissions <@ '["read", "write", "admin"]'::jsonb
  )
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON api_keys(key_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS api_keys_key_prefix_idx ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS api_keys_is_active_idx ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS api_keys_created_at_idx ON api_keys(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate secure API keys
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_suffix text;
  full_key text;
BEGIN
  -- Generate 32 random hex characters for the suffix
  key_suffix := encode(gen_random_bytes(16), 'hex');
  
  -- Combine with prefix
  full_key := 'refb_' || key_suffix;
  
  RETURN full_key;
END;
$$;

-- Create function to hash API keys consistently
CREATE OR REPLACE FUNCTION hash_api_key(key_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use SHA-256 with a salt for consistent hashing
  RETURN encode(digest(key_text || current_setting('app.jwt_secret', true), 'sha256'), 'hex');
END;
$$;

-- Create function to validate API key format
CREATE OR REPLACE FUNCTION is_valid_api_key_format(key_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Check if key matches pattern: refb_[32 hex chars]
  RETURN key_text ~ '^refb_[a-f0-9]{32}$';
END;
$$;

-- Create helper view for API key management (excludes sensitive data)
CREATE OR REPLACE VIEW api_keys_safe AS
SELECT 
  id,
  user_id,
  name,
  key_prefix,
  permissions,
  scopes,
  is_active,
  expires_at,
  last_used_at,
  usage_count,
  created_at,
  updated_at
FROM api_keys;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;
GRANT SELECT ON api_keys_safe TO authenticated;
GRANT EXECUTE ON FUNCTION generate_api_key() TO authenticated;
GRANT EXECUTE ON FUNCTION hash_api_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION is_valid_api_key_format(text) TO authenticated;