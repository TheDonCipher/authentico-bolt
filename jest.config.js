module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/frontend/app/components/$1',
    '^@lib/(.*)$': '<rootDir>/frontend/lib/$1',
    '^@utils/(.*)$': '<rootDir>/frontend/utils/$1',
    '^@contexts/(.*)$': '<rootDir>/frontend/app/contexts/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: [
    '<rootDir>/frontend/test/setup.js',
    '<rootDir>/frontend/test/jest-setup.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
};
