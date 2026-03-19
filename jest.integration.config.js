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
};
