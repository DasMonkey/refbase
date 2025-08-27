import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase with service key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service key for server operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Auth middleware - validates user token
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Validate the user token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Add user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

// Apply auth middleware to all routes
app.use('/api', authenticateUser);

// Health check endpoint (no auth required)
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'RefBase API is running',
    timestamp: new Date().toISOString()
  });
});

// CONVERSATIONS ENDPOINTS
app.post('/api/conversations', async (req, res) => {
  try {
    // Parse body if it's a Buffer
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString());
    }
    
    const { title, messages, tags = [], projectContext } = body;
    const user = (req as any).user;

    // Validate required fields
    if (!title || !messages) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title and messages' 
      });
    }

    const conversationData = {
      title,
      messages,
      tags,
      project_context: projectContext,
      user_id: user.id,
      source: 'mcp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('conversations')
      .insert([conversationData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to save conversation' });
    }

    res.json({ 
      success: true, 
      data: { id: data.id, message: 'Conversation saved successfully' }
    });

  } catch (error) {
    console.error('Save conversation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/conversations', async (req, res) => {
  try {
    const user = (req as any).user;
    const { 
      query, 
      tags, 
      project, 
      limit = 10, 
      offset = 0 
    } = req.query;

    let queryBuilder = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters  
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%`);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      queryBuilder = queryBuilder.overlaps('tags', tagArray);
    }

    if (project) {
      queryBuilder = queryBuilder.ilike('project_context->>projectName', `%${project}%`);
    }

    queryBuilder = queryBuilder
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to search conversations' });
    }

    res.json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Search conversations error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// BUGS ENDPOINTS
app.post('/api/bugs', async (req, res) => {
  try {
    // Parse body if it's a Buffer
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString());
    }
    
    const { 
      title, 
      description, 
      symptoms = [], 
      reproduction, 
      solution, 
      status = 'open', 
      severity = 'medium',
      tags = [],
      projectContext 
    } = body;
    const user = (req as any).user;

    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title and description' 
      });
    }

    const bugData = {
      title,
      description,
      symptoms,
      reproduction: reproduction || '',
      solution: solution || '',
      status,
      severity,
      tags,
      project_context: projectContext,
      user_id: user.id,
      project_id: null, // For MCP API, we allow bugs without specific projects
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bugs')
      .insert([bugData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to save bug' });
    }

    res.json({ 
      success: true, 
      data: { id: data.id, message: 'Bug saved successfully' }
    });

  } catch (error) {
    console.error('Save bug error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/bugs', async (req, res) => {
  try {
    const user = (req as any).user;
    const { 
      query, 
      status, 
      severity,
      tags, 
      limit = 10, 
      offset = 0 
    } = req.query;

    let queryBuilder = supabase
      .from('bugs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      queryBuilder = queryBuilder.in('status', statusArray);
    }

    if (severity) {
      queryBuilder = queryBuilder.eq('severity', severity);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      queryBuilder = queryBuilder.overlaps('tags', tagArray);
    }

    queryBuilder = queryBuilder
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to search bugs' });
    }

    res.json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Search bugs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// FEATURES ENDPOINTS
app.post('/api/features', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      implementation, 
      codeExamples = [], 
      patterns = [],
      dependencies = [],
      techStack = [],
      tags = [],
      projectContext 
    } = req.body;
    const user = (req as any).user;

    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title and description' 
      });
    }

    const featureData = {
      title,
      description,
      implementation: implementation || '',
      code_examples: codeExamples,
      patterns,
      dependencies,
      tech_stack: techStack,
      tags,
      project_context: projectContext,
      user_id: user.id,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('features')
      .insert([featureData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to save feature' });
    }

    res.json({ 
      success: true, 
      data: { id: data.id, message: 'Feature saved successfully' }
    });

  } catch (error) {
    console.error('Save feature error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/features', async (req, res) => {
  try {
    const user = (req as any).user;
    const { 
      query, 
      techStack,
      tags, 
      limit = 10, 
      offset = 0 
    } = req.query;

    let queryBuilder = supabase
      .from('features')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,implementation.ilike.%${query}%`);
    }

    if (techStack) {
      const techArray = Array.isArray(techStack) ? techStack : [techStack];
      queryBuilder = queryBuilder.overlaps('tech_stack', techArray);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      queryBuilder = queryBuilder.overlaps('tags', tagArray);
    }

    queryBuilder = queryBuilder
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to search features' });
    }

    res.json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Search features error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DOCUMENTS ENDPOINTS
app.post('/api/documents', async (req, res) => {
  try {
    // Parse body if it's a Buffer
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString());
    }
    
    const { 
      title, 
      content, 
      type = 'documentation',
      tags = [],
      projectContext,
      language,
      framework
    } = body;
    const user = (req as any).user;

    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title and content' 
      });
    }

    const documentData = {
      title,
      content,
      type,
      tags,
      project_context: projectContext,
      language,
      framework,
      user_id: user.id,
      project_id: null, // For MCP API, we allow documents without specific projects
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to save document' });
    }

    res.json({ 
      success: true, 
      data: { id: data.id, message: 'Document saved successfully' }
    });

  } catch (error) {
    console.error('Save document error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const user = (req as any).user;
    const { 
      query, 
      type,
      tags,
      language,
      framework,
      limit = 10, 
      offset = 0 
    } = req.query;

    let queryBuilder = supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    if (language) {
      queryBuilder = queryBuilder.eq('language', language);
    }

    if (framework) {
      queryBuilder = queryBuilder.eq('framework', framework);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      queryBuilder = queryBuilder.overlaps('tags', tagArray);
    }

    queryBuilder = queryBuilder
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to search documents' });
    }

    res.json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Export the serverless function
export const handler = serverless(app);