import { jest } from "@jest/globals";

// Mock dependencies before importing the controller
const mockProductModel = {
	find: jest.fn(),
	findOne: jest.fn(),
	findById: jest.fn(),
	findByIdAndDelete: jest.fn(),
	findByIdAndUpdate: jest.fn(),
};

const mockCategoryModel = {
	findOne: jest.fn(),
};

const mockFs = {
	readFileSync: jest.fn(),
};

const mockSlugify = jest.fn();

const mockGateway = {
	clientToken: {
		generate: jest.fn(),
	},
	transaction: {
		sale: jest.fn(),
	},
};

jest.unstable_mockModule("braintree", () => ({
	default: {
		BraintreeGateway: jest.fn().mockReturnValue(mockGateway),
		Environment: { Sandbox: "sandbox" },
	},
}));

jest.unstable_mockModule("../models/orderModel.js", () => ({
	default: jest.fn().mockImplementation(() => ({
		save: jest.fn().mockResolvedValue({}),
	})),
}));

jest.unstable_mockModule("../models/productModel.js", () => ({
	default: jest.fn().mockImplementation(() => ({
		save: jest.fn(),
	})),
}));

jest.unstable_mockModule("../models/categoryModel.js", () => ({
	default: mockCategoryModel,
}));

jest.unstable_mockModule("fs", () => ({
	default: mockFs,
	readFileSync: mockFs.readFileSync,
}));

jest.unstable_mockModule("slugify", () => ({
	default: mockSlugify,
}));

// Now import after mocking
const productModelModule = await import("../models/productModel.js");
const productModel = productModelModule.default;
Object.assign(productModel, mockProductModel);

const categoryModel = (await import("../models/categoryModel.js")).default;
const fs = (await import("fs")).default;
const slugify = (await import("slugify")).default;

const {
	createProductController,
	getProductController,
	getSingleProductController,
	productPhotoController,
	deleteProductController,
	updateProductController,
	productFiltersController,
	productCountController,
	productListController,
	searchProductController,
	realtedProductController,
	productCategoryController,
	braintreeTokenController,
	brainTreePaymentController,
} = await import("./productController.js");

