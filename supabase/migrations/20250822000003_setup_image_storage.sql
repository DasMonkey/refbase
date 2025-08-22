-- Setup private storage bucket for bug images
-- This migration creates a secure, private bucket for storing bug report images

-- Create the bug-images bucket
DO $$
BEGIN
  -- Insert the bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'bug-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'bug-images',
      'bug-images', 
      false,  -- Private bucket
      10485760, -- 10MB file size limit
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    );
  END IF;
END $$;

-- Create RLS policies for the storage bucket
-- Policy 1: Users can only upload images to their own project's bugs
CREATE POLICY "Users can upload images to own project bugs" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'bug-images' 
  AND auth.uid() IS NOT NULL
  AND (
    -- Check if user has access to the project containing this bug
    EXISTS (
      SELECT 1 
      FROM bugs b
      JOIN projects p ON b.project_id = p.id
      WHERE 
        -- Extract bug-id from the path: project-id/bug-id/filename
        b.id::text = split_part(name, '/', 2)
        AND p.user_id = auth.uid()
    )
    OR
    -- Allow if path matches project-id/bug-id pattern and user owns project
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE 
        p.id::text = split_part(name, '/', 1)
        AND p.user_id = auth.uid()
    )
  )
);

-- Policy 2: Users can view images from bugs in their projects
CREATE POLICY "Users can view images from own project bugs" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'bug-images'
  AND auth.uid() IS NOT NULL
  AND (
    -- Check if user has access to the project containing this bug
    EXISTS (
      SELECT 1 
      FROM bugs b
      JOIN projects p ON b.project_id = p.id
      WHERE 
        -- Extract bug-id from the path: project-id/bug-id/filename
        b.id::text = split_part(name, '/', 2)
        AND p.user_id = auth.uid()
    )
    OR
    -- Allow if path matches project-id/bug-id pattern and user owns project
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE 
        p.id::text = split_part(name, '/', 1)
        AND p.user_id = auth.uid()
    )
  )
);

-- Policy 3: Users can delete images from their project bugs
CREATE POLICY "Users can delete images from own project bugs" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'bug-images'
  AND auth.uid() IS NOT NULL
  AND (
    -- Check if user has access to the project containing this bug
    EXISTS (
      SELECT 1 
      FROM bugs b
      JOIN projects p ON b.project_id = p.id
      WHERE 
        -- Extract bug-id from the path: project-id/bug-id/filename
        b.id::text = split_part(name, '/', 2)
        AND p.user_id = auth.uid()
    )
    OR
    -- Allow if path matches project-id/bug-id pattern and user owns project
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE 
        p.id::text = split_part(name, '/', 1)
        AND p.user_id = auth.uid()
    )
  )
);

-- Create optional bug_images metadata table for better tracking
CREATE TABLE IF NOT EXISTS bug_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id uuid REFERENCES bugs(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  thumbnail_path text NOT NULL,  -- Path in storage bucket for thumbnail
  full_path text NOT NULL,       -- Path in storage bucket for full image
  width integer,
  height integer,
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on bug_images table
ALTER TABLE bug_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access images from their project bugs
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bug_images_bug_id ON bug_images(bug_id);
CREATE INDEX IF NOT EXISTS idx_bug_images_created_at ON bug_images(created_at);

-- Add helpful comments
COMMENT ON TABLE bug_images IS 'Metadata for images attached to bug reports';
COMMENT ON COLUMN bug_images.thumbnail_path IS 'Storage path for compressed thumbnail (300px width)';
COMMENT ON COLUMN bug_images.full_path IS 'Storage path for full-size optimized image (max 1200px width)';