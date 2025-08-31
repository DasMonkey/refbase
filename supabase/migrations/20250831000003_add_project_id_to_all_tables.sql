/*
  # Add project_id column to conversations and features tables

  This migration adds the missing project_id column to conversations and features tables
  to enable proper project association for MCP-saved items.
*/

-- Add project_id column to conversations table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'project_id') THEN
        ALTER TABLE conversations ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add project_id column to features table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'features' AND column_name = 'project_id') THEN
        ALTER TABLE features ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_features_project_id ON features(project_id);