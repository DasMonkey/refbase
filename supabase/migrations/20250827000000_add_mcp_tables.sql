/*
  # MCP API Tables Migration
  
  1. New Tables for MCP API endpoints:
    - `conversations` - AI conversation history
    - `documents` - Documentation and guides
    - Update existing `bugs` and `features` tables for MCP compatibility
    
  2. Security
    - Enable RLS on all tables
    - Add user-based policies (not project-based)
    
  3. Indexes
    - Add search indexes for better query performance
*/

-- Create conversations table for MCP API
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  project_context jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'mcp')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table for MCP API
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'documentation' CHECK (type IN ('documentation', 'guide', 'notes', 'api-docs', 'readme')),
  tags text[] DEFAULT ARRAY[]::text[],
  project_context jsonb DEFAULT '{}'::jsonb,
  language text,
  framework text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add MCP-compatible columns to existing bugs table (if they don't exist)
DO $$
BEGIN
  -- Check if bugs table exists first
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bugs') THEN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bugs' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE bugs ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add symptoms column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bugs' AND column_name = 'symptoms'
    ) THEN
      ALTER TABLE bugs ADD COLUMN symptoms text[] DEFAULT ARRAY[]::text[];
    END IF;
    
    -- Add reproduction column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bugs' AND column_name = 'reproduction'
    ) THEN
      ALTER TABLE bugs ADD COLUMN reproduction text DEFAULT '';
    END IF;
    
    -- Add solution column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bugs' AND column_name = 'solution'
    ) THEN
      ALTER TABLE bugs ADD COLUMN solution text DEFAULT '';
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bugs' AND column_name = 'tags'
    ) THEN
      ALTER TABLE bugs ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
    END IF;
    
    -- Add project_context column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bugs' AND column_name = 'project_context'
    ) THEN
      ALTER TABLE bugs ADD COLUMN project_context jsonb DEFAULT '{}'::jsonb;
    END IF;
  END IF;
END $$;

-- Add MCP-compatible columns to existing features table (if they don't exist)
DO $$
BEGIN
  -- Check if features table exists first
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'features') THEN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE features ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'description'
    ) THEN
      ALTER TABLE features ADD COLUMN description text DEFAULT '';
    END IF;
    
    -- Add implementation column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'implementation'
    ) THEN
      ALTER TABLE features ADD COLUMN implementation text DEFAULT '';
    END IF;
    
    -- Add code_examples column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'code_examples'
    ) THEN
      ALTER TABLE features ADD COLUMN code_examples jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add patterns column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'patterns'
    ) THEN
      ALTER TABLE features ADD COLUMN patterns jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add dependencies column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'dependencies'
    ) THEN
      ALTER TABLE features ADD COLUMN dependencies text[] DEFAULT ARRAY[]::text[];
    END IF;
    
    -- Add tech_stack column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'tech_stack'
    ) THEN
      ALTER TABLE features ADD COLUMN tech_stack text[] DEFAULT ARRAY[]::text[];
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'tags'
    ) THEN
      ALTER TABLE features ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
    END IF;
    
    -- Add project_context column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'project_context'
    ) THEN
      ALTER TABLE features ADD COLUMN project_context jsonb DEFAULT '{}'::jsonb;
    END IF;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations table
CREATE POLICY "Users can manage their own conversations" ON conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for documents table
CREATE POLICY "Users can manage their own documents" ON documents
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add user-based policies for bugs (for MCP API access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bugs' AND policyname = 'Users can manage their own bugs via MCP'
  ) THEN
    CREATE POLICY "Users can manage their own bugs via MCP" ON bugs
      FOR ALL TO authenticated
      USING (auth.uid() = user_id OR user_id IS NULL)
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- Add user-based policies for features (for MCP API access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'features' AND policyname = 'Users can manage their own features via MCP'
  ) THEN
    CREATE POLICY "Users can manage their own features via MCP" ON features
      FOR ALL TO authenticated
      USING (auth.uid() = user_id OR user_id IS NULL)
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- Create updated_at triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for conversations table
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for documents table
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_tags_idx ON conversations USING GIN(tags);
CREATE INDEX IF NOT EXISTS conversations_title_idx ON conversations USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_tags_idx ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS documents_title_idx ON documents USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS documents_type_idx ON documents(type);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);

-- Add indexes for bugs table (only if table and columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bugs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bugs' AND column_name = 'user_id') THEN
      CREATE INDEX IF NOT EXISTS bugs_user_id_idx ON bugs(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bugs' AND column_name = 'tags') THEN
      CREATE INDEX IF NOT EXISTS bugs_tags_idx ON bugs USING GIN(tags);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bugs' AND column_name = 'symptoms') THEN
      CREATE INDEX IF NOT EXISTS bugs_symptoms_idx ON bugs USING GIN(symptoms);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bugs' AND column_name = 'status') THEN
      CREATE INDEX IF NOT EXISTS bugs_status_idx ON bugs(status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bugs' AND column_name = 'severity') THEN
      CREATE INDEX IF NOT EXISTS bugs_severity_idx ON bugs(severity);
    END IF;
  END IF;
END $$;

-- Add indexes for features table (only if table and columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'features') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'features' AND column_name = 'user_id') THEN
      CREATE INDEX IF NOT EXISTS features_user_id_idx ON features(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'features' AND column_name = 'tags') THEN
      CREATE INDEX IF NOT EXISTS features_tags_idx ON features USING GIN(tags);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'features' AND column_name = 'tech_stack') THEN
      CREATE INDEX IF NOT EXISTS features_tech_stack_idx ON features USING GIN(tech_stack);
    END IF;
  END IF;
END $$;