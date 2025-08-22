-- Add language column to documents table for syntax highlighting
DO $migration$
BEGIN
  -- Add language column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'language'
  ) THEN
    ALTER TABLE documents ADD COLUMN language text DEFAULT 'markdown';
  END IF;
END $migration$;