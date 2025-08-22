-- Add language column to features table for syntax highlighting
DO $migration$
BEGIN
  -- Add language column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'features' AND column_name = 'language'
  ) THEN
    ALTER TABLE features ADD COLUMN language text DEFAULT 'markdown';
  END IF;
END $migration$;