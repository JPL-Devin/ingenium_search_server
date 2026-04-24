jest.mock('../../../src/controllers/queryBuilderController', () => ({
  getAllQueryBuilder: jest.fn(),
  getQueryBuilder: jest.fn(),
  postQueryBuilder: jest.fn(),
  deleteQueryBuilder: jest.fn(),
}));

describe('queryBuilderRoutes', () => {
  let router;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('../../../src/controllers/queryBuilderController', () => ({
      getAllQueryBuilder: jest.fn(),
      getQueryBuilder: jest.fn(),
      postQueryBuilder: jest.fn(),
      deleteQueryBuilder: jest.fn(),
    }));
    router = require('../../../src/routes/queryBuilderRoutes');
  });

  test('should export an Express router', () => {
    expect(router).toBeDefined();
    expect(router.stack).toBeDefined();
  });

  test('should have a GET /querybuilders route', () => {
    const route = router.stack.find(
      (layer) => layer.route && layer.route.path === '/querybuilders' && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });

  test('should have a GET /querybuilders/:id route', () => {
    const route = router.stack.find(
      (layer) => layer.route && layer.route.path === '/querybuilders/:id' && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });

  test('should have a POST /querybuilders route', () => {
    const route = router.stack.find(
      (layer) => layer.route && layer.route.path === '/querybuilders' && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  test('should have a DELETE /querybuilders/:id route', () => {
    const route = router.stack.find(
      (layer) => layer.route && layer.route.path === '/querybuilders/:id' && layer.route.methods.delete
    );
    expect(route).toBeDefined();
  });
});
