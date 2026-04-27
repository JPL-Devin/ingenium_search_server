# Testing

The service uses Jest as its test framework. The test suite covers configuration, controllers, middleware, routes, and utilities with 98.52% statement coverage. All external dependencies (Elasticsearch, JWT) are mocked.

## Test Command

```bash
npm test
# Runs: jest --coverage --forceExit --detectOpenHandles
```

## Test Structure

```
tests/
└── unit/
    ├── config/
    │   ├── app-config.test.js           # Application configuration
    │   ├── elasticsearch-config.test.js  # ES client and initialization
    │   └── mapping-config.test.js        # Index mapping definitions
    ├── controllers/
    │   ├── healthController.test.js      # Health check endpoint
    │   ├── queryBuilderController.test.js # Saved query CRUD
    │   └── searchController.test.js      # Search query execution
    ├── middlewares/
    │   ├── addUsernameToResponse.test.js # Username extraction
    │   └── jwtAuth.test.js              # JWT authentication
    ├── routes/
    │   ├── healthRoutes.test.js          # Health route registration
    │   ├── queryBuilderRoutes.test.js    # Query builder route registration
    │   └── searchRoutes.test.js          # Search route registration
    └── utils/
        └── logger.test.js               # Winston logger configuration
```

## Test Summary

| Suite | File | Tests | Description |
|-------|------|-------|-------------|
| Config | app-config.test.js | 7 | Port parsing, API version, PUBLIC_PEM validation, ES host, index limits |
| Config | elasticsearch-config.test.js | 8 | Client creation, connection retries, index creation, mapping, settings |
| Config | mapping-config.test.js | 5 | Mapping structure, field types, dynamic templates |
| Controllers | healthController.test.js | 1 | Health status response |
| Controllers | searchController.test.js | 20 | All operators, multi-field, pagination, error handling, index validation |
| Controllers | queryBuilderController.test.js | 18 | CRUD operations, ownership checks, error handling |
| Middleware | addUsernameToResponse.test.js | 5 | Username extraction, missing auth, missing username |
| Middleware | jwtAuth.test.js | 5 | Export validation, middleware function, route protection |
| Routes | healthRoutes.test.js | 2 | Route registration, GET handler |
| Routes | queryBuilderRoutes.test.js | 2 | Route registration, CRUD handlers |
| Routes | searchRoutes.test.js | 2 | Route registration, POST handler |
| Utils | logger.test.js | 10 | Logger instance, transports, log levels, format |
| **Total** | **12 suites** | **85** | **98.52% statement coverage** |

## Mocking Strategy

All external dependencies are mocked to isolate unit tests from infrastructure:

### Elasticsearch Client

```javascript
jest.mock('../../../src/config/elasticsearch-config', () => ({
  client: {
    search: jest.fn(),
    index: jest.fn(),
    delete: jest.fn(),
  },
}));
```

### Environment Variables

Tests that depend on configuration use `beforeEach` to set up the environment:

```javascript
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv, PUBLIC_PEM: 'test-pem-key' };
});
```

The `PUBLIC_PEM` variable must be set in test setup because the `app-config` module calls `process.exit(1)` if it is missing.

### Process.exit

Tests that verify fatal error behavior mock `process.exit`:

```javascript
test('should exit process when PUBLIC_PEM is not set', () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  delete process.env.PUBLIC_PEM;
  require('../../../src/config/app-config');
  expect(mockExit).toHaveBeenCalledWith(1);
  mockExit.mockRestore();
});
```

### Elasticsearch Connection Retries

The elasticsearch-config tests use Jest fake timers to avoid waiting for real 5-second retry delays:

```javascript
jest.useFakeTimers();
// ... advance timers in a loop to simulate 20 retries × 5s
```

## Key Test Behaviors Validated

### Security Tests

| Test | Validates |
|------|-----------|
| Generic error messages | Controllers return "Internal server error" for 500s, not raw ES errors |
| Ownership checks | `getQueryBuilder` and `deleteQueryBuilder` include username filter |
| Delete ownership verification | `deleteQueryBuilder` searches before deleting, returns 404 if not owned |
| Index allowlist | Invalid index names return 400 |
| Value length limit | Search values > 256 chars return 400 with descriptive message |
| PUBLIC_PEM validation | Missing PUBLIC_PEM causes process.exit(1) |

### Search Operator Tests

| Test | Operator | Expected ES Query Type |
|------|----------|----------------------|
| Wildcard match | `=` | `wildcard` with `*value*` |
| Exact match | `==` | `match` |
| Greater than | `>` | `range.gt` |
| Greater than or equal | `>=` | `range.gte` |
| Less than | `<` | `range.lt` |
| Less than or equal | `<=` | `range.lte` |
| Not wildcard match | `!=` | `bool.must_not` + `wildcard` |
| Not exact match | `!==` | `bool.must_not` + `match` |
| Multi-field | `=` on `"a,b"` | `bool.should` with multiple wildcards |
| Nested conditions | AND/OR nesting | Recursive `bool.must`/`bool.should` |

### Middleware Tests

| Test | Validates |
|------|-----------|
| Username from req.auth | `req.auth.username` is copied to `res.locals.username` |
| Missing auth | `next()` called, no error |
| Missing username claim | `next()` called, `res.locals.username` is undefined |
| JWT export | `jwtAuth` is a function |
| Route exclusions | Health and api-docs paths are excluded from auth |

## Coverage

```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   98.52 |       95 |     100 |   98.48 |
 config            |     100 |      100 |     100 |     100 |
 controllers       |   97.43 |    93.18 |     100 |   97.32 |
 middlewares       |     100 |      100 |     100 |     100 |
 routes            |     100 |      100 |     100 |     100 |
 utils             |     100 |      100 |     100 |     100 |
-------------------|---------|----------|---------|---------|-------------------
```
