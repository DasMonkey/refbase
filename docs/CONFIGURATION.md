# RefBase MCP Configuration Reference

This document provides comprehensive reference for all configuration options available in the RefBase MCP.

## Configuration Overview

The RefBase MCP supports multiple configuration methods with the following precedence order (highest to lowest):

1. **Command-line arguments** (highest priority)
2. **Environment variables**
3. **Configuration files**
4. **Default values** (lowest priority)

## Configuration File Formats

### JSON Configuration Files

The primary configuration format is JSON. Files should be named:
- `config.development.json` - Development environment
- `config.production.json` - Production environment  
- `config.test.json` - Test environment
- `config.json` - Default configuration

### Example Complete Configuration

```json
{
  "server": {
    "port": 3000,
    "host": "localhost",
    "timeout": 30000,
    "maxConnections": 100
  },
  "refbase": {
    "apiUrl": "https://refbase.dev/api",
    "timeout": 30000,
    "retryAttempts": 3,
    "retryDelay": 1000
  },
  "auth": {
    "tokenValidation": {
      "endpoint": "https://refbase.dev/api/auth/validate",
      "cacheTTL": 300000,
      "retries": 2
    },
    "refreshToken": {
      "enabled": true,
      "endpoint": "https://refbase.dev/api/auth/refresh"
    }
  },
  "logging": {
    "level": "info",
    "file": "./logs/mcp-server.log",
    "maxSize": "10m",
    "maxFiles": 5,
    "format": "json",
    "enableConsole": true
  },
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 100,
    "skipSuccessfulRequests": false,
    "message": "Too many requests"
  },
  "cache": {
    "enabled": true,
    "ttl": 300000,
    "maxSize": 1000,
    "cleanupInterval": 60000
  },
  "security": {
    "requestSigning": {
      "enabled": true,
      "algorithm": "sha256",
      "timestampTolerance": 300
    },
    "ipAccess": {
      "enabled": false,
      "defaultPolicy": "allow",
      "rules": []
    },
    "dataAnonymization": {
      "enabled": false,
      "level": "medium"
    }
  },
  "monitoring": {
    "healthCheck": {
      "enabled": true,
      "endpoint": "/health",
      "interval": 30000
    },
    "metrics": {
      "enabled": true,
      "collectInterval": 60000,
      "retentionDays": 30
    }
  },
  "development": {
    "debugMode": false,
    "hotReload": false,
    "mockResponses": false
  }
}
```

---

## Configuration Sections

### Server Configuration

Controls the MCP server behavior and connection settings.

```json
{
  "server": {
    "port": 3000,                    // Server port (1024-65535)
    "host": "localhost",             // Bind address
    "timeout": 30000,                // Request timeout in ms
    "maxConnections": 100,           // Max concurrent connections
    "keepAliveTimeout": 5000,        // Keep-alive timeout
    "requestSizeLimit": "10mb",      // Max request size
    "compression": true              // Enable gzip compression
  }
}
```

**Options:**
- `port` (number): Port to bind the server (default: 3000)
- `host` (string): Host address to bind (default: "localhost")
- `timeout` (number): Request timeout in milliseconds (default: 30000)
- `maxConnections` (number): Maximum concurrent connections (default: 100)
- `keepAliveTimeout` (number): Keep-alive timeout in ms (default: 5000)
- `requestSizeLimit` (string): Maximum request size (default: "10mb")
- `compression` (boolean): Enable response compression (default: true)

### RefBase Integration

Configuration for connecting to the RefBase API.

```json
{
  "refbase": {
    "apiUrl": "https://refbase.dev/api",  // Base API URL
    "timeout": 30000,                          // API request timeout
    "retryAttempts": 3,                        // Number of retries
    "retryDelay": 1000,                        // Delay between retries
    "connectionPool": {
      "maxSockets": 50,                        // Max HTTP connections
      "keepAlive": true,                       // Enable keep-alive
      "keepAliveMsecs": 1000                   // Keep-alive interval
    },
    "headers": {                               // Custom headers
      "User-Agent": "RefBase-MCP-Server/1.0"
    }
  }
}
```

