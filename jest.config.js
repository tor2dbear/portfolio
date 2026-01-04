module.exports = {
  // Use jsdom for DOM testing
  testEnvironment: "jsdom",

  // Setup files to run after jest is initialized
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Test file patterns
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],

  // Coverage configuration
  collectCoverageFrom: [
    "assets/js/**/*.js",
    "!assets/js/**/*.min.js",
    "!**/node_modules/**",
    "!**/vendor/**",
  ],

  // Coverage thresholds (starting conservative, will increase over time)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },

  // Coverage reporters
  coverageReporters: ["text", "text-summary", "html", "lcov"],

  // Module paths
  moduleDirectories: ["node_modules", "assets/js"],

  // Transform files (if needed for ES6+ syntax)
  transform: {},

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/public/", "/resources/"],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,
};
