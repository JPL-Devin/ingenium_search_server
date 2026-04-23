jest.mock('../../../src/config/elasticsearch-config', () => ({
  client: {
    search: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const { client } = require('../../../src/config/elasticsearch-config');
const logger = require('../../../src/utils/logger');

const searchControllerModule = require('../../../src/controllers/searchController');
const { searchQuery } = searchControllerModule;

// Access internal functions via rewiring by extracting them from the module
// Since buildElasticsearchQuery, getOperator, getComparisonOperator are not exported,
// we test them indirectly through searchQuery.

describe('searchController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { username: 'testuser' },
    };
  });

  describe('searchQuery', () => {
    test('should search with AND condition and wildcard operator', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'title', operator: '=', value: 'test' },
          ],
        },
        limit: 10,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: '1', _source: { title: 'test doc' } }],
        },
      });

      await searchQuery(mockReq, mockRes);

      expect(client.search).toHaveBeenCalledWith(expect.objectContaining({
        index: 'element',
        from: 0,
        size: 10,
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        results: [{ id: '1', title: 'test doc' }],
        total: 1,
      });
    });

    test('should search with OR condition', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'OR',
          rules: [
            { field: 'title', operator: '=', value: 'alpha' },
            { field: 'description', operator: '=', value: 'beta' },
          ],
        },
        limit: 20,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 2 },
          hits: [
            { _id: '1', _source: { title: 'alpha doc' } },
            { _id: '2', _source: { description: 'beta doc' } },
          ],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      expect(searchCall.body.query.bool).toHaveProperty('should');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should search with exact match operator (==)', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'status', operator: '==', value: 'active' },
          ],
        },
        limit: 10,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: '1', _source: { status: 'active' } }],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      const rule = searchCall.body.query.bool.must[0];
      expect(rule.bool.should[0]).toHaveProperty('match');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should search with range operator (>)', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'count', operator: '>', value: '10' },
          ],
        },
        limit: 10,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: '1', _source: { count: 15 } }],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      const rule = searchCall.body.query.bool.must[0];
      expect(rule).toHaveProperty('range');
      expect(rule.range.count).toHaveProperty('gt');
    });

    test('should search with range operator (>=)', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'count', operator: '>=', value: '10' },
          ],
        },
        limit: 5,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: '1', _source: { count: 10 } }],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      const rule = searchCall.body.query.bool.must[0];
      expect(rule.range.count).toHaveProperty('gte');
    });

    test('should search with range operator (<)', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'count', operator: '<', value: '100' },
          ],
        },
        limit: 5,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: '1', _source: { count: 50 } }],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      const rule = searchCall.body.query.bool.must[0];
      expect(rule.range.count).toHaveProperty('lt');
    });

    test('should search with range operator (<=)', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'count', operator: '<=', value: '100' },
          ],
        },
        limit: 5,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: '1', _source: { count: 100 } }],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      const rule = searchCall.body.query.bool.must[0];
      expect(rule.range.count).toHaveProperty('lte');
    });

    test('should search with not wildcard match operator (!=)', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'title', operator: '!=', value: 'excluded' },
          ],
        },
        limit: 10,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: '1', _source: { title: 'included' } }],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      const rule = searchCall.body.query.bool.must[0];
      expect(rule.bool).toHaveProperty('must_not');
      expect(rule.bool.must_not[0]).toHaveProperty('wildcard');
    });

    test('should search with not exact match operator (!==)', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'status', operator: '!==', value: 'archived' },
          ],
        },
        limit: 10,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: '1', _source: { status: 'active' } }],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      const rule = searchCall.body.query.bool.must[0];
      expect(rule.bool).toHaveProperty('must_not');
      expect(rule.bool.must_not[0]).toHaveProperty('match');
    });

    test('should search across multiple fields (comma-separated)', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'title,description', operator: '=', value: 'search' },
          ],
        },
        limit: 10,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 2 },
          hits: [
            { _id: '1', _source: { title: 'search doc' } },
            { _id: '2', _source: { description: 'search desc' } },
          ],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      const rule = searchCall.body.query.bool.must[0];
      expect(rule.bool.should).toHaveLength(2);
    });

    test('should search with nested conditions', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'title', operator: '=', value: 'test' },
            {
              condition: 'OR',
              rules: [
                { field: 'status', operator: '==', value: 'active' },
                { field: 'status', operator: '==', value: 'pending' },
              ],
            },
          ],
        },
        limit: 10,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: '1', _source: { title: 'test', status: 'active' } }],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      const query = searchCall.body.query;
      expect(query.bool.must).toHaveLength(2);
      expect(query.bool.must[1].bool).toHaveProperty('should');
    });

    test('should use all indices when index is "all"', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'title', operator: '=', value: 'test' },
          ],
        },
        limit: 10,
        offset: 0,
        index: 'all',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 0 },
          hits: [],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      expect(searchCall.index).toEqual(['procedure_element', 'element']);
    });

    test('should handle pagination with offset', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'title', operator: '=', value: 'test' },
          ],
        },
        limit: 10,
        offset: 20,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 50 },
          hits: [],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      expect(searchCall.from).toBe(20);
      expect(searchCall.size).toBe(10);
    });

    test('should return 500 when elasticsearch search fails', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'title', operator: '=', value: 'test' },
          ],
        },
        limit: 10,
        offset: 0,
        index: 'element',
      };

      client.search.mockRejectedValue(new Error('ES connection failed'));

      await searchQuery(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Error searching data'),
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });

    test('should handle null queryBuilderParams', async () => {
      mockReq.body = {
        queryBuilderParams: null,
        limit: 10,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 0 },
          hits: [],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      expect(searchCall.body.query).toBeNull();
    });

    test('should use default match for unknown operators', async () => {
      mockReq.body = {
        queryBuilderParams: {
          condition: 'AND',
          rules: [
            { field: 'title', operator: 'UNKNOWN', value: 'test' },
          ],
        },
        limit: 10,
        offset: 0,
        index: 'element',
      };

      client.search.mockResolvedValue({
        hits: {
          total: { value: 0 },
          hits: [],
        },
      });

      await searchQuery(mockReq, mockRes);

      const searchCall = client.search.mock.calls[0][0];
      const rule = searchCall.body.query.bool.must[0];
      expect(rule.bool.should[0]).toHaveProperty('match');
    });
  });
});
