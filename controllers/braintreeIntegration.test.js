// Koo Zhuo Hui, A0253417H
import { jest } from "@jest/globals";

const mockClientTokenGenerate = jest.fn();
const mockTransactionSale = jest.fn();

jest.unstable_mockModule("../config/braintree.js", () => ({
	default: {
		clientToken: { generate: mockClientTokenGenerate },
		transaction: { sale: mockTransactionSale },
	},
}));

const mockOrderSave = jest.fn();
const MockOrderModel = jest.fn().mockImplementation((data) => ({
	...data,
	save: mockOrderSave,
}));

jest.unstable_mockModule("../models/orderModel.js", () => ({
	default: MockOrderModel,
}));

jest.unstable_mockModule("../models/productModel.js", () => ({
	default: Object.assign(jest.fn(), {
		find: jest.fn(),
		findOne: jest.fn(),
		findById: jest.fn(),
		findByIdAndDelete: jest.fn(),
		findByIdAndUpdate: jest.fn(),
	}),
}));

jest.unstable_mockModule("../models/categoryModel.js", () => ({
	default: { findOne: jest.fn() },
}));

jest.unstable_mockModule("fs", () => ({
	default: { readFileSync: jest.fn() },
	readFileSync: jest.fn(),
}));

jest.unstable_mockModule("slugify", () => ({ default: jest.fn() }));

const { braintreeTokenController, brainTreePaymentController } = await import("./productController.js");

