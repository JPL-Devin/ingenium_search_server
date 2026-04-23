describe('app-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should use default PORT 3025 when PORT env is not set', () => {
    delete process.env.PORT;
    const config = require('../../../src/config/app-config');
    expect(config.PORT).toBe(3025);
  });

  test('should parse PORT from env when valid', () => {
    process.env.PORT = '4000';
    const config = require('../../../src/config/app-config');
    expect(config.PORT).toBe(4000);
  });

  test('should fall back to default PORT when env value is not a number', () => {
    process.env.PORT = 'abc';
    const config = require('../../../src/config/app-config');
    expect(config.PORT).toBe(3025);
  });

  test('should set API_VERSION to v1', () => {
    const config = require('../../../src/config/app-config');
    expect(config.API_VERSION).toBe('v1');
  });

  test('should use PUBLIC_PEM from env when set', () => {
    process.env.PUBLIC_PEM = 'test-pem-key';
    const config = require('../../../src/config/app-config');
    expect(config.public_pem).toBe('test-pem-key');
  });

  test('should default public_pem to empty string when env is not set', () => {
    delete process.env.PUBLIC_PEM;
    const config = require('../../../src/config/app-config');
    expect(config.public_pem).toBe('');
  });

  test('should use ELASTIC_SEARCH_HOST from env when set', () => {
    process.env.ELASTIC_SEARCH_HOST = 'http://es-host:9200';
    const config = require('../../../src/config/app-config');
    expect(config.ELASTIC_SEARCH_HOST).toBe('http://es-host:9200');
  });

  test('should default ELASTIC_SEARCH_HOST to localhost:19200', () => {
    delete process.env.ELASTIC_SEARCH_HOST;
    const config = require('../../../src/config/app-config');
    expect(config.ELASTIC_SEARCH_HOST).toBe('http://127.0.0.1:19200');
  });

  test('should parse INDEX_MAPPING_TOTAL_FIELDS_LIMIT from env', () => {
    process.env.INDEX_MAPPING_TOTAL_FIELDS_LIMIT = '50000';
    const config = require('../../../src/config/app-config');
    expect(config.index_mapping_total_fields_limit).toBe(50000);
  });

  test('should default INDEX_MAPPING_TOTAL_FIELDS_LIMIT to 20000', () => {
    delete process.env.INDEX_MAPPING_TOTAL_FIELDS_LIMIT;
    const config = require('../../../src/config/app-config');
    expect(config.index_mapping_total_fields_limit).toBe(20000);
  });

  test('should fall back to default INDEX_MAPPING_TOTAL_FIELDS_LIMIT when env is NaN', () => {
    process.env.INDEX_MAPPING_TOTAL_FIELDS_LIMIT = 'invalid';
    const config = require('../../../src/config/app-config');
    expect(config.index_mapping_total_fields_limit).toBe(20000);
  });

  test('should parse INDEX_MAX_RESULT_WINDOW from env', () => {
    process.env.INDEX_MAX_RESULT_WINDOW = '100000';
    const config = require('../../../src/config/app-config');
    expect(config.index_max_result_window).toBe(100000);
  });

  test('should default INDEX_MAX_RESULT_WINDOW to 20000000', () => {
    delete process.env.INDEX_MAX_RESULT_WINDOW;
    const config = require('../../../src/config/app-config');
    expect(config.index_max_result_window).toBe(20000000);
  });

  test('should fall back to default INDEX_MAX_RESULT_WINDOW when env is NaN', () => {
    process.env.INDEX_MAX_RESULT_WINDOW = 'notanumber';
    const config = require('../../../src/config/app-config');
    expect(config.index_max_result_window).toBe(20000000);
  });

  test('should define expected elastic_search_indices', () => {
    const config = require('../../../src/config/app-config');
    expect(config.elastic_search_indices).toEqual([
      'syncdata', 'querybuilder', 'element', 'procedure_element'
    ]);
  });
});
