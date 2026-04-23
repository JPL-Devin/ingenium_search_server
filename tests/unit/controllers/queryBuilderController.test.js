jest.mock('../../../src/config/elasticsearch-config', () => ({
  client: {
    search: jest.fn(),
    index: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const { client } = require('../../../src/config/elasticsearch-config');
const logger = require('../../../src/utils/logger');
const {
  getAllQueryBuilder,
  getQueryBuilder,
  postQueryBuilder,
  deleteQueryBuilder,
} = require('../../../src/controllers/queryBuilderController');

describe('queryBuilderController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { username: 'testuser' },
    };
  });

  describe('getAllQueryBuilder', () => {
    test('should return all query builders for the authenticated user', async () => {
      client.search.mockResolvedValue({
        hits: {
          hits: [
            { _id: 'q1', _source: { username: 'testuser', name: 'Query 1', description: 'Desc 1', queryBuilderParams: {} } },
            { _id: 'q2', _source: { username: 'testuser', name: 'Query 2', description: 'Desc 2', queryBuilderParams: {} } },
          ],
        },
      });

      await getAllQueryBuilder(mockReq, mockRes);

      expect(client.search).toHaveBeenCalledWith(expect.objectContaining({
        index: 'querybuilder',
        body: {
          query: {
            term: { username: 'testuser' },
          },
        },
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        { id: 'q1', username: 'testuser', name: 'Query 1', description: 'Desc 1', queryBuilderParams: {} },
        { id: 'q2', username: 'testuser', name: 'Query 2', description: 'Desc 2', queryBuilderParams: {} },
      ]);
    });

    test('should return empty array when no query builders exist', async () => {
      client.search.mockResolvedValue({
        hits: {
          hits: [],
        },
      });

      await getAllQueryBuilder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    test('should return 500 when elasticsearch fails', async () => {
      client.search.mockRejectedValue(new Error('ES error'));

      await getAllQueryBuilder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Error retrieving data from getAllQueryBuilder'),
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getQueryBuilder', () => {
    test('should return a specific query builder by id', async () => {
      mockReq.params = { id: 'q1' };

      client.search.mockResolvedValue({
        hits: {
          hits: [
            { _id: 'q1', _source: { username: 'testuser', name: 'Query 1', description: 'Desc 1', queryBuilderParams: {} } },
          ],
        },
      });

      await getQueryBuilder(mockReq, mockRes);

      expect(client.search).toHaveBeenCalledWith(expect.objectContaining({
        index: 'querybuilder',
        body: {
          query: {
            match: { _id: 'q1' },
          },
        },
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        { id: 'q1', username: 'testuser', name: 'Query 1', description: 'Desc 1', queryBuilderParams: {} },
      ]);
    });

    test('should return empty array when query builder not found', async () => {
      mockReq.params = { id: 'nonexistent' };

      client.search.mockResolvedValue({
        hits: {
          hits: [],
        },
      });

      await getQueryBuilder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    test('should return 500 when elasticsearch fails', async () => {
      mockReq.params = { id: 'q1' };

      client.search.mockRejectedValue(new Error('ES error'));

      await getQueryBuilder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Error retrieving data from getQueryBuilder'),
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('postQueryBuilder', () => {
    test('should create a new query builder and return 201', async () => {
      mockReq.body = {
        name: 'New Query',
        description: 'A new query',
        queryBuilderParams: { condition: 'AND', rules: [] },
      };

      client.index.mockResolvedValue({ _id: 'new-id' });

      await postQueryBuilder(mockReq, mockRes);

      expect(client.index).toHaveBeenCalledWith(expect.objectContaining({
        index: 'querybuilder',
        body: {
          username: 'testuser',
          name: 'New Query',
          description: 'A new query',
          queryBuilderParams: { condition: 'AND', rules: [] },
        },
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 'new-id',
        name: 'New Query',
        description: 'A new query',
        queryBuilderParams: { condition: 'AND', rules: [] },
      });
    });

    test('should return 500 when elasticsearch indexing fails', async () => {
      mockReq.body = {
        name: 'New Query',
        description: 'A new query',
        queryBuilderParams: {},
      };

      client.index.mockRejectedValue(new Error('indexing failed'));

      await postQueryBuilder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Error adding data to querybuilder'),
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });

    test('should associate query builder with authenticated user', async () => {
      mockRes.locals.username = 'anotheruser';
      mockReq.body = {
        name: 'Query',
        description: 'Desc',
        queryBuilderParams: {},
      };

      client.index.mockResolvedValue({ _id: 'id1' });

      await postQueryBuilder(mockReq, mockRes);

      expect(client.index).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            username: 'anotheruser',
          }),
        })
      );
    });
  });

  describe('deleteQueryBuilder', () => {
    test('should delete a query builder by id and return 200', async () => {
      mockReq.params = { id: 'q1' };

      client.delete.mockResolvedValue({ result: 'deleted' });

      await deleteQueryBuilder(mockReq, mockRes);

      expect(client.delete).toHaveBeenCalledWith({
        index: 'querybuilder',
        id: 'q1',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Deleted successfully',
        id: 'q1',
      });
    });

    test('should return 500 when deletion fails', async () => {
      mockReq.params = { id: 'q1' };

      client.delete.mockRejectedValue(new Error('delete failed'));

      await deleteQueryBuilder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Error deleting data from querybuilder'),
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
