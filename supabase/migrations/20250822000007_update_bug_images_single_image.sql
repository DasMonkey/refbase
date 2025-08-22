-- Update bug_images table to use single image path instead of separate thumbnail and full paths
-- This migration removes thumbnail support and uses only full-size optimized images

-- Drop the old thumbnail_path and full_path columns
ALTER TABLE bug_images DROP COLUMN IF EXISTS thumbnail_path;
ALTER TABLE bug_images DROP COLUMN IF EXISTS full_path;

-- Add the new single image_path column
ALTER TABLE bug_images ADD COLUMN image_path text NOT NULL DEFAULT '';

-- Update the comment to reflect the new structure
COMMENT ON COLUMN bug_images.image_path IS 'Storage path for optimized image (max 1200px width, high quality)';

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_bug_images_image_path ON bug_images(image_path);