jest.mock('../../../src/controllers/searchController', () => ({
  searchQuery: jest.fn(),
}));

describe('searchRoutes', () => {
  let router;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('../../../src/controllers/searchController', () => ({
      searchQuery: jest.fn(),
    }));
    router = require('../../../src/routes/searchRoutes');
  });

  test('should export an Express router', () => {
    expect(router).toBeDefined();
    expect(router.stack).toBeDefined();
  });

  test('should have a POST /search route', () => {
    const route = router.stack.find(
      (layer) => layer.route && layer.route.path === '/search' && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });
});
