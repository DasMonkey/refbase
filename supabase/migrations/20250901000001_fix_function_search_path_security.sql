/*
  # Fix Function Search Path Security Issues
  
  This migration fixes the security warnings for PostgreSQL functions that don't have
  their search_path set properly. Functions without explicit search_path settings
  are vulnerable to search_path manipulation attacks.
  
  The fix is to recreate these functions with a fixed search_path.
  
  Functions to fix:
  - update_updated_at_column
  - update_conversation_technical_details
  - validate_technical_details  
  - validate_code_changes
  - validate_tool_usage
*/

-- Fix update_conversation_technical_details function
CREATE OR REPLACE FUNCTION update_conversation_technical_details()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update updated_at if technical details actually changed
  IF (OLD.technical_details IS DISTINCT FROM NEW.technical_details) OR
     (OLD.implementation_summary IS DISTINCT FROM NEW.implementation_summary) OR
     (OLD.files_changed IS DISTINCT FROM NEW.files_changed) OR
     (OLD.code_changes IS DISTINCT FROM NEW.code_changes) OR
     (OLD.tool_usage IS DISTINCT FROM NEW.tool_usage) THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Fix validate_technical_details function
CREATE OR REPLACE FUNCTION validate_technical_details(details jsonb)
RETURNS boolean AS $$
BEGIN
  -- Basic structure validation
  IF details IS NULL THEN
    RETURN true;
  END IF;
  
  -- Ensure it's an object, not an array or primitive
  IF jsonb_typeof(details) != 'object' THEN
    RETURN false;
  END IF;
  
  -- If tool_calls exists, it should be an array
  IF details ? 'tool_calls' AND jsonb_typeof(details->'tool_calls') != 'array' THEN
    RETURN false;
  END IF;
  
  -- If implementation_flow exists, it should be an array
  IF details ? 'implementation_flow' AND jsonb_typeof(details->'implementation_flow') != 'array' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Fix validate_code_changes function  
CREATE OR REPLACE FUNCTION validate_code_changes(changes jsonb)
RETURNS boolean AS $$
BEGIN
  -- Basic structure validation
  IF changes IS NULL THEN
    RETURN true;
  END IF;
  
  -- Must be an array
  IF jsonb_typeof(changes) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Each element should have required fields if not empty
  IF jsonb_array_length(changes) > 0 THEN
    -- Basic validation that each change has file_path
    RETURN (
      SELECT bool_and(
        change ? 'file_path' AND 
        jsonb_typeof(change->'file_path') = 'string'
      )
      FROM jsonb_array_elements(changes) AS change
    );
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Fix validate_tool_usage function
CREATE OR REPLACE FUNCTION validate_tool_usage(usage jsonb)
RETURNS boolean AS $$
BEGIN
  -- Basic structure validation
  IF usage IS NULL THEN
    RETURN true;
  END IF;
  
  -- Must be an array
  IF jsonb_typeof(usage) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Each element should have tool and timestamp if not empty
  IF jsonb_array_length(usage) > 0 THEN
    RETURN (
      SELECT bool_and(
        tool_call ? 'tool' AND 
        tool_call ? 'timestamp' AND
        jsonb_typeof(tool_call->'tool') = 'string' AND
        jsonb_typeof(tool_call->'timestamp') = 'string'
      )
      FROM jsonb_array_elements(usage) AS tool_call
    );
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Check if update_updated_at_column function exists and fix it if found
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    -- Fix the generic update_updated_at_column function if it exists
    EXECUTE '
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $func$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;
    ';
    RAISE NOTICE 'Fixed update_updated_at_column function';
  ELSE
    RAISE NOTICE 'update_updated_at_column function not found - skipping';
  END IF;
END $$;

-- Add comments explaining the security fix
COMMENT ON FUNCTION update_conversation_technical_details() IS 'Trigger function with fixed search_path for security. Updates updated_at when technical details change.';
COMMENT ON FUNCTION validate_technical_details(jsonb) IS 'Validation function with fixed search_path for security. Validates technical_details JSONB structure.';
COMMENT ON FUNCTION validate_code_changes(jsonb) IS 'Validation function with fixed search_path for security. Validates code_changes JSONB structure.';
COMMENT ON FUNCTION validate_tool_usage(jsonb) IS 'Validation function with fixed search_path for security. Validates tool_usage JSONB structure.';