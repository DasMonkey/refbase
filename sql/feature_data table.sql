-- Create comprehensive feature_data table to store all feature-related content
CREATE TABLE IF NOT EXISTS feature_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_id UUID NOT NULL,
    project_id UUID NOT NULL,
    
    -- Data classification
    data_type TEXT NOT NULL CHECK (data_type IN (
        'info_file',           -- Individual files in info tab (requirements.md, structure.md, etc.)
        'kanban_board',        -- Tasks kanban board data
        'ai_summary',          -- AI-generated summaries 
        'chat_history',        -- Chat conversations about this feature
        'imported_file',       -- Imported text files (md, ts, js, etc.)
        'logs',               -- Activity logs and history
        'attachments',        -- File attachments and uploads
        'metadata'            -- Feature metadata and settings
    )),
    
    -- Content details
    name TEXT NOT NULL,                    -- File name, chat title, log entry name, etc.
    content TEXT DEFAULT '',              -- Main content (markdown, code, JSON data, etc.)
    content_type TEXT DEFAULT 'markdown', -- 'markdown', 'javascript', 'typescript', 'json', 'text', etc.
    
    -- Organization and display
    "order" INTEGER NOT NULL DEFAULT 1,   -- Display order within data_type
    parent_id UUID,                       -- For hierarchical data (replies, nested items)
    
    -- Metadata
    file_size INTEGER DEFAULT 0,          -- Content size in bytes
    language TEXT,                        -- Programming language for syntax highlighting
    tags TEXT[],                         -- Searchable tags array
    
    -- Status and workflow
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted', 'draft')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- JSON data for complex structures
    metadata JSONB DEFAULT '{}',          -- Flexible metadata storage
    settings JSONB DEFAULT '{}',          -- User preferences and settings
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    accessed_at TIMESTAMPTZ DEFAULT NOW(), -- Track last access for usage analytics
    
    -- User attribution
    created_by UUID,                      -- User who created this data
    updated_by UUID,                      -- User who last updated this data
    
    -- Foreign key constraints
    CONSTRAINT fk_feature_data_feature_id FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
    CONSTRAINT fk_feature_data_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_feature_data_parent_id FOREIGN KEY (parent_id) REFERENCES feature_data(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_feature_data_feature_id ON feature_data(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_data_project_id ON feature_data(project_id);
CREATE INDEX IF NOT EXISTS idx_feature_data_type ON feature_data(data_type);
CREATE INDEX IF NOT EXISTS idx_feature_data_order ON feature_data(feature_id, data_type, "order");
CREATE INDEX IF NOT EXISTS idx_feature_data_status ON feature_data(status);
CREATE INDEX IF NOT EXISTS idx_feature_data_updated ON feature_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_data_tags ON feature_data USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_feature_data_metadata ON feature_data USING GIN(metadata);

-- Full text search index for content
CREATE INDEX IF NOT EXISTS idx_feature_data_content_search ON feature_data USING GIN(to_tsvector('english', name || ' ' || content));

-- Update trigger to automatically update updated_at and accessed_at
CREATE OR REPLACE FUNCTION update_feature_data_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF TG_OP = 'UPDATE' THEN
        NEW.accessed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feature_data_timestamps
    BEFORE UPDATE ON feature_data
    FOR EACH ROW EXECUTE PROCEDURE update_feature_data_timestamps();

-- Trigger to update accessed_at on SELECT (for analytics)
CREATE OR REPLACE FUNCTION update_feature_data_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE feature_data SET accessed_at = NOW() WHERE id = NEW.id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Row Level Security (RLS) policies
ALTER TABLE feature_data ENABLE ROW LEVEL SECURITY;

-- Policy for users to only access their own feature data
CREATE POLICY "Users can only access their own feature data" ON feature_data
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Policy for inserting feature data
CREATE POLICY "Users can insert feature data for their projects" ON feature_data
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Policy for updating feature data
CREATE POLICY "Users can update their own feature data" ON feature_data
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Policy for deleting feature data
CREATE POLICY "Users can delete their own feature data" ON feature_data
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Create view for easier querying of info files
CREATE VIEW feature_info_files AS
SELECT 
    fd.*,
    f.title as feature_title,
    f.type as feature_type
FROM feature_data fd
JOIN features f ON fd.feature_id = f.id
WHERE fd.data_type = 'info_file' AND fd.status = 'active'
ORDER BY fd.feature_id, fd."order";

-- Create view for feature analytics
CREATE VIEW feature_analytics AS
SELECT 
    fd.feature_id,
    fd.data_type,
    COUNT(*) as item_count,
    SUM(fd.file_size) as total_size,
    MAX(fd.updated_at) as last_updated,
    MAX(fd.accessed_at) as last_accessed
FROM feature_data fd
WHERE fd.status = 'active'
GROUP BY fd.feature_id, fd.data_type;