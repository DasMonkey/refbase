# IDE Setup Guide for RefBase MCP

This guide provides step-by-step instructions for setting up the RefBase MCP with different AI-powered IDEs.

## Prerequisites

Before setting up with any IDE, ensure you have:

1. **RefBase MCP installed:**
   ```bash
   npm install -g refbase-mcp
   ```

2. **RefBase account and API token:**
   - Log into your RefBase webapp
   - Navigate to Settings → API Tokens
   - Generate a new MCP token
   - Copy the token for use in configuration

3. **Node.js 18+ installed** on your system

---

## Cursor IDE Setup

Cursor provides excellent MCP support with easy configuration options.

### Method 1: Using Cursor's MCP Settings (Recommended)

1. **Open Cursor IDE**

2. **Access MCP Settings:**
   - Press `Cmd/Ctrl + Shift + P` to open command palette
   - Type "MCP" and select "Configure MCP Servers"
   - Or go to: Settings → Extensions → MCP Servers

3. **Add RefBase MCP:**
   ```json
   {
     "mcpServers": {
       "refbase": {
         "command": "refbase-mcp",
         "args": ["start"],
         "env": {
           "REFBASE_TOKEN": "your-token-here",
           "REFBASE_API_URL": "https://refbase.dev/api"
         }
       }
     }
   }
   ```

4. **Restart Cursor** to apply the configuration

### Method 2: Using .cursorrules File

1. **Create or edit `.cursorrules` in your project root:**
   ```json
   {
     "mcp": {
       "servers": {
         "refbase": {
           "command": "refbase-mcp",
           "args": ["start"],
           "env": {
             "REFBASE_TOKEN": "your-token-here",
             "REFBASE_API_URL": "https://refbase.dev/api"
           }
         }
       }
     },
     "instructions": [
       "You have access to RefBase MCP tools for saving conversations, managing bugs, and storing solutions.",
       "Use save_conversation when discussing important topics that should be preserved.",
       "Use search_bugs and search_features to find existing solutions before creating new ones.",
       "Always provide context when using RefBase tools."
     ]
   }
   ```

2. **Reload window** (Cmd/Ctrl + R) or restart Cursor

### Method 3: Global Configuration

1. **Create global Cursor config file:**
   - **macOS:** `~/Library/Application Support/Cursor/User/settings.json`
   - **Windows:** `%APPDATA%\Cursor\User\settings.json`
   - **Linux:** `~/.config/Cursor/User/settings.json`

2. **Add MCP configuration:**
   ```json
   {
     "mcp.servers": {
       "refbase": {
         "command": "refbase-mcp",
         "args": ["start"],
         "env": {
           "REFBASE_TOKEN": "your-token-here",
           "REFBASE_API_URL": "https://refbase.dev/api"
         }
       }
     }
   }
   ```

### Verification for Cursor

1. **Check MCP Status:**
   - Open command palette (`Cmd/Ctrl + Shift + P`)
   - Type "MCP Status" and select it
   - Verify RefBase server is "Connected"

2. **Test MCP Tools:**
   - Start a conversation with Claude
   - Type: "What RefBase MCP tools are available?"
   - Claude should list the available RefBase tools

---

## Claude Desktop Setup

Claude Desktop has built-in MCP support and is straightforward to configure.

### Configuration Steps

