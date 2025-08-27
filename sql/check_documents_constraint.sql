-- Check the type constraint on documents table
SELECT 
    tc.constraint_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'documents' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name LIKE '%type%';