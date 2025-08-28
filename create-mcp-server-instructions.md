# RefBase MCP Server Setup Instructions

## What You Need to Create

Your RefBase API is deployed and working! Now you need to create an MCP server that AI assistants can use to interact with your API.

## Option 1: Standalone MCP Server Package (Recommended)

### 1. Create New Project Structure
```
refbase-mcp-server/
├── package.json
├── src/
│   ├── index.ts          # Main MCP server
│   ├── tools.ts          # MCP tool definitions
│   └── api-client.ts     # RefBase API client
└── README.md
```

### 2. MCP Server Implementation

#### package.json
```json
{
  "name": "refbase-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "refbase-mcp-server": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.1.0",
    "node-fetch": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

#### src/index.ts (Main MCP Server)
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { RefBaseClient } from './api-client.js';
import { REFBASE_TOOLS } from './tools.js';

const server = new Server({
  name: 'refbase-mcp-server',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Initialize RefBase API client
const refbaseClient = new RefBaseClient(
  process.env.REFBASE_API_URL || 'https://your-site.netlify.app',
  process.env.REFBASE_USER_TOKEN || ''
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: REFBASE_TOOLS,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'save_conversation':
      return await refbaseClient.saveConversation(args);
    
    case 'search_conversations':
      return await refbaseClient.searchConversations(args);
    
    case 'save_bug':
      return await refbaseClient.saveBug(args);
    
    case 'search_bugs':
      return await refbaseClient.searchBugs(args);
    
    case 'save_document':
      return await refbaseClient.saveDocument(args);
    
    case 'search_documents':
      return await refbaseClient.searchDocuments(args);
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('RefBase MCP server running on stdio');
}

main().catch(console.error);
```

### 3. Claude Desktop Configuration

Once your MCP server is built and published (or available locally), users would add this to their Claude Desktop config:

```json
{
  "mcpServers": {
    "refbase": {
      "command": "npx",
      "args": ["refbase-mcp-server"],
      "env": {
        "REFBASE_API_URL": "https://your-refbase-site.netlify.app",
        "REFBASE_USER_TOKEN": "user-supabase-jwt-token"
      },
      "disabled": false,
      "autoApprove": ["save_conversation", "save_bug", "save_document"]
    }
  }
}
```

## Option 2: Direct Configuration (Simpler)

If you want to avoid creating a separate package, you could create a simple Node.js script:

### claude_desktop_config.json
```json
{
  "mcpServers": {
    "refbase": {
      "command": "node",
      "args": ["/path/to/your/refbase-mcp-bridge.js"],
      "env": {
        "REFBASE_API_URL": "https://your-refbase-site.netlify.app",
        "REFBASE_USER_TOKEN": "user-supabase-jwt-token"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Next Steps

1. **Choose Option 1** (recommended) - Create proper MCP server package
2. **Get your Netlify URL** - What's your deployed RefBase site URL?
3. **Get user tokens** - Users will need their Supabase JWT tokens
4. **Test locally** - Verify MCP server works before publishing
5. **Publish to npm** - Make it easy for others to install

Would you like me to help you create the full MCP server implementation?