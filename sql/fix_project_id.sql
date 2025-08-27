-- Make project_id nullable for MCP API usage
-- This allows bugs and documents to be saved without being tied to specific projects

-- Make project_id nullable in bugs table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'bugs' AND column_name = 'project_id') THEN
    ALTER TABLE bugs ALTER COLUMN project_id DROP NOT NULL;
    RAISE NOTICE 'Made project_id nullable in bugs table';
  END IF;
END $$;

-- Make project_id nullable in documents table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'documents' AND column_name = 'project_id') THEN
    ALTER TABLE documents ALTER COLUMN project_id DROP NOT NULL;
    RAISE NOTICE 'Made project_id nullable in documents table';
  END IF;
END $$;