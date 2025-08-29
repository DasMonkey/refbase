/*
  # Fix gen_random_bytes Function Usage
  
  The generate_api_key function is still using the old code that references
  gen_random_bytes. We need to update it to work with the available functions.
*/

-- Drop and recreate the function with working code
DROP FUNCTION IF EXISTS generate_api_key();

-- Create function using gen_random_uuid instead (which is available)
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 'refb_' || replace(gen_random_uuid()::text, '-', '')::text;
$$;

-- Test the function
SELECT generate_api_key() as test_key;