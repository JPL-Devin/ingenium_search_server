# Elasticsearch Integration

The Elasticsearch integration handles client initialization, connection retry logic, index lifecycle management, and mapping configuration. It is defined in `src/config/elasticsearch-config.js` with mapping definitions in `src/config/mapping-config.js`.

## Source Files

- `src/config/elasticsearch-config.js` - Client creation and initialization
- `src/config/mapping-config.js` - Index mapping definitions

## Client Creation

The Elasticsearch client is created using the `@elastic/elasticsearch` package (v8.19.x):

```javascript
const { Client } = require('@elastic/elasticsearch');
const config = require('./app-config');

const client = new Client({
  node: config.ELASTIC_SEARCH_HOST,
});
```

The client connects to the host specified by the `ELASTIC_SEARCH_HOST` environment variable (default: `http://127.0.0.1:19200`).

## Connection Retry Logic

On startup, `initElasticsearch()` attempts to connect to Elasticsearch with a retry mechanism:

```
initElasticsearch()
  │
  ├─ Attempt connection (client.info())
  │   ├─ Success → proceed to index setup
  │   └─ Failure → wait 5 seconds, retry
  │       ├─ Max retries: 20 (total wait: up to 100 seconds)
  │       └─ All retries exhausted → process.exit(1)
  │
  ├─ For each managed index:
  │   ├─ Check if index exists (client.indices.get())
  │   │   ├─ Exists → skip
  │   │   └─ Does not exist:
  │   │       ├─ Create index (client.indices.create())
  │   │       └─ Apply mapping (client.indices.putMapping())
  │   │
  │   └─ On failure → process.exit(1)
  │
  └─ For each managed index:
      ├─ Update settings (putSettings)
      │   ├─ index.mapping.total_fields.limit
      │   └─ index.max_result_window
      └─ On failure → process.exit(1)
```

The retry parameters:
- **Max trials**: 20
- **Delay between retries**: 5,000 ms
- **Total maximum wait**: ~100 seconds
- **On exhaustion**: `process.exit(1)`

## Managed Indices

The service manages four Elasticsearch indices, defined in `app-config.js`:

| Index | Purpose |
|-------|---------|
| `syncdata` | Synchronized data storage |
| `querybuilder` | User-saved query builder configurations |
| `element` | Element data (searchable) |
| `procedure_element` | Procedure-related element data (searchable) |

## Index Settings

After index creation, the following settings are applied to each managed index individually:

| Setting | Config Property | Default |
|---------|----------------|---------|
| `index.mapping.total_fields.limit` | `index_mapping_total_fields_limit` | 20,000 |
| `index.max_result_window` | `index_max_result_window` | 20,000,000 |

Settings are applied per-index rather than using `_all` to avoid affecting indices not managed by this service.

## Mapping Configuration

The mapping configuration (`src/config/mapping-config.js`) defines Elasticsearch field types for domain-specific data structures. The same mapping is applied to all newly created indices.

### Explicit Field Mappings

| Field Path | Type | Format |
|-----------|------|--------|
| `execution_user_input.reference_procedure_version` | long | — |
| `execution_user_input.duration` | long | — |
| `execution_user_input.timeout` | long | — |
| `execution_user_input.lookback` | long | — |
| `authoring_user_input.reference_procedure_version` | long | — |
| `authoring_user_input.timeout` | long | — |
| `authoring_user_input.lookback` | long | — |
| `execution.meta_data.time_started` | date | `strict_date_optional_time` |
| `execution.meta_data.time_updated` | date | `strict_date_optional_time` |
| `execution.meta_data.time_completed` | date | `strict_date_optional_time` |
| `procedureDetails.time_created` | date | `strict_date_optional_time` |
| `procedureDetails.time_saved` | date | `strict_date_optional_time` |
| `procedureVersionDetails.version` | long | — |
| `procedureVersionDetails.time_saved` | date | `strict_date_optional_time` |
| `procedureVersionDetails.time_versioned` | date | `strict_date_optional_time` |
| `executionDetails.time_completed` | date | `strict_date_optional_time` |
| `executionDetails.time_started` | date | `strict_date_optional_time` |
| `executionDetails.transitions.time_updated` | date | `strict_date_optional_time` |
| `venueDetails.venue_status.started_on` | date | `strict_date_optional_time` |

### Dynamic Template

All string fields that are not explicitly mapped are automatically assigned the `wildcard` type via a dynamic template:

```json
{
  "dynamic_templates": [
    {
      "string_as_wildcard": {
        "match_mapping_type": "string",
        "mapping": {
          "type": "wildcard"
        }
      }
    }
  ]
}
```

This enables case-insensitive wildcard searches on all string fields without requiring explicit mapping for each field.

## Exports

The module exports both the client instance and the initialization function:

```javascript
module.exports = {
  client,           // Elasticsearch client instance (used by controllers)
  initElasticsearch // Initialization function (called at startup)
};
```

The `client` is imported directly by `searchController.js` and `queryBuilderController.js` to execute queries.