**Options:**
- `apiUrl` (string, required): RefBase API base URL
- `timeout` (number): API request timeout in ms (default: 30000)
- `retryAttempts` (number): Number of retry attempts (default: 3)
- `retryDelay` (number): Delay between retries in ms (default: 1000)
- `connectionPool` (object): HTTP connection pool settings
- `headers` (object): Custom HTTP headers for API requests

### Authentication Configuration

Settings for token validation and authentication.

```json
{
  "auth": {
    "tokenValidation": {
      "endpoint": "https://refbase.dev/api/auth/validate",
      "cacheTTL": 300000,                      // Cache time-to-live
      "retries": 2,                            // Validation retries
      "timeout": 10000                         // Validation timeout
    },
    "refreshToken": {
      "enabled": true,                         // Enable auto-refresh
      "endpoint": "https://refbase.dev/api/auth/refresh",
      "threshold": 600000                      // Refresh threshold
    },
    "sessionManagement": {
      "enabled": true,                         // Enable sessions
      "maxAge": 86400000,                      // Session max age
      "maxIdleTime": 7200000,                  // Max idle time
      "maxSessionsPerUser": 5                  // Sessions per user
    }
  }
}
```

**Options:**
- `tokenValidation.endpoint` (string): Token validation URL
- `tokenValidation.cacheTTL` (number): Token cache TTL in ms (default: 300000)
- `tokenValidation.retries` (number): Validation retry attempts (default: 2)
- `refreshToken.enabled` (boolean): Enable automatic token refresh (default: true)
- `refreshToken.threshold` (number): Refresh before expiry in ms (default: 600000)
- `sessionManagement.enabled` (boolean): Enable session management (default: true)

### Logging Configuration

Comprehensive logging settings for debugging and monitoring.

```json
{
  "logging": {
    "level": "info",                           // Log level
    "file": "./logs/mcp-server.log",          // Log file path
    "maxSize": "10m",                          // Max log file size
    "maxFiles": 5,                             // Max log files to keep
    "format": "json",                          // Log format
    "enableConsole": true,                     // Console logging
    "enableFile": true,                        // File logging
    "enableAudit": true,                       // Audit logging
    "auditFile": "./logs/audit.log",          // Audit log file
    "categories": {                            // Category-specific levels
      "auth": "debug",
      "api": "info",
      "security": "warn"
    },
    "filter": {                                // Log filtering
      "excludePatterns": ["health-check"],
      "includePatterns": ["error", "warn"]
    }
  }
}
```

**Log Levels:**
- `debug`: Detailed debugging information
- `info`: General information messages
- `warn`: Warning messages
- `error`: Error messages only

**Format Options:**
- `json`: Structured JSON format
- `text`: Plain text format
- `combined`: Apache combined log format

### Rate Limiting

Protection against excessive API usage.

```json
{
  "rateLimit": {
    "windowMs": 60000,                         // Time window in ms
    "maxRequests": 100,                        // Max requests per window
    "skipSuccessfulRequests": false,           // Count successful requests
    "skipFailedRequests": true,                // Skip failed requests
    "message": "Too many requests",            // Rate limit message
    "statusCode": 429,                         // HTTP status code
    "headers": true,                           // Include rate limit headers
    "keyGenerator": "ip",                      // Key generation method
    "store": "memory",                         // Storage backend
    "perUser": {                               // Per-user limits
      "enabled": true,
      "maxRequests": 200,
      "windowMs": 60000
    },
    "perEndpoint": {                           // Per-endpoint limits
      "search": { "maxRequests": 30, "windowMs": 60000 },
      "save": { "maxRequests": 50, "windowMs": 60000 }
    }
  }
}
```

**Options:**
- `windowMs` (number): Rate limit time window in ms (default: 60000)
- `maxRequests` (number): Maximum requests per window (default: 100)
- `keyGenerator` (string): Method for generating rate limit keys ("ip", "user", "token")
- `store` (string): Storage backend ("memory", "redis")

