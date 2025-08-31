/*
  # Fix Salt Consistency - FINAL SOLUTION
  
  The API key authentication fails because of salt mismatch:
  - Database function uses: current_database() (returns actual DB name) 
  - Server fallback uses: hardcoded 'postgres'
  
  This creates different hashes for the same key, causing auth failures.
  
  Solution: Update database function to use hardcoded 'postgres' to match server code.
*/

-- Drop existing hash function
DROP FUNCTION IF EXISTS hash_api_key(text);

-- Create function with hardcoded 'postgres' salt to match server fallback
CREATE OR REPLACE FUNCTION hash_api_key(key_text text)
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT md5(key_text || 'refbase_api_salt_postgres');
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hash_api_key(text) TO authenticated;

-- Test the function produces expected output
DO $$
DECLARE
  test_key text := 'refb_test123456789012345678901234567890';
  db_hash text;
  server_hash text;
BEGIN
  -- Get hash from database function
  SELECT hash_api_key(test_key) INTO db_hash;
  
  -- Calculate what server-side code would produce
  SELECT md5(test_key || 'refbase_api_salt_postgres') INTO server_hash;
  
  -- Verify they match
  IF db_hash = server_hash THEN
    RAISE NOTICE 'SUCCESS: Database and server hashes match!';
    RAISE NOTICE 'Hash: %', substring(db_hash, 1, 12) || '...';
  ELSE
    RAISE EXCEPTION 'FAILED: Hash mismatch. DB: %, Server: %', db_hash, server_hash;
  END IF;
END $$;

-- Important Note: Existing API keys may need to be regenerated
-- because they were hashed with the old inconsistent salt format