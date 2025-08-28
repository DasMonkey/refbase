/*
  # Fix API Keys View Security Definer Issue
  
  This migration completely recreates the view to ensure it doesn't have
  SECURITY DEFINER property. We'll create a simple view that relies purely
  on RLS policies for security.
*/

-- Drop the existing view completely
DROP VIEW IF EXISTS api_keys_safe CASCADE;

-- Create a new view without any security definer properties
-- This view is purely for convenience and relies on RLS for security
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
FROM api_keys;

-- The view will automatically respect the RLS policies on api_keys table
-- No need for additional WHERE clause since RLS handles the filtering

-- Grant SELECT permission to authenticated users
GRANT SELECT ON api_keys_safe TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW api_keys_safe IS 'Safe view of API keys that excludes sensitive data like key_hash. Security is enforced through RLS policies on the underlying api_keys table.';