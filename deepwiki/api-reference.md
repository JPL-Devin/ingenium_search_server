# API Reference

The Ingenium Search Server exposes a RESTful API under the `/api/v1` prefix. The API is defined by an OpenAPI 3.0 specification at `src/api/openapi.yaml` and validated at runtime by `express-openapi-validator`.

## Base URL

```
/api/v1
```

## Authentication

All endpoints except health and API docs require a JWT bearer token:

```
Authorization: Bearer <token>
```

The token must be signed with RS256 using the private key corresponding to the configured `PUBLIC_PEM`.

## Endpoints

### Health Check

```
GET /api/v1/health
```

No authentication required.

**Response 200:**
```json
{
  "status": "OK",
  "message": "Service is running"
}
```

### Search

```
POST /api/v1/search
```

Requires authentication.

**Request Body:**
```json
{
  "queryBuilderParams": {
    "condition": "AND",
    "rules": [
      {
        "field": "title,description",
        "operator": "=",
        "value": "search term"
      },
      {
        "field": "created_date",
        "operator": ">=",
        "value": "2023-01-01"
      }
    ]
  },
  "limit": 50,
  "offset": 0,
  "index": "element"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `queryBuilderParams` | object | Yes | Query builder configuration with conditions and rules |
| `queryBuilderParams.condition` | string | Yes | Logical operator: `"AND"` or `"OR"` |
| `queryBuilderParams.rules` | array | Yes | Array of rules or nested condition groups |
| `queryBuilderParams.rules[].field` | string | Yes | Field name(s) to search, comma-separated for multi-field |
| `queryBuilderParams.rules[].operator` | string | Yes | Comparison operator: `=`, `==`, `>`, `>=`, `<`, `<=`, `!=`, `!==` |
| `queryBuilderParams.rules[].value` | any | Yes | Search value (strings capped at 256 characters) |
| `limit` | number | No | Maximum results to return (page size) |
| `offset` | number | No | Number of results to skip (pagination offset) |
| `index` | string | No | Index to search: `"element"`, `"procedure_element"`, or `"all"` (default: `"all"`) |

**Response 200:**
```json
{
  "results": [
    {
      "id": "abc123",
      "title": "Example Element",
      "description": "An example element document"
    }
  ],
  "total": 1
}
```

**Response 400:**
```json
{
  "message": "Invalid index specified"
}
```

**Response 400 (value too long):**
```json
{
  "message": "Search value exceeds maximum length of 256 characters"
}
```

**Response 500:**
```json
{
  "message": "Internal server error"
}
```

### List Saved Queries

```
GET /api/v1/querybuilders
```

Requires authentication. Returns only queries owned by the authenticated user.

**Response 200:**
```json
[
  {
    "id": "query_id_1",
    "username": "jdoe",
    "name": "Active Elements",
    "description": "All currently active elements",
    "queryBuilderParams": { ... }
  }
]
```

### Get Saved Query

```
GET /api/v1/querybuilders/{id}
```

Requires authentication. Returns the query only if owned by the authenticated user.

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `id` | path | string | Yes | Query builder item ID |

**Response 200:**
```json
[
  {
    "id": "query_id_1",
    "username": "jdoe",
    "name": "Active Elements",
    "description": "All currently active elements",
    "queryBuilderParams": { ... }
  }
]
```

### Create Saved Query

```
POST /api/v1/querybuilders
```

Requires authentication. The username is automatically associated from the JWT token.

**Request Body:**
```json
{
  "name": "My Query",
  "description": "Description of the query",
  "queryBuilderParams": {
    "condition": "AND",
    "rules": [
      { "field": "status", "operator": "==", "value": "active" }
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name for the saved query |
| `description` | string | Yes | Description of the query |
| `queryBuilderParams` | object | Yes | Query builder configuration |

**Response 201:**
```json
{
  "id": "generated_id",
  "name": "My Query",
  "description": "Description of the query",
  "queryBuilderParams": { ... }
}
```

### Delete Saved Query

```
DELETE /api/v1/querybuilders/{id}
```

Requires authentication. Only the owner can delete a query.

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `id` | path | string | Yes | Query builder item ID |

**Response 200:**
```json
{
  "message": "Deleted successfully",
  "id": "query_id_1"
}
```

**Response 404:**
```json
{
  "message": "Query not found"
}
```

## Swagger UI

Interactive API documentation is available at:

```
http://<host>:3025/api-docs
```

This endpoint does not require authentication and serves the OpenAPI specification via Swagger UI.

## OpenAPI Specification

The full OpenAPI 3.0 specification is defined in `src/api/openapi.yaml`. It includes:

- Path definitions for all endpoints
- Request body schemas with validation rules
- Response schemas with examples
- Bearer token security scheme
- Component schema definitions for reusable types

The specification is enforced at runtime by `express-openapi-validator`, which validates both incoming requests and outgoing responses.
