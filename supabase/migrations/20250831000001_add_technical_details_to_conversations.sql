/*
  # Enhanced Chat History - Technical Details Migration
  
  This migration adds enhanced fields to the conversations table to capture:
  - Code changes and file modifications
  - Tool usage history (Read, Write, Edit, Bash, etc.)
  - Implementation flow and technical decisions
  - Before/after code comparisons
  
  New fields added:
  - technical_details: Complete structured technical information
  - implementation_summary: High-level overview of what was implemented
  - files_changed: Quick array of affected file paths
  - code_changes: Before/after code with diffs
  - tool_usage: History of all tool calls made
*/

-- Add new fields to conversations table for enhanced technical details
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS technical_details jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS implementation_summary text DEFAULT '',
ADD COLUMN IF NOT EXISTS files_changed text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS code_changes jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tool_usage jsonb DEFAULT '[]'::jsonb;

-- Add comments to document the new fields
COMMENT ON COLUMN conversations.technical_details IS 'Complete structured technical information including implementation flow, decisions, and challenges';
COMMENT ON COLUMN conversations.implementation_summary IS 'High-level text summary of what was implemented in this conversation';
COMMENT ON COLUMN conversations.files_changed IS 'Array of file paths that were created, modified, or deleted';
COMMENT ON COLUMN conversations.code_changes IS 'Array of before/after code changes with diffs and metadata';
COMMENT ON COLUMN conversations.tool_usage IS 'History of all tool calls made during the conversation';

-- Create indexes for better query performance on new fields

-- Index for searching within technical_details
CREATE INDEX IF NOT EXISTS conversations_technical_details_gin_idx 
ON conversations USING GIN(technical_details);

-- Index for searching files_changed array
CREATE INDEX IF NOT EXISTS conversations_files_changed_gin_idx 
ON conversations USING GIN(files_changed);

-- Index for searching within code_changes
CREATE INDEX IF NOT EXISTS conversations_code_changes_gin_idx 
ON conversations USING GIN(code_changes);

-- Index for searching within tool_usage
CREATE INDEX IF NOT EXISTS conversations_tool_usage_gin_idx 
ON conversations USING GIN(tool_usage);

-- Index for implementation_summary text search
CREATE INDEX IF NOT EXISTS conversations_implementation_summary_text_idx 
ON conversations USING GIN(to_tsvector('english', implementation_summary));

-- Create a partial index for conversations with technical details (non-empty)
CREATE INDEX IF NOT EXISTS conversations_with_technical_details_idx 
ON conversations (created_at DESC) 
WHERE technical_details != '{}'::jsonb;

-- Create a partial index for conversations with code changes
CREATE INDEX IF NOT EXISTS conversations_with_code_changes_idx 
ON conversations (created_at DESC) 
WHERE code_changes != '[]'::jsonb;

-- Update the updated_at timestamp for conversations that will be enhanced
-- (This ensures proper tracking of when technical details were added)
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
$$ language 'plpgsql';

-- Create trigger for technical details updates
CREATE TRIGGER update_conversations_technical_details_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_technical_details();

-- Add validation function for technical_details structure
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
$$ language 'plpgsql';

-- Add check constraint for technical_details validation
ALTER TABLE conversations 
ADD CONSTRAINT conversations_technical_details_valid 
CHECK (validate_technical_details(technical_details));

-- Add validation function for code_changes structure
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
$$ language 'plpgsql';

-- Add check constraint for code_changes validation
ALTER TABLE conversations 
ADD CONSTRAINT conversations_code_changes_valid 
CHECK (validate_code_changes(code_changes));

-- Add validation function for tool_usage structure
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
$$ language 'plpgsql';

-- Add check constraint for tool_usage validation
ALTER TABLE conversations 
ADD CONSTRAINT conversations_tool_usage_valid 
CHECK (validate_tool_usage(tool_usage));

-- Create a view for conversations with enhanced details for easier querying
CREATE OR REPLACE VIEW conversations_enhanced AS
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

-- Add comment to the view
COMMENT ON VIEW conversations_enhanced IS 'Enhanced view of conversations with computed metrics and technical details';

-- Grant appropriate permissions on the new view
GRANT SELECT ON conversations_enhanced TO authenticated;