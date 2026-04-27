# Architecture Overview

Ingenium Search Server follows a layered Express.js microservice architecture. Incoming HTTP requests pass through a middleware pipeline before reaching route handlers, which delegate to controllers that interact with Elasticsearch.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Application                       │
│                   (Authorization: Bearer <JWT>)                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express.js Application                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Middleware Pipeline                      │  │
│  │                                                           │  │
│  │  1. express.json({ limit: '100kb' })                      │  │
│  │  2. cors()                                                │  │
│  │  3. jwtAuth (express-jwt, RS256)                          │  │
│  │  4. addUsernameToResponse (req.auth → res.locals)         │  │
│  │  5. OpenAPI Validator (request + response validation)     │  │
│  │                                                           │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │                      Route Layer                          │  │
│  │                                                           │  │
│  │  /api/v1/health        → healthRoutes                     │  │
│  │  /api/v1/search        → searchRoutes                     │  │
│  │  /api/v1/querybuilders → queryBuilderRoutes               │  │
│  │  /api-docs             → Swagger UI                       │  │
│  │                                                           │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │                   Controller Layer                         │  │
│  │                                                           │  │
│  │  healthController      → health status                    │  │
│  │  searchController      → query building + ES search       │  │
│  │  queryBuilderController → saved query CRUD                │  │
│  │                                                           │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │                   Error Handler                           │  │
│  │                                                           │  │
│  │  Client errors (< 500): pass through message + errors     │  │
│  │  Server errors (>= 500): generic "Internal server error"  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Elasticsearch 8.x                        │
│                                                                 │
│  Indices:                                                       │
│  ┌──────────┐ ┌──────────────┐ ┌─────────┐ ┌─────────────────┐ │
│  │ syncdata │ │ querybuilder │ │ element │ │procedure_element│ │
│  └──────────┘ └──────────────┘ └─────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

1. **Client** sends an HTTP request with a JWT bearer token in the `Authorization` header.
2. **JSON parser** extracts the request body (limited to 100kb).
3. **CORS middleware** adds cross-origin headers.
4. **JWT authentication** validates the token using the RS256 algorithm and the configured public key. Unauthenticated requests to protected endpoints receive a 401 response. The `/api/v1/health` and `/api-docs` paths are excluded from authentication.
5. **Username extraction** reads `req.auth.username` (populated by express-jwt) and stores it on `res.locals.username` for downstream use.
6. **OpenAPI validation** checks the request against the OpenAPI 3.0 spec (`src/api/openapi.yaml`). Invalid requests are rejected with a 400 response. Responses are also validated.
7. **Route handlers** dispatch to the appropriate controller based on the URL path.
8. **Controllers** execute business logic, interacting with Elasticsearch via the `@elastic/elasticsearch` client.
9. **Error handler** catches any errors. Client errors (status < 500) pass through with their original message. Server errors return a generic "Internal server error" to prevent information disclosure.

## Startup Sequence

```
startService()
  │
  ├─ Validate PUBLIC_PEM (exit if missing)
  ├─ Create Elasticsearch client
  ├─ initElasticsearch()
  │   ├─ Retry connection up to 20 times (5s interval)
  │   ├─ Create missing indices (syncdata, querybuilder, element, procedure_element)
  │   ├─ Apply mappings to new indices
  │   └─ Update index settings (field limits, result window)
  │
  └─ app.listen(PORT)
```

## Directory Structure

```
src/
├── api/
│   └── openapi.yaml             # OpenAPI 3.0 specification
├── config/
│   ├── app-config.js            # Environment configuration
│   ├── elasticsearch-config.js  # ES client + index initialization
│   └── mapping-config.js        # Index mapping definitions
├── controllers/
│   ├── healthController.js      # Health check handler
│   ├── queryBuilderController.js # Saved query CRUD
│   └── searchController.js      # Search query execution
├── middlewares/
│   ├── addUsernameToResponse.js # Username extraction
│   └── jwtAuth.js               # JWT authentication
├── routes/
│   ├── healthRoutes.js          # GET /health
│   ├── queryBuilderRoutes.js    # CRUD /querybuilders
│   └── searchRoutes.js          # POST /search
└── utils/
    └── logger.js                # Winston logger
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Express-jwt for auth | Decodes JWT once; downstream middleware reads `req.auth` instead of re-parsing tokens |
| Ownership checks on queries | Prevents IDOR — users can only access their own saved queries |
| Index allowlist | Prevents Elasticsearch index injection by restricting searchable indices to `element`, `procedure_element`, and `all` |
| Generic 500 error messages | Prevents internal error details (stack traces, ES connection strings) from leaking to clients |
| Per-index settings | Uses per-index `putSettings` instead of `_all` to avoid affecting unmanaged indices |
| Alpine Docker image | Smaller image size (~180MB vs ~900MB for full Node image) |
| Error handler after routes | Ensures the error handler catches errors from all route handlers and middleware |
