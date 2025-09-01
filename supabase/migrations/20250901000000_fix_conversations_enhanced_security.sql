/*
  # Fix conversations_enhanced View Security Issue
  
  The conversations_enhanced view was created without explicit SECURITY INVOKER,
  which means PostgreSQL defaults to SECURITY DEFINER behavior. This creates
  a security risk where the view runs with the creator's privileges instead
  of the current user's privileges, potentially bypassing RLS policies.
  
  This migration recreates the view with explicit SECURITY INVOKER to ensure
  it respects the current user's permissions and RLS policies.
*/

-- Drop the existing view completely
DROP VIEW IF EXISTS conversations_enhanced CASCADE;

-- Recreate the view with explicit SECURITY INVOKER
CREATE VIEW conversations_enhanced 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  title,
  messages,
  tags,
  project_context,
  source,
  created_at,
  updated_at,
  implementation_summary,
  files_changed,
  
  -- Extract useful metrics from technical_details
  CASE 
    WHEN technical_details ? 'tool_calls' THEN jsonb_array_length(technical_details->'tool_calls')
    ELSE 0 
  END as tool_calls_count,
  
  CASE 
    WHEN technical_details ? 'implementation_flow' THEN jsonb_array_length(technical_details->'implementation_flow')
    ELSE 0 
  END as implementation_steps_count,
  
  -- Extract metrics from code_changes
  jsonb_array_length(code_changes) as code_changes_count,
  jsonb_array_length(tool_usage) as tool_usage_count,
  
  -- Check if conversation has technical details
  CASE 
    WHEN technical_details != '{}'::jsonb OR 
         code_changes != '[]'::jsonb OR 
         tool_usage != '[]'::jsonb OR 
         implementation_summary != '' OR 
         array_length(files_changed, 1) > 0 
    THEN true 
    ELSE false 
  END as has_technical_details,
  
  -- Full technical data
  technical_details,
  code_changes,
  tool_usage
  
FROM conversations;

-- Add comment to the view explaining the security model
COMMENT ON VIEW conversations_enhanced IS 'Enhanced view of conversations with computed metrics and technical details. Uses SECURITY INVOKER to respect RLS policies on the underlying conversations table.';

-- Grant appropriate permissions on the new view
GRANT SELECT ON conversations_enhanced TO authenticated;

-- The view is now recreated with SECURITY INVOKER
-- This ensures it respects the current user's permissions and RLS policies
-- instead of running with the creator's elevated privileges