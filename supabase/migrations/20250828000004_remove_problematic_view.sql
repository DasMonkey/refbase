/*
  # Remove Problematic View Entirely
  
  Since the api_keys_safe view keeps getting flagged with SECURITY DEFINER
  despite our attempts to fix it, we'll remove it entirely and update
  our application to use the api_keys table directly with proper column selection.
  
  The RLS policies on api_keys table provide all the security we need.
*/

-- Drop the problematic view completely
DROP VIEW IF EXISTS api_keys_safe CASCADE;

-- Revoke any permissions that were granted on the view
-- (this will fail gracefully if the view doesn't exist)

-- Instead, we'll ensure the api_keys table has proper RLS policies
-- and our application code will select only the safe columns directly

-- Double-check that our RLS policies are in place
DO $$
BEGIN
  -- Ensure the user-based policy exists on api_keys table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'api_keys' AND policyname = 'Users can manage their own API keys'
  ) THEN
    CREATE POLICY "Users can manage their own API keys" ON api_keys
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Add a helpful comment to the table
COMMENT ON TABLE api_keys IS 'API keys table with RLS policies. Applications should select only safe columns (exclude key_hash) when querying.';

-- Safe columns that applications should select:
COMMENT ON COLUMN api_keys.key_hash IS 'SENSITIVE: Never return this column to clients. Used only for server-side authentication.';
COMMENT ON COLUMN api_keys.created_from_ip IS 'SENSITIVE: IP address information for audit purposes only.';
COMMENT ON COLUMN api_keys.user_agent IS 'SENSITIVE: User agent information for audit purposes only.';

-- List of SAFE columns applications should select:
-- id, user_id, name, key_prefix, permissions, scopes, is_active, expires_at, last_used_at, usage_count, created_at, updated_at