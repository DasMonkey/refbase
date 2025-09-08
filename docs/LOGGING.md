# Logging and Monitoring System

The RefBase MCP includes a comprehensive logging and monitoring system built with Winston and custom monitoring utilities. This system provides structured logging, metrics collection, health checks, and log analysis capabilities.

## Features

### 1. Structured Logging with Winston
- **Multiple log levels**: debug, info, warn, error
- **Environment-specific formatting**: JSON for production, colorized for development
- **Daily log rotation**: Automatic file rotation with compression
- **Multiple log files**: Separate files for main logs, errors, audit events, and metrics
- **Configurable retention**: Automatic cleanup of old log files

### 2. Audit Logging
- **Security events**: Authentication, authorization, and security-related activities
- **Tool usage tracking**: Complete audit trail of all MCP tool executions
- **API call logging**: HTTP request/response logging with sanitized sensitive data
- **Data sanitization**: Automatic redaction of sensitive fields (passwords, tokens, etc.)

### 3. Metrics Collection
- **System metrics**: Memory usage, CPU usage, uptime, active connections
- **Performance metrics**: Response times, throughput, error rates
- **Tool-specific metrics**: Usage statistics per tool, success rates, performance
- **Custom metrics**: Support for application-specific metrics

### 4. Monitoring System
- **Real-time monitoring**: Continuous collection of system and application metrics
- **Alert system**: Configurable alerts based on thresholds
- **Health checks**: Comprehensive system health monitoring
- **Performance tracking**: Tool execution times and success rates

### 5. Log Analysis
- **Log parsing**: Analyze structured log files for insights
- **Error analysis**: Identify and categorize error patterns
- **Performance analysis**: Tool usage statistics and performance trends
- **Search capabilities**: Query logs by time range, user, tool, or keyword

## Configuration

### Environment Variables

```bash
# Logging configuration
LOG_LEVEL=info                    # debug, info, warn, error
LOG_DIR=./logs                    # Directory for log files
NODE_ENV=development              # Environment (affects log formatting)

# Log rotation settings (optional)
LOG_MAX_SIZE=20m                  # Maximum log file size
LOG_MAX_FILES=14d                 # Retention period for log files
```

### Configuration File

```json
{
  "logging": {
    "level": "info",
    "rotation": {
      "enabled": true,
      "maxSize": "20m",
      "maxFiles": 14
    },
    "structured": true,
    "file": "./logs/refbase-mcp.log"
  }
}
```

## Usage

### Basic Logging

```typescript
import { logger } from './utils/logger';

// Basic logging
logger.info('Server started successfully');
logger.debug('Processing request', { userId: 'user123', requestId: 'req456' });
logger.warn('High memory usage detected', { memoryUsage: 85.5 });
logger.error('Database connection failed', error, { component: 'database' });
```

### Audit Logging

```typescript
// Security events
logger.auditSecurity({
  type: 'auth_success',
  userId: 'user123',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Tool usage
logger.auditToolUsage(
  'save_conversation',
  'user123',
  { title: 'Meeting notes' },
  { success: true, conversationId: 'conv456' }
);

// API calls
logger.auditApiCall('POST', '/api/conversations', 'user123', 200, 150);
```

### Metrics Logging

```typescript
// Performance metrics
logger.performanceMetric('api_response_time', 250, { endpoint: '/conversations' });

// Counter metrics
logger.counterMetric('tool_calls_total', 1, { tool: 'save_conversation' });

// Gauge metrics
logger.gaugeMetric('active_connections', 15);

// Custom metrics
logger.metric({
  name: 'custom_metric',
  value: 42,
  unit: 'count',
  tags: { component: 'feature-x' }
});
```

### Monitoring System

```typescript
import { monitoring } from './utils/monitoring';

// Start monitoring
monitoring.start();

// Record tool calls
monitoring.recordToolCall('save_conversation', true, 150);
monitoring.recordToolCall('search_bugs', false, 300);

// Record connection changes
monitoring.recordConnection(1);  // New connection
monitoring.recordConnection(-1); // Connection closed

// Get metrics
const systemMetrics = monitoring.getSystemMetrics();
const toolMetrics = monitoring.getToolMetrics();

// Add custom alert rules
monitoring.addAlertRule({
  name: 'high_error_rate',
  condition: (metrics) => metrics.errorRate > 0.1,
  message: 'Error rate exceeded 10%',
  severity: 'critical',
  cooldownMs: 60000
});

// Stop monitoring
monitoring.stop();
```

### Health Checks

```typescript
import { healthCheck } from './utils/healthCheck';

// Perform comprehensive health check
const result = await healthCheck.performHealthCheck();
console.log('Health Status:', result.status);
console.log('Overall Score:', result.overall.score);

// Quick status check
const quickStatus = healthCheck.getQuickStatus();
console.log('Quick Status:', quickStatus);

// Configure health check thresholds
healthCheck.updateConfig({
  thresholds: {
    memoryUsagePercent: 90,
    errorRatePercent: 5,
    averageResponseTimeMs: 3000
  }
});
```

### Log Analysis

