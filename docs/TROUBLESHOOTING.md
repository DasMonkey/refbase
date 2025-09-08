# RefBase MCP Troubleshooting Guide

This guide provides solutions to common issues and frequently asked questions for the RefBase MCP.

## Quick Diagnostic Commands

Before diving into specific issues, try these diagnostic commands:

```bash
# Health check
refbase-mcp diag health --detailed

# Server status
refbase-mcp diag status

# View recent logs
refbase-mcp diag logs --lines 50 --level error

# Interactive troubleshooting
refbase-mcp diag troubleshoot
```

---

## Common Issues and Solutions

### 1. Server Won't Start

#### **Symptoms:**
- Command `refbase-mcp start` fails
- Error: "Server failed to start"
- Process exits immediately

#### **Diagnosis:**
```bash
# Check if port is in use
netstat -an | grep :3000

# Test configuration
refbase-mcp config validate --report

# Try starting in debug mode
refbase-mcp start --debug
```

#### **Solutions:**

**Port Already in Use:**
```bash
# Find process using the port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or use different port
refbase-mcp start --port 3001
```

**Invalid Configuration:**
```bash
# Generate new config
refbase-mcp config init --env development --force

# Validate specific config
refbase-mcp config validate -c path/to/config.json
```

**Missing Dependencies:**
```bash
# Reinstall dependencies
npm install -g refbase-mcp --force

# Check Node.js version (requires 18+)
node --version
```

**Permissions Error:**
```bash
# Fix permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or install locally
npm install refbase-mcp
npx refbase-mcp start
```

---

### 2. Authentication Issues

#### **Symptoms:**
- Error: "Authentication failed"
- Error: "Invalid token"
- Tools return 401/403 errors

#### **Diagnosis:**
```bash
# Validate your token
refbase-mcp token validate -t your-token-here

# Get token info
refbase-mcp token info -t your-token-here

# Check API connectivity
curl -H "Authorization: Bearer your-token" https://refbase.dev/api/health
```

#### **Solutions:**

**Expired or Invalid Token:**
1. Log into RefBase webapp
2. Go to Settings → API Tokens
3. Generate a new token
4. Update configuration:
   ```bash
   refbase-mcp token validate -t new-token --save
   ```

**Wrong API URL:**
```bash
# Check your RefBase instance URL
# Should be: https://refbase.dev/api (with /api)
# Not: https://refbase.dev

# Update config
refbase-mcp config validate --report
```

**Token Permissions:**
- Ensure token has MCP permissions in RefBase
- Check user account is active
- Verify organization membership if applicable

**Network Issues:**
```bash
# Test connectivity
ping refbase.dev

# Test HTTPS
curl -I https://refbase.dev/api/health

# Check firewall/proxy settings
```

---

### 3. IDE Integration Problems

#### **Symptoms:**
- IDE doesn't show RefBase tools
- Error: "MCP server not responding"
- Tools appear but don't work

#### **Diagnosis:**

**For Cursor:**
```bash
# Check MCP status in Cursor
# Command Palette → "MCP Status"

# Check Cursor logs
tail -f ~/Library/Logs/Cursor/main.log  # macOS
```

**For Claude Desktop:**
```bash
# Check config file location
# macOS: ~/Library/Application Support/Claude/claude_desktop_config.json

# Validate JSON syntax
python -m json.tool claude_desktop_config.json
```

**For Kiro:**
```bash
# Check MCP panel status
# View → Panels → MCP

# Check Kiro logs
```

#### **Solutions:**

**Configuration Syntax Error:**
```json
// Correct format
{
  "mcpServers": {
    "refbase": {
      "command": "refbase-mcp",
      "args": ["start"],
      "env": {
        "REFBASE_TOKEN": "your-token",
        "REFBASE_API_URL": "https://refbase.dev/api"
      }
    }
  }
}
```

**Server Path Issues:**
```bash
# Make sure refbase-mcp is in PATH
which refbase-mcp

# If not found, use full path
/usr/local/bin/refbase-mcp
# or
/path/to/node_modules/.bin/refbase-mcp
```