describe("Product Controller", () => {
	let req, res;

	beforeEach(() => {
		jest.clearAllMocks();

		// Reset mock implementations
		mockProductModel.find.mockReset();
		mockProductModel.findOne.mockReset();
		mockProductModel.findById.mockReset();
		mockProductModel.findByIdAndDelete.mockReset();
		mockProductModel.findByIdAndUpdate.mockReset();
		mockCategoryModel.findOne.mockReset();
		mockFs.readFileSync.mockReset();
		mockSlugify.mockReset();
		mockGateway.clientToken.generate.mockReset();
		mockGateway.transaction.sale.mockReset();

		req = {
			fields: {},
			files: {},
			params: {},
			body: {},
		};
		res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
		};
	});

	// ==================== createProductController Tests ====================
	describe("createProductController", () => {
		it("should return error when name is missing", async () => {
			req.fields = {
				description: "test",
				price: 100,
				category: "cat1",
				quantity: 10,
			};
			req.files = {};

			await createProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["Name is Required"],
			});
		});

		it("should return error when description is missing", async () => {
			req.fields = { name: "test", price: 100, category: "cat1", quantity: 10 };
			req.files = {};

			await createProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["Description is Required"],
			});
		});

		it("should return error when price is missing", async () => {
			req.fields = {
				name: "test",
				description: "test desc",
				category: "cat1",
				quantity: 10,
			};
			req.files = {};

			await createProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["Price is Required"],
			});
		});

		it("should return error when category is missing", async () => {
			req.fields = {
				name: "test",
				description: "test desc",
				price: 100,
				quantity: 10,
			};
			req.files = {};

			await createProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["Category is Required"],
			});
		});

		it("should return error when quantity is missing", async () => {
			req.fields = {
				name: "test",
				description: "test desc",
				price: 100,
				category: "cat1",
			};
			req.files = {};

			await createProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["Quantity is Required"],
			});
		});

		it("should return error when photo is larger than 1MB", async () => {
			req.fields = {
				name: "test",
				description: "test desc",
				price: 100,
				category: "cat1",
				quantity: 10,
			};
			req.files = { photo: { size: 2000000 } };

			await createProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["photo is Required and should be less than 1mb"],
			});
		});

		it("should create product successfully without photo", async () => {
			req.fields = {
				name: "Test Product",
				description: "test desc",
				price: 100,
				category: "cat1",
				quantity: 10,
			};
			req.files = {};

			slugify.mockReturnValue("test-product");
			const mockProduct = {
				...req.fields,
				slug: "test-product",
				save: jest.fn().mockResolvedValue(true),
			};
			productModel.mockImplementation(() => mockProduct);

			await createProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "Product Created Successfully",
				products: mockProduct,
			});
		});

		it("should create product successfully with photo", async () => {
			req.fields = {
				name: "Test Product",
				description: "test desc",
				price: 100,
				category: "cat1",
				quantity: 10,
			};
			req.files = {
				photo: { size: 500000, path: "/tmp/photo.jpg", type: "image/jpeg" },
			};

			slugify.mockReturnValue("test-product");
			fs.readFileSync.mockReturnValue(Buffer.from("photo data"));

			const mockProduct = {
				...req.fields,
				slug: "test-product",
				photo: { data: null, contentType: null },
				save: jest.fn().mockResolvedValue(true),
			};
			productModel.mockImplementation(() => mockProduct);

			await createProductController(req, res);

			expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/photo.jpg");
			expect(res.status).toHaveBeenCalledWith(201);
		});

		it("should handle error during product creation", async () => {
			req.fields = {
				name: "Test Product",
				description: "test desc",
				price: 100,
				category: "cat1",
				quantity: 10,
			};
			req.files = {};

			slugify.mockReturnValue("test-product");
			const mockError = new Error("Database error");
			productModel.mockImplementation(() => ({
				save: jest.fn().mockRejectedValue(mockError),
			}));

			await createProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				error: mockError,
				message: "Error in creating product",
			});
		});
	});

	// ==================== getProductController Tests ====================
	describe("getProductController", () => {
		it("should get all products successfully", async () => {
			const mockProducts = [
				{ _id: "1", name: "Product 1", price: 100 },
				{ _id: "2", name: "Product 2", price: 200 },
			];

			productModel.find = jest.fn().mockReturnValue({
				populate: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						limit: jest.fn().mockReturnValue({
							sort: jest.fn().mockResolvedValue(mockProducts),
						}),
					}),
				}),
			});

			await getProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				countTotal: 2,
				message: "All Products ",
				products: mockProducts,
			});
		});

		it("should handle error when getting products", async () => {
			const mockError = new Error("Database error");
			productModel.find = jest.fn().mockReturnValue({
				populate: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						limit: jest.fn().mockReturnValue({
							sort: jest.fn().mockRejectedValue(mockError),
						}),
					}),
				}),
			});

			await getProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Error in getting products",
				error: mockError.message,
			});
		});
	});

	// ==================== getSingleProductController Tests ====================
	describe("getSingleProductController", () => {
		it("should get single product successfully", async () => {
			const mockProduct = { _id: "1", name: "Product 1", slug: "product-1" };
			req.params.slug = "product-1";

			productModel.findOne = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					populate: jest.fn().mockResolvedValue(mockProduct),
				}),
			});

			await getSingleProductController(req, res);

			expect(productModel.findOne).toHaveBeenCalledWith({ slug: "product-1" });
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "Single Product Fetched",
				product: mockProduct,
			});
		});

		it("should handle error when getting single product", async () => {
			const mockError = new Error("Product not found");
			req.params.slug = "invalid-slug";

			productModel.findOne = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					populate: jest.fn().mockRejectedValue(mockError),
				}),
			});

			await getSingleProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Eror while getting single product",
				error: mockError,
			});
		});
	});

	// ==================== productPhotoController Tests ====================
	describe("productPhotoController", () => {
		it("should get product photo successfully", async () => {
			const mockPhotoData = Buffer.from("photo data");
			req.params.pid = "product-id";

			productModel.findById = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue({
					photo: {
						data: mockPhotoData,
						contentType: "image/jpeg",
					},
				}),
			});

			await productPhotoController(req, res);

			expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith(mockPhotoData);
		});

		it("should handle error when getting photo", async () => {
			const mockError = new Error("Photo not found");
			req.params.pid = "invalid-id";

			productModel.findById = jest.fn().mockReturnValue({
				select: jest.fn().mockRejectedValue(mockError),
			});

			await productPhotoController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Error while getting photo",
				error: mockError,
			});
		});

		it("should return 404 when product not found", async () => {
			req.params.pid = "nonexistent-id";

			productModel.findById = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue(null),
			});

			await productPhotoController(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Product not found",
			});
		});

		it("should do nothing when product has no photo data", async () => {
			req.params.pid = "product-id";

			productModel.findById = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue({
					photo: { data: null, contentType: null },
				}),
			});

			await productPhotoController(req, res);

			expect(res.status).not.toHaveBeenCalled();
		});
	});

	// ==================== deleteProductController Tests ====================
	describe("deleteProductController", () => {
		it("should delete product successfully", async () => {
			req.params.pid = "product-id";

			productModel.findByIdAndDelete = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue({}),
			});

			await deleteProductController(req, res);

			expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("product-id");
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "Product Deleted successfully",
			});
		});

		it("should handle error when deleting product", async () => {
			const mockError = new Error("Delete failed");
			req.params.pid = "invalid-id";

			productModel.findByIdAndDelete = jest.fn().mockReturnValue({
				select: jest.fn().mockRejectedValue(mockError),
			});

			await deleteProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Error while deleting product",
				error: mockError,
			});
		});
	});

	// ==================== updateProductController Tests ====================
	describe("updateProductController", () => {
		it("should return error when name is missing", async () => {
			req.fields = {
				description: "test",
				price: 100,
				category: "cat1",
				quantity: 10,
			};
			req.files = {};
			req.params.pid = "product-id";

			await updateProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["Name is Required"],
			});
		});

		it("should return error when description is missing", async () => {
			req.fields = { name: "test", price: 100, category: "cat1", quantity: 10 };
			req.files = {};
			req.params.pid = "product-id";

			await updateProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["Description is Required"],
			});
		});

		it("should return error when price is missing", async () => {
			req.fields = {
				name: "test",
				description: "test desc",
				category: "cat1",
				quantity: 10,
			};
			req.files = {};
			req.params.pid = "product-id";

			await updateProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["Price is Required"],
			});
		});

		it("should return error when category is missing", async () => {
			req.fields = {
				name: "test",
				description: "test desc",
				price: 100,
				quantity: 10,
			};
			req.files = {};
			req.params.pid = "product-id";

			await updateProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["Category is Required"],
			});
		});

		it("should return error when quantity is missing", async () => {
			req.fields = {
				name: "test",
				description: "test desc",
				price: 100,
				category: "cat1",
			};
			req.files = {};
			req.params.pid = "product-id";

			await updateProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["Quantity is Required"],
			});
		});

		it("should return error when photo is larger than 1MB", async () => {
			req.fields = {
				name: "test",
				description: "test desc",
				price: 100,
				category: "cat1",
				quantity: 10,
			};
			req.files = { photo: { size: 2000000 } };
			req.params.pid = "product-id";

			await updateProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				errors: ["photo is Required and should be less than 1mb"],
			});
		});

		it("should update product successfully without photo", async () => {
			req.fields = {
				name: "Updated Product",
				description: "updated desc",
				price: 150,
				category: "cat1",
				quantity: 20,
			};
			req.files = {};
			req.params.pid = "product-id";

			slugify.mockReturnValue("updated-product");
			const mockProduct = {
				...req.fields,
				slug: "updated-product",
				save: jest.fn().mockResolvedValue(true),
			};
			productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockProduct);

			await updateProductController(req, res);

			expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
				"product-id",
				{ ...req.fields, slug: "updated-product" },
				{ new: true },
			);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "Product Updated Successfully",
				products: mockProduct,
			});
		});

		it("should update product successfully with photo", async () => {
			req.fields = {
				name: "Updated Product",
				description: "updated desc",
				price: 150,
				category: "cat1",
				quantity: 20,
			};
			req.files = {
				photo: { size: 500000, path: "/tmp/photo.jpg", type: "image/jpeg" },
			};
			req.params.pid = "product-id";

			slugify.mockReturnValue("updated-product");
			fs.readFileSync.mockReturnValue(Buffer.from("photo data"));

			const mockProduct = {
				...req.fields,
				slug: "updated-product",
				photo: { data: null, contentType: null },
				save: jest.fn().mockResolvedValue(true),
			};
			productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockProduct);

			await updateProductController(req, res);

			expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/photo.jpg");
			expect(res.status).toHaveBeenCalledWith(201);
		});

		it("should handle error during product update", async () => {
			req.fields = {
				name: "Test Product",
				description: "test desc",
				price: 100,
				category: "cat1",
				quantity: 10,
			};
			req.files = {};
			req.params.pid = "product-id";

			slugify.mockReturnValue("test-product");
			const mockError = new Error("Update failed");
			productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);

			await updateProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				error: mockError,
				message: "Error in Update product",
			});
		});
	});

	// ==================== productFiltersController Tests ====================
	describe("productFiltersController", () => {
		it("should filter products by category", async () => {
			const mockProducts = [{ _id: "1", name: "Product 1" }];
			req.body = { checked: ["cat1", "cat2"], radio: [] };

			productModel.find = jest.fn().mockResolvedValue(mockProducts);

			await productFiltersController(req, res);

			expect(productModel.find).toHaveBeenCalledWith({
				category: ["cat1", "cat2"],
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				products: mockProducts,
			});
		});

		it("should filter products by price range", async () => {
			const mockProducts = [{ _id: "1", name: "Product 1" }];
			req.body = { checked: [], radio: [[0, 100]] };

			productModel.find = jest.fn().mockResolvedValue(mockProducts);

			await productFiltersController(req, res);

			expect(productModel.find).toHaveBeenCalledWith({
				$or: [{ price: { $gte: 0, $lte: 100 } }],
			});
			expect(res.status).toHaveBeenCalledWith(200);
		});

		it("should filter products by both category and price", async () => {
			const mockProducts = [{ _id: "1", name: "Product 1" }];
			req.body = { checked: ["cat1"], radio: [[50, 150]] };

			productModel.find = jest.fn().mockResolvedValue(mockProducts);

			await productFiltersController(req, res);

			expect(productModel.find).toHaveBeenCalledWith({
				category: ["cat1"],
				$or: [{ price: { $gte: 50, $lte: 150 } }],
			});
		});

		it("should handle error during filtering", async () => {
			const mockError = new Error("Filter error");
			req.body = { checked: [], radio: [] };

			productModel.find = jest.fn().mockRejectedValue(mockError);

			await productFiltersController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Error WHile Filtering Products",
				error: mockError,
			});
		});
	});

	// ==================== productCountController Tests ====================
	describe("productCountController", () => {
		it("should get product count successfully", async () => {
			productModel.find = jest.fn().mockReturnValue({
				estimatedDocumentCount: jest.fn().mockResolvedValue(25),
			});

			await productCountController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				total: 25,
			});
		});

		it("should handle error when getting product count", async () => {
			const mockError = new Error("Count error");
			productModel.find = jest.fn().mockReturnValue({
				estimatedDocumentCount: jest.fn().mockRejectedValue(mockError),
			});

			await productCountController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				message: "Error in product count",
				error: mockError,
				success: false,
			});
		});
	});

	// ==================== productListController Tests ====================
	describe("productListController", () => {
		it("should get product list for page 1", async () => {
			const mockProducts = [{ _id: "1", name: "Product 1" }];
			req.params.page = 1;

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					skip: jest.fn().mockReturnValue({
						limit: jest.fn().mockReturnValue({
							sort: jest.fn().mockResolvedValue(mockProducts),
						}),
					}),
				}),
			});

			await productListController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				products: mockProducts,
			});
		});

		it("should default to page 1 when no page param", async () => {
			const mockProducts = [{ _id: "1", name: "Product 1" }];
			req.params = {};

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					skip: jest.fn().mockReturnValue({
						limit: jest.fn().mockReturnValue({
							sort: jest.fn().mockResolvedValue(mockProducts),
						}),
					}),
				}),
			});

			await productListController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
		});

		it("should handle error when getting product list", async () => {
			const mockError = new Error("List error");
			req.params.page = 1;

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					skip: jest.fn().mockReturnValue({
						limit: jest.fn().mockReturnValue({
							sort: jest.fn().mockRejectedValue(mockError),
						}),
					}),
				}),
			});

			await productListController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "error in per page ctrl",
				error: mockError,
			});
		});
	});

	// ==================== searchProductController Tests ====================
	describe("searchProductController", () => {
		it("should search products by keyword", async () => {
			const mockProducts = [{ _id: "1", name: "Test Product" }];
			req.params.keyword = "test";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue(mockProducts),
			});

			await searchProductController(req, res);

			expect(productModel.find).toHaveBeenCalled();
			expect(res.json).toHaveBeenCalledWith(mockProducts);
		});

		it("should include singular variation when searching plural (books -> book)", async () => {
			const mockProducts = [{ _id: "1", name: "book" }];
			req.params.keyword = "books";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue(mockProducts),
			});

			await searchProductController(req, res);

			const findArgs = productModel.find.mock.calls[0][0];
			const patterns = findArgs.$or.map((c) => c.name?.$regex || c.description?.$regex).filter(Boolean);
			expect(patterns).toContain("book");
			expect(res.json).toHaveBeenCalledWith(mockProducts);
		});

		it("should include plural variation when searching singular (book -> books)", async () => {
			const mockProducts = [{ _id: "1", name: "books" }];
			req.params.keyword = "book";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue(mockProducts),
			});

			await searchProductController(req, res);

			const findArgs = productModel.find.mock.calls[0][0];
			const patterns = findArgs.$or.map((c) => c.name?.$regex || c.description?.$regex).filter(Boolean);
			expect(patterns).toContain("books");
			expect(res.json).toHaveBeenCalledWith(mockProducts);
		});

		it("should include y->ies variation (battery -> batteries)", async () => {
			const mockProducts = [];
			req.params.keyword = "battery";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue(mockProducts),
			});

			await searchProductController(req, res);

			const findArgs = productModel.find.mock.calls[0][0];
			const patterns = findArgs.$or.map((c) => c.name?.$regex || c.description?.$regex).filter(Boolean);
			expect(patterns).toContain("batteries");
		});

		it("should include ies->y variation (batteries -> battery)", async () => {
			const mockProducts = [];
			req.params.keyword = "batteries";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue(mockProducts),
			});

			await searchProductController(req, res);

			const findArgs = productModel.find.mock.calls[0][0];
			const patterns = findArgs.$or.map((c) => c.name?.$regex || c.description?.$regex).filter(Boolean);
			expect(patterns).toContain("battery");
		});

		it("should include es->strip variation (boxes -> box)", async () => {
			const mockProducts = [];
			req.params.keyword = "boxes";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue(mockProducts),
			});

			await searchProductController(req, res);

			const findArgs = productModel.find.mock.calls[0][0];
			const patterns = findArgs.$or.map((c) => c.name?.$regex || c.description?.$regex).filter(Boolean);
			expect(patterns).toContain("box");
		});

		it("should include ing->strip and ing->strip+e variations (computing -> comput, compute)", async () => {
			const mockProducts = [];
			req.params.keyword = "computing";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue(mockProducts),
			});

			await searchProductController(req, res);

			const findArgs = productModel.find.mock.calls[0][0];
			const patterns = findArgs.$or.map((c) => c.name?.$regex || c.description?.$regex).filter(Boolean);
			expect(patterns).toContain("comput");
			expect(patterns).toContain("compute");
		});

		it("should include ed->strip variations (walked -> walk)", async () => {
			const mockProducts = [];
			req.params.keyword = "walked";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue(mockProducts),
			});

			await searchProductController(req, res);

			const findArgs = productModel.find.mock.calls[0][0];
			const patterns = findArgs.$or.map((c) => c.name?.$regex || c.description?.$regex).filter(Boolean);
			expect(patterns).toContain("walk");
			expect(patterns).toContain("walke");
		});

		it("should handle error during search", async () => {
			const mockError = new Error("Search error");
			req.params.keyword = "test";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockRejectedValue(mockError),
			});

			await searchProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Error In Search Product API",
				error: mockError,
			});
		});
	});

	// ==================== realtedProductController Tests ====================
	describe("realtedProductController", () => {
		it("should get related products successfully", async () => {
			const mockProducts = [
				{ _id: "2", name: "Related Product 1" },
				{ _id: "3", name: "Related Product 2" },
			];
			req.params.pid = "1";
			req.params.cid = "category-id";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(mockProducts),
					}),
				}),
			});

			await realtedProductController(req, res);

			expect(productModel.find).toHaveBeenCalledWith({
				category: "category-id",
				_id: { $ne: "1" },
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				products: mockProducts,
			});
		});

		it("should handle error when getting related products", async () => {
			const mockError = new Error("Related products error");
			req.params.pid = "1";
			req.params.cid = "category-id";

			productModel.find = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockReturnValue({
						populate: jest.fn().mockRejectedValue(mockError),
					}),
				}),
			});

			await realtedProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "error while geting related product",
				error: mockError,
			});
		});
	});

	// ==================== productCategoryController Tests ====================
	describe("productCategoryController", () => {
		it("should get products by category successfully", async () => {
			const mockCategory = {
				_id: "cat1",
				name: "Electronics",
				slug: "electronics",
			};
			const mockProducts = [{ _id: "1", name: "Product 1" }];
			req.params.slug = "electronics";

			categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);
			productModel.find = jest.fn().mockReturnValue({
				populate: jest.fn().mockResolvedValue(mockProducts),
			});

			await productCategoryController(req, res);

			expect(categoryModel.findOne).toHaveBeenCalledWith({
				slug: "electronics",
			});
			expect(productModel.find).toHaveBeenCalledWith({
				category: mockCategory,
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				category: mockCategory,
				products: mockProducts,
			});
		});

		it("should handle error when getting products by category", async () => {
			const mockError = new Error("Category error");
			req.params.slug = "invalid-category";

			categoryModel.findOne = jest.fn().mockRejectedValue(mockError);

			await productCategoryController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				error: mockError,
				message: "Error While Getting products",
			});
		});
	});

	// ==================== braintreeTokenController Tests ====================
	describe("braintreeTokenController", () => {
		it("should generate client token successfully", async () => {
			const mockResponse = { clientToken: "test-token" };
			mockGateway.clientToken.generate.mockImplementation((opts, cb) => {
				cb(null, mockResponse);
			});

			await braintreeTokenController(req, res);

			expect(res.send).toHaveBeenCalledWith(mockResponse);
		});

		it("should handle error when generating client token", async () => {
			const mockError = new Error("Token error");
			mockGateway.clientToken.generate.mockImplementation((opts, cb) => {
				cb(mockError, null);
			});

			await braintreeTokenController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith(mockError);
		});

		it("should handle thrown exception in token generation", async () => {
			mockGateway.clientToken.generate.mockImplementation(() => {
				throw new Error("Unexpected throw");
			});

			await braintreeTokenController(req, res);
			// catch block reached — no crash
		});
	});

	// ==================== brainTreePaymentController Tests ====================
	describe("brainTreePaymentController", () => {
		it("should process payment and save order successfully", async () => {
			const mockResult = { transaction: { id: "txn123" } };
			req.body = { nonce: "test-nonce", cart: [{ price: 50 }, { price: 30 }] };
			req.user = { _id: "user1" };

			mockGateway.transaction.sale.mockImplementation((opts, cb) => {
				cb(null, mockResult);
			});

			await brainTreePaymentController(req, res);

			expect(res.json).toHaveBeenCalledWith({ ok: true });
		});

		it("should handle payment failure", async () => {
			const mockError = new Error("Payment failed");
			req.body = { nonce: "test-nonce", cart: [{ price: 100 }] };
			req.user = { _id: "user1" };

			mockGateway.transaction.sale.mockImplementation((opts, cb) => {
				cb(mockError, null);
			});

			await brainTreePaymentController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith(mockError);
		});

		it("should handle thrown exception in payment", async () => {
			req.body = { nonce: "test-nonce", cart: [{ price: 100 }] };
			req.user = { _id: "user1" };

			mockGateway.transaction.sale.mockImplementation(() => {
				throw new Error("Unexpected throw");
			});

			await brainTreePaymentController(req, res);
			// catch block reached — no crash
		});
	});
});
