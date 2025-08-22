-- Add status column to features table
-- This allows tracking feature development progress

-- Add status column with default value
ALTER TABLE features ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'planned';

-- Add constraint to ensure only valid status values
ALTER TABLE features ADD CONSTRAINT features_status_check 
CHECK (status IN ('planned', 'in-progress', 'implemented', 'testing'));

-- Add index for status column for better query performance
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);

-- Add comment to document the status field
COMMENT ON COLUMN features.status IS 'Current development status of the feature (planned, in-progress, implemented, testing)';