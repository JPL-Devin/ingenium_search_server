describe('healthController', () => {
  const { checkHealth } = require('../../../src/controllers/healthController');

  test('should return 200 with OK status', async () => {
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await checkHealth(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'OK',
      message: 'Service is running',
    });
  });
});
