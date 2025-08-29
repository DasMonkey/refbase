# RefBase API Documentation

**Base URL:** `https://refbase.dev/api`

This documentation covers the complete RefBase API system, including the permanent API key system and MCP-ready endpoints for AI conversation management.

## 🔐 Authentication

RefBase supports **dual authentication** for different use cases:

### API Key Authentication (Recommended for MCP Tools)
```bash
Authorization: Bearer refb_9bafcf024221ed182286db3641769056
```
- **Permanent keys** that never expire
- **Ideal for MCP servers** and automated tools
- **Generated via webapp** Settings → API Keys tab
- **Secure**: Keys are hashed and only shown once at creation

### JWT Token Authentication (Web App Only)
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```
- **1-hour expiry** tokens from Supabase Auth
- **Used by RefBase webapp** for user interface
- **Not recommended for MCP tools** due to frequent expiry

---

## 🔑 API Key Management Endpoints

### Create API Key
```http
POST /api/api-keys
Content-Type: application/json
Authorization: Bearer [JWT_TOKEN]

{
  "name": "My MCP Server Key",
  "permissions": ["read", "write"],
  "scopes": ["conversations", "bugs", "features", "documents"],
  "expiresInDays": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "refb_9bafcf024221ed182286db3641769056",
    "id": "7b56a0cb-acb5-48cb-8ed4-8c32121df6c4",
    "name": "My MCP Server Key",
    "key_prefix": "refb_9bafcf02",
    "permissions": ["read", "write"],
    "scopes": ["conversations", "bugs", "features", "documents"],
    "expires_at": null,
    "created_at": "2025-08-29T04:02:34.268485+00:00",
    "message": "API key created successfully. Save it now - it will not be shown again!"
  }
}
```

**⚠️ Important:** The full API key is only shown once at creation. Save it immediately!

### List API Keys
```http
GET /api/api-keys
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `includeInactive` (boolean): Include deactivated keys in results

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "7b56a0cb-acb5-48cb-8ed4-8c32121df6c4",
      "user_id": "bd260423-35fe-434a-90d0-b4b09c2aef74",
      "name": "My MCP Server Key",
      "key_prefix": "refb_9bafcf02",
      "permissions": ["read", "write"],
      "scopes": ["conversations", "bugs", "features", "documents"],
      "is_active": true,
      "expires_at": null,
      "last_used_at": null,
      "usage_count": 0,
      "created_at": "2025-08-29T04:02:34.268485+00:00",
      "updated_at": "2025-08-29T04:02:34.268485+00:00"
    }
  ]
}
```

### Update API Key
```http
PUT /api/api-keys/{keyId}
Content-Type: application/json
Authorization: Bearer [JWT_TOKEN]

{
  "name": "Updated Key Name",
  "is_active": false
}
```

### Delete API Key
```http
DELETE /api/api-keys/{keyId}
Authorization: Bearer [JWT_TOKEN]
```

---

## 💬 MCP Data Endpoints

All MCP endpoints support both **API key** and **JWT token** authentication.

### Conversations API

#### Save Conversation
```http
POST /api/conversations
Content-Type: application/json
Authorization: Bearer [API_KEY_OR_JWT]

{
  "title": "React Hooks Implementation Discussion",
  "messages": [
    {
      "role": "user",
      "content": "How do I implement useEffect for data fetching?",
      "timestamp": "2025-08-29T10:00:00.000Z"
    },
    {
      "role": "assistant", 
      "content": "Here's how to implement useEffect for data fetching...",
      "timestamp": "2025-08-29T10:00:30.000Z"
    }
  ],
  "tags": ["react", "hooks", "useEffect"],
  "project_context": {
    "projectName": "RefBase Frontend",
    "techStack": ["react", "typescript"],
    "filePath": "/src/components/DataFetcher.tsx"
  },
  "source": "mcp"
}
```

#### Search Conversations
```http
GET /api/conversations
Authorization: Bearer [API_KEY_OR_JWT]
```

**Query Parameters:**
- `query` (string): Search in conversation titles and content
- `tags` (string): Filter by comma-separated tags
- `project` (string): Filter by project name
- `source` (string): Filter by source (`manual`, `mcp`, `file`)
- `limit` (number): Maximum results (default: 10)
- `offset` (number): Pagination offset (default: 0)

### Bugs API

#### Save Bug Report
```http
POST /api/bugs
Content-Type: application/json
Authorization: Bearer [API_KEY_OR_JWT]

{
  "title": "Login form validation not working",
  "description": "User can submit empty login form without validation errors",
  "symptoms": [
    "Form submits with empty fields",
    "No validation error messages shown",
    "API receives empty credentials"
  ],
  "reproduction": "1. Navigate to /login\n2. Click submit without entering credentials\n3. Form submits successfully",
  "solution": "Added client-side validation using Zod schema",
  "status": "resolved",
  "severity": "medium",
  "tags": ["validation", "forms", "login"],
  "project_context": {
    "projectName": "RefBase Frontend",
    "affectedFiles": ["/src/components/LoginForm.tsx"],
    "gitCommit": "abc123"
  }
}
```

#### Search Bugs
```http
GET /api/bugs
Authorization: Bearer [API_KEY_OR_JWT]
```

**Query Parameters:**
- `query` (string): Search in bug titles and descriptions
- `status` (string): Filter by status (`open`, `in-progress`, `resolved`, `closed`)
- `severity` (string): Filter by severity (`low`, `medium`, `high`, `critical`)
- `tags` (string): Filter by comma-separated tags
- `limit` (number): Maximum results (default: 10)
- `offset` (number): Pagination offset (default: 0)

### Features API

#### Save Feature Implementation
```http
POST /api/features
Content-Type: application/json
Authorization: Bearer [API_KEY_OR_JWT]