```typescript
import { logAnalyzer } from './utils/logAnalyzer';

// Analyze log file
const analysis = await logAnalyzer.analyzeLogFile('./logs/refbase-mcp-2024-01-01.log');
console.log('Total entries:', analysis.totalEntries);
console.log('Error count:', analysis.errorCount);
console.log('Top errors:', analysis.topErrors);

// Search logs
const errors = await logAnalyzer.searchLogs({
  level: 'error',
  startTime: new Date('2024-01-01'),
  endTime: new Date('2024-01-02'),
  limit: 50
});

// Get recent errors
const recentErrors = await logAnalyzer.getRecentErrors(24); // Last 24 hours

// Tool performance analysis
const performance = await logAnalyzer.getToolPerformance('save_conversation', 24);
console.log('Success rate:', performance.successRate);
console.log('Average response time:', performance.averageResponseTime);

// Generate daily report
const report = await logAnalyzer.generateDailyReport(new Date('2024-01-01'));

// Cleanup old logs
const deletedCount = await logAnalyzer.cleanupOldLogs(30); // Keep 30 days
```

## Log File Structure

### Main Log Files

- `refbase-mcp-YYYY-MM-DD.log` - Main application logs
- `error-YYYY-MM-DD.log` - Error-specific logs
- `audit-YYYY-MM-DD.log` - Security and audit events
- `metrics-YYYY-MM-DD.log` - Metrics and performance data

### Log Format

```json
{
  "timestamp": "2024-01-01T10:00:00.000Z",
  "level": "info",
  "message": "Tool execution completed",
  "metadata": {
    "userId": "user123",
    "toolName": "save_conversation",
    "duration": 150,
    "requestId": "req456"
  }
}
```

## Monitoring Alerts

### Default Alert Rules

1. **High Memory Usage**: Triggers when memory usage > 85%
2. **High Error Rate**: Triggers when error rate > 10%
3. **Slow Response Time**: Triggers when average response time > 5 seconds
4. **High Tool Call Volume**: Triggers when tool calls > 100/minute

### Custom Alert Rules

```typescript
monitoring.addAlertRule({
  name: 'custom_alert',
  condition: (metrics) => {
    // Custom condition logic
    return metrics.toolCallsPerMinute > 50 && metrics.errorRate > 0.05;
  },
  message: 'High load with elevated error rate',
  severity: 'medium',
  cooldownMs: 300000 // 5 minutes
});
```

## Security Features

### Data Sanitization

The logging system automatically sanitizes sensitive data:

- **Passwords**: Replaced with `[REDACTED]`
- **API Keys**: Replaced with `[REDACTED]`
- **Tokens**: Replaced with `[REDACTED]`
- **URLs**: Sensitive query parameters are sanitized

### Audit Trail

Complete audit trail includes:

- User authentication events
- Tool usage with parameters and results
- API calls with response codes and timing
- Security events and violations
- Configuration changes

## Performance Considerations

### Log Rotation

- Daily rotation prevents large log files
- Compression reduces storage requirements
- Configurable retention policies
- Automatic cleanup of old files

### Async Logging

- Non-blocking log operations
- Buffered writes for performance
- Graceful handling of log failures

### Resource Monitoring

- Memory usage tracking
- CPU usage monitoring
- Disk space monitoring
- Connection pool monitoring

## Troubleshooting

### Common Issues

1. **Log Directory Permissions**
   ```bash
   # Ensure write permissions
   chmod 755 ./logs
   ```

2. **Disk Space**
   ```bash
   # Check available space
   df -h
   # Clean up old logs
   npm run logs:cleanup
   ```

3. **High Memory Usage**
   ```bash
   # Check memory usage
   npm run diag:memory
   # Restart if needed
   npm run restart
   ```

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
logger.enableDebugMode();
// ... perform operations
logger.disableDebugMode();
```

### Health Check Diagnostics

```typescript
// Comprehensive health check
const health = await healthCheck.performHealthCheck();
if (health.status !== 'healthy') {
  console.log('Issues detected:', health.checks);
}

// Logger-specific health check
const loggerHealth = logger.healthCheck();
if (loggerHealth.status !== 'healthy') {
  console.log('Logger issues:', loggerHealth.details);
}
```

## Integration with CLI

The logging system integrates with the CLI for management:

```bash
# View recent logs
refbase-mcp diag logs

# Health check
refbase-mcp diag health

# System status
refbase-mcp diag status

# Log analysis
refbase-mcp logs analyze --date 2024-01-01

# Cleanup old logs
refbase-mcp logs cleanup --days 30
```

## Best Practices

1. **Use appropriate log levels**
   - `debug`: Detailed diagnostic information
   - `info`: General operational messages
   - `warn`: Warning conditions that should be addressed
   - `error`: Error conditions that need immediate attention

2. **Include context information**
   - Always include relevant context (userId, requestId, etc.)
   - Use structured logging with consistent field names
   - Avoid logging sensitive information

3. **Monitor performance impact**
   - Use async logging for high-throughput scenarios
   - Monitor log file sizes and rotation
   - Set appropriate log levels for production

4. **Regular maintenance**
   - Monitor disk space usage
   - Review and analyze error patterns
   - Update alert thresholds based on usage patterns
   - Clean up old log files regularly

## Requirements Satisfied

This logging and monitoring system satisfies the following requirements:

- **11.1**: Structured logging with Winston ✅
- **11.2**: Log formatters for different environments ✅
- **11.3**: Log rotation and cleanup policies ✅
- **11.5**: Audit logging for security events ✅
- **11.8**: Debug logging modes for troubleshooting ✅

The system provides comprehensive logging, monitoring, and analysis capabilities that enable effective troubleshooting, performance monitoring, and security auditing for the RefBase MCP.