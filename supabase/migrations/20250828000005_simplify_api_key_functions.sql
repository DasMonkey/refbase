/*
  # Simplify API Key Functions
  
  This migration creates simpler, more reliable functions for API key generation
  that work better in serverless environments and have fewer dependencies.
*/

-- Drop existing functions to recreate them more simply
DROP FUNCTION IF EXISTS generate_api_key();
DROP FUNCTION IF EXISTS hash_api_key(text);
DROP FUNCTION IF EXISTS verify_api_key(text, text);

-- Create a simple key generation function using built-in PostgreSQL functions
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 'refb_' || encode(gen_random_bytes(16), 'hex');
$$;

-- Create a simple hashing function using built-in digest
CREATE OR REPLACE FUNCTION hash_api_key(key_text text)
RETURNS text  
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT encode(digest(key_text || 'refbase_api_salt_' || current_database(), 'sha256'), 'hex');
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_api_key() TO authenticated;
GRANT EXECUTE ON FUNCTION hash_api_key(text) TO authenticated;

-- Test the functions work
DO $$
DECLARE
  test_key text;
  test_hash text;
BEGIN
  -- Test key generation
  SELECT generate_api_key() INTO test_key;
  RAISE NOTICE 'Generated test key: %', substring(test_key, 1, 12) || '...';
  
  -- Test key hashing
  SELECT hash_api_key(test_key) INTO test_hash;
  RAISE NOTICE 'Generated hash length: %', length(test_hash);
  
  -- Verify format
  IF test_key ~ '^refb_[a-f0-9]{32}$' THEN
    RAISE NOTICE 'Key format validation: PASS';
  ELSE
    RAISE EXCEPTION 'Key format validation: FAIL - %', test_key;
  END IF;
  
  IF length(test_hash) = 64 THEN
    RAISE NOTICE 'Hash format validation: PASS';
  ELSE
    RAISE EXCEPTION 'Hash format validation: FAIL - length %', length(test_hash);
  END IF;
END $$;