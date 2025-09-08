# Developer Guide for RefBase MCP

This guide provides comprehensive information for developers who want to extend, customize, or contribute to the RefBase MCP.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Creating Custom MCP Tools](#creating-custom-mcp-tools)
4. [Extending Existing Tools](#extending-existing-tools)
5. [Adding New API Clients](#adding-new-api-clients)
6. [Custom Authentication](#custom-authentication)
7. [Plugin System](#plugin-system)
8. [Testing Framework](#testing-framework)
9. [Performance Optimization](#performance-optimization)
10. [Contributing Guidelines](#contributing-guidelines)

---

## Architecture Overview

### Core Components

```
src/
├── server/          # MCP Server implementation
├── tools/           # MCP tool implementations
├── api/             # API client integrations
├── auth/            # Authentication middleware
├── utils/           # Utility functions and helpers
├── types/           # TypeScript type definitions
├── config/          # Configuration management
└── security/        # Security features
```

### Key Interfaces

```typescript
// Base MCP Tool Interface
interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler(params: any, context: UserContext): Promise<MCPToolResult>;
}

// User Context for all tool calls
interface UserContext {
  userId: string;
  accessToken: string;
  projectPath?: string;
  ide: 'cursor' | 'claude' | 'kiro';
  permissions: string[];
}

// Tool Result Interface  
interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: MCPError;
  message?: string;
}
```

### Plugin Architecture

The RefBase MCP uses a modular plugin architecture:

```typescript
interface Plugin {
  name: string;
  version: string;
  initialize(server: MCPServer): Promise<void>;
  tools?: MCPTool[];
  middleware?: Middleware[];
  apiClients?: APIClient[];
}
```

---

## Development Setup

### Prerequisites

- Node.js 18+
- TypeScript 4.5+
- Git

### Local Development

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd refbase-mcp
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your settings
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   npm run test:watch
   ```

### Project Structure

```
src/
├── index.ts                 # Main entry point
├── server/
│   └── MCPServer.ts        # Core MCP server implementation
├── tools/
│   ├── BaseTool.ts         # Abstract base tool class
│   ├── conversation/       # Conversation management tools
│   ├── bug/               # Bug tracking tools
│   ├── feature/           # Feature management tools
│   └── project/           # Project context tools
├── api/
│   └── RefBaseAPIClient.ts # RefBase API integration
├── auth/
│   └── AuthMiddleware.ts   # Authentication handling
├── utils/                  # Utility functions
├── types/
│   └── index.ts           # Type definitions
└── config/
    └── config.ts          # Configuration management
```

### Development Workflow

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code  
npm run format

# Type check
npm run type-check
```

---

## Creating Custom MCP Tools

### 1. Basic Tool Structure

Create a new tool by extending the `BaseTool` class:

```typescript
// src/tools/custom/MyCustomTool.ts
import { BaseTool } from '../BaseTool';
import { UserContext, MCPToolResult } from '../../types';

export class MyCustomTool extends BaseTool {
  name = 'my_custom_tool';
  
  description = 'Description of what this tool does';

  inputSchema = {
    type: 'object',
    properties: {
      requiredParam: {
        type: 'string',
        description: 'Required parameter description'
      },
      optionalParam: {
        type: 'number', 
        description: 'Optional parameter description'
      }
    },
    required: ['requiredParam']
  };

  async handler(
    params: { requiredParam: string; optionalParam?: number },
    context: UserContext
  ): Promise<MCPToolResult> {
    try {
      // Validate input
      this.validateInput(params);

      // Your tool logic here
      const result = await this.performCustomOperation(
        params.requiredParam,
        params.optionalParam,
        context
      );

      return {
        success: true,
        data: result,
        message: 'Custom operation completed successfully'
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async performCustomOperation(
    required: string,
    optional?: number,
    context: UserContext
  ) {
    // Implement your custom logic
    return {
      processed: required,
      value: optional,
      userId: context.userId
    };
  }
}
```

### 2. Advanced Tool Features

#### Input Validation

```typescript
export class AdvancedTool extends BaseTool {
  inputSchema = {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Valid email address'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Priority level'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 10,
        description: 'Tag list'
      }
    },
    required: ['email']
  };

  private validateCustomRules(params: any): void {
    // Custom validation logic
    if (params.tags?.some((tag: string) => tag.length > 50)) {
      throw new ValidationError('Tags must be under 50 characters');
    }
    
    if (params.priority === 'critical' && !params.justification) {
      throw new ValidationError('Critical priority requires justification');
    }
  }
}
```

#### Async Operations and Streaming

```typescript
export class StreamingTool extends BaseTool {
  async handler(params: any, context: UserContext): Promise<MCPToolResult> {
    // For long-running operations
    const operationId = this.generateOperationId();
    
    // Start async operation
    this.performLongOperation(operationId, params, context);
    
    return {
      success: true,
      data: {
        operationId,
        status: 'started',
        estimatedTime: 30000
      },
      message: 'Long operation started'
    };
  }

  private async performLongOperation(
    operationId: string,
    params: any,
    context: UserContext
  ) {
    try {
      // Emit progress updates
      this.emit('progress', { operationId, progress: 0 });
      
      // Process in chunks
      for (let i = 0; i < 10; i++) {
        await this.processChunk(i, params, context);
        this.emit('progress', { operationId, progress: (i + 1) * 10 });
      }
      
      this.emit('complete', { operationId, result: 'success' });
    } catch (error) {
      this.emit('error', { operationId, error: error.message });
    }
  }
}
```

#### Integration with External Services

```typescript
export class ExternalServiceTool extends BaseTool {
  private externalClient: ExternalAPIClient;

  constructor() {
    super();
    this.externalClient = new ExternalAPIClient({
      baseUrl: process.env.EXTERNAL_API_URL,
      apiKey: process.env.EXTERNAL_API_KEY
    });
  }

  async handler(params: any, context: UserContext): Promise<MCPToolResult> {
    try {
      // Rate limiting check
      await this.checkRateLimit(context.userId);

      // Call external service
      const externalResult = await this.externalClient.performAction({
        ...params,
        userId: context.userId
      });

      // Transform result for RefBase
      const refbaseData = this.transformForRefBase(externalResult);

      // Save to RefBase
      const savedId = await this.apiClient.saveData(refbaseData, context);

      return {
        success: true,
        data: {
          externalId: externalResult.id,
          refbaseId: savedId,
          summary: externalResult.summary
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

### 3. Tool Registration

Register your custom tool with the MCP server:

```typescript
// src/server/MCPServer.ts
import { MyCustomTool } from '../tools/custom/MyCustomTool';

export class MCPServer {
  private registerTools(): void {
    // Existing tools...
    
    // Register custom tool
    this.registerTool(new MyCustomTool());
  }
}
```

Or use the plugin system:

```typescript
// src/plugins/MyPlugin.ts
import { Plugin } from '../types';
import { MyCustomTool } from '../tools/custom/MyCustomTool';

export const MyPlugin: Plugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  
  async initialize(server: MCPServer) {
    console.log('Initializing My Plugin');
  },
  
  tools: [
    new MyCustomTool()
  ]
};
```

---

## Extending Existing Tools

### 1. Tool Inheritance

Extend existing tools to add new functionality:

```typescript
// src/tools/conversation/ExtendedSaveConversationTool.ts
import { SaveConversationTool } from './SaveConversationTool';
import { UserContext, MCPToolResult } from '../../types';

export class ExtendedSaveConversationTool extends SaveConversationTool {
  description = 'Save conversation with advanced features like auto-tagging and sentiment analysis';

  async handler(params: any, context: UserContext): Promise<MCPToolResult> {
    // Pre-process conversation
    params = await this.preprocessConversation(params, context);
    
    // Call parent handler
    const result = await super.handler(params, context);
    
    // Post-process result
    if (result.success) {
      await this.performPostProcessing(result.data, context);
    }
    
    return result;
  }

  private async preprocessConversation(params: any, context: UserContext) {
    // Auto-generate tags based on content
    const autoTags = await this.generateAutoTags(params.messages);
    params.tags = [...(params.tags || []), ...autoTags];

    // Analyze sentiment
    const sentiment = await this.analyzeSentiment(params.messages);
    params.metadata = {
      ...params.metadata,
      sentiment: sentiment.overall,
      confidence: sentiment.confidence
    };

    return params;
  }

  private async generateAutoTags(messages: any[]): Promise<string[]> {
    // Implement auto-tagging logic
    const content = messages.map(m => m.content).join(' ');
    
    // Use NLP or keyword extraction
    return this.extractKeywords(content);
  }

  private async analyzeSentiment(messages: any[]) {
    // Implement sentiment analysis
    return { overall: 'positive', confidence: 0.85 };
  }
}
```

### 2. Tool Composition

Compose multiple tools for complex workflows:

```typescript
export class WorkflowTool extends BaseTool {
  name = 'execute_workflow';
  description = 'Execute a complex workflow using multiple tools';

  constructor(
    private conversationTool: SaveConversationTool,
    private bugTool: SaveBugTool,
    private featureTool: SaveFeatureTool
  ) {
    super();
  }

  async handler(params: any, context: UserContext): Promise<MCPToolResult> {
    const results = [];

    try {
      // Step 1: Save conversation
      if (params.conversation) {
        const convResult = await this.conversationTool.handler(
          params.conversation,
          context
        );
        results.push({ step: 'conversation', result: convResult });
      }

      // Step 2: Extract and save bugs
      if (params.extractBugs) {
        const bugs = await this.extractBugsFromConversation(params.conversation);
        for (const bug of bugs) {
          const bugResult = await this.bugTool.handler(bug, context);
          results.push({ step: 'bug', result: bugResult });
        }
      }

      // Step 3: Extract and save features
      if (params.extractFeatures) {
        const features = await this.extractFeaturesFromConversation(params.conversation);
        for (const feature of features) {
          const featureResult = await this.featureTool.handler(feature, context);
          results.push({ step: 'feature', result: featureResult });
        }
      }

      return {
        success: true,
        data: {
          workflowId: this.generateWorkflowId(),
          steps: results.length,
          results: results
        },
        message: `Workflow completed with ${results.length} steps`
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

---

## Adding New API Clients

### 1. API Client Interface

Create custom API clients for different services:

```typescript
// src/api/BaseAPIClient.ts
export abstract class BaseAPIClient {
  protected baseUrl: string;
  protected apiKey: string;
  protected timeout: number;

  constructor(config: APIClientConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  abstract authenticate(token: string): Promise<boolean>;
  abstract get(endpoint: string, params?: any): Promise<any>;
  abstract post(endpoint: string, data: any): Promise<any>;
  abstract put(endpoint: string, data: any): Promise<any>;
  abstract delete(endpoint: string): Promise<any>;
}
```

### 2. Concrete Implementation

```typescript
// src/api/GitHubAPIClient.ts
import { BaseAPIClient } from './BaseAPIClient';
import axios, { AxiosInstance } from 'axios';

export class GitHubAPIClient extends BaseAPIClient {
  private client: AxiosInstance;

  constructor(config: GitHubAPIConfig) {
    super(config);
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `token ${this.apiKey}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    this.setupInterceptors();
  }

  async authenticate(token: string): Promise<boolean> {
    try {
      const response = await this.client.get('/user');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async get(endpoint: string, params?: any): Promise<any> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  async post(endpoint: string, data: any): Promise<any> {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  // GitHub-specific methods
  async createIssue(repo: string, issue: GitHubIssue): Promise<GitHubIssueResponse> {
    return this.post(`/repos/${repo}/issues`, issue);
  }

  async searchIssues(query: string): Promise<GitHubSearchResponse> {
    return this.get('/search/issues', { q: query });
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`GitHub API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 403) {
          throw new APIError('GitHub API rate limit exceeded', 429);
        }
        throw error;
      }
    );
  }
}
```

### 3. API Client Registry

```typescript
// src/api/APIClientRegistry.ts
export class APIClientRegistry {
  private clients: Map<string, BaseAPIClient> = new Map();

  register(name: string, client: BaseAPIClient): void {
    this.clients.set(name, client);
  }

  get(name: string): BaseAPIClient | undefined {
    return this.clients.get(name);
  }

  async initializeAll(): Promise<void> {
    for (const [name, client] of this.clients) {
      try {
        await client.authenticate(process.env[`${name.toUpperCase()}_TOKEN`] || '');
        console.log(`${name} API client initialized`);
      } catch (error) {
        console.warn(`Failed to initialize ${name} API client:`, error);
      }
    }
  }
}
```

---

## Custom Authentication

### 1. Authentication Provider Interface

```typescript
// src/auth/providers/AuthProvider.ts
export interface AuthProvider {
  name: string;
  validateToken(token: string): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<TokenPair>;
  getUserContext(token: string): Promise<UserContext>;
}

export interface AuthResult {
  valid: boolean;
  user?: User;
  permissions?: string[];
  expiresAt?: Date;
}
```

### 2. Custom Provider Implementation

```typescript
// src/auth/providers/CustomAuthProvider.ts
export class CustomAuthProvider implements AuthProvider {
  name = 'custom';

  constructor(
    private config: CustomAuthConfig,
    private httpClient: AxiosInstance
  ) {}

  async validateToken(token: string): Promise<AuthResult> {
    try {
      const response = await this.httpClient.post('/auth/validate', {
        token,
        service: 'mcp-server'
      });

      return {
        valid: true,
        user: response.data.user,
        permissions: response.data.permissions,
        expiresAt: new Date(response.data.expiresAt)
      };
    } catch (error) {
      return { valid: false };
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const response = await this.httpClient.post('/auth/refresh', {
      refreshToken
    });

    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      expiresIn: response.data.expiresIn
    };
  }

  async getUserContext(token: string): Promise<UserContext> {
    const authResult = await this.validateToken(token);
    
    if (!authResult.valid || !authResult.user) {
      throw new AuthenticationError('Invalid token');
    }

    return {
      userId: authResult.user.id,
      accessToken: token,
      permissions: authResult.permissions || [],
      ide: 'unknown' // Will be determined by MCP server
    };
  }
}
```

### 3. Multi-Provider Authentication

```typescript
// src/auth/AuthManager.ts
export class AuthManager {
  private providers: Map<string, AuthProvider> = new Map();
  private cache: Map<string, AuthResult> = new Map();

  registerProvider(provider: AuthProvider): void {
    this.providers.set(provider.name, provider);
  }

  async authenticate(token: string, providerName?: string): Promise<UserContext> {
    // Try specific provider first
    if (providerName && this.providers.has(providerName)) {
      return this.authenticateWithProvider(token, providerName);
    }

    // Try all providers
    for (const [name, provider] of this.providers) {
      try {
        return await provider.getUserContext(token);
      } catch (error) {
        console.debug(`Authentication failed with ${name}:`, error.message);
      }
    }

    throw new AuthenticationError('Authentication failed with all providers');
  }

  private async authenticateWithProvider(token: string, providerName: string): Promise<UserContext> {
    const provider = this.providers.get(providerName)!;
    return provider.getUserContext(token);
  }
}
```

---

## Plugin System

### 1. Plugin Interface

```typescript
// src/plugins/Plugin.ts
export interface Plugin {
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
  
  initialize(server: MCPServer): Promise<void>;
  shutdown?(): Promise<void>;
  
  tools?: MCPTool[];
  middleware?: Middleware[];
  apiClients?: BaseAPIClient[];
  authProviders?: AuthProvider[];
  
  config?: PluginConfig;
}

export interface PluginConfig {
  required?: string[];
  optional?: Record<string, any>;
  schema?: JSONSchema;
}
```

### 2. Plugin Manager

```typescript
// src/plugins/PluginManager.ts
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private server: MCPServer;

  constructor(server: MCPServer) {
    this.server = server;
  }

  async loadPlugin(plugin: Plugin): Promise<void> {
    // Validate plugin
    this.validatePlugin(plugin);

    // Check dependencies
    await this.checkDependencies(plugin);

    // Initialize plugin
    await plugin.initialize(this.server);

    // Register plugin components
    if (plugin.tools) {
      plugin.tools.forEach(tool => this.server.registerTool(tool));
    }

    if (plugin.middleware) {
      plugin.middleware.forEach(mw => this.server.use(mw));
    }

    if (plugin.apiClients) {
      plugin.apiClients.forEach(client => 
        this.server.registerAPIClient(client.name, client)
      );
    }

    this.plugins.set(plugin.name, plugin);
    console.log(`Plugin ${plugin.name} v${plugin.version} loaded`);
  }

  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    if (plugin.shutdown) {
      await plugin.shutdown();
    }

    this.plugins.delete(name);
    console.log(`Plugin ${name} unloaded`);
  }

  private validatePlugin(plugin: Plugin): void {
    if (!plugin.name || !plugin.version) {
      throw new Error('Plugin must have name and version');
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already loaded`);
    }
  }
}
```

### 3. Example Plugin

```typescript
// src/plugins/SlackIntegrationPlugin.ts
export const SlackIntegrationPlugin: Plugin = {
  name: 'slack-integration',
  version: '1.0.0',
  description: 'Integrate with Slack for notifications and commands',
  dependencies: ['@slack/web-api'],

  config: {
    required: ['SLACK_BOT_TOKEN'],
    optional: {
      defaultChannel: '#general',
      enableCommands: true
    }
  },

  async initialize(server: MCPServer): Promise<void> {
    // Initialize Slack client
    const slackClient = new SlackAPIClient({
      token: process.env.SLACK_BOT_TOKEN!,
      baseUrl: 'https://slack.com/api'
    });

    // Test connection
    const auth = await slackClient.auth.test();
    console.log(`Connected to Slack as ${auth.user}`);
  },

  tools: [
    new SendSlackMessageTool(),
    new CreateSlackChannelTool(),
    new GetSlackThreadTool()
  ],

  apiClients: [
    new SlackAPIClient({
      token: process.env.SLACK_BOT_TOKEN!
    })
  ]
};
```

---

## Testing Framework

### 1. Tool Testing

```typescript
// tests/tools/MyCustomTool.test.ts
import { MyCustomTool } from '../../src/tools/custom/MyCustomTool';
import { createMockUserContext } from '../helpers/mockContext';

describe('MyCustomTool', () => {
  let tool: MyCustomTool;
  let mockContext: UserContext;

  beforeEach(() => {
    tool = new MyCustomTool();
    mockContext = createMockUserContext();
  });

  it('should handle valid input correctly', async () => {
    const params = {
      requiredParam: 'test-value',
      optionalParam: 42
    };

    const result = await tool.handler(params, mockContext);

    expect(result.success).toBe(true);
    expect(result.data.processed).toBe('test-value');
    expect(result.data.value).toBe(42);
  });

  it('should validate required parameters', async () => {
    const params = {
      optionalParam: 42
      // missing requiredParam
    };

    const result = await tool.handler(params, mockContext);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(4002); // INVALID_PARAMETERS
  });

  it('should handle API errors gracefully', async () => {
    // Mock API client to throw error
    jest.spyOn(tool['apiClient'], 'post').mockRejectedValue(
      new Error('API Error')
    );

    const params = { requiredParam: 'test' };
    const result = await tool.handler(params, mockContext);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('API Error');
  });
});
```

### 2. Integration Testing

```typescript
// tests/integration/CustomWorkflow.test.ts
import { MCPServer } from '../../src/server/MCPServer';
import { TestRefBaseAPI } from '../helpers/TestRefBaseAPI';

describe('Custom Workflow Integration', () => {
  let server: MCPServer;
  let mockAPI: TestRefBaseAPI;

  beforeAll(async () => {
    mockAPI = new TestRefBaseAPI();
    await mockAPI.start();

    server = new MCPServer({
      refbase: {
        apiUrl: mockAPI.getUrl()
      }
    });
    
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
    await mockAPI.stop();
  });

  it('should execute complete workflow', async () => {
    // Setup test data
    mockAPI.setUserData('test-user', {
      conversations: [],
      bugs: [],
      features: []
    });

    // Execute workflow
    const result = await server.executeTool('execute_workflow', {
      conversation: {
        title: 'Test Conversation',
        messages: [
          { role: 'user', content: 'I found a bug' },
          { role: 'assistant', content: 'Let me help you log it' }
        ]
      },
      extractBugs: true,
      extractFeatures: false
    }, createMockUserContext('test-user'));

    // Verify results
    expect(result.success).toBe(true);
    expect(result.data.steps).toBeGreaterThan(0);

    // Verify data was saved
    const userData = mockAPI.getUserData('test-user');
    expect(userData.conversations).toHaveLength(1);
    expect(userData.bugs).toHaveLength(1);
  });
});
```

### 3. Test Utilities

```typescript
// tests/helpers/mockContext.ts
export function createMockUserContext(
  overrides: Partial<UserContext> = {}
): UserContext {
  return {
    userId: 'test-user-123',
    accessToken: 'mock-token',
    projectPath: '/mock/project',
    ide: 'cursor',
    permissions: ['read', 'write'],
    ...overrides
  };
}

// tests/helpers/TestRefBaseAPI.ts
export class TestRefBaseAPI {
  private server: http.Server;
  private port: number;
  private userData: Map<string, any> = new Map();

  async start(): Promise<void> {
    const app = express();
    app.use(express.json());

    // Mock endpoints
    app.post('/api/conversations', this.saveConversation.bind(this));
    app.get('/api/conversations/search', this.searchConversations.bind(this));
    app.post('/api/bugs', this.saveBug.bind(this));
    
    this.server = app.listen(0);
    this.port = (this.server.address() as AddressInfo).port;
  }

  getUrl(): string {
    return `http://localhost:${this.port}/api`;
  }

  setUserData(userId: string, data: any): void {
    this.userData.set(userId, data);
  }

  private saveConversation(req: Request, res: Response): void {
    const userId = this.extractUserId(req);
    const userData = this.userData.get(userId) || { conversations: [] };
    
    const conversation = {
      id: `conv_${Date.now()}`,
      ...req.body,
      createdAt: new Date()
    };
    
    userData.conversations.push(conversation);
    this.userData.set(userId, userData);
    
    res.json({ id: conversation.id });
  }
}
```

---

## Performance Optimization

### 1. Caching Strategy

```typescript
// src/utils/cache/AdvancedCache.ts
export class AdvancedCache {
  private memory: LRUCache<string, any>;
  private redis?: RedisClient;
  
  constructor(config: CacheConfig) {
    this.memory = new LRUCache({
      max: config.maxMemoryItems,
      ttl: config.defaultTTL
    });
    
    if (config.redis) {
      this.redis = new RedisClient(config.redis);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory first
    const memoryValue = this.memory.get(key);
    if (memoryValue !== undefined) {
      return memoryValue;
    }

    // Try Redis if available
    if (this.redis) {
      const redisValue = await this.redis.get(key);
      if (redisValue) {
        const parsed = JSON.parse(redisValue);
        // Backfill memory cache
        this.memory.set(key, parsed);
        return parsed;
      }
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Set in memory
    this.memory.set(key, value, { ttl });

    // Set in Redis if available
    if (this.redis) {
      await this.redis.setex(key, ttl || 300, JSON.stringify(value));
    }
  }

  // Smart cache warming
  async warmCache(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!(await this.has(key))) {
        const value = await fetcher(key);
        await this.set(key, value);
      }
    });

    await Promise.all(promises);
  }
}
```

### 2. Connection Pooling

```typescript
// src/utils/http/ConnectionPool.ts
export class ConnectionPool {
  private pools: Map<string, http.Agent> = new Map();

  getAgent(baseUrl: string): http.Agent {
    if (!this.pools.has(baseUrl)) {
      const agent = new http.Agent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 60000,
        freeSocketTimeout: 30000
      });
      
      this.pools.set(baseUrl, agent);
    }
    
    return this.pools.get(baseUrl)!;
  }

  // Monitor pool health
  getPoolStats(): Map<string, any> {
    const stats = new Map();
    
    for (const [url, agent] of this.pools) {
      stats.set(url, {
        freeSockets: Object.keys(agent.freeSockets).length,
        sockets: Object.keys(agent.sockets).length,
        requests: Object.keys(agent.requests).length
      });
    }
    
    return stats;
  }
}
```

### 3. Background Processing

```typescript
// src/utils/queue/BackgroundProcessor.ts
export class BackgroundProcessor {
  private queue: Queue<BackgroundTask>;
  private workers: Worker[] = [];

  constructor(config: ProcessorConfig) {
    this.queue = new Queue('background-tasks', {
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: 'exponential'
      }
    });

    // Start workers
    for (let i = 0; i < config.concurrency; i++) {
      this.startWorker();
    }
  }

  async enqueue(task: BackgroundTask): Promise<void> {
    await this.queue.add(task.type, task.data, {
      priority: task.priority || 0,
      delay: task.delay || 0
    });
  }

  private startWorker(): void {
    const worker = new Worker(this.queue.name, async (job) => {
      const processor = this.getProcessor(job.name);
      return processor.process(job.data);
    });

    this.workers.push(worker);
  }

  private getProcessor(taskType: string): TaskProcessor {
    // Return appropriate processor for task type
    switch (taskType) {
      case 'index-conversation':
        return new ConversationIndexProcessor();
      case 'analyze-sentiment':
        return new SentimentAnalysisProcessor();
      case 'generate-summary':
        return new SummaryGenerationProcessor();
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }
}
```

---

## Contributing Guidelines

### 1. Development Process

1. **Fork and clone** the repository
2. **Create feature branch**: `git checkout -b feature/my-feature`
3. **Make changes** with tests
4. **Run quality checks**: `npm run lint && npm test`
5. **Commit with message**: Follow conventional commits
6. **Push and create PR**: Include description and tests

### 2. Code Standards

**TypeScript Guidelines:**
```typescript
// Use strict typing
interface StrictInterface {
  requiredField: string;
  optionalField?: number;
}

// Prefer explicit return types
function processData(input: InputData): Promise<ProcessedData> {
  return this.processor.process(input);
}

// Use proper error handling
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed:', error);
  return { success: false, error: this.formatError(error) };
}
```

**Testing Requirements:**
- Unit tests for all new functions
- Integration tests for new features
- Minimum 90% code coverage
- Mock external dependencies

### 3. Documentation

**Code Documentation:**
```typescript
/**
 * Processes conversation data and extracts insights
 * @param conversation - The conversation to process
 * @param options - Processing options
 * @returns Promise resolving to processed insights
 * @throws {ValidationError} When conversation data is invalid
 * @example
 * ```typescript
 * const insights = await processConversation(conversation, {
 *   extractKeywords: true,
 *   analyzeSentiment: true
 * });
 * ```
 */
async function processConversation(
  conversation: Conversation,
  options: ProcessingOptions = {}
): Promise<ConversationInsights> {
  // Implementation
}
```

**README Updates:**
- Update API documentation for new tools
- Add configuration examples
- Include troubleshooting for new features
- Update installation instructions if needed

### 4. Release Process

1. **Version bump**: Follow semantic versioning
2. **Update CHANGELOG.md**: Document all changes
3. **Tag release**: `git tag v1.2.3`
4. **Build and test**: Ensure all tests pass
5. **Publish**: `npm publish` (for maintainers)

### 5. Issue Templates

**Bug Report Template:**
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. macOS 12.1]
- Node.js: [e.g. 18.12.0]
- RefBase MCP: [e.g. 1.2.3]
- IDE: [e.g. Cursor 0.2.1]

## Logs
```
Paste relevant logs here
```

**Feature Request Template:**
```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this work?

## Alternatives Considered
What other solutions were considered?

## Additional Context
Any other relevant information
```

This developer guide provides comprehensive information for extending and contributing to the RefBase MCP. Follow these patterns and guidelines to ensure consistent, maintainable, and well-tested code.