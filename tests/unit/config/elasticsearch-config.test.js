const mockClient = {
  info: jest.fn(),
  indices: {
    get: jest.fn(),
    create: jest.fn(),
    putMapping: jest.fn(),
    putSettings: jest.fn(),
  },
};

jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn(() => mockClient),
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('elasticsearch-config', () => {
  let initElasticsearch, client;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest.mock('@elastic/elasticsearch', () => ({
      Client: jest.fn(() => mockClient),
    }));
    jest.mock('../../../src/utils/logger', () => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    }));

    const esConfig = require('../../../src/config/elasticsearch-config');
    initElasticsearch = esConfig.initElasticsearch;
    client = esConfig.client;
  });

  test('should export client and initElasticsearch', () => {
    expect(client).toBeDefined();
    expect(initElasticsearch).toBeInstanceOf(Function);
  });

  test('should connect and set up indices when all exist', async () => {
    mockClient.info.mockResolvedValue({ version: { number: '8.6.0' } });
    mockClient.indices.get.mockResolvedValue({});
    mockClient.indices.putSettings.mockResolvedValue({});

    await initElasticsearch();

    expect(mockClient.info).toHaveBeenCalled();
    expect(mockClient.indices.putSettings).toHaveBeenCalled();
  });

  test('should create index and set mapping when index does not exist', async () => {
    mockClient.info.mockResolvedValue({ version: { number: '8.6.0' } });
    mockClient.indices.get.mockRejectedValue(new Error('index_not_found'));
    mockClient.indices.create.mockResolvedValue({});
    mockClient.indices.putMapping.mockResolvedValue({});
    mockClient.indices.putSettings.mockResolvedValue({});

    await initElasticsearch();

    expect(mockClient.indices.create).toHaveBeenCalled();
    expect(mockClient.indices.putMapping).toHaveBeenCalled();
  });

  test('should skip creating index when it already exists', async () => {
    mockClient.info.mockResolvedValue({ version: { number: '8.6.0' } });
    mockClient.indices.get.mockResolvedValue({ syncdata: {} });
    mockClient.indices.putSettings.mockResolvedValue({});

    await initElasticsearch();

    expect(mockClient.indices.create).not.toHaveBeenCalled();
  });

  test('should retry connection and exit when elasticsearch is unreachable', async () => {
    jest.useFakeTimers();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    jest.resetModules();
    jest.mock('@elastic/elasticsearch', () => ({
      Client: jest.fn(() => mockClient),
    }));
    jest.mock('../../../src/utils/logger', () => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    }));
    jest.mock('../../../src/config/app-config', () => ({
      ELASTIC_SEARCH_HOST: 'http://localhost:19200',
      elastic_search_indices: ['testindex'],
      index_mapping_total_fields_limit: 20000,
      index_max_result_window: 20000000,
    }));

    mockClient.info.mockRejectedValue(new Error('ECONNREFUSED'));

    const esConfig = require('../../../src/config/elasticsearch-config');
    const initPromise = esConfig.initElasticsearch();

    for (let i = 0; i < 25; i++) {
      await Promise.resolve();
      await Promise.resolve();
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
    }

    await initPromise;

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
    jest.useRealTimers();
  });

  test('should exit process when index creation fails', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    mockClient.info.mockResolvedValue({ version: { number: '8.6.0' } });
    mockClient.indices.get.mockRejectedValue(new Error('not found'));
    mockClient.indices.create.mockRejectedValue(new Error('creation failed'));

    await initElasticsearch();

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  test('should exit process when putMapping fails', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    mockClient.info.mockResolvedValue({ version: { number: '8.6.0' } });
    mockClient.indices.get.mockRejectedValue(new Error('not found'));
    mockClient.indices.create.mockResolvedValue({});
    mockClient.indices.putMapping.mockRejectedValue(new Error('mapping failed'));

    await initElasticsearch();

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  test('should exit process when putSettings fails', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    mockClient.info.mockResolvedValue({ version: { number: '8.6.0' } });
    mockClient.indices.get.mockResolvedValue({});
    mockClient.indices.putSettings.mockRejectedValue(new Error('settings failed'));

    await initElasticsearch();

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
