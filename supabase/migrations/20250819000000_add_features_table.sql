/*
  # Features table migration
  
  1. New Table
    - `features` - Project features and requirements
    
  2. Security
    - Enable RLS on features table
    - Add comprehensive policies for CRUD operations
    - Ensure users can only access their own project features
    
  3. Triggers
    - Add updated_at trigger for features table
*/

-- Create features table
CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text DEFAULT '',
  type text DEFAULT 'custom' CHECK (type IN ('user-story', 'enhancement', 'new-feature', 'integration', 'performance', 'custom')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on features table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'features' AND rowsecurity = true
  ) THEN
    ALTER TABLE features ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create features policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'features' AND policyname = 'Users can read project features'
  ) THEN
    CREATE POLICY "Users can read project features" ON features
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = features.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'features' AND policyname = 'Users can create project features'
  ) THEN
    CREATE POLICY "Users can create project features" ON features
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = features.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'features' AND policyname = 'Users can update project features'
  ) THEN
    CREATE POLICY "Users can update project features" ON features
      FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = features.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'features' AND policyname = 'Users can delete project features'
  ) THEN
    CREATE POLICY "Users can delete project features" ON features
      FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = features.project_id 
        AND projects.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Create updated_at trigger for features table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_features_updated_at'
  ) THEN
    CREATE TRIGGER update_features_updated_at
      BEFORE UPDATE ON features
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;