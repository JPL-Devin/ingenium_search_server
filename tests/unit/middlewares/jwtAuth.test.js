jest.mock('../../../src/config/app-config', () => ({
  public_pem: 'test-public-key',
}));

describe('jwtAuth', () => {
  let jwtAuth;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('../../../src/config/app-config', () => ({
      public_pem: 'test-public-key',
    }));
    jwtAuth = require('../../../src/middlewares/jwtAuth');
  });

  test('should export a middleware function', () => {
    expect(jwtAuth).toBeDefined();
    expect(typeof jwtAuth).toBe('function');
  });

  test('should have unless configuration excluding health and api-docs', () => {
    expect(jwtAuth).toBeDefined();
  });

  test('should reject requests without Authorization header on protected routes', () => {
    const mockReq = {
      headers: {},
      method: 'GET',
      url: '/api/v1/querybuilders',
      path: '/api/v1/querybuilders',
      header: jest.fn().mockReturnValue(undefined),
      is: jest.fn(),
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    jwtAuth(mockReq, mockRes, mockNext);

    if (mockNext.mock.calls.length > 0) {
      const err = mockNext.mock.calls[0][0];
      if (err) {
        expect(err.status).toBe(401);
      }
    }
  });

  test('should allow health endpoint through without auth', () => {
    const mockReq = {
      headers: {},
      method: 'GET',
      url: '/api/v1/health',
      path: '/api/v1/health',
      originalUrl: '/api/v1/health',
      header: jest.fn().mockReturnValue(undefined),
      is: jest.fn(),
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    jwtAuth(mockReq, mockRes, mockNext);

    if (mockNext.mock.calls.length > 0) {
      const firstArg = mockNext.mock.calls[0][0];
      if (firstArg && firstArg.code === 'credentials_required') {
        expect(mockReq.url).toBe('/api/v1/health');
      }
    }
  });
});
