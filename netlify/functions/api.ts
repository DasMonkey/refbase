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

// Auth middleware - validates both JWT tokens and API keys
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Check if this is an API key (starts with refb_)
    if (token.startsWith('refb_')) {
      return await authenticateWithApiKey(token, req, res, next);
    }
    
    // Otherwise, treat as JWT token
    return await authenticateWithJWT(token, req, res, next);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

// JWT authentication (existing behavior)
const authenticateWithJWT = async (token: string, req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Validate the user token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired JWT token' });
    }

    // Add user to request object
    (req as any).user = user;
    (req as any).authMethod = 'jwt';
    next();
  } catch (error) {
    console.error('JWT auth error:', error);
    return res.status(500).json({ success: false, error: 'JWT authentication failed' });
  }
};

// API key authentication 
const authenticateWithApiKey = async (apiKey: string, req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Validate API key format
    if (!apiKey.match(/^refb_[a-f0-9]{32}$/)) {
      return res.status(401).json({ success: false, error: 'Invalid API key format' });
    }
    
    // Hash the API key for lookup (with fallback)
    let hashResult: string;
    
    try {
      const { data: dbHash, error: hashError } = await supabase
        .rpc('hash_api_key', { key_text: apiKey });
      
      if (hashError || !dbHash) {
        console.warn('Database hashing failed in auth, using server-side hashing:', hashError);
        // Fallback: Hash key server-side with MD5 to match database function
        const crypto = require('crypto');
        // Use hardcoded 'postgres' to match current_database() in Supabase
        hashResult = crypto.createHash('md5').update(apiKey + 'refbase_api_salt_' + 'postgres').digest('hex');
      } else {
        hashResult = dbHash;
      }
    } catch (error) {
      console.error('API key hash error:', error);
      return res.status(500).json({ success: false, error: 'Authentication failed' });
    }
    
    // Look up the API key in database
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, user_id, name, permissions, scopes, is_active, expires_at, usage_count')
      .eq('key_hash', hashResult)
      .eq('is_active', true)
      .single();
    
    if (keyError || !keyData) {
      return res.status(401).json({ success: false, error: 'Invalid or inactive API key' });
    }
    
    // Check if key has expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return res.status(401).json({ success: false, error: 'API key has expired' });
    }
    
    // Get user details
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(keyData.user_id);
    
    if (userError || !userData.user) {
      return res.status(401).json({ success: false, error: 'User not found for API key' });
    }
    
    // Update last used timestamp and usage count
    await supabase
      .from('api_keys')
      .update({ 
        last_used_at: new Date().toISOString(),
        usage_count: keyData.usage_count + 1
      })
      .eq('id', keyData.id);
    
    // Add user and API key info to request
    (req as any).user = userData.user;
    (req as any).authMethod = 'api_key';
    (req as any).apiKey = {
      id: keyData.id,
      name: keyData.name,
      permissions: keyData.permissions,
      scopes: keyData.scopes
    };
    
    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({ success: false, error: 'API key authentication failed' });
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

