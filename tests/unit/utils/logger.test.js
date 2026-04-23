describe('logger', () => {
  let logger;

  beforeEach(() => {
    jest.resetModules();
    logger = require('../../../src/utils/logger');
  });

  test('should export a winston logger instance', () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeInstanceOf(Function);
    expect(logger.error).toBeInstanceOf(Function);
    expect(logger.warn).toBeInstanceOf(Function);
    expect(logger.debug).toBeInstanceOf(Function);
  });

  test('should have info as default log level', () => {
    expect(logger.level).toBe('info');
  });

  test('should have at least one transport configured', () => {
    expect(logger.transports.length).toBeGreaterThanOrEqual(1);
  });

  test('should log info messages without throwing', () => {
    expect(() => logger.info('test info message')).not.toThrow();
  });

  test('should log error messages without throwing', () => {
    expect(() => logger.error('test error message')).not.toThrow();
  });

  test('should log warn messages without throwing', () => {
    expect(() => logger.warn('test warning message')).not.toThrow();
  });
});
