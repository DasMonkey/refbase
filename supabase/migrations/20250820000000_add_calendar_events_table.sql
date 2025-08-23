/*
  # Create calendar_events table

  1. New Tables
    - `calendar_events`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `title` (text, required)
      - `description` (text, optional)
      - `event_date` (date, required)
      - `start_time` (time, required)
      - `end_time` (time, required)
      - `event_type` (text, required)
      - `attendees` (text array, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `calendar_events` table
    - Add policies for authenticated users to manage their own project events
*/

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('meeting', 'task', 'milestone', 'bug')),
  attendees text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own project events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events for own projects"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_calendar_events_project_date 
  ON calendar_events(project_id, event_date);

CREATE INDEX idx_calendar_events_user_date 
  ON calendar_events(user_id, event_date);