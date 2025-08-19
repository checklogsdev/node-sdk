# @checklogs/node-sdk

Official Node.js SDK for CheckLogs.dev - A powerful log monitoring system.

## Installation

```bash
npm install @checklogs/node-sdk
```

## Quick Start

```javascript
const { createLogger } = require('@checklogs/node-sdk');

// Create a logger instance
const logger = createLogger('your-api-key-here');

// Log messages
await logger.info('Application started');
await logger.error('Something went wrong', { error_code: 500 });
```

## Features

- ✅ Full API coverage (logging, retrieval, statistics)
- ✅ TypeScript support with complete type definitions
- ✅ Automatic retry mechanism with exponential backoff
- ✅ Enhanced logging with metadata (hostname, process info, timestamps)
- ✅ Console output integration
- ✅ Child loggers with inherited context
- ✅ Statistics and analytics
- ✅ Error handling with custom error types
- ✅ Validation and sanitization

## API Overview

### Basic Client

```javascript
const { CheckLogsClient } = require('@checklogs/node-sdk');

const client = new CheckLogsClient('your-api-key');

// Send a log
await client.log({
  message: 'User logged in',
  level: 'info',
  context: { user_id: 123, ip: '192.168.1.1' }
});

// Retrieve logs
const logs = await client.getLogs({
  limit: 100,
  level: 'error',
  since: '2024-01-01'
});
```

### Enhanced Logger

```javascript
const { CheckLogsLogger } = require('@checklogs/node-sdk');

const logger = new CheckLogsLogger('your-api-key', {
  source: 'my-app',
  defaultContext: { version: '1.0.0' },
  consoleOutput: true
});

// Convenience methods
await logger.info('Info message');
await logger.warning('Warning message');
await logger.error('Error message');
await logger.critical('Critical message');
await logger.debug('Debug message');
```

## Configuration Options

### Client Options

```javascript
const client = new CheckLogsClient('api-key', {
  timeout: 5000,           // Request timeout in ms
  validatePayload: true    // Validate data before sending
});
```

### Logger Options

```javascript
const logger = new CheckLogsLogger('api-key', {
  // Client options
  timeout: 5000,
  validatePayload: true,
  
  // Logger-specific options
  source: 'my-app',                    // Default source
  user_id: 123,                        // Default user ID
  defaultContext: { env: 'prod' },     // Default context
  silent: false,                       // Suppress all output
  consoleOutput: true,                 // Also log to console
  enabledLevels: ['info', 'error'],    // Only these levels
  includeTimestamp: true,              // Add timestamp to context
  includeHostname: true                // Add hostname to context
});
```

## Advanced Features

### Child Loggers

Create child loggers with inherited context:

```javascript
const mainLogger = new CheckLogsLogger('api-key', {
  defaultContext: { service: 'api' }
});

const userLogger = mainLogger.child({ module: 'user' });
const orderLogger = mainLogger.child({ module: 'orders' });

// Each child inherits parent context
await userLogger.info('User created');  // Context: { service: 'api', module: 'user' }
await orderLogger.error('Order failed'); // Context: { service: 'api', module: 'orders' }
```

### Timing Logs

Measure execution time:

```javascript
const endTimer = logger.time('db-query', 'Executing database query');

// ... your code here ...

const duration = endTimer(); // Automatically logs end time with duration
console.log(`Operation took ${duration}ms`);
```

### Statistics and Analytics

```javascript
// Get basic statistics
const stats = await client.stats.getStats();
console.log('Total logs:', stats.data.total_logs);

// Get analytics summary
const summary = await client.stats.getSummary();
console.log('Error rate:', summary.data.analytics.error_rate);

// Get specific metrics
const errorRate = await client.stats.getErrorRate();
const trend = await client.stats.getTrend();
const peakDay = await client.stats.getPeakDay();
```

### Error Handling

The SDK provides specific error types:

```javascript
const { ApiError, NetworkError, ValidationError } = require('@checklogs/node-sdk');

try {
  await logger.log({ /* invalid data */ });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message);
  } else if (error instanceof ApiError) {
    console.log('API error:', error.statusCode, error.message);
    
    if (error.isAuthError()) {
      console.log('Authentication problem');
    } else if (error.isRateLimitError()) {
      console.log('Rate limit exceeded');
    }
  } else if (error instanceof NetworkError) {
    console.log('Network problem:', error.message);
    
    if (error.isTimeoutError()) {
      console.log('Request timed out');
    }
  }
}
```

### Retry Mechanism

The logger automatically retries failed requests:

```javascript
// Check retry queue status
const status = logger.getRetryQueueStatus();
console.log(`${status.count} logs pending retry`);

// Wait for all logs to be sent
const success = await logger.flush(30000); // 30 second timeout
if (success) {
  console.log('All logs sent successfully');
}

// Clear retry queue if needed
logger.clearRetryQueue();
```

## Log Levels

Supported log levels (in order of severity):

- `debug` - Development and troubleshooting information
- `info` - General application flow
- `warning` - Potentially harmful situations
- `error` - Error events that might still allow the application to continue
- `critical` - Very severe error events that might cause the application to abort

## Data Validation

The SDK automatically validates and sanitizes data:

- **Message**: Required, max 1024 characters
- **Level**: Must be valid level, defaults to 'info'
- **Source**: Max 100 characters
- **Context**: Objects only, max 5000 characters when serialized
- **User ID**: Must be a number

## Rate Limiting and Best Practices

1. **Batch Operations**: Use child loggers for related operations
2. **Level Filtering**: Only enable necessary log levels in production
3. **Context Size**: Keep context objects reasonably small
4. **Error Handling**: Always handle potential network issues
5. **Graceful Shutdown**: Call `flush()` before app termination

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import { CheckLogsLogger, LogLevel, LogData } from '@checklogs/node-sdk';

const logger = new CheckLogsLogger('api-key');

const logData: LogData = {
  message: 'User action',
  level: 'info',
  context: { userId: 123 }
};

await logger.log(logData);
```

## Examples

### Express.js Middleware

```javascript
const express = require('express');
const { createLogger } = require('@checklogs/node-sdk');

const app = express();
const logger = createLogger('your-api-key');

// Request logging middleware
app.use((req, res, next) => {
  const requestLogger = logger.child({
    request_id: Math.random().toString(36),
    method: req.method,
    url: req.url
  });
  
  req.logger = requestLogger;
  next();
});

// Route handler
app.get('/users/:id', async (req, res) => {
  try {
    req.logger.info('Fetching user', { user_id: req.params.id });
    
    // ... your logic here ...
    
    req.logger.info('User fetched successfully');
    res.json({ user: userData });
  } catch (error) {
    req.logger.error('Failed to fetch user', { 
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Cron Job Monitoring

```javascript
const { createLogger } = require('@checklogs/node-sdk');

const logger = createLogger('your-api-key', {
  source: 'cron-job',
  defaultContext: { job: 'daily-cleanup' }
});

async function dailyCleanup() {
  const endTimer = logger.time('cleanup', 'Starting daily cleanup');
  
  try {
    logger.info('Cleanup started');
    
    // ... cleanup logic ...
    
    logger.info('Cleanup completed successfully', { 
      records_cleaned: 1500,
      duration_ms: endTimer()
    });
  } catch (error) {
    logger.critical('Cleanup failed', { 
      error: error.message,
      duration_ms: endTimer()
    });
    throw error;
  }
}
```

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: [https://docs.checklogs.dev](https://checklogs.dev/docs)
- Issues: [GitHub Issues](https://github.com/checklogs/node-sdk/issues)
- Email: contact@checklogs.dev