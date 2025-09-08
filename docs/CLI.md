# RefBase MCP CLI Documentation

The RefBase MCP provides a comprehensive command-line interface for managing the server, configuration, diagnostics, and IDE integration.

## Installation

```bash
npm install -g refbase-mcp
```

## Quick Start

```bash
# Initialize configuration
refbase-mcp config init --env development

# Set up IDE integration
refbase-mcp setup --ide cursor

# Validate token
refbase-mcp token validate -t your-token-here

# Start server
refbase-mcp start
```

## Commands Overview

### Server Management

#### `start`
Start the RefBase MCP server.

```bash
refbase-mcp start [options]
```

**Options:**
- `-c, --config <file>` - Configuration file path
- `-e, --env <environment>` - Environment (development, production, test)
- `-p, --port <port>` - Server port (overrides config)
- `-h, --host <host>` - Server host (overrides config)
- `--hot-reload` - Enable configuration hot reload
- `--debug` - Enable debug mode

**Examples:**
```bash
# Start with default configuration
refbase-mcp start

# Start with custom config and port
refbase-mcp start -c config/production.json -p 3001

# Start in debug mode
refbase-mcp start --debug --hot-reload
```

### Configuration Management

#### `config validate`
Validate configuration files.

```bash
refbase-mcp config validate [options]
```

**Options:**
- `-c, --config <file>` - Configuration file path
- `-e, --env <environment>` - Environment to validate
- `--report` - Generate detailed validation report

**Examples:**
```bash
# Validate default configuration
refbase-mcp config validate

# Validate specific config file with report
refbase-mcp config validate -c config/production.json --report
```

#### `config init`
Initialize new configuration files.

```bash
refbase-mcp config init [options]
```

**Options:**
- `-e, --env <environment>` - Environment (development, production, test)
- `--force` - Overwrite existing configuration files

**Examples:**
```bash
# Initialize development configuration
refbase-mcp config init --env development

# Force overwrite existing production config
refbase-mcp config init --env production --force
```

### Diagnostics and Troubleshooting

#### `diag health`
Comprehensive health check of the server and configuration.

```bash
refbase-mcp diag health [options]
```

**Options:**
- `-c, --config <file>` - Configuration file path
- `-e, --env <environment>` - Environment
- `--detailed` - Show detailed health information
- `--fix` - Attempt to fix common issues

**Examples:**
```bash
# Basic health check
refbase-mcp diag health

# Detailed health check with auto-fix
refbase-mcp diag health --detailed --fix
```

#### `diag status`
Show server status and statistics.

```bash
refbase-mcp diag status [options]
```

**Options:**
- `--json` - Output in JSON format
- `--watch` - Watch status in real-time

**Examples:**
```bash
# Show current status
refbase-mcp diag status

# Watch status in real-time
refbase-mcp diag status --watch

# Get status as JSON
refbase-mcp diag status --json
```

#### `diag troubleshoot`
Interactive troubleshooting guide.

```bash
refbase-mcp diag troubleshoot [options]
```

**Options:**
- `--issue <type>` - Specific issue type (connection, auth, performance, config)

**Examples:**
```bash
# Interactive troubleshooting
refbase-mcp diag troubleshoot

# Specific issue troubleshooting
refbase-mcp diag troubleshoot --issue auth
```

#### `diag logs`
View and analyze server logs.

```bash
refbase-mcp diag logs [options]
```

**Options:**
- `-f, --follow` - Follow log output
- `-n, --lines <number>` - Number of lines to show (default: 50)
- `--level <level>` - Filter by log level (debug, info, warn, error)
- `--grep <pattern>` - Filter logs by pattern

**Examples:**
```bash
# Show last 50 log lines
refbase-mcp diag logs

# Follow logs in real-time
refbase-mcp diag logs --follow

# Show only error logs
refbase-mcp diag logs --level error

# Filter logs by pattern
refbase-mcp diag logs --grep "authentication"
```

### Token Management

#### `token validate`
Validate RefBase authentication tokens.

```bash
refbase-mcp token validate [options]
```

**Options:**
- `-t, --token <token>` - Token to validate
- `-c, --config <file>` - Configuration file path
- `--save` - Save valid token to environment file

**Examples:**
```bash
# Validate token (will prompt if not provided)
refbase-mcp token validate

# Validate specific token
refbase-mcp token validate -t your-token-here

# Validate and save token to .env
refbase-mcp token validate -t your-token-here --save
```

#### `token generate-url`
Generate URL for creating new RefBase tokens.

```bash
refbase-mcp token generate-url [options]
```

**Options:**
- `-c, --config <file>` - Configuration file path

#### `token info`
Show information about a token.

```bash
refbase-mcp token info [options]
```

**Options:**
- `-t, --token <token>` - Token to analyze

### Setup and Configuration

#### `setup`
Interactive setup wizard for initial configuration.