**Permission Problems:**
```bash
# Make executable
chmod +x /path/to/refbase-mcp

# Check npm global installation
npm list -g refbase-mcp
```

**Environment Variable Issues:**
```bash
# Debug environment
refbase-mcp start --debug

# Check if env vars are loaded
echo $REFBASE_TOKEN
```

---

### 4. API Connection Problems

#### **Symptoms:**
- Error: "RefBase API unavailable"
- Timeouts on all operations
- Intermittent connection failures

#### **Diagnosis:**
```bash
# Test API directly
curl -H "Authorization: Bearer your-token" \
     https://refbase.dev/api/conversations

# Check DNS resolution
nslookup refbase.dev

# Test connectivity
telnet refbase.dev 443
```

#### **Solutions:**

**DNS/Network Issues:**
```bash
# Try different DNS
# Google: 8.8.8.8, 8.8.4.4
# Cloudflare: 1.1.1.1, 1.0.0.1

# Check hosts file
cat /etc/hosts  # macOS/Linux
type %WINDIR%\System32\drivers\etc\hosts  # Windows
```

**SSL/TLS Problems:**
```bash
# Test SSL certificate
openssl s_client -connect refbase.dev:443

# Check certificate validity
curl -I https://refbase.dev
```

**Firewall/Proxy:**
```bash
# Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Configure proxy if needed
export HTTPS_PROXY=http://proxy.company.com:8080
```

**API Rate Limiting:**
```bash
# Check rate limit headers in logs
refbase-mcp diag logs --grep "rate.limit"

# Reduce request frequency
# Increase timeout in config
```

---

### 5. Performance Issues

#### **Symptoms:**
- Slow tool responses
- Timeouts
- High CPU/memory usage

#### **Diagnosis:**
```bash
# Check server stats
refbase-mcp diag status --watch

# Monitor resource usage
top -p $(pgrep refbase-mcp)

# Check cache stats
refbase-mcp cache stats
```

#### **Solutions:**

**Increase Timeouts:**
```json
{
  "refbase": {
    "timeout": 60000,
    "retryAttempts": 3
  }
}
```

**Clear Caches:**
```bash
# Clear all caches
refbase-mcp cache clear

# Clear specific cache
refbase-mcp cache clear --cache user-tokens
```

**Optimize Configuration:**
```json
{
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 50
  },
  "logging": {
    "level": "warn"
  }
}
```

**Memory Issues:**
```bash
# Restart server periodically
# Add to crontab:
0 */6 * * * pkill refbase-mcp && refbase-mcp start
```

---

### 6. Data/Content Issues

#### **Symptoms:**
- Search returns no results
- Saved data doesn't appear
- Incomplete or corrupted data

#### **Diagnosis:**
```bash
# Check API responses
refbase-mcp diag logs --grep "api.response"

# Test specific operations
# Use debug mode to see request/response
refbase-mcp start --debug
```

#### **Solutions:**

**Search Issues:**
- Check search query syntax
- Verify data was saved successfully
- Try broader search terms
- Check filters (tags, dates, etc.)

**Data Sync Problems:**
- Verify authentication
- Check RefBase webapp directly
- Clear local caches
- Wait for data propagation (if distributed)

**Encoding Issues:**
- Ensure UTF-8 encoding
- Check special characters
- Verify locale settings

---

## Frequently Asked Questions (FAQ)

### Installation and Setup

**Q: Do I need to install anything besides the MCP server?**

A: You need:
- Node.js 18+ 
- The RefBase MCP (`npm install -g refbase-mcp`)
- A RefBase account with API token
- An MCP-compatible IDE (Cursor, Claude Desktop, Kiro, etc.)

**Q: Can I run multiple instances of the MCP server?**

A: Yes, but each needs a unique port. Use different config files or port parameters:
```bash
refbase-mcp start --port 3001
refbase-mcp start --port 3002 --config config2.json
```

**Q: How do I update to the latest version?**

A:
```bash
npm update -g refbase-mcp
# or
npm install -g refbase-mcp@latest
```

### Configuration

**Q: Where should I store my configuration files?**

A: Recommended locations:
- Development: `./config/development.json`
- Production: `/etc/refbase-mcp/config.json`
- User-specific: `~/.refbase-mcp/config.json`

