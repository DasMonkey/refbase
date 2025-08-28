/*
  # Fix API Keys Security Issues
  
  This migration fixes the security warnings from the previous migration:
  1. Removes SECURITY DEFINER from view (not needed with RLS)
  2. Sets explicit search_path for all functions
  3. Uses more secure function definitions
*/

-- Drop the previous view that had SECURITY DEFINER
DROP VIEW IF EXISTS api_keys_safe;

-- Drop the previous functions to recreate them with proper security
DROP FUNCTION IF EXISTS generate_api_key();
DROP FUNCTION IF EXISTS hash_api_key(text);
DROP FUNCTION IF EXISTS is_valid_api_key_format(text);

-- Create function to generate secure API keys with explicit search_path
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER  -- Use caller's permissions instead of DEFINER
SET search_path = public  -- Explicit search path
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

-- Create function to hash API keys with explicit search_path
CREATE OR REPLACE FUNCTION hash_api_key(key_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER  -- Use caller's permissions instead of DEFINER
SET search_path = public  -- Explicit search path
AS $$
BEGIN
  -- Use SHA-256 with a salt for consistent hashing
  -- Note: In production, you should use a more secure secret from environment
  RETURN encode(digest(key_text || coalesce(current_setting('app.jwt_secret', true), 'fallback_salt_change_me'), 'sha256'), 'hex');
END;
$$;

-- Create function to validate API key format with explicit search_path
CREATE OR REPLACE FUNCTION is_valid_api_key_format(key_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER  -- Use caller's permissions instead of DEFINER
IMMUTABLE
SET search_path = public  -- Explicit search path
AS $$
BEGIN
  -- Check if key matches pattern: refb_[32 hex chars]
  RETURN key_text ~ '^refb_[a-f0-9]{32}$';
END;
$$;

-- Create a simple view without SECURITY DEFINER (RLS handles security)
CREATE VIEW api_keys_safe AS
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
FROM api_keys
WHERE (auth.uid() = user_id OR auth.role() = 'service_role');

-- Grant appropriate permissions (same as before)
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;
GRANT SELECT ON api_keys_safe TO authenticated;
GRANT EXECUTE ON FUNCTION generate_api_key() TO authenticated;
GRANT EXECUTE ON FUNCTION hash_api_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION is_valid_api_key_format(text) TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW api_keys_safe IS 'Secure view of API keys that respects RLS policies. Users can only see their own keys.';
COMMENT ON FUNCTION generate_api_key() IS 'Generates cryptographically secure API keys with refb_ prefix';
COMMENT ON FUNCTION hash_api_key(text) IS 'Hashes API keys using SHA-256 for secure storage';
COMMENT ON FUNCTION is_valid_api_key_format(text) IS 'Validates API key format without exposing the actual key';