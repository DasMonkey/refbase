/*
  # Update bugs table to support enhanced bug reporting features

  1. Add missing columns to bugs table:
    - `content` (text) - Main bug content for enhanced editor
    - `type` (text) - Bug type (ui-bug, functional-bug, etc.)
    - `language` (text) - Programming language for enhanced editor

  2. Update existing bugs table structure to match application requirements

  Note: This migration is designed to be safe to run multiple times
*/

-- Add missing columns to bugs table
DO $$
BEGIN
  -- Add content column for enhanced editor
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bugs' AND column_name = 'content'
  ) THEN
    ALTER TABLE bugs ADD COLUMN content text DEFAULT '';
  END IF;

  -- Add type column for bug categorization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bugs' AND column_name = 'type'
  ) THEN
    ALTER TABLE bugs ADD COLUMN type text DEFAULT 'functional-bug' 
      CHECK (type IN ('ui-bug', 'functional-bug', 'performance-bug', 'security-bug', 'data-bug', 'integration-bug'));
  END IF;

  -- Add language column for enhanced editor
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bugs' AND column_name = 'language'
  ) THEN
    ALTER TABLE bugs ADD COLUMN language text DEFAULT 'markdown';
  END IF;

  -- Add bug_id column to tasks table to link tasks to specific bugs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'bug_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN bug_id uuid REFERENCES bugs(id) ON DELETE CASCADE;
  END IF;
END $$;