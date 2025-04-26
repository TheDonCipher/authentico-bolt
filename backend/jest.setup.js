/**
 * Jest setup file for Authentico backend security testing
 */

// Increase timeout for all tests
jest.setTimeout(30000);

// Silence console logs during tests unless explicitly enabled
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Add global test utilities
global.waitFor = async (condition, timeout = 5000, interval = 100) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) return true;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};
