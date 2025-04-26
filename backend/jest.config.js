/**
 * Jest configuration for Authentico backend testing
 */
module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Test environment
  testEnvironment: 'node',

  // Coverage configuration
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'authMiddleware.js',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],

  // Test matching
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/'],

  // Setup files
  setupFilesAfterEnv: ['./jest.setup.js'],
  setupFiles: ['./test/setup.js'],

  // Verbosity
  verbose: true,

  // Timeout for tests (in milliseconds)
  testTimeout: 60000,

  // Performance improvements
  maxWorkers: '50%', // Run tests in parallel
  cache: true, // Cache test results for faster re-runs
  bail: false, // Don't stop on first failure

  // Mock handling
  restoreMocks: true, // Automatically restore mock state between every test
  resetMocks: false, // Don't reset mocks between tests
  resetModules: false, // Don't reset modules between tests

  // Process handling
  detectOpenHandles: true, // Detect open handles (like unfinished network requests or timers)
  forceExit: true, // Force Jest to exit after all tests have completed

  // Display
  displayName: {
    name: 'AUTHENTICO',
    color: 'green',
  },

  // The number of seconds after which a test is considered as slow
  slowTestThreshold: 5,
};