{
  "title": "Dark Mode Toggle Implementation",
  "description": "Added system-wide dark mode with user preference persistence",
  "implementation_details": "Implemented using React Context and localStorage for persistence",
  "code_examples": [
    {
      "language": "typescript",
      "code": "const ThemeContext = createContext<ThemeContextType | undefined>(undefined);"
    }
  ],
  "tech_stack": ["react", "typescript", "tailwindcss"],
  "status": "implemented",
  "complexity": "medium",
  "tags": ["ui", "theming", "darkmode"],
  "project_context": {
    "projectName": "RefBase Frontend",
    "implementationFiles": [
      "/src/contexts/ThemeContext.tsx",
      "/src/components/ThemeToggle.tsx"
    ]
  }
}
```

#### Search Features
```http
GET /api/features
Authorization: Bearer [API_KEY_OR_JWT]
```

**Query Parameters:**
- `query` (string): Search in feature titles and descriptions
- `techStack` (string): Filter by technology (e.g., "react", "typescript")
- `status` (string): Filter by status (`planned`, `in-progress`, `implemented`, `testing`)
- `complexity` (string): Filter by complexity (`low`, `medium`, `high`)
- `tags` (string): Filter by comma-separated tags
- `limit` (number): Maximum results (default: 10)
- `offset` (number): Pagination offset (default: 0)

### Documents API

#### Save Document
```http
POST /api/documents
Content-Type: application/json
Authorization: Bearer [API_KEY_OR_JWT]

{
  "title": "React Component Best Practices",
  "content": "# React Component Best Practices\n\n## 1. Use TypeScript\n...",
  "type": "documentation",
  "language": "markdown",
  "tags": ["react", "typescript", "best-practices"],
  "project_context": {
    "projectName": "RefBase Frontend",
    "category": "development-guidelines"
  }
}
```

#### Search Documents
```http
GET /api/documents
Authorization: Bearer [API_KEY_OR_JWT]
```

**Query Parameters:**
- `query` (string): Search in document titles and content
- `type` (string): Filter by document type
- `language` (string): Filter by programming language
- `tags` (string): Filter by comma-separated tags
- `limit` (number): Maximum results (default: 10)
- `offset` (number): Pagination offset (default: 0)

---

## 📊 Response Format

All API endpoints follow a consistent response format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (development only)",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🔒 Security & Rate Limits

### Security Features
- **API Key Hashing**: All API keys are hashed using MD5 with application salt
- **Row Level Security**: Users can only access their own data
- **Input Validation**: All inputs are validated and sanitized
- **CORS Enabled**: Configured for cross-origin requests

### Rate Limits
- **Netlify Functions**: 1000 requests/second (inherited from platform)
- **No per-user limits**: Currently no additional rate limiting implemented

### Best Practices
1. **Store API keys securely** - Never commit keys to version control
2. **Use environment variables** - Store keys in `.env` files or secure config
3. **Rotate keys regularly** - Generate new keys and delete old ones periodically  
4. **Monitor usage** - Check `last_used_at` and `usage_count` fields regularly
5. **Revoke compromised keys** - Immediately delete or deactivate suspicious keys

---

## 🚀 Getting Started

### 1. Generate an API Key
1. Go to [RefBase Settings](https://refbase.dev) → **API Keys** tab
2. Click **"Create API Key"**
3. Enter a descriptive name (e.g., "My MCP Server")
4. **Copy the key immediately** - it won't be shown again!
5. Store the key securely in your environment variables

### 2. Test the API
```bash
# Test with your API key
curl -X GET "https://refbase.dev/api/conversations" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"

# Save a test conversation
curl -X POST "https://refbase.dev/api/conversations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -d '{
    "title": "API Test Conversation",
    "messages": [
      {
        "role": "user",
        "content": "Testing the RefBase API",
        "timestamp": "2025-08-29T10:00:00.000Z"
      }
    ],
    "tags": ["test", "api"],
    "source": "manual"
  }'
```

### 3. Build Your MCP Server
Use these endpoints to build your MCP server that automatically captures and saves AI conversations from your IDE.

**Example MCP Server Structure:**
```
refbase-mcp-server/
├── package.json
├── src/
│   ├── server.ts          # Main MCP server
│   ├── refbase-client.ts  # API client using your endpoints
│   └── conversation-extractor.ts
└── config.json           # MCP server configuration
```

---

## 📚 Additional Resources

- **RefBase Web App**: [https://refbase.dev](https://refbase.dev)
- **MCP Protocol**: [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- **Support**: Report issues at [RefBase GitHub Issues](https://github.com/your-repo/refbase/issues)

---

## 🎉 Success!

**The RefBase API is production-ready and fully functional!** 

You now have:
✅ **Permanent API keys** that never expire  
✅ **8 working MCP endpoints** for full conversation management  
✅ **Complete authentication system** with security features  
✅ **MCP-ready architecture** for AI assistant integration  

**Ready to build your MCP server and enable automatic AI conversation capture!** 🚀