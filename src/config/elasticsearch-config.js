const { Client } = require('@elastic/elasticsearch');
const config = require('./app-config');
const logger = require('../utils/logger');
const mappingConfig = require('./mapping-config');

const client = new Client({
  node: config.ELASTIC_SEARCH_HOST,
});

async function initElasticsearch() {
  let maxTrials = 20;
  let numTrials = 0;
  while (numTrials <= maxTrials) {
    try {
      numTrials++
      logger.info(`Trying to connect to Elastic Search. Trial: ${numTrials}`)
      const res = await client.info()
      logger.info(`Connected to Elasticsearch: ${JSON.stringify(res)}`)
      break
    } catch (error) {
      logger.error(`Elasticsearch connection attempt failed: ${error.message}`);
      if (numTrials === maxTrials) {
        logger.error('Elastic Search is not available. Exit Ingenium Search Service')
        process.exit(1);      
      }
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  for (const index of config.elastic_search_indices) {
    let indexInfo = null;
    try {
      indexInfo = await client.indices.get({index});
      logger.info(`Index exists: ${index}`);
      continue;
    } catch (error) {
      logger.info(`Index does not exist: ${index}`);
    }

    logger.info(`Creating index: ${index}`);

    // create index
    try {
      await client.indices.create({ index });
      logger.info(`Index was created: ${index}`);
    } catch (error) {
      logger.error(`Failed to create index ${index} in ElasticSearch: ${error.message}`);
      process.exit(1)
    }

    // set mapping
    try {
      // The same mapping is used for all indices including 'syncdata', 'querybuilder'.
      // Probably it does not hurt.
      await client.indices.putMapping({
        index: index,
        body: mappingConfig.mappings,
      });
      logger.info(`Mapping was set for: ${index}`);
    } catch (error) {
      logger.error(`Failed to set mapping for index ${index} in ElasticSearch: ${error.message}`);
      process.exit(1)
    }
  }

  // Update index settings for managed indices only
  for (const index of config.elastic_search_indices) {
    try {
      await client.indices.putSettings({
        index,
        body: {
          'index.mapping.total_fields.limit': config.index_mapping_total_fields_limit,
          'index.max_result_window': config.index_max_result_window,
        },
      });
    } catch (error) {
      logger.error(`Failed to configure index ${index} in ElasticSearch: ${error.message}`);
      process.exit(1)
    }
  }
}

module.exports = {
  client,
  initElasticsearch,
};

