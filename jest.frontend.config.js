export default {
  displayName: "frontend",

  testEnvironment: "jest-environment-jsdom",

  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  testMatch: [
    "<rootDir>/client/src/pages/**/*.test.js",
    "<rootDir>/client/src/components/**/*.test.js",
    "<rootDir>/client/src/context/**/*.test.js",
    "<rootDir>/client/src/hooks/useCategory.test.js",
  ],

  collectCoverage: true,
  collectCoverageFrom: [
    "client/src/pages/**/*.js",
    "client/src/context/**/*.js",
    "client/src/components/Form/**/*.js",
    "client/src/components/Footer.js",
    "client/src/components/Spinner.js",
    "client/src/components/Layout.js",
    "client/src/components/UserMenu.js",
    "client/src/components/AdminMenu.js",
    "client/src/components/Routes/Private.js",
    "client/src/hooks/useCategory.js",
    "!**/*.test.js",
    "!**/node_modules/**",
    "!**/_site/**",
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
