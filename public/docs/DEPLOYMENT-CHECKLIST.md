# RefBase MCP - Production Deployment Checklist

This checklist ensures a successful and secure deployment of the RefBase MCP in production or local environments.

## Pre-Deployment Checklist

### ✅ Environment Setup

- [ ] **Node.js Version**: Verify Node.js 18+ is installed
  ```bash
  node --version  # Should show v18.0.0 or higher
  ```

- [ ] **Dependencies**: Install all required dependencies
  ```bash
  npm ci --production  # For production deployment
  # OR
  npm install          # For development setup
  ```

- [ ] **Build Process**: Compile TypeScript successfully
  ```bash
  npm run build
  # Verify dist/ directory is created with compiled files
  ls -la dist/
  ```

- [ ] **Environment Variables**: Configure all required environment variables
  ```bash
  # Required
  export REFBASE_TOKEN="your-actual-refbase-token"
  export REFBASE_API_URL="https://refbase.dev/api"
  
  # Optional but recommended
  export MCP_SERVER_PORT="3000"
  export NODE_ENV="production"
  export LOG_LEVEL="info"
  export LOG_FILE="./logs/refbase-mcp.log"
  ```

### ✅ Security Configuration

- [ ] **API Token**: Obtain valid RefBase API token from RefBase webapp
  - [ ] Log into RefBase webapp at https://refbase.dev
  - [ ] Navigate to Settings → API Tokens
  - [ ] Generate new MCP token with appropriate permissions
  - [ ] Test token validity: `curl -H "Authorization: Bearer YOUR_TOKEN" https://refbase.dev/api/health`

- [ ] **Token Security**: Secure token storage
  - [ ] Never commit tokens to version control
  - [ ] Use environment variables or secure secrets management
  - [ ] Set restrictive file permissions on config files: `chmod 600 .env`

