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
  // Ratchet floors, set a few points below the current numbers (statements ~45,
  // branches ~37, functions ~51, lines ~45) so they don't fail today's suite but
  // do catch a real regression — a PR that deletes tests or lands a chunk of
  // untested code. Raise them as coverage climbs; don't lower them.
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 45,
      lines: 40,
      statements: 40,
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
