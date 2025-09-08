# RefBase MCP API Documentation

This document provides comprehensive documentation for all MCP tools available in the RefBase MCP.

## Overview

The RefBase MCP exposes 15 MCP tools that enable AI assistants to interact with the RefBase knowledge base. These tools are organized into four main categories:

- **Conversation Management**: Save and search AI conversations
- **Bug Tracking**: Manage bugs and issues
- **Feature Solutions**: Store and retrieve implementations
- **Project Context**: Extract and provide project insights

## Authentication

All MCP tools require authentication using a RefBase API token. The token should be configured in your environment or configuration file:

```bash
REFBASE_TOKEN=your-access-token-here
```

The token is validated on each tool call and provides access to user-specific data in RefBase.

---

## Conversation Management Tools

### save_conversation

Save the current IDE conversation to RefBase knowledge base.

**Parameters:**
```typescript
{
  title: string;           // Conversation title (required)
  messages: Message[];     // Array of conversation messages (required)
  tags?: string[];         // Optional tags for categorization
  projectPath?: string;    // Current project path for context
}
```

**Message Format:**
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  codeBlocks?: CodeBlock[];
  fileReferences?: string[];
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    conversationId: string;
    message: "Conversation saved successfully"
  }
}
```

**Example Usage:**
```json
{
  "tool": "save_conversation",
  "parameters": {
    "title": "Login Bug Fix Discussion",
    "messages": [
      {
        "role": "user",
        "content": "I'm having issues with user authentication",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "role": "assistant", 
        "content": "Let me help you debug this authentication issue...",
        "timestamp": "2024-01-15T10:30:15Z"
      }
    ],
    "tags": ["auth", "bug", "login"],
    "projectPath": "/workspace/my-app/src/auth"
  }
}
```

**Error Cases:**
- `AUTHENTICATION_FAILED`: Invalid or expired token
- `INVALID_PARAMETERS`: Missing required fields or invalid data
- `REFBASE_API_ERROR`: RefBase API unavailable or error

---

### search_conversations

Find similar past conversations in RefBase.

**Parameters:**
```typescript
{
  query?: string;          // Search query text
  tags?: string[];         // Filter by tags
  projectPath?: string;    // Filter by project
  limit?: number;          // Max results (default: 10, max: 50)
  offset?: number;         // Pagination offset (default: 0)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    conversations: Conversation[];
    total: number;
    hasMore: boolean;
  }
}
```

**Conversation Object:**
```typescript
interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  tags: string[];
  messageCount: number;
  projectContext?: {
    projectName: string;
    techStack: string[];
  };
  relevanceScore?: number;
}
```

**Example Usage:**
```json
{
  "tool": "search_conversations",
  "parameters": {
    "query": "authentication login issues",
    "tags": ["auth"],
    "limit": 5
  }
}
```

---

### get_conversation

Retrieve a specific conversation by ID.

**Parameters:**
```typescript
{
  conversationId: string;  // Required conversation ID
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    messages: Message[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    projectContext: ProjectContext;
    metadata: ConversationMetadata;
  }
}
```

**Example Usage:**
```json
{
  "tool": "get_conversation", 
  "parameters": {
    "conversationId": "conv_123456"
  }
}
```

---

## Bug Tracking Tools

### save_bug

Log a new bug to RefBase bug tracker.

**Parameters:**
```typescript
{
  title: string;           // Bug title (required)
  description: string;     // Bug description (required)
  symptoms: string[];      // Observable symptoms (required)
  reproduction?: string;   // Steps to reproduce
  solution?: string;       // Solution if known
  severity: 'low' | 'medium' | 'high' | 'critical';  // Bug severity
  tags?: string[];         // Tags for categorization
  projectPath?: string;    // Current project path
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    bugId: string;
    message: "Bug logged successfully"
  }
}
```

**Example Usage:**
```json
{
  "tool": "save_bug",
  "parameters": {
    "title": "Login form validation fails",
    "description": "The login form doesn't validate email format properly",
    "symptoms": [
      "Invalid emails are accepted",
      "No error message shown",
      "Form submits with invalid data"
    ],
    "reproduction": "1. Enter invalid email 2. Click submit 3. Form processes without error",
    "severity": "medium",
    "tags": ["ui", "validation", "auth"],
    "projectPath": "/workspace/my-app/src/components/auth"
  }
}
```

---

### search_bugs

Find existing bugs by query, status, or symptoms.

**Parameters:**
```typescript
{
  query?: string;          // Search query
  status?: ('open' | 'in-progress' | 'resolved' | 'wont-fix')[];
  severity?: ('low' | 'medium' | 'high' | 'critical')[];
  tags?: string[];         // Filter by tags
  projectPath?: string;    // Filter by project
  limit?: number;          // Max results (default: 10)
  offset?: number;         // Pagination offset
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    bugs: Bug[];
    total: number;
    hasMore: boolean;
  }
}
```

**Bug Object:**
```typescript
interface Bug {
  id: string;
  title: string;
  description: string;
  symptoms: string[];
  status: string;
  severity: string;
  tags: string[];
  createdAt: Date;
  solution?: string;
  relevanceScore?: number;
}
```

**Example Usage:**
```json
{
  "tool": "search_bugs",
  "parameters": {
    "query": "login validation",
    "status": ["open", "in-progress"],
    "severity": ["medium", "high"],
    "limit": 10
  }
}
```

---

### update_bug_status

Update the status of an existing bug.

**Parameters:**
```typescript
{
  bugId: string;           // Bug ID (required)
  status: 'open' | 'in-progress' | 'resolved' | 'wont-fix';
  solution?: string;       // Solution description (required for 'resolved')
  notes?: string;          // Additional notes
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    bugId: string;
    newStatus: string;
    message: "Bug status updated successfully"
  }
}
```

**Example Usage:**
```json
{
  "tool": "update_bug_status",
  "parameters": {
    "bugId": "bug_789",
    "status": "resolved",
    "solution": "Added proper email validation regex and error messaging",
    "notes": "Fixed in commit abc123"
  }
}
```

---

### get_bug_details

Get detailed information about a specific bug.

**Parameters:**
```typescript
{
  bugId: string;           // Bug ID (required)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    description: string;
    symptoms: string[];
    reproduction?: string;
    solution?: string;
    status: string;
    severity: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    projectContext: ProjectContext;
    relatedConversations: string[];
    history: BugHistoryEntry[];
  }
}
```

**Example Usage:**
```json
{
  "tool": "get_bug_details",
  "parameters": {
    "bugId": "bug_789"
  }
}
```

---

## Feature & Solution Tools

### save_feature

Store a working feature or solution implementation.

**Parameters:**
```typescript
{
  title: string;           // Feature title (required)
  description: string;     // Feature description (required)
  implementation: string;  // Implementation details (required)
  codeExamples: CodeExample[];  // Code examples
  techStack: string[];     // Technologies used
  dependencies?: string[]; // Required dependencies
  tags?: string[];         // Tags for categorization
  projectPath?: string;    // Current project path
}
```

**CodeExample Format:**
```typescript
interface CodeExample {
  language: string;        // Programming language
  code: string;           // Code snippet
  filename?: string;      // Optional filename
  description: string;    // Code description
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    featureId: string;
    message: "Feature saved successfully"
  }
}
```

**Example Usage:**
```json
{
  "tool": "save_feature",
  "parameters": {
    "title": "JWT Authentication Middleware",
    "description": "Express middleware for JWT token validation",
    "implementation": "Created reusable middleware that validates JWT tokens and extracts user context",
    "codeExamples": [
      {
        "language": "typescript",
        "code": "const authMiddleware = (req, res, next) => { /* implementation */ }",
        "filename": "authMiddleware.ts",
        "description": "JWT validation middleware"
      }
    ],
    "techStack": ["node.js", "express", "jsonwebtoken", "typescript"],
    "dependencies": ["jsonwebtoken", "@types/jsonwebtoken"],
    "tags": ["auth", "middleware", "jwt"]
  }
}
```

---

### search_features

Find existing working solutions and implementations.

**Parameters:**
```typescript
{
  query?: string;          // Search query
  techStack?: string[];    // Filter by technologies
  tags?: string[];         // Filter by tags
  projectPath?: string;    // Filter by project
  limit?: number;          // Max results (default: 10)
  offset?: number;         // Pagination offset
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    features: Feature[];
    total: number;
    hasMore: boolean;
  }
}
```

**Feature Object:**
```typescript
interface Feature {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  tags: string[];
  createdAt: Date;
  codeExampleCount: number;
  relevanceScore?: number;
}
```

**Example Usage:**
```json
{
  "tool": "search_features",
  "parameters": {
    "query": "authentication middleware",
    "techStack": ["node.js", "express"],
    "tags": ["auth"]
  }
}
```

---

### get_feature_implementation

Get detailed implementation of a specific feature.

**Parameters:**
```typescript
{
  featureId: string;       // Feature ID (required)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    description: string;
    implementation: string;
    codeExamples: CodeExample[];
    patterns: ImplementationPattern[];
    techStack: string[];
    dependencies: string[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    projectContext: ProjectContext;
    successMetrics?: SuccessMetrics;
  }
}
```

**Example Usage:**
```json
{
  "tool": "get_feature_implementation",
  "parameters": {
    "featureId": "feat_456"
  }
}
```

---

## Project Context Tools

### get_project_context

Get relevant information for the current project.

**Parameters:**
```typescript
{
  projectPath?: string;    // Project path (uses current if not provided)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    projectPath: string;
    projectName: string;
    techStack: string[];
    mainLanguage: string;
    framework?: string;
    packageInfo?: {
      name: string;
      version: string;
      dependencies: string[];
    };
    gitInfo?: {
      repository: string;
      branch: string;
      commit: string;
    };
    fileStructure: {
      totalFiles: number;
      languages: Record<string, number>;
      directories: string[];
    };
  }
}
```

**Example Usage:**
```json
{
  "tool": "get_project_context",
  "parameters": {
    "projectPath": "/workspace/my-app"
  }
}
```

---

### search_similar_projects

Find projects with similar tech stack or characteristics.

**Parameters:**
```typescript
{
  techStack?: string[];    // Technologies to match
  projectPath?: string;    // Reference project for similarity
  language?: string;       // Primary language
  framework?: string;      // Framework to match
  limit?: number;          // Max results (default: 10)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    projects: SimilarProject[];
    total: number;
  }
}
```

**SimilarProject Object:**
```typescript
interface SimilarProject {
  name: string;
  description?: string;
  techStack: string[];
  mainLanguage: string;
  framework?: string;
  similarityScore: number;
  sharedTechnologies: string[];
  conversationCount: number;
  featureCount: number;
}
```

**Example Usage:**
```json
{
  "tool": "search_similar_projects",
  "parameters": {
    "techStack": ["react", "typescript", "node.js"],
    "framework": "next.js"
  }
}
```

---

### get_project_patterns

Extract common implementation patterns for the project type.

**Parameters:**
```typescript
{
  projectPath?: string;    // Project path
  patternType?: string;    // Specific pattern type to focus on
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    patterns: ImplementationPattern[];
    recommendations: PatternRecommendation[];
    commonIssues: string[];
    bestPractices: string[];
  }
}
```

**ImplementationPattern Object:**
```typescript
interface ImplementationPattern {
  name: string;
  description: string;
  applicability: string;
  steps: string[];
  codeExamples: CodeExample[];
  commonPitfalls: string[];
  benefits: string[];
  usageFrequency: number;
}
```

**Example Usage:**
```json
{
  "tool": "get_project_patterns",
  "parameters": {
    "projectPath": "/workspace/my-react-app",
    "patternType": "component-architecture"
  }
}
```

---

## Error Handling

All MCP tools return consistent error responses when operations fail:

```typescript
{
  success: false,
  error: {
    code: MCPErrorCode;
    message: string;
    details?: any;
  }
}
```

### Error Codes

- `AUTHENTICATION_FAILED` (4001): Invalid or expired authentication token
- `INVALID_PARAMETERS` (4002): Missing required parameters or invalid data format
- `TOOL_NOT_FOUND` (4004): Requested tool does not exist
- `REFBASE_API_ERROR` (5001): RefBase API returned an error
- `DATABASE_ERROR` (5002): Database operation failed
- `RATE_LIMIT_EXCEEDED` (4029): Too many requests, rate limit exceeded
- `INSUFFICIENT_PERMISSIONS` (4003): User lacks required permissions

### Common Error Scenarios

**Authentication Errors:**
```json
{
  "success": false,
  "error": {
    "code": 4001,
    "message": "Authentication failed",
    "details": "Token has expired. Please generate a new token."
  }
}
```

**Validation Errors:**
```json
{
  "success": false, 
  "error": {
    "code": 4002,
    "message": "Invalid parameters",
    "details": {
      "field": "title",
      "issue": "Title is required and must be at least 3 characters"
    }
  }
}
```

**API Errors:**
```json
{
  "success": false,
  "error": {
    "code": 5001,
    "message": "RefBase API error",
    "details": "The RefBase API is currently unavailable. Please try again later."
  }
}
```

---

## Rate Limits

To ensure fair usage and system stability, the RefBase MCP implements rate limiting:

- **Default Limit**: 100 requests per minute per user
- **Burst Limit**: 20 requests per 10 seconds per user
- **Search Operations**: 30 requests per minute per user
- **Write Operations**: 50 requests per minute per user

When rate limits are exceeded, the server returns an error with suggested retry timing:

```json
{
  "success": false,
  "error": {
    "code": 4029,
    "message": "Rate limit exceeded",
    "details": {
      "resetTime": "2024-01-15T10:35:00Z",
      "retryAfter": 60
    }
  }
}
```

---

## Best Practices

### Tool Usage Guidelines

1. **Batch Similar Operations**: When possible, use search tools to find existing data before creating new entries
2. **Provide Context**: Always include project context when available for better categorization
3. **Use Descriptive Titles**: Make titles searchable and descriptive
4. **Tag Consistently**: Use consistent tagging schemes for better searchability
5. **Handle Errors Gracefully**: Always check the `success` field and handle errors appropriately

### Performance Optimization

1. **Use Pagination**: For search operations, use appropriate `limit` and `offset` parameters
2. **Cache Results**: Cache search results when appropriate to reduce API calls
3. **Filter Early**: Use specific filters to reduce result set size
4. **Avoid Polling**: Don't poll for updates; use event-driven approaches when possible

### Security Considerations

1. **Secure Token Storage**: Store authentication tokens securely
2. **Validate Input**: Always validate user input before sending to tools
3. **Handle Sensitive Data**: Be careful with sensitive information in conversation content
4. **Monitor Usage**: Monitor tool usage for unusual patterns

---

This API documentation covers all available MCP tools in the RefBase MCP. For additional help, setup guides, and troubleshooting, refer to the other documentation files in this repository.