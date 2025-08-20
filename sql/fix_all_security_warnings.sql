-- Fix all Supabase Security Warnings
-- Run this SQL in your Supabase SQL Editor

-- 1. Fix Function Search Path Mutable Issues
-- These functions need explicit search_path settings to prevent injection attacks

-- Fix update_feature_data_timestamps function
CREATE OR REPLACE FUNCTION public.update_feature_data_timestamps()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    IF TG_OP = 'UPDATE' THEN
        NEW.accessed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

-- Fix update_feature_data_access function  
CREATE OR REPLACE FUNCTION public.update_feature_data_access()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE feature_data SET accessed_at = NOW() WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function (generic trigger function)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. Auth Configuration (these need to be set in Supabase Dashboard)
-- Note: The following settings cannot be applied via SQL and must be configured 
-- in the Supabase Dashboard under Authentication settings:

-- For Leaked Password Protection:
-- 1. Go to Supabase Dashboard > Authentication > Settings > Security
-- 2. Enable "Check password against HaveIBeenPwned database"

-- For MFA Options:
-- 1. Go to Supabase Dashboard > Authentication > Settings > Multi-Factor Authentication  
-- 2. Enable additional MFA methods such as:
--    - SMS (requires Twilio integration)
--    - WhatsApp (requires Twilio integration) 
--    - Phone call (requires Twilio integration)
--    - SAML SSO (enterprise feature)

-- Verify functions are properly secured
SELECT 
    routine_name,
    routine_schema,
    security_type,
    sql_data_access,
    external_language
FROM information_schema.routines 
WHERE routine_name IN (
    'update_feature_data_timestamps',
    'update_feature_data_access', 
    'update_updated_at_column'
)
AND routine_schema = 'public';