### Caching Configuration

Settings for performance optimization through caching.

```json
{
  "cache": {
    "enabled": true,                           // Enable caching
    "ttl": 300000,                             // Default TTL in ms
    "maxSize": 1000,                           // Max cache entries
    "cleanupInterval": 60000,                  // Cleanup interval
    "compression": true,                       // Compress cached data
    "layers": {
      "memory": {
        "enabled": true,
        "maxSize": 500,
        "ttl": 300000
      },
      "redis": {
        "enabled": false,
        "url": "redis://localhost:6379",
        "ttl": 3600000
      }
    },
    "strategies": {
      "conversations": { "ttl": 600000, "maxSize": 100 },
      "bugs": { "ttl": 300000, "maxSize": 200 },
      "features": { "ttl": 1800000, "maxSize": 150 },
      "projectContext": { "ttl": 3600000, "maxSize": 50 }
    }
  }
}
```

**Cache Strategies:**
- `lru`: Least Recently Used eviction
- `lfu`: Least Frequently Used eviction
- `ttl`: Time-based expiration
- `fifo`: First In, First Out eviction

### Security Configuration

Advanced security features and settings.

```json
{
  "security": {
    "requestSigning": {
      "enabled": true,                         // Enable request signing
      "algorithm": "sha256",                   // Signing algorithm
      "timestampTolerance": 300,               // Timestamp tolerance (seconds)
      "nonceExpiry": 300,                      // Nonce expiry time
      "secretKey": "env:SIGNING_SECRET"        // Secret key reference
    },
    "ipAccess": {
      "enabled": false,                        // Enable IP access control
      "defaultPolicy": "allow",                // Default policy
      "rules": [
        {
          "type": "allow",
          "ip": "192.168.1.0/24",
          "description": "Local network",
          "priority": 100
        },
        {
          "type": "deny",
          "ip": "10.0.0.1",
          "description": "Blocked IP",
          "priority": 200
        }
      ],
      "trustedProxies": ["10.0.0.1"],         // Trusted proxy IPs
      "emergencyBlock": {
        "enabled": true,
        "duration": 3600000                    // Emergency block duration
      }
    },
    "dataAnonymization": {
      "enabled": false,                        // Enable data anonymization
      "level": "medium",                       // Anonymization level
      "preserveStructure": true,               // Keep data structure
      "fields": {                              // Field-specific rules
        "email": "pseudonymize",
        "password": "remove",
        "phone": "mask"
      }
    },
    "complianceLogging": {
      "enabled": false,                        // Enable compliance logging
      "dataCategories": ["personal", "sensitive"],
      "retentionDays": 365,
      "encryption": true
    }
  }
}
```

### Monitoring Configuration

Health checks, metrics, and system monitoring.

```json
{
  "monitoring": {
    "healthCheck": {
      "enabled": true,                         // Enable health checks
      "endpoint": "/health",                   // Health check endpoint
      "interval": 30000,                       // Check interval
      "timeout": 5000,                         // Check timeout
      "checks": {                              // Individual checks
        "database": true,
        "refbaseApi": true,
        "memory": true,
        "disk": true
      },
      "thresholds": {                          // Health thresholds
        "memoryUsage": 80,                     // Memory usage % 
        "diskUsage": 85,                       // Disk usage %
        "responseTime": 2000                   // Max response time
      }
    },
    "metrics": {
      "enabled": true,                         // Enable metrics collection
      "collectInterval": 60000,                // Collection interval
      "retentionDays": 30,                     // Metric retention
      "export": {
        "prometheus": {
          "enabled": false,
          "port": 9090,
          "path": "/metrics"
        },
        "json": {
          "enabled": true,
          "file": "./logs/metrics.json"
        }
      }
    },
    "alerts": {
      "enabled": false,                        // Enable alerting
      "thresholds": {
        "errorRate": 5,                        // Error rate %
        "responseTime": 3000,                  // Response time ms
        "memoryUsage": 90                      // Memory usage %
      },
      "notifications": {
        "email": {
          "enabled": false,
          "to": ["admin@company.com"],
          "smtp": "smtp.company.com"
        },
        "webhook": {
          "enabled": false,
          "url": "https://hooks.slack.com/..."
        }
      }
    }
  }
}
```