**Q: Can I use environment variables instead of config files?**

A: Yes, environment variables take precedence:
```bash
export REFBASE_TOKEN=your-token
export REFBASE_API_URL=https://refbase.dev/api
export LOG_LEVEL=debug
```

**Q: How do I secure my API token?**

A: Best practices:
- Use environment variables in production
- Set file permissions (600) on config files
- Use secrets management in containers/cloud
- Rotate tokens regularly

### Usage

**Q: Which MCP tools should I use for different scenarios?**

A:
- **Save important discussions**: `save_conversation`
- **Find existing solutions**: `search_features`, `search_bugs`
- **Track new issues**: `save_bug`
- **Store working code**: `save_feature`
- **Understand project context**: `get_project_context`

**Q: How do I organize my conversations and data effectively?**

A: Use consistent patterns:
- **Tags**: Use consistent tag schemes (`ui`, `api`, `bug`, `feature`)
- **Titles**: Make them descriptive and searchable
- **Context**: Always provide project context when possible
- **Updates**: Keep bug status current

**Q: What happens if the RefBase server is down?**

A: The MCP server will:
- Return appropriate error messages
- Retry operations with exponential backoff
- Cache data locally when possible
- Continue working once connection is restored

### Performance

**Q: How many requests can I make per minute?**

A: Default limits:
- 100 general requests per minute
- 30 search operations per minute
- 50 write operations per minute
- Configurable via `rateLimit` settings

**Q: Can I run the MCP server on a different machine?**

A: Yes, but you'll need to configure the IDE to connect to the remote server. This requires additional network configuration and isn't recommended for security reasons.

**Q: How much memory does the MCP server use?**

A: Typically 50-100MB base memory, plus:
- 1-5MB per cached conversation
- 2-10MB per active connection
- More with debug logging enabled

### Troubleshooting

**Q: How do I enable debug logging?**

A:
```bash
# Temporary debugging
refbase-mcp start --debug

# Permanent config change
{
  "logging": {
    "level": "debug",
    "file": "./logs/debug.log"
  }
}
```

**Q: Where are the log files stored?**

A: Default locations:
- Current directory: `./logs/`
- System logs: `/var/log/refbase-mcp/`
- User logs: `~/.refbase-mcp/logs/`

**Q: How do I report bugs or get support?**

A:
1. Run diagnostic: `refbase-mcp diag health --detailed`
2. Collect logs: `refbase-mcp diag logs --lines 100`
3. Check documentation and FAQ
4. Contact support with diagnostic information

### Advanced Usage

**Q: Can I customize the MCP tools or add new ones?**

A: Yes! See the Developer Documentation for:
- Extending existing tools
- Creating custom tools
- Plugin architecture
- API integration patterns

**Q: How do I deploy in production with high availability?**

A: See the Production Deployment guide for:
- Docker containerization
- Load balancing
- Health monitoring
- Auto-scaling configuration

**Q: Can I integrate with other systems besides RefBase?**

A: The architecture is extensible. You can:
- Create custom API clients
- Add new data sources
- Implement custom authentication
- Build specialized tools

---

## Getting Additional Help

### Self-Service Options

1. **Interactive Troubleshooting:**
   ```bash
   refbase-mcp diag troubleshoot --issue connection
   ```

2. **Health Check with Auto-Fix:**
   ```bash
   refbase-mcp diag health --fix
   ```

3. **Configuration Wizard:**
   ```bash
   refbase-mcp setup
   ```

### Diagnostic Information

When seeking help, include:

```bash
# System information
refbase-mcp version
node --version
npm --version

# Configuration
refbase-mcp config validate --report

# Health status
refbase-mcp diag health --detailed --json

# Recent logs
refbase-mcp diag logs --lines 50 --level error
```

### Community Resources

- Documentation: Check all documentation files
- Examples: Review example configurations
- Best Practices: Follow recommended patterns
- Updates: Keep software updated

---

This troubleshooting guide covers the most common issues encountered with RefBase MCP. Most problems can be resolved by following the diagnostic steps and solutions provided. For complex issues, the interactive troubleshooting tools and detailed logging will help identify the root cause.