// DEBUG API KEY AUTHENTICATION ENDPOINT (NO AUTH REQUIRED)
app.post('/debug-auth', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.json({ success: false, error: 'API key required in body' });
    }
    
    console.log('Debug auth - Testing key:', apiKey.substring(0, 12) + '...');
    
    // Validate format
    if (!apiKey.match(/^refb_[a-f0-9]{32}$/)) {
      return res.json({ success: false, error: 'Invalid API key format', format: apiKey.length });
    }
    
    // Hash the API key for lookup (with fallback)
    let hashResult: string;
    let hashMethod: string;
    
    try {
      const { data: dbHash, error: hashError } = await supabase
        .rpc('hash_api_key', { key_text: apiKey });
      
      if (hashError || !dbHash) {
        console.log('Database hashing failed, using server-side hashing:', hashError);
        // Fallback: Hash key server-side with MD5 to match database function
        const crypto = require('crypto');
        // Use hardcoded 'postgres' to match current_database() in Supabase
        hashResult = crypto.createHash('md5').update(apiKey + 'refbase_api_salt_' + 'postgres').digest('hex');
        hashMethod = 'server-md5';
      } else {
        hashResult = dbHash;
        hashMethod = 'database';
      }
    } catch (error) {
      console.error('API key hash error:', error);
      return res.json({ success: false, error: 'Hash error', details: error.message });
    }
    
    console.log('Hash result:', hashResult.substring(0, 12) + '...', 'Method:', hashMethod);
    
    // Look up the API key in database
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, user_id, name, key_hash, is_active, expires_at, created_at')
      .eq('key_hash', hashResult)
      .single();
    
    if (keyError) {
      console.log('Database lookup error:', keyError);
      return res.json({
        success: false,
        error: 'Database lookup failed',
        details: keyError.message,
        hashUsed: hashResult.substring(0, 12) + '...',
        hashMethod
      });
    }
    
    if (!keyData) {
      console.log('No key data found for hash:', hashResult.substring(0, 12) + '...');
      return res.json({
        success: false,
        error: 'No matching key found',
        hashUsed: hashResult.substring(0, 12) + '...',
        hashMethod
      });
    }
    
    res.json({
      success: true,
      data: {
        found: true,
        keyId: keyData.id,
        name: keyData.name,
        isActive: keyData.is_active,
        hashMethod,
        hashUsed: hashResult.substring(0, 12) + '...',
        storedHash: keyData.key_hash.substring(0, 12) + '...'
      }
    });
    
  } catch (error) {
    console.error('Debug auth error:', error);
    res.json({ success: false, error: 'Internal error', details: error.message });
  }
});

// CONVERSATIONS ENDPOINTS
app.post('/api/conversations', async (req, res) => {
  try {
    console.log('POST /api/conversations - Starting request');
    
    // Parse body if it's a Buffer
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString());
    }
    
    console.log('Request body:', body);
    
    const { title, messages, tags = [], projectContext } = body;
    const user = (req as any).user;
    
    console.log('User:', user ? { id: user.id, email: user.email } : 'No user');

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
      source: 'mcp'
      // Remove manual timestamps - let database handle defaults
    };

    const { data, error } = await supabase
      .from('conversations')
      .insert([conversationData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Data being inserted:', conversationData);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save conversation',
        details: error.message || 'Unknown database error'
      });
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
    // Parse body if it's a Buffer
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString());
    }
    
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
    } = body;
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
      project_id: null, // For MCP API, we allow features without specific projects
      status: 'implemented',
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

