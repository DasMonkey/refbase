-- Fix features status constraint for MCP API
-- Remove the existing status constraint and allow any status

-- First, check what the current constraint allows
SELECT cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'features' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name LIKE '%status%';

-- Drop the existing status constraint
DO $$
DECLARE
    constraint_name_var text;
BEGIN
    -- Find the constraint name
    SELECT tc.constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'features' 
        AND tc.constraint_type = 'CHECK'
        AND tc.constraint_name LIKE '%status%'
    LIMIT 1;
    
    -- Drop the constraint if it exists
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE features DROP CONSTRAINT ' || constraint_name_var;
        RAISE NOTICE 'Dropped status constraint: %', constraint_name_var;
    END IF;
END $$;