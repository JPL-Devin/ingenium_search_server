# Search System

The search system translates structured query builder parameters into Elasticsearch queries. It supports multiple operators, nested conditions, multi-field searches, and pagination. The implementation is in `src/controllers/searchController.js`.

## Source File

`src/controllers/searchController.js`

## Overview

```
Client POST /api/v1/search
  │
  │  { queryBuilderParams, limit, offset, index }
  ▼
┌─────────────────────────────────────┐
│         searchQuery()               │
│                                     │
│  1. Validate index against allowlist│
│  2. buildElasticsearchQuery()       │
│  3. Execute ES search              │
│  4. Map results                     │
│  5. Return { results, total }       │
└─────────────────────────────────────┘
```

## Index Allowlist

Before executing a search, the requested index is validated against a hardcoded allowlist:

```javascript
const ALLOWED_SEARCH_INDICES = ['element', 'procedure_element', 'all'];
```

| Value | Behavior |
|-------|----------|
| `element` | Search the `element` index |
| `procedure_element` | Search the `procedure_element` index |
| `all` (default) | Search both `procedure_element` and `element` |
| Anything else | Returns 400: "Invalid index specified" |

This prevents Elasticsearch index injection — users cannot search arbitrary indices like `querybuilder` or `syncdata`.

## Search Value Length Limit

Search values are capped at 256 characters to limit wildcard query resource consumption:

```javascript
const MAX_SEARCH_VALUE_LENGTH = 256;

if (typeof value === 'string' && value.length > MAX_SEARCH_VALUE_LENGTH) {
  throw new ValidationError(`Search value exceeds maximum length of ${MAX_SEARCH_VALUE_LENGTH} characters`);
}
```

Validation errors return HTTP 400 (not 500) with a descriptive message, and are logged at `warn` level to avoid polluting error logs.

## Query Builder

The `buildElasticsearchQuery()` function recursively converts a structured query object into an Elasticsearch bool query.

### Input Format

```json
{
  "condition": "AND",
  "rules": [
    {
      "field": "title,description",
      "operator": "=",
      "value": "search term"
    },
    {
      "condition": "OR",
      "rules": [
        { "field": "status", "operator": "==", "value": "active" },
        { "field": "status", "operator": "==", "value": "pending" }
      ]
    }
  ]
}
```

### Translation Logic

```
queryBuilderParams
  │
  ├─ condition: "AND" → bool.must
  │   condition: "OR"  → bool.should
  │
  └─ rules[] → for each rule:
      │
      ├─ Has nested condition/rules? → recurse (buildElasticsearchQuery)
      │
      └─ Leaf rule:
          ├─ Parse operator → getOperator()
          ├─ Split field by comma → multi-field support
          ├─ Validate value length
          └─ Build ES clause based on operator type
```

### Supported Operators

| Input Operator | Internal Name | Elasticsearch Query Type | Description |
|---------------|---------------|------------------------|-------------|
| `=` | `match_wildcard` | `wildcard` with `*value*` | Case-insensitive wildcard match |
| `==` | `match` | `match` | Exact/analyzed match |
| `>` | `range` | `range.gt` | Greater than |
| `>=` | `range` | `range.gte` | Greater than or equal |
| `<` | `range` | `range.lt` | Less than |
| `<=` | `range` | `range.lte` | Less than or equal |
| `!=` | `not_match_wildcard` | `bool.must_not` + `wildcard` | Negated wildcard match |
| `!==` | `not_match` | `bool.must_not` + `match` | Negated exact match |
| (default) | `match` | `match` | Unknown operators fall back to match |

### Multi-Field Support

Fields can be comma-separated (e.g., `"title,description"`). For wildcard and match operators, this generates a `bool.should` with `minimum_should_match: 1`, matching if any of the specified fields contains the value.

For range operators, only the first field is used.

### Wildcard Query Details

Wildcard queries use the following parameters:
```json
{
  "wildcard": {
    "fieldName": {
      "value": "*searchTerm*",
      "boost": 1.0,
      "rewrite": "constant_score",
      "case_insensitive": true
    }
  }
}
```

### Example Translation

Input:
```json
{
  "condition": "AND",
  "rules": [
    { "field": "title", "operator": "=", "value": "test" },
    { "field": "count", "operator": ">=", "value": "10" }
  ]
}
```

Output Elasticsearch query:
```json
{
  "bool": {
    "must": [
      {
        "bool": {
          "should": [
            {
              "wildcard": {
                "title": {
                  "value": "*test*",
                  "boost": 1.0,
                  "rewrite": "constant_score",
                  "case_insensitive": true
                }
              }
            }
          ],
          "minimum_should_match": 1
        }
      },
      {
        "range": {
          "count": { "gte": "10" }
        }
      }
    ]
  }
}
```

## Search Execution

The `searchQuery` function orchestrates the full search flow:

```javascript
async function searchQuery(req, res) {
  const { queryBuilderParams, limit, offset, index } = req.body;

  // 1. Validate index
  const indexName = index || 'all';
  if (!ALLOWED_SEARCH_INDICES.includes(indexName)) {
    res.status(400).json({ message: 'Invalid index specified' });
    return;
  }

  // 2. Build and execute query
  const indexes = indexName === 'all' ? ['procedure_element', 'element'] : indexName;
  const query = buildElasticsearchQuery(queryBuilderParams);
  const body = await client.search({
    index: indexes,
    body: { query },
    from: offset,
    size: limit,
  });

  // 3. Map results
  const results = body.hits.hits.map((hit) => ({
    id: hit._id,
    ...hit._source,
  }));

  res.status(200).json({ results, total: body.hits.total.value });
}
```

### Response Format

```json
{
  "results": [
    {
      "id": "document_id",
      "field1": "value1",
      "field2": "value2"
    }
  ],
  "total": 42
}
```

### Error Handling

| Error Type | HTTP Status | Response |
|-----------|-------------|----------|
| Invalid index | 400 | `{ "message": "Invalid index specified" }` |
| Value too long (> 256 chars) | 400 | `{ "message": "Search value exceeds maximum length of 256 characters" }` |
| Elasticsearch error | 500 | `{ "message": "Internal server error" }` |
