jest.mock('../../../src/controllers/healthController', () => ({
  checkHealth: jest.fn((req, res) => res.status(200).json({ status: 'OK' })),
}));

describe('healthRoutes', () => {
  let router;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('../../../src/controllers/healthController', () => ({
      checkHealth: jest.fn((req, res) => res.status(200).json({ status: 'OK' })),
    }));
    router = require('../../../src/routes/healthRoutes');
  });

  test('should export an Express router', () => {
    expect(router).toBeDefined();
    expect(router.stack).toBeDefined();
  });

  test('should have a GET /health route', () => {
    const healthRoute = router.stack.find(
      (layer) => layer.route && layer.route.path === '/health'
    );
    expect(healthRoute).toBeDefined();
    expect(healthRoute.route.methods.get).toBe(true);
  });
});
