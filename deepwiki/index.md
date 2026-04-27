# Ingenium Search Server

Ingenium Search Server is a Node.js microservice that provides advanced search functionality over Elasticsearch. It is part of the Ingenium platform developed at NASA's Jet Propulsion Laboratory (JPL). The service exposes a RESTful API for executing complex search queries, managing saved query builder configurations, and performing health checks, all secured with JWT-based authentication.

## Purpose and Scope

The service acts as a search abstraction layer between client applications and Elasticsearch. Rather than exposing Elasticsearch directly, it provides:

- A structured query builder interface that translates user-defined rules and conditions into Elasticsearch queries
- User-scoped saved queries (query builder items) stored in Elasticsearch
- JWT authentication and per-user data isolation
- OpenAPI 3.0 request/response validation
- Automatic Elasticsearch index creation and configuration on startup

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | >= 22.0.0 (LTS) |
| Framework | Express.js | 4.22.x |
| Search Engine | Elasticsearch | 8.x (client 8.19.x) |
| Authentication | express-jwt + jsonwebtoken | RS256 |
| API Specification | OpenAPI 3.0 | express-openapi-validator 5.6.x |
| Logging | Winston | 3.19.x |
| Testing | Jest | 29.7.x |
| Container | Docker (Alpine) | node:22-alpine |
| CI/CD | GitHub Actions | Node 22 matrix |

## Wiki Contents

- [Architecture Overview](architecture-overview.md) - System architecture and request flow
- [Application Entry Point](application-entry-point.md) - Express app setup and middleware pipeline
- [Configuration System](configuration-system.md) - Environment variables and app configuration
- [Elasticsearch Integration](elasticsearch-integration.md) - Client setup, index management, and mappings
- [Authentication and Authorization](authentication-and-authorization.md) - JWT middleware and user scoping
- [Search System](search-system.md) - Query builder, operators, and search execution
- [Query Builder Management](query-builder-management.md) - CRUD operations for saved queries
- [API Reference](api-reference.md) - Complete endpoint documentation
- [Error Handling](error-handling.md) - Error handling strategy and response format
- [Logging](logging.md) - Winston logger configuration
- [Docker Deployment](docker-deployment.md) - Container build and deployment
- [CI/CD Pipeline](ci-cd-pipeline.md) - GitHub Actions workflow
- [Testing](testing.md) - Jest test suite and coverage

## Source References

| Path | Description |
|------|-------------|
| `src/app.js` | Application entry point and middleware pipeline |
| `src/config/app-config.js` | Environment-based application configuration |
| `src/config/elasticsearch-config.js` | Elasticsearch client and index initialization |
| `src/config/mapping-config.js` | Elasticsearch index mapping definitions |
| `src/controllers/searchController.js` | Search query execution and query building |
| `src/controllers/queryBuilderController.js` | Saved query CRUD operations |
| `src/controllers/healthController.js` | Health check endpoint |
| `src/middlewares/jwtAuth.js` | JWT authentication middleware |
| `src/middlewares/addUsernameToResponse.js` | Username extraction middleware |
| `src/routes/searchRoutes.js` | Search route registration |
| `src/routes/queryBuilderRoutes.js` | Query builder route registration |
| `src/routes/healthRoutes.js` | Health route registration |
| `src/utils/logger.js` | Winston logger instance |
| `src/api/openapi.yaml` | OpenAPI 3.0 specification |
