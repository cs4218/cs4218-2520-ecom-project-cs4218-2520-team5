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
    "controllers/authController.js",
    "controllers/orderController.js",
    "controllers/categoryController.js",
    "middlewares/authMiddleware.js",
    "helpers/authHelper.js",
    "models/**",
    "config/db.js",
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