// PROJECTS ENDPOINTS
app.post('/api/projects', async (req, res) => {
  try {
    // Parse body if it's a Buffer
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString());
    }
    
    const { 
      name, 
      description, 
      techStack = [],
      framework,
      language,
      projectPath
    } = body;
    const user = (req as any).user;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: name' 
      });
    }

    const projectData = {
      name,
      description: description || '',
      tech_stack: techStack,
      framework: framework || null,
      language: language || null,
      project_path: projectPath || null,
      workspace_root: null, // Can be set later if needed
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to save project' });
    }

    res.json({ 
      success: true, 
      data: { id: data.id, message: 'Project created successfully' }
    });

  } catch (error) {
    console.error('Save project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      return res.status(500).json({ success: false, error: 'Failed to get project' });
    }

    res.json({ 
      success: true, 
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        techStack: data.tech_stack,
        framework: data.framework,
        language: data.language,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    });

  } catch (error) {
    console.error('Get project error:', error);
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

// API KEY MANAGEMENT ENDPOINTS
app.post('/api/api-keys', async (req, res) => {
  try {
    console.log('Main endpoint - Starting API key creation');
    
    // Only allow JWT authentication for API key management
    if ((req as any).authMethod !== 'jwt') {
      console.log('Main endpoint - Authentication failed: not JWT');
      return res.status(403).json({ success: false, error: 'API key management requires JWT authentication' });
    }
    
    console.log('Main endpoint - JWT authentication passed');
    
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString());
    }
    
    const { name = 'Main Endpoint Test' } = body; // Default name if not provided
    const user = (req as any).user;
    
    console.log('Main endpoint - User ID:', user.id);
    console.log('Main endpoint - Key name:', name);
    
    // Simple key generation (same as working debug endpoint)
    const crypto = require('crypto');
    const keyBytes = crypto.randomBytes(16);
    const fullKey = 'refb_' + keyBytes.toString('hex');
    const keyPrefix = 'refb_' + keyBytes.toString('hex').substring(0, 8);
    // Use database name from Supabase URL to match current_database() in function
    const dbName = process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'postgres';
    const keyHash = crypto.createHash('md5').update(fullKey + 'refbase_api_salt_postgres').digest('hex');
    
    console.log('Main endpoint - Generated key prefix:', keyPrefix);
    
    // Parse IP address correctly (take first IP from x-forwarded-for)
    let clientIp = null;
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // Take the first IP from the comma-separated list
      clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
    } else {
      clientIp = req.connection?.remoteAddress || null;
    }
    
    console.log('Main endpoint - Client IP:', clientIp);
    
    // Simple insert with proper IP handling
    const { data: keyRecord, error: insertError } = await supabase
      .from('api_keys')
      .insert([{
        user_id: user.id,
        name: name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        permissions: ['read', 'write'],
        scopes: ['conversations', 'bugs', 'features', 'documents'],
        is_active: true,
        expires_at: null,
        created_from_ip: clientIp,
        user_agent: req.headers['user-agent'] || 'main-endpoint-fixed'
      }])
      .select('id, name, key_prefix, permissions, scopes, expires_at, created_at')
      .single();
    
    if (insertError) {
      console.error('Main endpoint - Database insert error:', insertError);
      return res.status(500).json({ 
        success: false, 
        error: 'Database insert failed',
        details: insertError.message,
        code: insertError.code
      });
    }
    
    console.log('Main endpoint - Successfully created key');
    
    // Return the full key ONLY once - never stored or returned again
    res.json({ 
      success: true, 
      data: {
        key: fullKey, // This is the only time the full key is shown!
        ...keyRecord,
        message: 'API key created successfully. Save it now - it will not be shown again!'
      }
    });
    
  } catch (error) {
    console.error('Main endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
  }
});

