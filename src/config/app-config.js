const config = {};

config.PORT = isNaN(parseInt(process.env.PORT)) ? 3025 : parseInt(process.env.PORT);

config.API_VERSION = 'v1';

if (!process.env.PUBLIC_PEM) {
  console.error('FATAL: PUBLIC_PEM environment variable is required');
  process.exit(1);
}
config.public_pem = process.env.PUBLIC_PEM;

config.ELASTIC_SEARCH_HOST = process.env.ELASTIC_SEARCH_HOST || 'http://127.0.0.1:19200';

config.index_mapping_total_fields_limit = isNaN(parseInt(process.env.INDEX_MAPPING_TOTAL_FIELDS_LIMIT)) ? 20000 : parseInt(process.env.INDEX_MAPPING_TOTAL_FIELDS_LIMIT);

config.index_max_result_window = isNaN(parseInt(process.env.INDEX_MAX_RESULT_WINDOW)) ? 20000000 : parseInt(process.env.INDEX_MAX_RESULT_WINDOW);

config.elastic_search_indices = ['syncdata', 'querybuilder', 'element', 'procedure_element'];

module.exports = config;
