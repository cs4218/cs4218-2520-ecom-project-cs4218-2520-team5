// Ivan Ang, A0259256U
// Assisted with AI
export default {
  transform: {},
  displayName: "integration",
  injectGlobals: true,
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/integration/*.test.js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testTimeout: 30000,
  forceExit: true,
  // Below added by: Ong Xin Hui Lynnette, A0257058X
  projects: [
    {
      displayName: "frontend-integration",
      testEnvironment: "jest-environment-jsdom",
      transform: {
        "^.+\\.jsx?$": "babel-jest",
      },
      moduleNameMapper: {
        "\\.(css|scss)$": "identity-obj-proxy",
      },
      transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],
      testMatch: ["<rootDir>/client/src/**/*.integration.test.js"],
      setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
    },
    {
      displayName: "backend-integration",
      testEnvironment: "node",
      transform: {},
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
      },
      testMatch: [
        "<rootDir>/controllers/*.integration.test.js",
        "<rootDir>/middlewares/*.integration.test.js",
        "<rootDir>/tests/**/*.supertest.integration.test.js",
      ],
    },
  ],
};
