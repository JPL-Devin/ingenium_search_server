# Ingenium Search Server

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js](https://img.shields.io/badge/Node.js-22%20LTS-green.svg)](https://nodejs.org/)
[![CI](https://github.com/JPL-Devin/ingenium_search_server/actions/workflows/ci.yml/badge.svg)](https://github.com/JPL-Devin/ingenium_search_server/actions/workflows/ci.yml)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8.x-yellow.svg)](https://www.elastic.co/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![API](https://img.shields.io/badge/API-OpenAPI%203.0-orange.svg)](https://swagger.io/specification/)


A powerful Node.js microservice providing advanced search functionality using Elasticsearch with JWT authentication, complex query building capabilities, and RESTful API.

## 🚀 Features

- **Advanced Search Engine**: Complex query builder with support for multiple operators and nested conditions
- **JWT Authentication**: Secure token-based authentication with RS256 algorithm
- **Multi-Index Search**: Search across multiple Elasticsearch indices simultaneously
- **User-Scoped Queries**: Save and manage personalized search queries
- **RESTful API**: Clean, well-documented API following OpenAPI 3.0 specification
- **Docker Support**: Containerized deployment with Docker
- **Real-time Health Monitoring**: Built-in health check endpoints
- **Comprehensive Logging**: Winston-based logging system

## 📋 Prerequisites

Before running the Ingenium Search Server, ensure you have the following installed:

- **Node.js** (v22.0.0 or later — LTS)
- **npm** (v10.0.0 or later)
- **Elasticsearch** (v8.x recommended)
- **Docker** (optional, for containerized deployment)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/OpenIngenium/search_server.git
cd search_server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root with the following variables:

```bash
# Server Configuration
PORT=3025
API_VERSION=v1

# JWT Configuration
PUBLIC_PEM="-----BEGIN PUBLIC KEY-----
YOUR_PUBLIC_KEY_HERE # TODO: Replace with your actual JWT public key
-----END PUBLIC KEY-----"

# Elasticsearch Configuration
ELASTIC_SEARCH_HOST=http://localhost:9200

# Index Configuration (optional)
INDEX_MAPPING_TOTAL_FIELDS_LIMIT=20000
INDEX_MAX_RESULT_WINDOW=20000000
```

## 🏃‍♂️ Quick Start

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Docker Deployment
```bash
docker build -t ingenium-search-server .
docker run -p 3025:3025 --env-file .env ingenium-search-server
```

## 📊 API Endpoints

### Health Check
- `GET /api/v1/health` - Check service health status

### Query Builder Management
- `GET /api/v1/querybuilders` - Get all saved queries for authenticated user
- `GET /api/v1/querybuilders/{id}` - Get specific query by ID
- `POST /api/v1/querybuilders` - Save new search query
- `DELETE /api/v1/querybuilders/{id}` - Delete saved query

### Search
- `POST /api/v1/search` - Execute complex search queries

## 📖 API Documentation

Once the server is running, you can access the interactive API documentation at:

```
http://localhost:3025/api-docs # TODO: Update port if you change default PORT
```

The API follows OpenAPI 3.0 specification and includes:
- Request/response schemas
- Authentication requirements
- Example payloads
- Interactive testing interface

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3025` | No |
| `API_VERSION` | API version | `v1` | No |
| `PUBLIC_PEM` | JWT public key for token verification | `""` | Yes |
| `ELASTIC_SEARCH_HOST` | Elasticsearch connection URL | `http://127.0.0.1:19200` | No |
| `INDEX_MAPPING_TOTAL_FIELDS_LIMIT` | Elasticsearch field limit | `20000` | No |
| `INDEX_MAX_RESULT_WINDOW` | Maximum search results | `20000000` | No |

### Elasticsearch Indices

The service automatically creates and manages the following indices:
- `syncdata` - Synchronized data storage
- `querybuilder` - Saved user queries
- `element` - Element data
- `procedure_element` - Procedure-related elements

## 🔍 Search Query Syntax

The search engine supports complex queries with:

### Operators
- `=` - Wildcard match
- `==` - Exact match
- `>`, `>=`, `<`, `<=` - Range comparisons
- `!=` - Not wildcard match
- `!==` - Not exact match

### Logical Conditions
- `AND` - All conditions must match
- `OR` - Any condition can match
- Nested conditions with unlimited depth

### Example Query
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

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Public Key**: Configure your JWT public key in the `PUBLIC_PEM` environment variable
2. **Algorithm**: RS256 (RSA with SHA-256)
3. **Header**: Include token in `Authorization: Bearer <token>` header
4. **Scope**: User-specific data is automatically filtered by username from token

### Excluded Endpoints
- `/api/v1/health` - No authentication required
- `/api-docs/*` - API documentation access

## 🐳 Docker Support

### Dockerfile
The included Dockerfile creates an optimized production image:
- Based on Node.js 22 LTS (Alpine)
- Exposes port 3025
- Uses `npm ci --omit=dev` for deterministic, production-only installs

### Build and Run
```bash
# Build image
docker build -t ingenium-search-server .

# Run container
docker run -d \
  --name search-server \
  -p 3025:3025 \
  --env-file .env \
  ingenium-search-server
```

## 🧪 Testing

Run the test suite with:
```bash
npm test
```

Tests are written with [Jest](https://jestjs.io/) and cover configuration, controllers, middleware, routes, and utilities. Coverage reports are generated automatically.

## 🧪 Examples

Check the `search_examples/` directory for various usage examples:
- `curl_examples.txt` - cURL command examples
- `query.py` - Python search examples
- `index_example.py` - Index management examples
- `date_example.py` - Date-based query examples

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.



## 🏗️ Architecture

```
├── src/
│   ├── api/                 # OpenAPI specification
│   ├── config/              # Configuration files
│   ├── controllers/         # Request handlers
│   ├── middlewares/         # Authentication & utility middleware
│   ├── routes/              # API route definitions
│   └── utils/               # Logging and utilities
├── tests/                   # Jest test suite
├── search_examples/         # Usage examples
├── .github/workflows/       # CI pipeline (GitHub Actions)
├── Dockerfile              # Container configuration
└── package.json            # Node.js dependencies
```

## 🚀 Performance

- **Elasticsearch Integration**: Optimized for large-scale document search
- **JWT Middleware**: Efficient token validation
- **Configurable Limits**: Tunable search result windows and field limits
- **Connection Pooling**: Automatic Elasticsearch connection management

---
