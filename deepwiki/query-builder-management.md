# Query Builder Management

The query builder management system provides CRUD operations for user-saved search queries. Saved queries are stored in the `querybuilder` Elasticsearch index and are scoped to the authenticated user. The implementation is in `src/controllers/queryBuilderController.js`.

## Source Files

- `src/controllers/queryBuilderController.js` - CRUD operations
- `src/routes/queryBuilderRoutes.js` - Route registration

## Routes

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/api/v1/querybuilders` | `getAllQueryBuilder` | List all saved queries for authenticated user |
| GET | `/api/v1/querybuilders/:id` | `getQueryBuilder` | Get a specific saved query by ID |
| POST | `/api/v1/querybuilders` | `postQueryBuilder` | Create a new saved query |
| DELETE | `/api/v1/querybuilders/:id` | `deleteQueryBuilder` | Delete a saved query by ID |

All endpoints require JWT authentication. The username is obtained from `res.locals.username`, which is set by the `addUsernameToResponse` middleware.

## Operations

### List All Queries (getAllQueryBuilder)

Retrieves all saved queries belonging to the authenticated user.

```
GET /api/v1/querybuilders
Authorization: Bearer <token>

→ Elasticsearch query:
  index: querybuilder
  query: { term: { username: <authenticated_user> } }

← 200: [ { id, username, name, description, queryBuilderParams }, ... ]
← 500: { message: "Internal server error" }
```

The query uses a `term` filter on the `username` field, ensuring users can only see their own saved queries.

### Get Single Query (getQueryBuilder)

Retrieves a specific saved query by ID, with ownership verification.

```
GET /api/v1/querybuilders/:id
Authorization: Bearer <token>

→ Elasticsearch query:
  index: querybuilder
  query: {
    bool: {
      must: [
        { match: { _id: <id> } },
        { term: { username: <authenticated_user> } }
      ]
    }
  }

← 200: [ { id, username, name, description, queryBuilderParams } ]
← 500: { message: "Internal server error" }
```

The query combines both the document ID and the username, preventing users from accessing queries owned by other users (IDOR protection).

### Create Query (postQueryBuilder)

Creates a new saved query, associating it with the authenticated user.

```
POST /api/v1/querybuilders
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Search Query",
  "description": "Searches for active elements",
  "queryBuilderParams": { ... }
}

→ Elasticsearch index operation:
  index: querybuilder
  body: { username, name, description, queryBuilderParams }

← 201: { id, name, description, queryBuilderParams }
← 500: { message: "Internal server error" }
```

The `username` is automatically added to the document body from the authenticated user's token. Clients do not need to (and should not) supply it.

### Delete Query (deleteQueryBuilder)

Deletes a saved query after verifying ownership.

```
DELETE /api/v1/querybuilders/:id
Authorization: Bearer <token>

→ Step 1: Verify ownership
  Elasticsearch search:
    index: querybuilder
    query: {
      bool: {
        must: [
          { match: { _id: <id> } },
          { term: { username: <authenticated_user> } }
        ]
      }
    }

  If no results → 404: { message: "Query not found" }

→ Step 2: Delete document
  Elasticsearch delete:
    index: querybuilder
    id: <id>

← 200: { message: "Deleted successfully", id }
← 404: { message: "Query not found" }
← 500: { message: "Internal server error" }
```

The delete operation uses a two-step process:
1. **Search** to verify the document exists and belongs to the authenticated user
2. **Delete** the document by ID

This prevents users from deleting queries owned by other users.

## Data Model

Documents in the `querybuilder` index have the following structure:

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Auto-generated Elasticsearch document ID |
| `username` | string | Owner's username (from JWT) |
| `name` | string | User-defined query name |
| `description` | string | User-defined query description |
| `queryBuilderParams` | object | Query builder configuration (rules, conditions, operators) |

## Security Model

| Operation | Authorization Check |
|-----------|-------------------|
| List all | Filtered by `{ term: { username } }` |
| Get by ID | Filtered by `{ bool: { must: [_id, username] } }` |
| Create | Username injected from token, not from request body |
| Delete | Ownership verified via search before delete |

All error responses return a generic "Internal server error" message to prevent information disclosure.
