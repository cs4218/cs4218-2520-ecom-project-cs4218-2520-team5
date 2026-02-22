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
    "client/src/pages/About.js",
    "client/src/pages/Contact.js",
    "client/src/pages/Pagenotfound.js",
    "client/src/pages/Policy.js",
    "client/src/pages/Search.js",
    "client/src/pages/Auth/Login.js",
    "client/src/pages/Auth/Register.js",
    "client/src/pages/user/Dashboard.js",
    "client/src/pages/user/Orders.js",
    "client/src/pages/user/Profile.js",
    "client/src/context/auth.js",
    "client/src/context/search.js",
    "client/src/components/Form/SearchInput.js",
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
