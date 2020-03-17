module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./src/jest.setup.js', './src/jest.teardown.js'],
  reporters: ['default', '<rootDir>/src/reporter.js']
};
