/*
  # Complete project management schema setup

  1. New Tables
    - `documents` - Project documentation
    - `tasks` - Project tasks with status and priority
    - `bugs` - Bug tracking with severity levels
    - `messages` - Project chat messages
    - `files` - File metadata storage

  2. Enhanced Tables
    - `projects` - Add missing columns (icon, color)

  3. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for all tables
    - Ensure users can only access their own project data

  4. Triggers
    - Add updated_at triggers for all tables
*/

-- First, let's add missing columns to projects table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'icon'
  ) THEN
    ALTER TABLE projects ADD COLUMN icon text DEFAULT '🚀';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'color'
  ) THEN
    ALTER TABLE projects ADD COLUMN color text DEFAULT '#3b82f6';
  END IF;

  -- Make user_id NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text DEFAULT '',
  type text DEFAULT 'custom' CHECK (type IN ('prd', 'ux-flow', 'feature-list', 'bug-list', 'custom')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'fix-later', 'done')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'top')),
  assignee text,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bugs table
CREATE TABLE IF NOT EXISTS bugs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'fixed', 'wont-fix')),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  assignee text,
  attachments text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table for project chat
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  author text NOT NULL,
  content text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create files table (metadata only, actual files stored elsewhere)
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  size_bytes bigint DEFAULT 0,
  file_type text DEFAULT 'unknown',
  url text,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables (only if not already enabled)
DO $$
BEGIN
  -- Enable RLS on new tables
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'documents' AND rowsecurity = true
  ) THEN
    ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'tasks' AND rowsecurity = true
  ) THEN
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'bugs' AND rowsecurity = true
  ) THEN
    ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'messages' AND rowsecurity = true
  ) THEN
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'files' AND rowsecurity = true
  ) THEN
    ALTER TABLE files ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies only if they don't exist
-- Documents policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' AND policyname = 'Users can read project documents'
  ) THEN
    CREATE POLICY "Users can read project documents" ON documents
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = documents.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' AND policyname = 'Users can create project documents'
  ) THEN
    CREATE POLICY "Users can create project documents" ON documents
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = documents.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' AND policyname = 'Users can update project documents'
  ) THEN
    CREATE POLICY "Users can update project documents" ON documents
      FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = documents.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' AND policyname = 'Users can delete project documents'
  ) THEN
    CREATE POLICY "Users can delete project documents" ON documents
      FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = documents.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Tasks policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' AND policyname = 'Users can read project tasks'
  ) THEN
    CREATE POLICY "Users can read project tasks" ON tasks
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = tasks.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' AND policyname = 'Users can create project tasks'
  ) THEN
    CREATE POLICY "Users can create project tasks" ON tasks
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = tasks.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' AND policyname = 'Users can update project tasks'
  ) THEN
    CREATE POLICY "Users can update project tasks" ON tasks
      FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = tasks.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' AND policyname = 'Users can delete project tasks'
  ) THEN
    CREATE POLICY "Users can delete project tasks" ON tasks
      FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = tasks.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Bugs policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bugs' AND policyname = 'Users can read project bugs'
  ) THEN
    CREATE POLICY "Users can read project bugs" ON bugs
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = bugs.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bugs' AND policyname = 'Users can create project bugs'
  ) THEN
    CREATE POLICY "Users can create project bugs" ON bugs
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = bugs.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bugs' AND policyname = 'Users can update project bugs'
  ) THEN
    CREATE POLICY "Users can update project bugs" ON bugs
      FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = bugs.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bugs' AND policyname = 'Users can delete project bugs'
  ) THEN
    CREATE POLICY "Users can delete project bugs" ON bugs
      FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = bugs.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Messages policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' AND policyname = 'Users can read project messages'
  ) THEN
    CREATE POLICY "Users can read project messages" ON messages
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = messages.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' AND policyname = 'Users can create project messages'
  ) THEN
    CREATE POLICY "Users can create project messages" ON messages
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = messages.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' AND policyname = 'Users can delete project messages'
  ) THEN
    CREATE POLICY "Users can delete project messages" ON messages
      FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = messages.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Files policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'files' AND policyname = 'Users can read project files'
  ) THEN
    CREATE POLICY "Users can read project files" ON files
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = files.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'files' AND policyname = 'Users can create project files'
  ) THEN
    CREATE POLICY "Users can create project files" ON files
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = files.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'files' AND policyname = 'Users can update project files'
  ) THEN
    CREATE POLICY "Users can update project files" ON files
      FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = files.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'files' AND policyname = 'Users can delete project files'
  ) THEN
    CREATE POLICY "Users can delete project files" ON files
      FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = files.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers only if they don't exist
DO $$
BEGIN
  -- Documents trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_documents_updated_at'
  ) THEN
    CREATE TRIGGER update_documents_updated_at
      BEFORE UPDATE ON documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Tasks trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_tasks_updated_at'
  ) THEN
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Bugs trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_bugs_updated_at'
  ) THEN
    CREATE TRIGGER update_bugs_updated_at
      BEFORE UPDATE ON bugs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;