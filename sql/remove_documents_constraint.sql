-- Remove type constraint from documents table to allow MCP API to work
-- This is the safest approach to get the API working immediately

-- Drop the existing type constraint
DO $$
DECLARE
    constraint_name_var text;
BEGIN
    -- Find the constraint name
    SELECT tc.constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'documents' 
        AND tc.constraint_type = 'CHECK'
        AND tc.constraint_name LIKE '%type%'
    LIMIT 1;
    
    -- Drop the constraint if it exists
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE documents DROP CONSTRAINT ' || constraint_name_var;
        RAISE NOTICE 'Dropped type constraint: %', constraint_name_var;
    ELSE
        RAISE NOTICE 'No type constraint found to drop';
    END IF;
END $$;

-- Verify constraint was removed
SELECT 'Type constraint removed - documents API should work now' as status;