```bash
refbase-mcp setup [options]
```

**Options:**
- `--ide <ide>` - Target IDE (cursor, claude, kiro)
- `--non-interactive` - Run setup without prompts

**Examples:**
```bash
# Interactive setup wizard
refbase-mcp setup

# Non-interactive setup for Cursor
refbase-mcp setup --ide cursor --non-interactive
```

#### `generate-config`
Generate configuration templates.

```bash
refbase-mcp generate-config [options]
```

**Options:**
- `-e, --env <environment>` - Environment (default: development)
- `-o, --output <file>` - Output file path

**Examples:**
```bash
# Generate development config
refbase-mcp generate-config

# Generate production config
refbase-mcp generate-config --env production --output config/prod.json
```

### Cache Management

#### `cache stats`
Show cache statistics.

```bash
refbase-mcp cache stats [options]
```

**Options:**
- `--json` - Output in JSON format

#### `cache clear`
Clear caches.

```bash
refbase-mcp cache clear [options]
```

**Options:**
- `--cache <name>` - Clear specific cache

**Examples:**
```bash
# Clear all caches
refbase-mcp cache clear

# Clear specific cache
refbase-mcp cache clear --cache user-tokens
```

### Utility Commands

#### `version`
Show version information.

```bash
refbase-mcp version
```

## Configuration File Format

The CLI uses JSON configuration files with the following structure:

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
      "endpoint": "https://refbase.dev/api/auth/validate",
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
  },
  "development": {
    "debugMode": false,
    "hotReload": false
  }
}
```

## Environment Variables

The CLI supports the following environment variables:

- `REFBASE_API_URL` - RefBase API URL
- `REFBASE_TOKEN` - Authentication token
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `LOG_FILE` - Log file path
- `MCP_SERVER_PORT` - Server port
- `NODE_ENV` - Environment (development, production, test)

## IDE Integration

### Cursor IDE

Add to your `.cursorrules` or MCP configuration:

```json
{
  "mcp": {
    "servers": {
      "refbase": {
        "command": "refbase-mcp",
        "args": ["start"]
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "refbase": {
      "command": "refbase-mcp",
      "args": ["start"]
    }
  }
}
```

### Kiro

Configure in your Kiro MCP settings:

```json
{
  "mcp": {
    "servers": {
      "refbase": {
        "command": "refbase-mcp",
        "args": ["start"],
        "port": 3000
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check configuration
refbase-mcp config validate

# Check dependencies
npm install

# Check port availability
netstat -an | grep :3000

# Try debug mode
refbase-mcp start --debug
```

#### Authentication Issues
```bash
# Validate token
refbase-mcp token validate -t your-token

# Check token info
refbase-mcp token info -t your-token

# Generate new token URL
refbase-mcp token generate-url
```

#### Connection Problems
```bash
# Run health check
refbase-mcp diag health --detailed

# Check logs
refbase-mcp diag logs --follow

# Test connectivity
ping refbase.dev
```

#### Performance Issues
```bash
# Check status
refbase-mcp diag status --watch

# Clear caches
refbase-mcp cache clear

# Check system resources
refbase-mcp diag health --detailed
```

### Getting Help

1. **Interactive Troubleshooting:**
   ```bash
   refbase-mcp diag troubleshoot
   ```

2. **Health Check with Auto-fix:**
   ```bash
   refbase-mcp diag health --fix
   ```

3. **View Logs:**
   ```bash
   refbase-mcp diag logs --follow --level error
   ```

4. **Setup Wizard:**
   ```bash
   refbase-mcp setup
   ```

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Configuration error
- `3` - Authentication error
- `4` - Network error

## Examples

### Complete Setup Workflow

```bash
# 1. Initialize configuration
refbase-mcp config init --env development

# 2. Edit configuration file (config.development.json)
# Set your RefBase API URL and other settings

# 3. Validate configuration
refbase-mcp config validate --report

# 4. Get your RefBase token
refbase-mcp token generate-url

# 5. Validate token
refbase-mcp token validate -t your-token --save

# 6. Run health check
refbase-mcp diag health --detailed

# 7. Set up IDE integration
refbase-mcp setup --ide cursor

# 8. Start server
refbase-mcp start --debug
```

### Production Deployment

```bash
# Generate production configuration
refbase-mcp generate-config --env production --output /etc/refbase-mcp/config.json

# Validate production config
refbase-mcp config validate -c /etc/refbase-mcp/config.json --report

# Start in production mode
refbase-mcp start -c /etc/refbase-mcp/config.json --env production
```

### Monitoring and Maintenance

```bash
# Monitor server status
refbase-mcp diag status --watch

# Follow logs
refbase-mcp diag logs --follow --level warn

# Check cache performance
refbase-mcp cache stats --json

# Clear caches if needed
refbase-mcp cache clear

# Run periodic health checks
refbase-mcp diag health --detailed
```