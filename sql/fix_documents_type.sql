-- Fix documents table type constraint for MCP API
-- Remove existing type constraint and add new one with MCP-compatible values

-- First, drop the existing type constraint
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

-- Add new type constraint with MCP-compatible values
ALTER TABLE documents ADD CONSTRAINT documents_type_check 
    CHECK (type IN ('documentation', 'guide', 'notes', 'api-docs', 'readme'));