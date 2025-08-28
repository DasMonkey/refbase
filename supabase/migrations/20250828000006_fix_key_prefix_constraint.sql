/*
  # Fix API Key Prefix Constraint
  
  The key_prefix constraint is incomplete - it's missing the $ anchor
  which causes validation issues. This fixes the constraint to properly
  validate the exact format.
*/

-- Drop the existing constraint
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_key_prefix_format;

-- Add the corrected constraint (should be exactly refb_ + 8 hex chars)
ALTER TABLE api_keys ADD CONSTRAINT api_keys_key_prefix_format 
CHECK (key_prefix ~ '^refb_[a-f0-9]{8}$');

-- Test the constraint with a sample value
DO $$
BEGIN
  -- This should pass
  IF 'refb_12345678' ~ '^refb_[a-f0-9]{8}$' THEN
    RAISE NOTICE 'Constraint test PASS: refb_12345678';
  ELSE
    RAISE EXCEPTION 'Constraint test FAIL: refb_12345678';
  END IF;
  
  -- This should fail (too long)
  IF NOT ('refb_123456789' ~ '^refb_[a-f0-9]{8}$') THEN
    RAISE NOTICE 'Constraint test PASS: refb_123456789 correctly rejected';
  ELSE
    RAISE EXCEPTION 'Constraint test FAIL: refb_123456789 should be rejected';
  END IF;
END $$;