/*
  # Create project_trackers table

  1. New Tables
    - `project_trackers`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `user_id` (uuid, references auth.users)
      - `title` (text, required)
      - `description` (text, optional)
      - `tracker_type` (text, required - project/feature/bug)
      - `start_date` (date, required)
      - `end_date` (date, required, must be >= start_date)
      - `status` (text, required - not_started/in_progress/completed)
      - `priority` (text, required - low/medium/high/critical)
      - `linked_items` (jsonb, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `project_trackers` table
    - Add policies for authenticated users to manage their own project trackers
*/

CREATE TABLE IF NOT EXISTS project_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  tracker_type text NOT NULL CHECK (tracker_type IN ('project', 'feature', 'bug')),
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  linked_items jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_trackers ENABLE ROW LEVEL SECURITY;

-- Create optimized policies for project_trackers (using EXISTS for better performance)
CREATE POLICY "Users can read own project trackers"
  ON project_trackers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_trackers.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trackers for own projects"
  ON project_trackers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_trackers.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project trackers"
  ON project_trackers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_trackers.project_id 
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_trackers.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project trackers"
  ON project_trackers
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_trackers.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_project_trackers_updated_at
  BEFORE UPDATE ON project_trackers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create optimized indexes for better query performance

-- Primary composite index for date range queries (most common use case)
CREATE INDEX idx_project_trackers_project_date_overlap 
  ON project_trackers(project_id, start_date, end_date);

-- Partial index for active trackers (excludes completed items for faster queries)
CREATE INDEX idx_project_trackers_active 
  ON project_trackers(project_id, status, start_date) 
  WHERE status IN ('not_started', 'in_progress');

-- Index for priority-based filtering (high-priority items)
CREATE INDEX idx_project_trackers_priority 
  ON project_trackers(project_id, priority, start_date) 
  WHERE priority IN ('high', 'critical');

-- Index for type-based queries with date sorting
CREATE INDEX idx_project_trackers_type_dates 
  ON project_trackers(project_id, tracker_type, start_date);

-- User-based index for cross-project queries (if needed)
CREATE INDEX idx_project_trackers_user_dates 
  ON project_trackers(user_id, start_date, end_date);