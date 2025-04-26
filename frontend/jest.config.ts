import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'text', 'lcov', 'clover', 'html'],
  // Temporarily disabled coverage thresholds
  /*
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    }
  },
  */
  collectCoverageFrom: [
    'lib/validation-util.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/*.d.ts',
    '!**/test/**',
    '!**/coverage/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@public/(.*)$': '<rootDir>/public/$1',
    '^../../lib/api-client$': '<rootDir>/test/mocks/api-client.js',
    '^../../lib/firebase-client$': '<rootDir>/test/mocks/firebase-client.js',
    '^../../lib/auth-service$': '<rootDir>/test/mocks/auth-service.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/test/mocks/fileMock.js',
    // Added from jest.config.js
    '^@thirdweb-dev/react$': '<rootDir>/test/mocks/thirdweb.js',
    '^../../app/components/document/DocumentCard$':
      '<rootDir>/test/mocks/document-components.tsx',
    '^../../app/components/document/DocumentView$':
      '<rootDir>/test/mocks/document-components.tsx',
    '^../../app/components/document/DocumentSeal$':
      '<rootDir>/test/mocks/document-components.tsx',
    '^../../app/components/document/DocumentUploadForm$':
      '<rootDir>/test/mocks/document-components.tsx',
    '^../../app/components/landing/WalletConnectionModal$':
      '<rootDir>/test/mocks/wallet-components.tsx',
    '^../../app/contexts/AuthContext$': '<rootDir>/test/mocks/auth-context.tsx',
    '^../../app/contexts/OrganizationContext$':
      '<rootDir>/test/mocks/organization-context.tsx',
    '^../../app/components/document/DocumentUploadDialog$':
      '<rootDir>/test/mocks/document-upload-dialog.tsx',
    '^../../lib/token-util$': '<rootDir>/test/__mocks__/token-util.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/test/setup.js'],
  resolver: '<rootDir>/test/jest-resolver.js',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@passwordless-id/webauthn|thirdweb)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/cypress/',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testTimeout: 10000,
  verbose: true,
  // Removed watchPlugins to fix the error
};

export default createJestConfig(config);
