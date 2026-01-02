const jest = require("eslint-plugin-jest");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "public/**",
      "resources/**",
      "**/*.min.js",
      "jest.setup.js",
      "jest.config.js",
    ],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        module: "readonly",
        require: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      // Error prevention
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",

      // Best practices
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "prefer-const": "error",
    },
  },
  {
    files: ["**/*.test.js", "**/__tests__/**/*.js"],
    plugins: {
      jest,
    },
    languageOptions: {
      globals: {
        ...jest.environments.globals.globals,
        Storage: "readonly",
        DOMParser: "readonly",
        getComputedStyle: "readonly",
      },
    },
    rules: {
      ...jest.configs.recommended.rules,
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error",
      "jest/prefer-to-have-length": "warn",
      "jest/valid-expect": "error",
    },
  },
];