### Development Configuration

Settings specific to development environments.

```json
{
  "development": {
    "debugMode": false,                        // Enable debug mode
    "hotReload": false,                        // Hot reload config
    "mockResponses": false,                    // Use mock responses
    "verboseLogging": true,                    // Verbose logging
    "disableCache": false,                     // Disable caching
    "allowCors": true,                         // Allow CORS
    "exposeErrors": true,                      // Expose error details
    "profiling": {
      "enabled": false,                        // Enable profiling
      "outputDir": "./profiles",
      "interval": 60000
    },
    "testing": {
      "mockApi": false,                        // Mock RefBase API
      "testData": "./test-data",               // Test data directory
      "resetOnStart": false                    // Reset test state
    }
  }
}
```

---

## Environment Variables

All configuration options can be overridden using environment variables. Use UPPER_CASE with underscores:

### Required Variables
```bash
REFBASE_API_URL=https://refbase.dev/api
REFBASE_TOKEN=your-access-token-here
```

### Optional Variables
```bash
# Server
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost
MCP_SERVER_TIMEOUT=30000

# Logging  
LOG_LEVEL=info
LOG_FILE=./logs/mcp-server.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Cache
CACHE_ENABLED=true
CACHE_TTL=300000
CACHE_MAX_SIZE=1000

# Security
REQUEST_SIGNING_ENABLED=false
IP_ACCESS_ENABLED=false
DATA_ANONYMIZATION_ENABLED=false

# Development
DEBUG_MODE=false
HOT_RELOAD=false
MOCK_RESPONSES=false

# Environment
NODE_ENV=production
```

### Environment Variable Naming

Configuration path to environment variable mapping:

```
server.port                    → MCP_SERVER_PORT
refbase.apiUrl                → REFBASE_API_URL  
auth.tokenValidation.cacheTTL → AUTH_TOKEN_VALIDATION_CACHE_TTL
logging.level                 → LOG_LEVEL
rateLimit.maxRequests         → RATE_LIMIT_MAX_REQUESTS
```

---

## Configuration Validation

The server validates all configuration options at startup:

### Validation Commands

```bash
# Validate current configuration
refbase-mcp config validate

# Validate specific file
refbase-mcp config validate -c config.json

# Generate validation report
refbase-mcp config validate --report

# Validate and fix common issues
refbase-mcp config validate --fix
```

### Validation Rules

**Required Fields:**
- `refbase.apiUrl`: Must be a valid HTTPS URL
- Authentication token (via env var or config)

**Value Constraints:**
- `server.port`: 1024-65535
- `server.timeout`: 1000-300000 ms
- `logging.level`: debug|info|warn|error
- `rateLimit.windowMs`: > 0
- `cache.ttl`: > 0

**Format Validation:**
- URLs must be valid and reachable
- File paths must be accessible
- JSON syntax must be valid
- Environment references must exist

### Common Validation Errors

**Invalid API URL:**
```json
{
  "error": "Invalid refbase.apiUrl",
  "details": "URL must start with https://",
  "fix": "Update apiUrl to: https://refbase.dev/api"
}
```

**Missing Authentication:**
```json
{
  "error": "Authentication not configured", 
  "details": "No token found in config or environment",
  "fix": "Set REFBASE_TOKEN environment variable"
}
```

**Port Conflict:**
```json
{
  "error": "Port already in use",
  "details": "Port 3000 is already bound",
  "fix": "Use different port: --port 3001"
}
```

---

## Configuration Examples

### Minimal Configuration

```json
{
  "refbase": {
    "apiUrl": "https://refbase.dev/api"
  }
}
```

### Development Configuration

```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "refbase": {
    "apiUrl": "http://localhost:8080/api",
    "timeout": 10000
  },
  "logging": {
    "level": "debug",
    "enableConsole": true,
    "file": "./logs/dev.log"
  },
  "development": {
    "debugMode": true,
    "hotReload": true,
    "exposeErrors": true
  },
  "cache": {
    "enabled": false
  }
}
```

