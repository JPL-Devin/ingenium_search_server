# Error Handling

The service implements a layered error handling strategy that distinguishes between client errors and server errors, preventing internal details from leaking to API consumers.

## Error Handling Layers

```
Request
  │
  ▼
Controller try/catch blocks          ← Domain-specific error handling
  │
  ▼
Global Express error handler         ← Catches middleware and route errors
  │
  ▼
Response to client
```

## Global Error Handler

The global error handler is registered in `src/app.js` after all routes and middleware:

```javascript
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) {
    res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    });
  } else {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(err.status || 500).json({
      message: 'Internal server error',
    });
  }
});
```

### Behavior

| Error Type | HTTP Status | Response Body | Logging |
|-----------|-------------|---------------|---------|
| Client error (status < 500) | Original status | `{ message, errors }` | None |
| Server error (status >= 500) | Original status or 500 | `{ message: "Internal server error" }` | `logger.error()` |
| No status set | 500 | `{ message: "Internal server error" }` | `logger.error()` |

### Error Sources Handled

| Source | Error Type | Example |
|--------|-----------|---------|
| `express-jwt` | 401 (client) | Invalid or missing JWT token |
| `express-openapi-validator` | 400/415 (client) | Request validation failure |
| `express-openapi-validator` | 500 (server) | Response validation failure |
| Route handlers | Various | Errors passed via `next(err)` |

## Controller-Level Error Handling

Each controller wraps its Elasticsearch operations in try/catch blocks:

### searchController.js

```javascript
try {
  // ... build query and execute search
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn(`Validation error in search: ${error.message}`);
    res.status(400).json({ message: error.message });
  } else {
    logger.error(`Error searching data in search: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

The search controller uses a custom `ValidationError` class to distinguish input validation errors (400) from server errors (500):

| Error | Status | Message | Log Level |
|-------|--------|---------|-----------|
| `ValidationError` (value too long) | 400 | Descriptive message | `warn` |
| Elasticsearch error | 500 | "Internal server error" | `error` |

### queryBuilderController.js

All four CRUD operations follow the same pattern:

```javascript
try {
  // ... Elasticsearch operation
} catch (error) {
  logger.error(`Error <operation>: ${error}`);
  res.status(500).json({ message: 'Internal server error' });
}
```

The delete operation also has an explicit 404 response for ownership check failures:

```javascript
if (verifyOwnership.hits.hits.length === 0) {
  res.status(404).json({ message: 'Query not found' });
  return;
}
```

## Error Response Formats

### Client Error (400)

```json
{
  "message": "Invalid index specified"
}
```

or with validation details from OpenAPI validator:

```json
{
  "message": "request/body must have required property 'queryBuilderParams'",
  "errors": [
    {
      "path": "/body/queryBuilderParams",
      "message": "must have required property 'queryBuilderParams'"
    }
  ]
}
```

### Authentication Error (401)

```json
{
  "message": "No authorization token was found"
}
```

### Not Found (404)

```json
{
  "message": "Query not found"
}
```

### Server Error (500)

```json
{
  "message": "Internal server error"
}
```

## Security Considerations

The error handling strategy is designed to prevent information disclosure:

| Risk | Mitigation |
|------|-----------|
| Elasticsearch connection strings in errors | Server errors return generic message |
| Stack traces in responses | Server errors return generic message |
| Internal error details | Only logged server-side, never returned to client |
| Validation errors polluting error logs | `ValidationError` logged at `warn` level, not `error` |

## Startup Errors

Certain errors during startup cause the process to exit immediately:

| Condition | Exit Code | Log Message |
|-----------|-----------|-------------|
| `PUBLIC_PEM` not set | 1 | "FATAL: PUBLIC_PEM environment variable is required" |
| Elasticsearch unavailable after 20 retries | 1 | "Elastic Search is not available. Exit Ingenium Search Service" |
| Index creation failure | 1 | "Failed to create index {name} in ElasticSearch: {error}" |
| Mapping configuration failure | 1 | "Failed to set mapping for index {name} in ElasticSearch: {error}" |
| Index settings failure | 1 | "Failed to configure index {name} in ElasticSearch: {error}" |
