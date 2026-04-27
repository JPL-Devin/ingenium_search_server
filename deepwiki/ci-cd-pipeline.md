# CI/CD Pipeline

The service uses GitHub Actions for continuous integration. The pipeline runs on every push to `main` and on pull requests targeting `main`.

## Source File

`.github/workflows/ci.yml`

## Pipeline Overview

```
Trigger (push to main / PR to main)
  │
  ▼
┌─────────────────────────────────┐
│          test (Node 22)         │
│                                 │
│  1. Checkout repository         │
│  2. Setup Node.js 22            │
│  3. npm ci                      │
│  4. npm test                    │
│  5. Upload coverage artifact    │
└──────────────┬──────────────────┘
               │ (requires test to pass)
               ▼
┌─────────────────────────────────┐
│         docker-build            │
│                                 │
│  1. Checkout repository         │
│  2. Build Docker image          │
└─────────────────────────────────┘
```

## Jobs

### test

Runs the Jest test suite on Node.js 22.

| Step | Command | Description |
|------|---------|-------------|
| Checkout | `actions/checkout@v4` | Clone the repository |
| Setup Node | `actions/setup-node@v4` | Install Node.js 22 with npm cache |
| Install | `npm ci` | Clean install of all dependencies (including devDependencies) |
| Test | `npm test` | Run `jest --coverage --forceExit --detectOpenHandles` |
| Upload coverage | `actions/upload-artifact@v4` | Upload `coverage/` directory, retained for 30 days |

The coverage upload runs with `if: always()`, meaning coverage is uploaded even if tests fail (useful for debugging).

### docker-build

Builds the Docker image to verify the Dockerfile is valid. This job depends on the test job passing.

| Step | Command | Description |
|------|---------|-------------|
| Checkout | `actions/checkout@v4` | Clone the repository |
| Build | `docker build -t ingenium-search-server:${{ github.sha }} .` | Build image tagged with commit SHA |

The Docker image is built but not pushed to a registry. This job validates that the Dockerfile and build context are correct.

## Workflow Configuration

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report-node-${{ matrix.node-version }}
          path: coverage/
          retention-days: 30

  docker-build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t ingenium-search-server:${{ github.sha }} .
```

## Triggers

| Event | Condition | Jobs Run |
|-------|-----------|----------|
| Push | Branch is `main` | test → docker-build |
| Pull Request | Targets `main` | test → docker-build |

## Artifacts

| Artifact | Path | Retention | Description |
|----------|------|-----------|-------------|
| `coverage-report-node-22` | `coverage/` | 30 days | Jest coverage report (HTML, JSON, lcov) |

## Test Suite Summary

The CI pipeline runs 85 tests across 12 test suites with 98.52% statement coverage:

| Suite Category | Files | Test Count |
|---------------|-------|------------|
| Config | app-config, elasticsearch-config, mapping-config | ~20 |
| Controllers | health, search, queryBuilder | ~45 |
| Middleware | jwtAuth, addUsernameToResponse | ~10 |
| Routes | health, search, queryBuilder | ~6 |
| Utils | logger | ~4 |

## Future Considerations

- The Node version matrix currently only includes `[22]` but can be extended to test multiple versions
- Docker image is built but not pushed — a deployment step could push to a container registry
- No lint step exists in CI — consider adding ESLint
- Tests mock all external dependencies — integration tests against a real Elasticsearch instance could be added