app.get('/api/api-keys', async (req, res) => {
  try {
    // Only allow JWT authentication for API key management
    if ((req as any).authMethod !== 'jwt') {
      return res.status(403).json({ success: false, error: 'API key management requires JWT authentication' });
    }
    
    const user = (req as any).user;
    const { includeInactive = false } = req.query;
    
    let query = supabase
      .from('api_keys')
      .select('id, user_id, name, key_prefix, permissions, scopes, is_active, expires_at, last_used_at, usage_count, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch API keys' });
    }
    
    res.json({ 
      success: true, 
      data: data || []
    });
    
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.put('/api/api-keys/:keyId', async (req, res) => {
  try {
    // Only allow JWT authentication for API key management
    if ((req as any).authMethod !== 'jwt') {
      return res.status(403).json({ success: false, error: 'API key management requires JWT authentication' });
    }
    
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString());
    }
    
    const { keyId } = req.params;
    const { name, is_active } = body;
    const user = (req as any).user;
    
    if (!keyId) {
      return res.status(400).json({ success: false, error: 'Key ID is required' });
    }
    
    const updateData: any = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name must be 1-100 characters' 
        });
      }
      updateData.name = name;
    }
    
    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }
    
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', keyId)
      .eq('user_id', user.id)
      .select('id, name, key_prefix, permissions, scopes, is_active, expires_at, last_used_at, usage_count, created_at, updated_at')
      .single();
    
    if (error) {
      console.error('Database error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'API key not found' });
      }
      return res.status(500).json({ success: false, error: 'Failed to update API key' });
    }
    
    res.json({ 
      success: true, 
      data: data,
      message: 'API key updated successfully'
    });
    
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.delete('/api/api-keys/:keyId', async (req, res) => {
  try {
    // Only allow JWT authentication for API key management
    if ((req as any).authMethod !== 'jwt') {
      return res.status(403).json({ success: false, error: 'API key management requires JWT authentication' });
    }
    
    const { keyId } = req.params;
    const user = (req as any).user;
    
    if (!keyId) {
      return res.status(400).json({ success: false, error: 'Key ID is required' });
    }
    
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete API key' });
    }
    
    res.json({ 
      success: true, 
      message: 'API key deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DEBUG TEST ENDPOINT - Simple API key creation without complex logic
app.post('/api/test-create-key', async (req, res) => {
  try {
    // Only allow JWT authentication for API key management
    if ((req as any).authMethod !== 'jwt') {
      return res.status(403).json({ success: false, error: 'JWT authentication required' });
    }
    
    const user = (req as any).user;
    console.log('Test endpoint - User ID:', user.id);
    
    // Generate simple key manually (no database functions)
    const crypto = require('crypto');
    const keyBytes = crypto.randomBytes(16);
    const fullKey = 'refb_' + keyBytes.toString('hex');
    console.log('Test endpoint - Generated key:', fullKey.substring(0, 12) + '...');
    
    // Generate key_prefix with exactly 8 hex chars after refb_
    const keyPrefix = 'refb_' + keyBytes.toString('hex').substring(0, 8);
    console.log('Test endpoint - Key prefix:', keyPrefix);
    
    // Hash key manually (no database functions)
    const keyHash = crypto.createHash('md5').update(fullKey + 'test_salt').digest('hex');
    console.log('Test endpoint - Generated hash length:', keyHash.length);
    
    // Simple insert without complex validation
    const { data: keyRecord, error: insertError } = await supabase
      .from('api_keys')
      .insert([{
        user_id: user.id,
        name: 'Test Key - Simple',
        key_prefix: keyPrefix, // Exactly 8 hex chars: refb_12345678
        key_hash: keyHash,
        permissions: ['read', 'write'],
        scopes: ['conversations', 'bugs', 'features', 'documents'],
        is_active: true,
        expires_at: null,
        created_from_ip: null,
        user_agent: 'test'
      }])
      .select('id, name, key_prefix, permissions, scopes, expires_at, created_at')
      .single();
    
    if (insertError) {
      console.error('Test endpoint - Database insert error:', insertError);
      return res.status(500).json({ 
        success: false, 
        error: 'Database insert failed',
        details: insertError.message
      });
    }
    
    console.log('Test endpoint - Success! Created key record:', keyRecord.id);
    
    res.json({ 
      success: true, 
      data: {
        key: fullKey,
        ...keyRecord,
        message: 'Test API key created successfully!'
      }
    });
    
  } catch (error) {
    console.error('Test endpoint - Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Test endpoint failed',
      details: error.message
    });
  }
});

// DEBUG API KEY AUTHENTICATION ENDPOINT
app.post('/api/debug-auth', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.json({ success: false, error: 'API key required in body' });
    }
    
    console.log('Debug auth - Testing key:', apiKey.substring(0, 12) + '...');
    
    // Validate format
    if (!apiKey.match(/^refb_[a-f0-9]{32}$/)) {
      return res.json({ success: false, error: 'Invalid API key format', format: apiKey.length });
    }
    
    // Hash the API key for lookup (with fallback)
    let hashResult: string;
    let hashMethod: string;
    
    try {
      const { data: dbHash, error: hashError } = await supabase
        .rpc('hash_api_key', { key_text: apiKey });
      
      if (hashError || !dbHash) {
        console.log('Database hashing failed, using server-side hashing:', hashError);
        // Fallback: Hash key server-side with MD5 to match database function
        const crypto = require('crypto');
        // Use hardcoded 'postgres' to match current_database() in Supabase
        hashResult = crypto.createHash('md5').update(apiKey + 'refbase_api_salt_' + 'postgres').digest('hex');
        hashMethod = 'server-md5';
      } else {
        hashResult = dbHash;
        hashMethod = 'database';
      }
    } catch (error) {
      console.error('API key hash error:', error);
      return res.json({ success: false, error: 'Hash error', details: error.message });
    }
    
    console.log('Hash result:', hashResult.substring(0, 12) + '...', 'Method:', hashMethod);
    
    // Look up the API key in database
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, user_id, name, key_hash, is_active, expires_at, created_at')
      .eq('key_hash', hashResult)
      .single();
    
    if (keyError) {
      console.log('Database lookup error:', keyError);
      return res.json({
        success: false,
        error: 'Database lookup failed',
        details: keyError.message,
        hashUsed: hashResult.substring(0, 12) + '...',
        hashMethod
      });
    }
    
    if (!keyData) {
      console.log('No key data found for hash:', hashResult.substring(0, 12) + '...');
      return res.json({
        success: false,
        error: 'No matching key found',
        hashUsed: hashResult.substring(0, 12) + '...',
        hashMethod
      });
    }
    
    res.json({
      success: true,
      data: {
        found: true,
        keyId: keyData.id,
        name: keyData.name,
        isActive: keyData.is_active,
        hashMethod,
        hashUsed: hashResult.substring(0, 12) + '...',
        storedHash: keyData.key_hash.substring(0, 12) + '...'
      }
    });
    
  } catch (error) {
    console.error('Debug auth error:', error);
    res.json({ success: false, error: 'Internal error', details: error.message });
  }
});

