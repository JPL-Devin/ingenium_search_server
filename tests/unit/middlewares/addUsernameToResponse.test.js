jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const mockKeyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

jest.mock('../../../src/config/app-config', () => ({
  public_pem: '',
}));

describe('addUsernameToResponse', () => {
  let addUsernameToResponse, mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.resetModules();

    jest.mock('../../../src/config/app-config', () => ({
      public_pem: mockKeyPair.publicKey,
    }));

    jest.mock('../../../src/utils/logger', () => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    }));

    addUsernameToResponse = require('../../../src/middlewares/addUsernameToResponse');

    mockReq = {
      header: jest.fn(),
    };
    mockRes = {
      locals: {},
    };
    mockNext = jest.fn();
  });

  test('should extract username from valid JWT and set it on res.locals', () => {
    const token = jwt.sign({ username: 'testuser' }, mockKeyPair.privateKey, { algorithm: 'RS256' });
    mockReq.header.mockReturnValue(`Bearer ${token}`);

    addUsernameToResponse(mockReq, mockRes, mockNext);

    expect(mockRes.locals.username).toBe('testuser');
    expect(mockNext).toHaveBeenCalled();
  });

  test('should call next without setting username when no Authorization header', () => {
    mockReq.header.mockReturnValue(undefined);

    addUsernameToResponse(mockReq, mockRes, mockNext);

    expect(mockRes.locals.username).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  test('should call next without setting username when token is invalid', () => {
    mockReq.header.mockReturnValue('Bearer invalid-token');

    addUsernameToResponse(mockReq, mockRes, mockNext);

    expect(mockRes.locals.username).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  test('should log error when JWT verification fails', () => {
    const logger = require('../../../src/utils/logger');
    mockReq.header.mockReturnValue('Bearer bad.token.here');

    addUsernameToResponse(mockReq, mockRes, mockNext);

    expect(logger.error).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  test('should handle token without username claim', () => {
    const token = jwt.sign({ sub: 'someuser' }, mockKeyPair.privateKey, { algorithm: 'RS256' });
    mockReq.header.mockReturnValue(`Bearer ${token}`);

    addUsernameToResponse(mockReq, mockRes, mockNext);

    expect(mockRes.locals.username).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });
});
