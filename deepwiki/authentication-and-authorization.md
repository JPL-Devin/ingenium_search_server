# Authentication and Authorization

The service uses JWT (JSON Web Token) authentication with RSA public key verification. Authentication is implemented as two middleware layers: token validation and username extraction.

## Source Files

- `src/middlewares/jwtAuth.js` - JWT token validation
- `src/middlewares/addUsernameToResponse.js` - Username extraction from decoded token

## Authentication Flow

```
Client Request
  │
  │  Authorization: Bearer <JWT>
  ▼
┌─────────────────────────────────────┐
│         jwtAuth Middleware           │
│                                     │
│  1. Extract token from header       │
│  2. Verify signature (RS256)        │
│  3. Decode payload → req.auth       │
│                                     │
│  Excluded paths:                    │
│  - /api-docs/*                      │
│  - /api/v1/health                   │
│                                     │
│  On failure → 401 Unauthorized      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   addUsernameToResponse Middleware   │
│                                     │
│  if (req.auth && req.auth.username) │
│    res.locals.username = username    │
│                                     │
└──────────────┬──────────────────────┘
               │
               ▼
         Route Handler
    (uses res.locals.username)
```

## JWT Validation (jwtAuth.js)

The JWT middleware uses `express-jwt` to validate tokens:

```javascript
var { expressjwt } = require("express-jwt");
const config = require('../config/app-config');

const jwtAuth = expressjwt({
  secret: config.public_pem,
  algorithms: ['RS256'],
  requestProperty: 'auth',
}).unless({ path: [/^\/api-docs\/?.*/, '/api/v1/health'] });
```

### Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `secret` | `config.public_pem` | RSA public key from `PUBLIC_PEM` env var |
| `algorithms` | `['RS256']` | Only RS256 algorithm accepted (prevents algorithm confusion attacks) |
| `requestProperty` | `'auth'` | Decoded token payload is stored on `req.auth` |

### Excluded Paths

These endpoints do not require authentication:

| Path Pattern | Description |
|-------------|-------------|
| `/api-docs/*` | Swagger UI documentation |
| `/api/v1/health` | Health check endpoint |

### Error Responses

When authentication fails, `express-jwt` returns:
- **401 Unauthorized** - Missing or invalid token
- **401 Unauthorized** - Expired token
- **401 Unauthorized** - Token signed with wrong algorithm

## Username Extraction (addUsernameToResponse.js)

After JWT validation, the username is extracted from the decoded token and made available to controllers:

```javascript
function addUsernameToResponse(req, res, next) {
  if (req.auth && req.auth.username) {
    res.locals.username = req.auth.username;
  }
  next();
}
```

This middleware:
1. Reads `req.auth.username` from the decoded JWT payload (populated by `express-jwt`)
2. Stores it on `res.locals.username` where controllers can access it
3. Always calls `next()` — if username is missing, the request proceeds but `res.locals.username` will be `undefined`

### Important Note

The middleware expects the JWT payload to contain a `username` claim. If the JWT uses a different claim name (e.g., `sub`, `preferred_username`, `email`), the username will not be extracted and ownership-scoped operations will not function correctly.

## Authorization (Ownership Checks)

Authorization is enforced at the controller level, not in middleware. The `queryBuilderController` uses `res.locals.username` to scope data access:

| Operation | Authorization Logic |
|-----------|-------------------|
| `GET /querybuilders` | Filters by `{ term: { username } }` — returns only the user's queries |
| `GET /querybuilders/:id` | Filters by `{ bool: { must: [{ match: { _id } }, { term: { username } }] } }` |
| `POST /querybuilders` | Stores `username` in the document body |
| `DELETE /querybuilders/:id` | Verifies ownership via search before deleting; returns 404 if not owned |

The `searchController` does not have ownership checks — search results are not user-scoped.

## Security Considerations

| Measure | Implementation |
|---------|---------------|
| Algorithm restriction | Only RS256 accepted; prevents HS256 confusion attacks |
| Public key validation | App exits at startup if `PUBLIC_PEM` is not set |
| No redundant verification | Username is read from `req.auth` (already verified by express-jwt) rather than re-verifying the token |
| Ownership enforcement | Query builder CRUD operations are scoped to the authenticated user |
