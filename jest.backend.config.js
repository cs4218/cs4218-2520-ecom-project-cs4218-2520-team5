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
	coverageDirectory: "coverage/backend",
	coverageReporters: ["lcov", "text"],
	collectCoverageFrom: [
		"controllers/authController.js",
		"controllers/orderController.js",
		"controllers/categoryController.js",
		"controllers/productController.js",
		"middlewares/authMiddleware.js",
		"helpers/authHelper.js",
		"models/userModel.js",
		"models/orderModel.js",
		"config/db.js",
	],
	coverageThreshold: {
		global: {
			lines: 98,
			functions: 100,
		},
	},
};
