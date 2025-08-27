# RefBase MCP Server Design Document

## Overview

The RefBase MCP Server provides MCP (Model Context Protocol) tools that allow AI assistants in IDEs to interact with the RefBase webapp. Instead of automatically capturing conversations, it provides explicit tools that AI can call to save conversations, search for bugs/features, and retrieve project context from the RefBase knowledge base.

**Core Concept:**
- User adds RefBase MCP server to their IDE (Cursor, Claude Code, Kiro)
- AI can call MCP tools to interact with RefBase webapp
- Bidirectional flow: Save conversations AND search existing knowledge

**Architecture Principles:**
- **Tool-Based Interaction**: Explicit MCP tools for specific actions
- **Integration with Existing RefBase**: Leverages current webapp API
- **User-Controlled**: Users/AI decide what to save and search
- **Simple & Reliable**: Direct API calls, no complex monitoring
- **Authentication**: Secure user token-based access

**Integration Architecture:**
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ IDE + AI        │    │ RefBase MCP      │    │ RefBase Webapp   │
│ (Cursor/Claude) │◄──►│ Server           │◄──►│ API Endpoints    │
│                 │    │ (MCP Tools)      │    │                  │
└─────────────────┘    └──────────────────┘    └──────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌──────────────────┐
                       │ Authentication   │    │ Supabase         │
                       │ & User Context   │    │ Database         │
                       └──────────────────┘    └──────────────────┘
```

## MCP Tools Architecture

### Core MCP Tools

The RefBase MCP Server exposes the following tools to AI assistants:

#### 1. Conversation Management Tools
- **`save_conversation`** - Save current IDE conversation to RefBase
- **`search_conversations`** - Find similar past conversations
- **`get_conversation`** - Retrieve specific conversation by ID

#### 2. Bug Tracking Tools  
- **`save_bug`** - Log a new bug to RefBase bug tracker
- **`search_bugs`** - Find existing bugs by query/symptoms
- **`update_bug_status`** - Update bug status (open, in-progress, resolved)
- **`get_bug_details`** - Get detailed bug information

#### 3. Feature & Solution Tools
- **`save_feature`** - Store working feature/solution
- **`search_features`** - Find existing working solutions
- **`get_feature_implementation`** - Get implementation details

#### 4. Project Context Tools
- **`get_project_context`** - Get relevant info for current project
- **`search_similar_projects`** - Find projects with similar tech stack
- **`get_project_patterns`** - Extract common patterns from project

### MCP Tool Implementation Architecture

```typescript
interface RefBaseMCPTool {
  name: string;
  description: string;
  parameters: MCPToolParameters;
  handler: (params: any, context: UserContext) => Promise<MCPToolResult>;
}

interface UserContext {
  userId: string;
  accessToken: string;
  projectPath?: string;
  currentIDE: 'cursor' | 'claude' | 'kiro';
}

interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

### Tool Categories and Workflows

#### Conversation Workflow
```
User in IDE: "Save this conversation about login bug fix"
AI calls: save_conversation({
  title: "Login Bug Fix Discussion",
  messages: [...current_conversation],
  tags: ["login", "bug", "auth"],
  projectContext: { path: "/src/auth", language: "typescript" }
})
MCP Server → RefBase API → Supabase
Result: "Conversation saved with ID: conv_123"
```

#### Bug Search Workflow  
```
User: "Search for similar login issues we've solved before"
AI calls: search_bugs({
  query: "login authentication issues",
  status: ["resolved"],
  tags: ["auth", "login"]
})
MCP Server → RefBase API → Query Supabase
Result: [
  { id: "bug_456", title: "OAuth login fails", solution: "..." },
  { id: "bug_789", title: "Session timeout", solution: "..." }
]
```

#### Feature Discovery Workflow
```
User: "How did we implement user registration in other projects?"
AI calls: search_features({
  query: "user registration implementation",
  techStack: ["react", "typescript", "supabase"]
})
MCP Server → RefBase API → Search Features
Result: [
  { 
    project: "Project A", 
    implementation: "...", 
    codeExamples: [...],
    patterns: [...]
  }
]
```

## System Components

### 1. MCP Server Core

```typescript
interface MCPServer {
  // Tool registration and discovery
  registerTool(tool: RefBaseMCPTool): void;
  getTool(name: string): RefBaseMCPTool | null;
  listTools(): RefBaseMCPTool[];
  
  // Tool execution
  executeTool(toolName: string, params: any, context: UserContext): Promise<MCPToolResult>;
  
  // Server lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

### 2. RefBase API Client

```typescript
interface RefBaseAPIClient {
  // Authentication
  authenticate(token: string): Promise<User>;
  
  // Conversations
  saveConversation(conversation: ConversationData): Promise<string>;
  searchConversations(query: SearchQuery): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation>;
  
  // Bugs
  saveBug(bug: BugData): Promise<string>;
  searchBugs(query: BugSearchQuery): Promise<Bug[]>;
  updateBugStatus(id: string, status: BugStatus): Promise<void>;
  
  // Features
  saveFeature(feature: FeatureData): Promise<string>;
  searchFeatures(query: FeatureSearchQuery): Promise<Feature[]>;
  
