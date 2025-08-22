-- Add featureId column to bugs table for linking bugs to features
DO $$
BEGIN
  -- Add featureId column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bugs' AND column_name = 'feature_id'
  ) THEN
    ALTER TABLE bugs ADD COLUMN feature_id uuid REFERENCES features(id) ON DELETE SET NULL;
  END IF;
END $$;