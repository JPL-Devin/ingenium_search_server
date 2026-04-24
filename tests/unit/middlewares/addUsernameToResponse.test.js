const addUsernameToResponse = require('../../../src/middlewares/addUsernameToResponse');

describe('addUsernameToResponse', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      locals: {},
    };
    mockNext = jest.fn();
  });

  test('should extract username from req.auth and set it on res.locals', () => {
    mockReq.auth = { username: 'testuser' };

    addUsernameToResponse(mockReq, mockRes, mockNext);

    expect(mockRes.locals.username).toBe('testuser');
    expect(mockNext).toHaveBeenCalled();
  });

  test('should call next without setting username when req.auth is absent', () => {
    addUsernameToResponse(mockReq, mockRes, mockNext);

    expect(mockRes.locals.username).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  test('should call next without setting username when req.auth has no username', () => {
    mockReq.auth = { sub: 'someuser' };

    addUsernameToResponse(mockReq, mockRes, mockNext);

    expect(mockRes.locals.username).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  test('should handle req.auth being null', () => {
    mockReq.auth = null;

    addUsernameToResponse(mockReq, mockRes, mockNext);

    expect(mockRes.locals.username).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });
});
