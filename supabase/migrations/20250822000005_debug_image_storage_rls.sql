-- Debug RLS policies for image storage
-- This migration creates a temporarily permissive policy to test the upload mechanism

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload to bug-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view from bug-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from bug-images bucket" ON storage.objects;

-- Create very permissive policies for debugging
-- These will allow any authenticated user to upload/view/delete from bug-images bucket
CREATE POLICY "Debug: Allow authenticated uploads to bug-images" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'bug-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Debug: Allow authenticated reads from bug-images" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'bug-images'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Debug: Allow authenticated deletes from bug-images" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'bug-images'
  AND auth.uid() IS NOT NULL
);