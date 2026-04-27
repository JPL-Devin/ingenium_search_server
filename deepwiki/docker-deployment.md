# Docker Deployment

The service is containerized using Docker with a production-optimized Alpine-based image. The Dockerfile and `.dockerignore` are configured for minimal image size and security.

## Source Files

- `Dockerfile` - Container build instructions
- `.dockerignore` - Files excluded from the build context

## Dockerfile

```dockerfile
# Use the official Node.js 22 LTS Alpine image
FROM node:22-alpine

# Set the working directory to /app
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install production dependencies only using clean install
RUN npm ci --omit=dev

# Copy only the application source code
COPY src/ ./src/

# Switch to non-root user
USER appuser

# Expose port 3025 for the microservice
EXPOSE 3025

# Start the microservice
CMD ["node", "src/app.js"]
```

## Build Stages

```
Stage 1: Base Image
  └─ node:22-alpine (~180MB vs ~900MB for full Node image)

Stage 2: User Setup
  └─ Create non-root user (appuser:appgroup)

Stage 3: Dependencies
  ├─ COPY package*.json
  └─ npm ci --omit=dev (deterministic, production-only install)

Stage 4: Application Code
  └─ COPY src/ ./src/ (only application source, not tests/docs/examples)

Stage 5: Runtime
  ├─ USER appuser (drop root privileges)
  ├─ EXPOSE 3025
  └─ CMD ["node", "src/app.js"]
```

## Security Measures

| Measure | Implementation |
|---------|---------------|
| Non-root user | `adduser -S appuser` — container runs as unprivileged user |
| Minimal base image | Alpine Linux — smaller attack surface |
| Production-only deps | `npm ci --omit=dev` — no test/dev dependencies in image |
| Selective COPY | Only `src/` copied — no tests, docs, examples, or config files |
| No secrets in image | Environment variables passed at runtime via `--env-file` |

## .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
.dockerignore
Dockerfile
docker-compose*.yml
*.md
search_examples
.env
.env.*
```

This excludes:
- `node_modules` — rebuilt inside the container via `npm ci`
- `.git` — version control history not needed at runtime
- Documentation files (`*.md`) — not needed at runtime
- `search_examples/` — development examples not needed at runtime
- `.env` files — secrets should be injected at runtime, not baked into the image

## Build and Run

### Build

```bash
docker build -t ingenium-search-server .
```

### Run

```bash
docker run -d \
  --name search-server \
  -p 3025:3025 \
  --env-file .env \
  ingenium-search-server
```

### Required Environment Variables

The container requires these environment variables at runtime:

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_PEM` | **Yes** | RSA public key for JWT verification (app exits without it) |
| `ELASTIC_SEARCH_HOST` | No | Elasticsearch URL (default: `http://127.0.0.1:19200`) |
| `PORT` | No | Server port (default: `3025`) |
| `INDEX_MAPPING_TOTAL_FIELDS_LIMIT` | No | ES field limit (default: `20000`) |
| `INDEX_MAX_RESULT_WINDOW` | No | ES result window (default: `20000000`) |

### Docker Compose Example

```yaml
version: '3.8'
services:
  search-server:
    build: .
    ports:
      - "3025:3025"
    environment:
      - ELASTIC_SEARCH_HOST=http://elasticsearch:9200
      - PUBLIC_PEM=${PUBLIC_PEM}
    depends_on:
      - elasticsearch

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.19.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
```

## Important Notes

- The `COPY src/ ./src/` instruction must include the `src/api/openapi.yaml` file, which is loaded at startup for both API validation and Swagger UI
- The container listens on port 3025 by default; override with the `PORT` environment variable
- The startup sequence includes Elasticsearch connection retries (up to 20 attempts at 5-second intervals), so the container will wait for Elasticsearch to become available