- [ ] **Network Security**: Configure network access
  - [ ] Ensure RefBase API (https://refbase.dev/api) is accessible
  - [ ] Configure firewall rules if needed
  - [ ] Verify HTTPS certificates are valid

### ✅ Configuration Validation

- [ ] **Configuration Files**: Validate all configuration
  ```bash
  # Test configuration loading
  npm run build && node -e "
    require('./dist/index.js');
    console.log('Configuration loaded successfully');
  "
  ```

- [ ] **API Connectivity**: Test RefBase API connection
  ```bash
  curl -H "Authorization: Bearer $REFBASE_TOKEN" \
       -H "Content-Type: application/json" \
       https://refbase.dev/api/health
  ```

- [ ] **Server Startup**: Verify server starts correctly
  ```bash
  npm start
  # Should start without errors and show "RefBase MCP started on port 3000"
  ```

## Deployment Process

### ✅ Local Development Deployment

- [ ] **Clone Repository**: Get latest code
  ```bash
  git clone https://github.com/your-org/refbase-mcp.git
  cd refbase-mcp
  ```

- [ ] **Install Dependencies**:
  ```bash
  npm install
  ```

- [ ] **Configure Environment**:
  ```bash
  cp .env.example .env
  # Edit .env file with your RefBase token and settings
  ```

- [ ] **Build and Test**:
  ```bash
  npm run build
  npm test
  npm run lint
  ```

- [ ] **Start Development Server**:
  ```bash
  npm run dev  # For development with hot reload
  # OR
  npm start   # For production mode
  ```

### ✅ Production Deployment (if needed)

- [ ] **Production Build**:
  ```bash
  npm run build
  npm prune --production  # Remove dev dependencies
  ```

- [ ] **Process Manager**: Setup process manager (PM2 recommended)
  ```bash
  npm install -g pm2
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup  # Configure auto-start
  ```

- [ ] **Log Management**: Configure log rotation
  ```bash
  # PM2 handles log rotation automatically
  pm2 logs refbase-mcp
  ```

- [ ] **Health Monitoring**: Setup health checks
  ```bash
  pm2 monit  # Monitor CPU and memory usage
  ```

## IDE Integration Setup

### ✅ Cursor IDE Setup

- [ ] **Configuration Method 1**: Using Cursor's MCP Settings
  - [ ] Press `Cmd/Ctrl + Shift + P`
  - [ ] Type "MCP" and select "Configure MCP Servers"
  - [ ] Add RefBase MCP configuration:
    ```json
    {
      "mcpServers": {
        "refbase": {
          "command": "node",
          "args": ["PATH_TO_PROJECT/dist/index.js"],
          "env": {
            "REFBASE_TOKEN": "your-token-here",
            "REFBASE_API_URL": "https://refbase.dev/api"
          }
        }
      }
    }
    ```
  - [ ] Restart Cursor

- [ ] **Configuration Method 2**: Using .cursorrules file
  - [ ] Create `.cursorrules` in your project root
  - [ ] Add MCP configuration (see IDE-SETUP.md for details)
  - [ ] Reload Cursor window

- [ ] **Verification**: Test Cursor integration
  - [ ] Start conversation with Claude in Cursor
  - [ ] Ask: "What RefBase MCP tools are available?"
  - [ ] Verify Claude lists RefBase tools

### ✅ Claude Desktop Setup

- [ ] **Locate Config File**:
  - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
  - **Linux**: `~/.config/Claude/claude_desktop_config.json`

- [ ] **Add MCP Configuration**:
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

- [ ] **Restart Claude Desktop**

- [ ] **Verification**: Test Claude Desktop integration
  - [ ] Look for MCP server status indicator
  - [ ] Ask Claude: "Show me available MCP tools"
  - [ ] Verify RefBase tools are listed

### ✅ Kiro IDE Setup

- [ ] **Open Kiro IDE**

- [ ] **Access MCP Settings**:
  - [ ] Go to: Kiro → Preferences → Extensions → MCP
  - [ ] Or use Command Palette: "MCP: Configure Servers"

- [ ] **Add RefBase MCP**:
  ```json
  {
    "name": "RefBase",
    "command": "refbase-mcp",
    "args": ["start"],
    "environment": {
      "REFBASE_TOKEN": "your-token-here",
      "REFBASE_API_URL": "https://refbase.dev/api"
    },
    "autoRestart": true
  }
  ```

- [ ] **Enable and Restart Kiro**

- [ ] **Verification**: Test Kiro integration
  - [ ] Check MCP panel (View → Panels → MCP)
  - [ ] Verify RefBase server shows as "Running"

## Post-Deployment Validation

### ✅ Functionality Testing

- [ ] **Basic Tool Operations**: Test core MCP tools
  ```bash
  # If server exposes HTTP endpoints for testing
  curl -X POST http://localhost:3000/test-tools
  ```

- [ ] **Conversation Management**: Test conversation tools
  - [ ] Save a test conversation through IDE
  - [ ] Search for the saved conversation
  - [ ] Retrieve the conversation by ID

- [ ] **Bug Tracking**: Test bug management tools
  - [ ] Log a test bug
  - [ ] Search for bugs
  - [ ] Update bug status

- [ ] **Feature Management**: Test feature tools
  - [ ] Save a test feature implementation
  - [ ] Search for features
  - [ ] Retrieve feature details

- [ ] **Project Context**: Test project analysis tools
  - [ ] Get project context for current project
  - [ ] Search for similar projects
  - [ ] Get project patterns

### ✅ Performance Validation

- [ ] **Response Times**: Verify acceptable response times
  - [ ] Quick operations (< 500ms): get_project_context
  - [ ] Normal operations (< 2s): save/search operations
  - [ ] Heavy operations (< 5s): pattern analysis

- [ ] **Memory Usage**: Monitor memory consumption
  ```bash
  # With PM2
  pm2 monit
  
  # Or with top/htop
  top -p $(pgrep node)
  ```

- [ ] **Concurrent Usage**: Test multiple simultaneous requests
  - [ ] Open multiple IDE instances
  - [ ] Perform operations simultaneously
  - [ ] Verify no race conditions or errors

### ✅ Error Handling Validation

- [ ] **Authentication Errors**: Test invalid token handling
  - [ ] Temporarily use invalid token
  - [ ] Verify graceful error messages
  - [ ] Restore valid token

- [ ] **Network Errors**: Test API unavailability
  - [ ] Temporarily block API access
  - [ ] Verify graceful degradation
  - [ ] Restore API access

- [ ] **Rate Limiting**: Test rate limit handling
  - [ ] Make rapid requests
  - [ ] Verify rate limit responses
  - [ ] Wait for rate limit reset

## Monitoring and Maintenance

### ✅ Log Monitoring

- [ ] **Log Files**: Verify log files are being created
  ```bash
  ls -la logs/
  tail -f logs/refbase-mcp.log
  ```

- [ ] **Log Levels**: Appropriate log levels are set
  - [ ] Production: `info` or `warn`
  - [ ] Development: `debug`
  - [ ] Error tracking: `error` level logs

- [ ] **Log Rotation**: Ensure logs don't fill disk space
  ```bash
  # PM2 handles rotation automatically
  # Or setup logrotate for manual deployments
  ```

### ✅ Health Monitoring

- [ ] **Health Checks**: Regular health verification
  ```bash
  # Manual health check
  curl http://localhost:3000/health
  
  # Automated monitoring (setup as needed)
  # - Uptime monitoring services
  # - Custom health check scripts
  # - PM2 monitoring dashboard
  ```

- [ ] **Performance Monitoring**: Track key metrics
  - [ ] Response times
  - [ ] Memory usage
  - [ ] CPU utilization
  - [ ] Error rates

### ✅ Backup and Recovery

- [ ] **Configuration Backup**: Backup configuration files
  ```bash
  cp .env .env.backup
  cp -r config/ config.backup/
  ```

- [ ] **Recovery Testing**: Test recovery procedures
  - [ ] Stop server
  - [ ] Restore from backup
  - [ ] Restart server
  - [ ] Verify functionality

## Troubleshooting Quick Fixes

### ✅ Common Issues

- [ ] **Server Won't Start**:
  ```bash
  # Check port availability
  netstat -an | grep :3000
  
  # Check configuration
  npm run build && node -c "require('./dist/index.js')"
  
  # Check logs
  tail -f logs/refbase-mcp.log
  ```

- [ ] **Authentication Failures**:
  ```bash
  # Validate token
  curl -H "Authorization: Bearer $REFBASE_TOKEN" https://refbase.dev/api/health
  
  # Check token permissions in RefBase webapp
  # Regenerate token if needed
  ```

- [ ] **IDE Not Connecting**:
  - [ ] Restart IDE
  - [ ] Check MCP configuration syntax
  - [ ] Verify server is running
  - [ ] Check IDE logs/console

- [ ] **Performance Issues**:
  ```bash
  # Monitor resource usage
  pm2 monit
  
  # Check for memory leaks
  node --inspect dist/index.js
  
  # Restart server
  pm2 restart refbase-mcp
  ```

## Final Checklist Sign-off

- [ ] **All pre-deployment checks completed**
- [ ] **Environment properly configured**
- [ ] **Security measures implemented**
- [ ] **IDE integration tested and working**
- [ ] **All MCP tools validated**
- [ ] **Performance within acceptable limits**
- [ ] **Error handling working correctly**
- [ ] **Monitoring and logging configured**
- [ ] **Backup procedures in place**
- [ ] **Team trained on usage and troubleshooting**

## Emergency Contacts and Resources

**Documentation Resources:**
- Full API Documentation: `docs/API.md`
- Troubleshooting Guide: `docs/TROUBLESHOOTING.md`
- Configuration Reference: `docs/CONFIGURATION.md`
- IDE Setup Guide: `docs/IDE-SETUP.md`

**Quick Commands:**
```bash
# Start server
npm start

# Development mode
npm run dev

# Run tests
npm test

# Check health
curl http://localhost:3000/health

# View logs
tail -f logs/refbase-mcp.log

# Restart with PM2
pm2 restart refbase-mcp
```

---

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Verified By**: ___________  
**Sign-off**: ___________

This checklist ensures a successful deployment of the RefBase MCP with all necessary validations and monitoring in place.