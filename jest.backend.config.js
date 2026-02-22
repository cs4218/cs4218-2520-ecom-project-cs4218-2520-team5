export default {
  displayName: "backend",

  injectGlobals: true,

  testEnvironment: "node",

  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/middlewares/*.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/models/*.test.js",
    "<rootDir>/config/db.test.js",
  ],

  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**",
    "middlewares/**",
    "helpers/**",
    "models/**",
    "config/db.js",
    "!**/*.test.js",
  ],
};
