-- Make project_id nullable in features table for MCP API usage
ALTER TABLE features ALTER COLUMN project_id DROP NOT NULL;