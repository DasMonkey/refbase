/*
  # Update existing projects with default values for new columns
  
  This fixes existing projects that were created before the new columns were added.
*/

-- Update existing projects that have NULL values in the new columns
UPDATE projects 
SET 
  tech_stack = COALESCE(tech_stack, ARRAY[]::text[]),
  framework = COALESCE(framework, NULL),
  language = COALESCE(language, NULL),
  project_path = COALESCE(project_path, NULL),
  workspace_root = COALESCE(workspace_root, NULL)
WHERE 
  tech_stack IS NULL OR 
  framework IS NULL OR 
  language IS NULL OR 
  project_path IS NULL OR 
  workspace_root IS NULL;