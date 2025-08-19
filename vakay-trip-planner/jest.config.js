const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env.local files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
                moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
              },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/types/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 2,
      functions: 2,
      lines: 2,
      statements: 2,
    },
  },
                testMatch: [
                '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
                '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
              ],
              testPathIgnorePatterns: [
                '<rootDir>/src/e2e/',
                '<rootDir>/node_modules/'
              ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
