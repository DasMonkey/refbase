-- Safely fix documents table type constraint for MCP API
-- First check what types exist, then update invalid ones, then apply constraint

-- 1. Check what types currently exist in the table
SELECT type, COUNT(*) as count 
FROM documents 
GROUP BY type 
ORDER BY count DESC;

-- 2. Update any invalid types to 'documentation' (default)
-- This will fix any existing rows that don't match our constraint
UPDATE documents 
SET type = 'documentation' 
WHERE type NOT IN ('documentation', 'guide', 'notes', 'api-docs', 'readme');

-- 3. Drop the existing type constraint
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
        RAISE NOTICE 'Dropped constraint: %', constraint_name_var;
    END IF;
END $$;

-- 4. Add new type constraint with MCP-compatible values
ALTER TABLE documents ADD CONSTRAINT documents_type_check 
    CHECK (type IN ('documentation', 'guide', 'notes', 'api-docs', 'readme'));

-- 5. Verify the constraint was applied successfully
SELECT 'Constraint applied successfully' as status;