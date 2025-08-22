-- Fix bug_images table schema to ensure proper structure
-- This migration ensures the table has the correct columns and constraints

-- First, let's check if image_path column exists, if not add it
DO $BODY$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bug_images' AND column_name = 'image_path') THEN
        ALTER TABLE bug_images ADD COLUMN image_path text NOT NULL DEFAULT '';
    END IF;
END $BODY$;

-- Remove old columns if they still exist
ALTER TABLE bug_images DROP COLUMN IF EXISTS thumbnail_path;
ALTER TABLE bug_images DROP COLUMN IF EXISTS full_path;

-- Ensure uploaded_by column exists and has proper constraint
DO $BODY2$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bug_images' AND column_name = 'uploaded_by') THEN
        ALTER TABLE bug_images ADD COLUMN uploaded_by uuid REFERENCES auth.users(id);
    END IF;
END $BODY2$;

-- Add index for image_path if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_bug_images_image_path ON bug_images(image_path);

-- Update RLS policy to be more specific
DROP POLICY IF EXISTS "Users can access images from own project bugs" ON bug_images;

CREATE POLICY "Users can access images from own project bugs" ON bug_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM bugs b
    JOIN projects p ON b.project_id = p.id
    WHERE 
      b.id = bug_images.bug_id
      AND p.user_id = auth.uid()
  )
);

-- Add comment to document the final structure
COMMENT ON TABLE bug_images IS 'Stores metadata for images uploaded to bug reports';
COMMENT ON COLUMN bug_images.image_path IS 'Storage path for optimized image (max 1200px width, high quality)';
COMMENT ON COLUMN bug_images.uploaded_by IS 'User who uploaded the image';