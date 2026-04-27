# Configuration System

The configuration system loads settings from environment variables at startup and exports a configuration object used throughout the application. It is defined in `src/config/app-config.js`.

## Source File

`src/config/app-config.js`

## Configuration Properties

| Property | Environment Variable | Type | Default | Required | Description |
|----------|---------------------|------|---------|----------|-------------|
| `PORT` | `PORT` | number | `3025` | No | HTTP server listening port |
| `API_VERSION` | — | string | `v1` | — | API version prefix for all routes (hardcoded) |
| `public_pem` | `PUBLIC_PEM` | string | — | **Yes** | RSA public key for JWT verification |
| `ELASTIC_SEARCH_HOST` | `ELASTIC_SEARCH_HOST` | string | `http://127.0.0.1:19200` | No | Elasticsearch connection URL |
| `index_mapping_total_fields_limit` | `INDEX_MAPPING_TOTAL_FIELDS_LIMIT` | number | `20000` | No | Maximum number of fields per ES index |
| `index_max_result_window` | `INDEX_MAX_RESULT_WINDOW` | number | `20000000` | No | Maximum `from + size` for ES search pagination |
| `elastic_search_indices` | — | string[] | `['syncdata', 'querybuilder', 'element', 'procedure_element']` | — | List of managed ES indices (hardcoded) |

## Startup Validation

The configuration module validates that `PUBLIC_PEM` is set. If it is missing, the application logs a fatal error and exits immediately:

```javascript
if (!process.env.PUBLIC_PEM) {
  console.error('FATAL: PUBLIC_PEM environment variable is required');
  process.exit(1);
}
```

This is a hard requirement because without a public key, JWT authentication cannot function, and the service would be unable to verify any tokens.

## Integer Parsing

Numeric configuration values use a safe parsing pattern that falls back to defaults when the environment variable is not a valid integer:

```javascript
config.PORT = isNaN(parseInt(process.env.PORT)) ? 3025 : parseInt(process.env.PORT);
```

This handles cases where:
- The environment variable is not set (`undefined` → `NaN` → default)
- The environment variable is empty or non-numeric (`""` → `NaN` → default)
- The environment variable is a valid number (`"8080"` → `8080`)

## Usage

The configuration object is imported by multiple modules:

```
src/config/app-config.js
  ├── src/app.js                    → PORT, API_VERSION
  ├── src/middlewares/jwtAuth.js     → public_pem
  ├── src/config/elasticsearch-config.js → ELASTIC_SEARCH_HOST, elastic_search_indices,
  │                                        index_mapping_total_fields_limit,
  │                                        index_max_result_window
  └── src/routes/*.js (via app.js)  → API_VERSION (route prefix)
```

## Example .env File

```bash
# Server
PORT=3025

# JWT Public Key (RS256)
PUBLIC_PEM="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"

# Elasticsearch
ELASTIC_SEARCH_HOST=http://localhost:9200

# Index Settings (optional)
INDEX_MAPPING_TOTAL_FIELDS_LIMIT=20000
INDEX_MAX_RESULT_WINDOW=20000000
```
