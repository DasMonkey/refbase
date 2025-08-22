-- Fix RLS policies for image storage
-- This migration simplifies the RLS policies to focus on project ownership

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload images to own project bugs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view images from own project bugs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete images from own project bugs" ON storage.objects;

-- Create simpler, more reliable RLS policies
-- Policy 1: Users can upload images - simplified logic
CREATE POLICY "Users can upload to bug-images bucket" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'bug-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM projects p
    WHERE 
      p.id::text = split_part(name, '/', 1)
      AND p.user_id = auth.uid()
  )
);

-- Policy 2: Users can view images - simplified logic
CREATE POLICY "Users can view from bug-images bucket" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'bug-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM projects p
    WHERE 
      p.id::text = split_part(name, '/', 1)
      AND p.user_id = auth.uid()
  )
);

-- Policy 3: Users can delete images - simplified logic
CREATE POLICY "Users can delete from bug-images bucket" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'bug-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM projects p
    WHERE 
      p.id::text = split_part(name, '/', 1)
      AND p.user_id = auth.uid()
  )
);