  // Projects
  getProjectContext(projectPath: string): Promise<ProjectContext>;
  searchSimilarProjects(techStack: string[]): Promise<Project[]>;
}
```

### 3. Authentication Manager

```typescript
interface AuthenticationManager {
  validateToken(token: string): Promise<User>;
  extractUserContext(request: MCPRequest): Promise<UserContext>;
  handleAuthError(error: AuthError): MCPToolResult;
}
```

### 4. Context Extractor

```typescript
interface ContextExtractor {
  extractProjectContext(filePath?: string): Promise<ProjectContext>;
  extractConversationContext(messages: Message[]): ConversationMetadata;
  extractTechStack(projectPath: string): Promise<string[]>;
}

interface ProjectContext {
  projectPath: string;
  projectName: string;
  techStack: string[];
  mainLanguage: string;
  framework?: string;
  gitInfo?: {
    repository: string;
    branch: string;
    commit: string;
  };
}
```

## Data Models

### Conversation Data Model
```typescript
interface ConversationData {
  title: string;
  messages: ConversationMessage[];
  tags: string[];
  projectContext: ProjectContext;
  metadata: {
    ideType: 'cursor' | 'claude' | 'kiro';
    duration?: number;
    codeBlockCount: number;
    filesReferenced: string[];
  };
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
  fileReferences?: FileReference[];
}
```

### Bug Data Model
```typescript
interface BugData {
  title: string;
  description: string;
  symptoms: string[];
  reproduction: string;
  solution?: string;
  status: 'open' | 'in-progress' | 'resolved' | 'wont-fix';
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  projectContext: ProjectContext;
  relatedConversations?: string[];
}
```

### Feature Data Model
```typescript
interface FeatureData {
  title: string;
  description: string;
  implementation: string;
  codeExamples: CodeExample[];
  patterns: ImplementationPattern[];
  dependencies: string[];
  techStack: string[];
  projectContext: ProjectContext;
  successMetrics?: SuccessMetrics;
}

interface CodeExample {
  language: string;
  code: string;
  filename?: string;
  description: string;
}

interface ImplementationPattern {
  name: string;
  description: string;
  steps: string[];
  commonIssues: string[];
  bestPractices: string[];
}
```

## MCP Protocol Integration

### Tool Definition Format
```typescript
const saveConversationTool: MCPToolDefinition = {
  name: "save_conversation",
  description: "Save current IDE conversation to RefBase knowledge base",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Conversation title" },
      messages: { 
        type: "array", 
        items: { $ref: "#/definitions/ConversationMessage" }
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Tags for categorization"
      },
      projectPath: {
        type: "string",
        description: "Current project path for context"
      }
    },
    required: ["title", "messages"]
  }
};
```

### Error Handling
```typescript
interface MCPErrorResponse {
  error: {
    code: number;
    message: string;
    details?: any;
  };
}

enum MCPErrorCode {
  AUTHENTICATION_FAILED = 4001,
  INVALID_PARAMETERS = 4002,
  REFBASE_API_ERROR = 5001,
  DATABASE_ERROR = 5002,
  TOOL_NOT_FOUND = 4004
}
```

## Security and Authentication

### Authentication Flow
1. User logs into RefBase webapp
2. User generates MCP access token in webapp settings  
3. User configures MCP server with token in IDE
4. MCP server validates token with RefBase API for each tool call
5. User context (ID, permissions) used for all operations

### Security Measures
- All API calls use HTTPS/TLS encryption
- Access tokens have expiration and refresh mechanism
- Rate limiting on tool calls per user
- Input validation and sanitization
- Audit logging of all tool usage

## Configuration

### Server Configuration
```typescript
interface MCPServerConfig {
  server: {
    port: number;
    host: string;
  };
  refbase: {
    apiUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  auth: {
    tokenValidation: {
      endpoint: string;
      cacheTTL: number;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}
```

### Environment Variables
```bash
# Server Configuration
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost

# RefBase Integration
REFBASE_API_URL=https://your-refbase.com/api
REFBASE_API_TIMEOUT=30000

# Authentication
REFBASE_AUTH_ENDPOINT=https://your-refbase.com/api/auth/validate

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/mcp-server.log
```

## Deployment Architecture

### Development Setup
```bash
# Install RefBase MCP Server
npm install -g refbase-mcp-server

# Configure with RefBase API
refbase-mcp config --api-url https://your-refbase.com/api

# Start server
refbase-mcp start

# Add to IDE (example for Cursor)
# Add to .cursorrules or MCP config:
{
  "mcp": {
    "servers": {
      "refbase": {
        "command": "refbase-mcp",
        "args": ["--config", "./refbase-mcp.config.json"]
      }
    }
  }
}
```

### Production Deployment
- Docker container with health checks
- Environment-based configuration
- Integration with existing RefBase infrastructure
- Monitoring and alerting
- Auto-scaling based on tool call volume

This design provides a focused, practical approach to integrating MCP tools with your existing RefBase webapp, enabling AI assistants to seamlessly interact with your knowledge base.