module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.spec.(js|ts)',
    '**/__tests__/**/*.(js|ts)',
    '../examples/**/tests/**/*.spec.(js|ts)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/web/',
    'require-nodejs-wrapper.spec.js'  // Playwright test
  ],
  coverageDirectory: './coverage/',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/cli.js',
    '!src/rexxjs-cli.js',
    '!src/standalone-tools/**/*.js',
    '!src/output/**/*.js'
  ]
};