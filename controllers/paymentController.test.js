// Koo Zhuo Hui, A0253417H
import { jest } from "@jest/globals";

// Define mocks first
const mockSale = jest.fn();
const mockGenerate = jest.fn();
const mockSave = jest.fn().mockResolvedValue({});
const MockOrderModel = jest.fn().mockImplementation(() => ({ save: mockSave }));

jest.unstable_mockModule("../config/braintree.js", () => ({
	default: {
		clientToken: { generate: mockGenerate },
		transaction: { sale: mockSale },
	},
}));

//Mock orders
jest.unstable_mockModule("../models/orderModel.js", () => {
	return { __esModule: true, default: MockOrderModel };
});

const { braintreeTokenController, brainTreePaymentController } = await import("../controllers/productController.js");

describe("braintreeTokenController", () => {
	let req, res;

	beforeEach(() => {
		req = {};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			send: jest.fn(),
		};
	});

	test("should return client token successfully", async () => {
		const mockResponse = { clientToken: "fake-token" };
		mockGenerate.mockImplementation((obj, cb) => {
			cb(null, { clientToken: "fake-token" });
		});
		await braintreeTokenController(req, res);

		expect(res.status).not.toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith(mockResponse);
	});

	test("should return 500 if error occurs", async () => {
		mockGenerate.mockImplementation((obj, cb) => {
			cb(new Error("Fail"), null);
		});

		await braintreeTokenController(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
	});
});

describe("brainTreePaymentController", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const mockRequest = (body = {}, user = { _id: "user123" }) => ({
		body,
		user,
	});

	const mockResponse = () => {
		const res = {};
		res.status = jest.fn().mockReturnValue(res);
		res.json = jest.fn().mockReturnValue(res);
		res.send = jest.fn();
		return res;
	};

	test("return 400 if nonce is missing", async () => {
		const req = mockRequest({ cart: [{ price: 10 }] });
		const res = mockResponse();

		await brainTreePaymentController(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: "Invalid payment data" });
	});

	test("return 400 if cart is missing", async () => {
		const req = mockRequest({ nonce: "valid-nonce" });
		const res = mockResponse();

		await brainTreePaymentController(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: "Invalid payment data" });
	});

	test("return 400 if cart is empty", async () => {
		const req = mockRequest({ nonce: "valid-nonce", cart: [] });
		const res = mockResponse();

		await brainTreePaymentController(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: "Invalid payment data" });
	});

	test("return 200 successful payment", async () => {
		const cart = [{ price: 10 }, { price: 20.5 }, { price: 5.75 }];
		const req = mockRequest({ nonce: "valid-nonce", cart });
		const res = mockResponse();

		const mockSave = jest.fn().mockResolvedValue({});
		MockOrderModel.mockImplementation(() => ({ save: mockSave }));

		mockSale.mockImplementation((data, cb) => {
			cb(null, { success: true });
		});

		await brainTreePaymentController(req, res);

		expect(mockSale).toHaveBeenCalledWith(expect.objectContaining({ amount: "36.25" }), expect.any(Function));
		expect(res.status).toHaveBeenCalledWith(200);
	});

	test("should save order", async () => {
		const cart = [{ price: 10 }];
		const mockSave = jest.fn().mockResolvedValue({});
		const req = mockRequest({ nonce: "valid-nonce", cart }, { _id: "user123" });
		const res = mockResponse();

		MockOrderModel.mockImplementation((data) => {
			expect(data.products).toEqual(cart);
			expect(data.payment).toEqual({ success: true });
			expect(data.buyer).toBe("user123");
			return { save: mockSave };
		});

		mockSale.mockImplementation((data, cb) => {
			cb(null, { success: true });
		});

		await brainTreePaymentController(req, res);

		expect(mockSave).toHaveBeenCalledTimes(1);
		expect(res.status).toHaveBeenCalledWith(200);
	});

	test("should return 500 if gateway returns an error", async () => {
		const req = mockRequest({
			nonce: "valid-nonce",
			cart: [{ price: 10 }],
		});
		const res = mockResponse();

		mockSale.mockImplementation((data, callback) => {
			callback({ message: "Gateway timeout" }, null);
		});

		await brainTreePaymentController(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Gateway timeout" });
	});

	test("should return 500 if result.success is false", async () => {
		const req = mockRequest({
			nonce: "valid-nonce",
			cart: [{ price: 10 }],
		});
		const res = mockResponse();

		mockSale.mockImplementation((data, callback) => {
			callback(null, { success: false, message: "Result is false" });
		});

		await brainTreePaymentController(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Result is false" });
	});

	test("should return 500 if orderModel.save() throws error", async () => {
		const req = mockRequest({
			nonce: "valid-nonce",
			cart: [{ price: 10 }],
		});
		const res = mockResponse();

		const mockSave = jest.fn().mockRejectedValue(new Error("DB error"));
		MockOrderModel.mockImplementation(() => ({ save: mockSave }));

		mockSale.mockImplementation((data, callback) => {
			callback(null, { success: true });
		});

		await brainTreePaymentController(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Save failed" });
	});
});
