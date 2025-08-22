/*
  # Fix bugs table status column constraints
  
  The bugs table has multiple conflicting check constraints on the status column.
  This migration removes all existing status constraints and adds the correct one for bugs.
  
  Expected bug status values: 'open', 'in-progress', 'fixed', 'wont-fix'
*/

-- First, find and drop all existing check constraints on bugs.status
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Get all check constraint names for bugs table status column
    FOR constraint_name IN 
        SELECT cc.constraint_name
        FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu 
            ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'bugs' 
            AND ccu.column_name = 'status'
            AND cc.constraint_schema = 'public'
    LOOP
        -- Drop each constraint
        EXECUTE format('ALTER TABLE bugs DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Add the correct check constraint for bugs status
ALTER TABLE bugs 
ADD CONSTRAINT bugs_status_check 
CHECK (status IN ('open', 'in-progress', 'fixed', 'wont-fix'));

-- Verify the constraint was added correctly
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'bugs_status_check';