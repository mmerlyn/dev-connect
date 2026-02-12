/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  testMatch: ['**/tests/unit/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  collectCoverageFrom: ['src/modules/**/*.service.ts'],
};
