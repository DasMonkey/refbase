-- Fix Supabase Security Issues
-- Run this SQL in your Supabase SQL Editor

-- 1. Enable RLS on the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Fix the security definer views by recreating them without SECURITY DEFINER
-- Drop existing views first
DROP VIEW IF EXISTS public.feature_info_files;
DROP VIEW IF EXISTS public.feature_analytics;

-- Recreate feature_info_files view without SECURITY DEFINER
CREATE VIEW public.feature_info_files AS
SELECT 
    fd.*,
    f.title as feature_title,
    f.type as feature_type
FROM feature_data fd
JOIN features f ON fd.feature_id = f.id
WHERE fd.data_type = 'info_file' AND fd.status = 'active'
ORDER BY fd.feature_id, fd."order";

-- Recreate feature_analytics view without SECURITY DEFINER
CREATE VIEW public.feature_analytics AS
SELECT 
    fd.feature_id,
    fd.data_type,
    COUNT(*) as item_count,
    SUM(fd.file_size) as total_size,
    MAX(fd.updated_at) as last_updated,
    MAX(fd.accessed_at) as last_accessed
FROM feature_data fd
WHERE fd.status = 'active'
GROUP BY fd.feature_id, fd.data_type;

-- 3. Ensure messages table has proper RLS policies
-- Drop existing policies first to avoid conflicts, then recreate them
DROP POLICY IF EXISTS "Users can read project messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create project messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete project messages" ON public.messages;

-- Policy for users to read their own project messages
CREATE POLICY "Users can read project messages" ON public.messages
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Policy for users to create messages in their own projects
CREATE POLICY "Users can create project messages" ON public.messages
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Policy for users to delete their own project messages
CREATE POLICY "Users can delete project messages" ON public.messages
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- 4. Grant appropriate permissions to the views for authenticated users
GRANT SELECT ON public.feature_info_files TO authenticated;
GRANT SELECT ON public.feature_analytics TO authenticated;

-- 5. Verify all tables have RLS enabled (run this to check other tables)
-- You can uncomment and run these if you find other tables without RLS

-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.feature_data ENABLE ROW LEVEL SECURITY;

-- 6. Optional: Add RLS policies to views (if needed for extra security)
-- Note: Views inherit permissions from underlying tables, but you can add extra restrictions

-- CREATE POLICY "Users can access feature info files" ON public.feature_info_files
--     FOR SELECT USING (
--         feature_id IN (
--             SELECT f.id FROM features f 
--             JOIN projects p ON f.project_id = p.id 
--             WHERE p.user_id = auth.uid()
--         )
--     );