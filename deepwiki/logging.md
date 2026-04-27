# Logging

The service uses Winston for structured logging. All application modules use a shared logger instance instead of `console.log`.

## Source File

`src/utils/logger.js`

## Logger Configuration

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  ],
});
```

### Configuration Details

| Property | Value | Description |
|----------|-------|-------------|
| Level | `info` | Minimum log level (info, warn, error) |
| Timestamp | ISO 8601 | Automatic timestamp on every log entry |
| Format | `[timestamp] LEVEL: message` | Structured format for log output |
| Transport | Console | Logs to stdout with colorized output |

### Output Format

```
[2026-04-24T12:00:00.000Z] INFO: Server running on port 3025
[2026-04-24T12:00:01.000Z] ERROR: Unhandled error: Something went wrong
[2026-04-24T12:00:02.000Z] WARN: Validation error in search: Search value exceeds maximum length
```

## Log Levels Used

| Level | Usage | Examples |
|-------|-------|---------|
| `info` | Normal operations | Connection attempts, data received, index created, server started |
| `warn` | Client-side issues | Validation errors (e.g., search value too long) |
| `error` | Server-side failures | Elasticsearch errors, unhandled exceptions, connection failures |

## Usage Across Modules

| Module | Log Events |
|--------|-----------|
| `src/app.js` | Server startup, unhandled errors in error handler |
| `src/config/elasticsearch-config.js` | Connection attempts, connection success/failure, index creation, mapping application, settings updates |
| `src/controllers/searchController.js` | Query parameters, built queries, search results received, validation errors, search errors |
| `src/controllers/queryBuilderController.js` | Data received, data entered, data deleted, operation errors |

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Winston over `console.log` | Structured logging with timestamps, levels, and extensible transports |
| Console-only transport | Suitable for containerized deployments where logs are collected from stdout |
| `info` as minimum level | Balances operational visibility with log volume |
| `warn` for validation errors | Distinguishes client-caused issues from server failures in log analysis |
| No file transport | Follows 12-factor app principles — logs are event streams written to stdout |
