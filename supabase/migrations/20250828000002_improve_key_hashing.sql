/*
  # Improve API Key Hashing Security
  
  This migration improves the key hashing to not depend on JWT secrets
  which may not be available in the database context.
*/

-- Create a more robust hashing function that doesn't depend on external secrets
CREATE OR REPLACE FUNCTION hash_api_key(key_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  salt_value text;
BEGIN
  -- Use a combination of database-specific values as salt
  -- This ensures consistent hashing across sessions while being secure
  salt_value := 'refbase_api_key_salt_' || current_database();
  
  -- Use SHA-256 with database-specific salt
  RETURN encode(digest(key_text || salt_value, 'sha256'), 'hex');
END;
$$;

-- Add a function to securely compare API keys without exposing them
CREATE OR REPLACE FUNCTION verify_api_key(provided_key text, stored_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Compare the hash of provided key with stored hash
  RETURN hash_api_key(provided_key) = stored_hash;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_api_key(text, text) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION verify_api_key(text, text) IS 'Securely verifies API key against stored hash without exposing the actual key';