### Production Configuration

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "timeout": 30000,
    "maxConnections": 1000
  },
  "refbase": {
    "apiUrl": "https://refbase.company.com/api",
    "timeout": 30000,
    "retryAttempts": 3
  },
  "auth": {
    "tokenValidation": {
      "cacheTTL": 300000,
      "retries": 2
    }
  },
  "logging": {
    "level": "warn",
    "file": "/var/log/refbase-mcp/server.log",
    "maxSize": "100m",
    "maxFiles": 10,
    "format": "json",
    "enableConsole": false
  },
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 200
  },
  "cache": {
    "enabled": true,
    "ttl": 600000,
    "maxSize": 5000
  },
  "monitoring": {
    "healthCheck": {
      "enabled": true,
      "interval": 30000
    },
    "metrics": {
      "enabled": true,
      "collectInterval": 60000
    }
  },
  "security": {
    "requestSigning": {
      "enabled": true
    },
    "ipAccess": {
      "enabled": true,
      "defaultPolicy": "deny",
      "rules": [
        {
          "type": "allow",
          "cidr": "10.0.0.0/8",
          "description": "Internal network"
        }
      ]
    }
  }
}
```

### High-Security Configuration

```json
{
  "server": {
    "port": 3000,
    "host": "127.0.0.1",
    "timeout": 15000
  },
  "refbase": {
    "apiUrl": "https://secure-refbase.company.com/api",
    "timeout": 15000,
    "retryAttempts": 2
  },
  "auth": {
    "tokenValidation": {
      "cacheTTL": 60000,
      "retries": 1
    },
    "sessionManagement": {
      "enabled": true,
      "maxAge": 3600000,
      "maxIdleTime": 1800000,
      "maxSessionsPerUser": 3
    }
  },
  "logging": {
    "level": "info",
    "enableAudit": true,
    "auditFile": "/secure/logs/audit.log"
  },
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 50,
    "perUser": {
      "enabled": true,
      "maxRequests": 30
    }
  },
  "security": {
    "requestSigning": {
      "enabled": true,
      "algorithm": "sha256",
      "timestampTolerance": 60
    },
    "ipAccess": {
      "enabled": true,
      "defaultPolicy": "deny",
      "rules": [
        {
          "type": "allow",
          "ip": "192.168.1.100",
          "description": "Admin workstation"
        }
      ]
    },
    "dataAnonymization": {
      "enabled": true,
      "level": "high"
    },
    "complianceLogging": {
      "enabled": true,
      "encryption": true
    }
  }
}
```

---

## Configuration Management

### Multiple Environments

Use environment-specific configuration files:

```bash
# Development
refbase-mcp start --env development

# Production  
refbase-mcp start --env production

# Custom environment
refbase-mcp start --config /path/to/custom.json
```

### Configuration Inheritance

Configuration files can extend others:

```json
{
  "extends": "./config.base.json",
  "server": {
    "port": 3001
  },
  "logging": {
    "level": "debug"
  }
}
```

### Dynamic Configuration

Enable hot-reload for certain configuration changes:

```json
{
  "development": {
    "hotReload": true
  }
}
```

Changes to these sections reload automatically:
- `logging` (except file location)
- `rateLimit`  
- `cache` settings
- `monitoring` intervals

### Configuration Security

**Protecting Sensitive Data:**

```json
{
  "refbase": {
    "apiUrl": "env:REFBASE_API_URL"
  },
  "auth": {
    "secretKey": "file:/etc/secrets/signing.key"
  },
  "database": {
    "password": "vault:database/password"
  }
}
```

**Reference Types:**
- `env:VAR_NAME` - Environment variable
- `file:/path/to/file` - File contents
- `vault:path/to/secret` - Vault secret (if configured)

This configuration reference provides comprehensive coverage of all available options for the RefBase MCP. Use the validation tools to ensure your configuration is correct and secure.