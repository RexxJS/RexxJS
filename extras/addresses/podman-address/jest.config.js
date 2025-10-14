module.exports = {
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '../../'],
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js'
  ],
  coverageDirectory: 'coverage'
};