1. **Locate Claude Desktop config file:**
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. **Create or edit the configuration file:**
   ```json
   {
     "mcpServers": {
       "refbase": {
         "command": "refbase-mcp",
         "args": ["start"],
         "env": {
           "REFBASE_TOKEN": "your-token-here",
           "REFBASE_API_URL": "https://refbase.dev/api",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### Advanced Configuration

For more control, create a dedicated config file:

1. **Create RefBase MCP config file:**
   ```bash
   refbase-mcp config init --env production
   ```

2. **Edit the generated config file** with your settings

3. **Update Claude Desktop config to use the file:**
   ```json
   {
     "mcpServers": {
       "refbase": {
         "command": "refbase-mcp",
         "args": ["start", "--config", "/path/to/your/config.json"]
       }
     }
   }
   ```

### Verification for Claude Desktop

1. **Check connection status:**
   - Open Claude Desktop
   - Look for MCP server status indicator
   - Should show "RefBase" as connected

2. **Test functionality:**
   - Ask Claude: "Show me the available MCP tools"
   - Claude should display RefBase tools in the response

---

## Kiro IDE Setup

Kiro provides flexible MCP configuration through its settings interface.

### Using Kiro's MCP Manager

1. **Open Kiro IDE**

2. **Access MCP Settings:**
   - Go to: Kiro → Preferences → Extensions → MCP
   - Or use Command Palette: "MCP: Configure Servers"

3. **Add New MCP Server:**
   ```json
   {
     "name": "RefBase",
     "command": "refbase-mcp",
     "args": ["start"],
     "port": 3000,
     "environment": {
       "REFBASE_TOKEN": "your-token-here",
       "REFBASE_API_URL": "https://refbase.dev/api"
     },
     "autoRestart": true,
     "timeout": 30000
   }
   ```

4. **Enable the server** and restart Kiro

### Using Kiro Configuration File

1. **Edit Kiro's settings.json:**
   - Open Command Palette
   - Type "Preferences: Open Settings (JSON)"

2. **Add MCP configuration:**
   ```json
   {
     "mcp.servers": {
       "refbase": {
         "command": "refbase-mcp",
         "args": ["start"],
         "port": 3000,
         "env": {
           "REFBASE_TOKEN": "your-token-here",
           "REFBASE_API_URL": "https://refbase.dev/api"
         },
         "autoRestart": true
       }
     },
     "mcp.enableLogging": true,
     "mcp.logLevel": "info"
   }
   ```

### Project-Specific Setup for Kiro

1. **Create `.kiro/mcp.json` in your project:**
   ```json
   {
     "servers": {
       "refbase": {
         "command": "refbase-mcp",
         "args": ["start"],
         "projectContext": true,
         "env": {
           "REFBASE_TOKEN": "your-token-here",
           "REFBASE_API_URL": "https://refbase.dev/api"
         }
       }
     }
   }
   ```

2. **Kiro will automatically detect and use this configuration**

### Verification for Kiro

1. **Check MCP Panel:**
   - Open the MCP panel (View → Panels → MCP)
   - Verify RefBase server shows as "Running"

2. **Test tools:**
   - Open AI chat
   - Ask: "What MCP tools can you access?"
   - Should list RefBase tools

---

## VS Code with Continue Extension

While not a primary MCP IDE, VS Code with Continue can work with MCP servers.

### Setup Steps

1. **Install Continue extension** from VS Code marketplace

2. **Configure Continue for MCP:**
   - Open Continue settings
   - Add custom model configuration:

   ```json
   {
     "models": [
       {
         "title": "Claude with RefBase",
         "provider": "anthropic",
         "model": "claude-3-5-sonnet-20241022",
         "apiKey": "your-anthropic-key",
         "mcp": {
           "servers": [
             {
               "name": "refbase",
               "command": "refbase-mcp",
               "args": ["start"],
               "env": {
                 "REFBASE_TOKEN": "your-token-here",
                 "REFBASE_API_URL": "https://refbase.dev/api"
               }
             }
           ]
         }
       }
     ]
   }
   ```

3. **Reload VS Code**

---

## Common Configuration Options

### Environment Variables

All IDEs support these environment variables:

```bash
# Required
REFBASE_TOKEN=your-access-token
REFBASE_API_URL=https://refbase.dev/api

# Optional
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost
LOG_LEVEL=info
LOG_FILE=./logs/mcp-server.log
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### Configuration File Options

Create a `refbase-mcp.config.json`:

```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "refbase": {
    "apiUrl": "https://refbase.dev/api",
    "timeout": 30000,
    "retryAttempts": 3
  },
  "auth": {
    "tokenValidation": {
      "cacheTTL": 300000
    }
  },
  "logging": {
    "level": "info",
    "file": "./logs/mcp-server.log"
  },
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 100
  }
}
```

---

## Troubleshooting Common Setup Issues

### Server Not Starting

**Problem:** MCP server fails to start

**Solutions:**
1. Check if port is available:
   ```bash
   netstat -an | grep :3000
   ```

2. Test server manually:
   ```bash
   refbase-mcp start --debug
   ```

3. Verify token:
   ```bash
   refbase-mcp token validate -t your-token
   ```

### Authentication Errors

**Problem:** "Authentication failed" errors

**Solutions:**
1. Verify token is valid:
   ```bash
   refbase-mcp token info -t your-token
   ```

2. Generate new token in RefBase webapp

3. Check API URL is correct

### Tools Not Available

**Problem:** AI says RefBase tools are not available

**Solutions:**
1. Check MCP server status in IDE
2. Restart the IDE
3. Verify configuration syntax
4. Check server logs:
   ```bash
   refbase-mcp diag logs --follow
   ```

### Connection Timeouts

**Problem:** MCP operations timing out

**Solutions:**
1. Increase timeout in config:
   ```json
   {
     "refbase": {
       "timeout": 60000
     }
   }
   ```

2. Check network connectivity to RefBase API
3. Verify RefBase API is responding

### Permission Errors

**Problem:** "Insufficient permissions" errors

**Solutions:**
1. Verify token has correct permissions in RefBase
2. Check user account status
3. Ensure token hasn't expired

---

## Best Practices

### Security

1. **Store tokens securely:**
   - Use environment variables in production
   - Don't commit tokens to version control
   - Rotate tokens regularly

2. **Network security:**
   - Use HTTPS for RefBase API
   - Consider VPN for private instances
   - Monitor for unusual access patterns

### Performance

1. **Optimize configuration:**
   - Set appropriate timeouts
   - Use caching when available
   - Configure rate limits properly

2. **Monitor usage:**
   - Enable logging for diagnostics
   - Monitor API usage patterns
   - Set up alerts for errors

### Maintenance

1. **Keep updated:**
   - Update RefBase MCP regularly
   - Monitor for IDE updates
   - Check RefBase API compatibility

2. **Backup configuration:**
   - Version control your config files
   - Document custom settings
   - Maintain multiple environments

---

## Getting Help

If you encounter issues:

1. **Run diagnostics:**
   ```bash
   refbase-mcp diag health --detailed
   ```

2. **Check logs:**
   ```bash
   refbase-mcp diag logs --level error
   ```

3. **Interactive troubleshooting:**
   ```bash
   refbase-mcp diag troubleshoot
   ```

4. **Community resources:**
   - Check the documentation
   - Review common issues
   - Contact support if needed

This setup guide should help you get RefBase MCP working with your preferred IDE. Each IDE has its own strengths, so choose the one that best fits your workflow.