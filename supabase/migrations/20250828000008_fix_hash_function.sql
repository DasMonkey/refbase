/*
  # Fix hash_api_key Function
  
  The hash_api_key function is using digest() which isn't available.
  Let's use a simpler approach with md5() which is built into PostgreSQL.
*/

-- Drop and recreate the hash function with working code
DROP FUNCTION IF EXISTS hash_api_key(text);

-- Create function using md5 instead (which is always available)
CREATE OR REPLACE FUNCTION hash_api_key(key_text text)
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT md5(key_text || 'refbase_api_salt_' || current_database());
$$;

-- Test both functions now
SELECT generate_api_key() as test_key;
SELECT hash_api_key('refb_test123456789012345678901234567890') as test_hash;