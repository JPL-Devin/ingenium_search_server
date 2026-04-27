# Application Entry Point

The application entry point is `src/app.js`. It creates the Express application, configures the middleware pipeline, loads routes, sets up error handling, and starts the HTTP server.

## Source File

`src/app.js`

## Module Dependencies

```
src/app.js
├── express
├── fs
├── path
├── src/config/app-config.js         → config (PORT, API_VERSION, public_pem)
├── src/middlewares/jwtAuth.js        → JWT authentication middleware
├── src/middlewares/addUsernameToResponse.js → username extraction
├── src/config/elasticsearch-config.js → initElasticsearch()
├── cors
├── express-openapi-validator
├── src/utils/logger.js              → Winston logger
├── swagger-ui-express
└── yaml                             → OpenAPI spec parser
```

## Middleware Pipeline

Middleware is registered in a specific order. Each layer processes the request before passing it to the next:

```
Request
  │
  ▼
express.json({ limit: '100kb' })     ← Parse JSON body, reject payloads > 100kb
  │
  ▼
cors()                                ← Add CORS headers for cross-origin access
  │
  ▼
jwtAuth                               ← Validate JWT (RS256), populate req.auth
  │                                      Excludes: /api-docs/*, /api/v1/health
  ▼
addUsernameToResponse                 ← Copy req.auth.username → res.locals.username
  │
  ▼
OpenApiValidator.middleware()         ← Validate request/response against openapi.yaml
  │
  ▼
Swagger UI (/api-docs)               ← Serve interactive API documentation
  │
  ▼
loadRoutes(app)                       ← Register all route files under /api/v1
  │
  ▼
Error Handler                         ← Catch errors from all above middleware/routes
```

## Route Loading

The `loadRoutes` function dynamically loads all `.js` files from the `src/routes/` directory and registers them under the `/api/{API_VERSION}` prefix:

```javascript
function loadRoutes(app) {
  const routesPath = path.join(__dirname, 'routes');
  fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js')) {
      const route = require(path.join(routesPath, file));
      app.use(`/api/${config.API_VERSION}`, route);
    }
  });
}
```

This means all routes are automatically discovered. Adding a new route file to `src/routes/` is sufficient to register it.

## Swagger UI

The OpenAPI specification at `src/api/openapi.yaml` is parsed at startup using the `yaml` package and served via `swagger-ui-express` at `/api-docs`:

```javascript
const swaggerDocument = YAML.parse(
  fs.readFileSync(path.join(__dirname, './api/openapi.yaml'), 'utf8')
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

## Error Handling

The global error handler is registered after all routes to ensure it catches errors from route handlers and middleware:

```javascript
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) {
    // Client errors: pass through original message
    res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    });
  } else {
    // Server errors: generic message to prevent info disclosure
    logger.error(`Unhandled error: ${err.message}`);
    res.status(err.status || 500).json({
      message: 'Internal server error',
    });
  }
});
```

Key behaviors:
- Client errors (status < 500) return the original error message and validation details
- Server errors (status >= 500) return a generic "Internal server error" message
- Server errors are logged with Winston before returning the generic response
- This prevents Elasticsearch connection strings, stack traces, and internal details from reaching clients

## Startup Sequence

```javascript
async function startService() {
  await initElasticsearch();
  app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`);
  });
}

startService();
```

The startup flow:
1. `initElasticsearch()` connects to Elasticsearch, creates missing indices, applies mappings, and configures settings
2. If Elasticsearch is unavailable after 20 retries (100 seconds total), the process exits
3. Once Elasticsearch is ready, the HTTP server starts listening on the configured port (default: 3025)
