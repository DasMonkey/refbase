-- Fix remaining Security Definer View issues
-- Run this SQL in your Supabase SQL Editor

-- Force drop and recreate views with explicit SECURITY INVOKER (opposite of SECURITY DEFINER)
DROP VIEW IF EXISTS public.feature_info_files CASCADE;
DROP VIEW IF EXISTS public.feature_analytics CASCADE;

-- Recreate feature_info_files view with SECURITY INVOKER (uses current user's permissions)
CREATE VIEW public.feature_info_files 
WITH (security_invoker=true) AS
SELECT 
    fd.*,
    f.title as feature_title,
    f.type as feature_type
FROM feature_data fd
JOIN features f ON fd.feature_id = f.id
WHERE fd.data_type = 'info_file' AND fd.status = 'active'
ORDER BY fd.feature_id, fd."order";

-- Recreate feature_analytics view with SECURITY INVOKER (uses current user's permissions)
CREATE VIEW public.feature_analytics 
WITH (security_invoker=true) AS
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

-- Grant appropriate permissions to the views for authenticated users
GRANT SELECT ON public.feature_info_files TO authenticated;
GRANT SELECT ON public.feature_analytics TO authenticated;

-- Optional: Verify the views are created correctly
-- You can run this to check:
-- SELECT schemaname, viewname, viewowner, definition 
-- FROM pg_views 
-- WHERE viewname IN ('feature_info_files', 'feature_analytics');