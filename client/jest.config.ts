import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'json',
  ],
  rootDir: './src',
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '(.*)$': '<rootDir>/services/$1.ts',
  },
  testRegex: '.*\\.test\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  globalSetup: '<rootDir>/test/loadEnvConfig.ts',
  testEnvironment: 'node',
};

export default config;