describe("Braintree Integration Tests", () => {
	let req, res;

	beforeEach(() => {
		jest.clearAllMocks();

		req = {
			body: {},
			user: { _id: "user-id-001" },
		};

		res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
	});

	describe("braintreeTokenController - Gateway Token Generation", () => {
		it("returns 200 with token response when gateway is successful", async () => {
			const fakeResponse = { clientToken: "fake-token" };
			mockClientTokenGenerate.mockImplementation((_opts, cb) => cb(null, fakeResponse));

			await braintreeTokenController(req, res);

			expect(mockClientTokenGenerate).toHaveBeenCalledWith({}, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(fakeResponse);
		});

		it("returns 500 with error when gateway returns an error", async () => {
			const gatewayError = new Error("Invalid merchant credentials");
			mockClientTokenGenerate.mockImplementation((_opts, cb) => cb(gatewayError, null));

			await braintreeTokenController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith(gatewayError);
		});

		it("returns 500 with generic message when gateway throws synchronously", async () => {
			mockClientTokenGenerate.mockImplementation(() => {
				throw new Error("Gateway instantiation failed");
			});

			await braintreeTokenController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({ error: "Something went wrong" });
		});
	});

	describe("brainTreePaymentController - Payment Processing", () => {
		describe("input validation (controller boundary)", () => {
			it("returns 400 when nonce is absent", async () => {
				req.body = { cart: [{ price: 10 }] };

				await brainTreePaymentController(req, res);

				expect(res.status).toHaveBeenCalledWith(400);
				expect(res.json).toHaveBeenCalledWith({ error: "Invalid payment data" });
				expect(mockTransactionSale).not.toHaveBeenCalled();
			});

			it("returns 400 when nonce is an empty string (falsy)", async () => {
				req.body = { nonce: "", cart: [{ price: 10 }] };

				await brainTreePaymentController(req, res);

				expect(res.status).toHaveBeenCalledWith(400);
				expect(res.json).toHaveBeenCalledWith({ error: "Invalid payment data" });
				expect(mockTransactionSale).not.toHaveBeenCalled();
			});

			it("returns 400 when cart is absent", async () => {
				req.body = { nonce: "valid-nonce" };

				await brainTreePaymentController(req, res);

				expect(res.status).toHaveBeenCalledWith(400);
				expect(res.json).toHaveBeenCalledWith({ error: "Invalid payment data" });
				expect(mockTransactionSale).not.toHaveBeenCalled();
			});

			it("returns 400 when cart is null", async () => {
				req.body = { nonce: "valid-nonce", cart: null };

				await brainTreePaymentController(req, res);

				expect(res.status).toHaveBeenCalledWith(400);
				expect(res.json).toHaveBeenCalledWith({ error: "Invalid payment data" });
				expect(mockTransactionSale).not.toHaveBeenCalled();
			});

			it("returns 400 when cart is empty array", async () => {
				req.body = { nonce: "valid-nonce", cart: [] };

				await brainTreePaymentController(req, res);

				expect(res.status).toHaveBeenCalledWith(400);
				expect(res.json).toHaveBeenCalledWith({ error: "Invalid payment data" });
				expect(mockTransactionSale).not.toHaveBeenCalled();
			});

			it("passes validation and calls gateway when cart has 1 item", async () => {
				req.body = { nonce: "valid-nonce", cart: [{ price: 10.0 }] };

				mockTransactionSale.mockImplementation((_opts, cb) => cb(null, { success: true }));
				mockOrderSave.mockResolvedValue({});

				await brainTreePaymentController(req, res);

				expect(mockTransactionSale).toHaveBeenCalled();
				expect(res.status).toHaveBeenCalledWith(200);
			});

			it("passes when cart multiple items", async () => {
				req.body = { nonce: "valid-nonce", cart: [{ price: 10.0 }, { price: 20.0 }, { price: 30.0 }] };

				mockTransactionSale.mockImplementation((_opts, cb) => cb(null, { success: true }));
				mockOrderSave.mockResolvedValue({});

				await brainTreePaymentController(req, res);

				expect(mockTransactionSale).toHaveBeenCalled();
				expect(res.status).toHaveBeenCalledWith(200);
			});
		});

		describe("Cart Total Calculation passed to Gateway", () => {
			beforeEach(() => {
				mockTransactionSale.mockImplementation((_opts, cb) => cb(null, { success: true }));
				mockOrderSave.mockResolvedValue({});
			});

			it("cart with single item price=0 sends amount '0.00' to gateway", async () => {
				req.body = { nonce: "valid-nonce", cart: [{ price: 0 }] };

				await brainTreePaymentController(req, res);

				expect(mockTransactionSale).toHaveBeenCalledWith(expect.objectContaining({ amount: "0.00" }), expect.any(Function));
			});

			it("cart with single item price=0.01 (minimum positive) sends amount '0.01'", async () => {
				req.body = { nonce: "valid-nonce", cart: [{ price: 0.01 }] };

				await brainTreePaymentController(req, res);

				expect(mockTransactionSale).toHaveBeenCalledWith(expect.objectContaining({ amount: "0.01" }), expect.any(Function));
			});

			it("cart with multiple items sum correctly", async () => {
				req.body = {
					nonce: "valid-nonce",
					cart: [{ price: 10.5 }, { price: 20.3 }, { price: 5.2 }],
				};

				await brainTreePaymentController(req, res);

				const calledAmount = mockTransactionSale.mock.calls[0][0].amount;
				expect(parseFloat(calledAmount)).toBeCloseTo(36.0, 2);
			});

			it("sums 9999.99 + 0.01 sends amount '10000.00'", async () => {
				req.body = {
					nonce: "valid-nonce",
					cart: [{ price: 9999.99 }, { price: 0.01 }],
				};

				await brainTreePaymentController(req, res);

				expect(mockTransactionSale).toHaveBeenCalledWith(expect.objectContaining({ amount: "10000.00" }), expect.any(Function));
			});
		});

		describe("Gateway and OrderModel Integration", () => {
			it("gateway error returns 500 with error message, orderModel never instantiated", async () => {
				req.body = { nonce: "valid-nonce", cart: [{ price: 50 }] };
				const gatewayError = new Error("Transaction declined");

				mockTransactionSale.mockImplementation((_opts, cb) => cb(gatewayError, null));

				await brainTreePaymentController(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.json).toHaveBeenCalledWith({ error: "Transaction declined" });
				expect(MockOrderModel).not.toHaveBeenCalled();
				expect(mockOrderSave).not.toHaveBeenCalled();
			});

			it("successful payment, orderModel instantiated with correct data and saved", async () => {
				const cartItems = [
					{ _id: "prod-aaa", price: 29.99 },
					{ _id: "prod-bbb", price: 9.99 },
				];
				req.body = { nonce: "valid-nonce", cart: cartItems };
				const gatewayResult = {
					success: true,
					transaction: { id: "txn-xyz-001", status: "submitted_for_settlement" },
				};

				mockTransactionSale.mockImplementation((_opts, cb) => cb(null, gatewayResult));
				mockOrderSave.mockResolvedValue({});

				await brainTreePaymentController(req, res);

				expect(MockOrderModel).toHaveBeenCalledWith({
					products: cartItems,
					payment: gatewayResult,
					buyer: "user-id-001",
				});

				expect(mockOrderSave).toHaveBeenCalled();

				expect(res.status).toHaveBeenCalledWith(200);
				expect(res.json).toHaveBeenCalledWith({ ok: true });
			});

			it("payment result.success=false returns 500 with result message, orderModel never instantiated", async () => {
				req.body = { nonce: "valid-nonce", cart: [{ price: 75 }] };
				const failResult = { success: false, message: "Insufficient funds" };

				mockTransactionSale.mockImplementation((_opts, cb) => cb(null, failResult));

				await brainTreePaymentController(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.json).toHaveBeenCalledWith({ error: "Insufficient funds" });
				expect(MockOrderModel).not.toHaveBeenCalled();
			});

			it("gateway.transaction.sale throws synchronously, returns 500 'Payment failed'", async () => {
				req.body = { nonce: "valid-nonce", cart: [{ price: 25 }] };

				mockTransactionSale.mockImplementation(() => {
					throw new Error("Unexpected gateway crash");
				});

				await brainTreePaymentController(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.json).toHaveBeenCalledWith({ error: "Payment failed" });
			});

			it("orderModel.save() fails, returns 500 'Save failed'", async () => {
				req.body = { nonce: "valid-nonce", cart: [{ price: 100 }] };

				mockTransactionSale.mockImplementation((_opts, cb) => cb(null, { success: true }));
				mockOrderSave.mockRejectedValue(new Error("MongoDB write error"));

				await brainTreePaymentController(req, res);

				expect(MockOrderModel).toHaveBeenCalled();
				expect(mockOrderSave).toHaveBeenCalled();

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.json).toHaveBeenCalledWith({ error: "Save failed" });
			});
		});

		describe("Payment gateway options passed correctly", () => {
			it("always passes paymentMethodNonce and submitForSettlement:true to gateway", async () => {
				req.body = { nonce: "valid-nonce", cart: [{ price: 100 }] };

				mockTransactionSale.mockImplementation((_opts, cb) => cb(null, { success: true }));
				mockOrderSave.mockResolvedValue({});

				await brainTreePaymentController(req, res);

				expect(mockTransactionSale).toHaveBeenCalledWith(
					expect.objectContaining({
						paymentMethodNonce: "valid-nonce",
						options: { submitForSettlement: true },
					}),
					expect.any(Function),
				);
			});
		});
	});
});