// FINAL DEBUG ENDPOINT - Test the new fixed logic
app.post('/api/debug-fixed-key', async (req, res) => {
  try {
    // Only allow JWT authentication for API key management
    if ((req as any).authMethod !== 'jwt') {
      return res.status(403).json({ success: false, error: 'JWT authentication required' });
    }
    
    const user = (req as any).user;
    console.log('Debug fixed endpoint - User ID:', user.id);
    
    // Use the exact same logic as the fixed main endpoint
    let fullKey: string;
    let keyHash: string;
    let keyPrefix: string;
    
    try {
      // Always use server-side generation for consistency
      const crypto = require('crypto');
      const keyBytes = crypto.randomBytes(16);
      fullKey = 'refb_' + keyBytes.toString('hex');
      
      // Generate key_prefix with exactly 8 hex chars after refb_
      keyPrefix = 'refb_' + keyBytes.toString('hex').substring(0, 8);
      console.log('Debug fixed - Generated key_prefix:', keyPrefix);
      
      // Try database hashing first
      const { data: dbHash, error: hashError } = await supabase.rpc('hash_api_key', { key_text: fullKey });
      
      if (hashError || !dbHash) {
        console.warn('Database hashing failed, using server-side hashing:', hashError);
        // Fallback: Hash key server-side with MD5 to match database function
        keyHash = crypto.createHash('md5').update(fullKey + 'refbase_api_salt_postgres').digest('hex');
      } else {
        keyHash = dbHash;
      }
      
    } catch (error) {
      console.error('Key generation error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate API key',
        details: error.message
      });
    }
    
    // Simple insert with the new logic
    const { data: keyRecord, error: insertError } = await supabase
      .from('api_keys')
      .insert([{
        user_id: user.id,
        name: 'Debug Fixed Key Test',
        key_prefix: keyPrefix, // Exactly 8 hex chars after refb_
        key_hash: keyHash,
        permissions: ['read', 'write'],
        scopes: ['conversations', 'bugs', 'features', 'documents'],
        is_active: true,
        expires_at: null,
        created_from_ip: null,
        user_agent: 'debug-fixed'
      }])
      .select('id, name, key_prefix, permissions, scopes, expires_at, created_at')
      .single();
    
    if (insertError) {
      console.error('Debug fixed - Database insert error:', insertError);
      return res.status(500).json({ 
        success: false, 
        error: 'Database insert failed',
        details: insertError.message,
        code: insertError.code
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        key: fullKey,
        ...keyRecord,
        message: 'Debug fixed API key created successfully!'
      }
    });
    
  } catch (error) {
    console.error('Debug fixed endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Export the serverless function
export const handler = serverless(app);