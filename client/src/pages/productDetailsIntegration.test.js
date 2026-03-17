// Koo Zhuo Hui, A0253417H

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import { CartProvider } from "../context/cart";
import ProductDetails from "./ProductDetails";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({ success: jest.fn() }));
jest.mock("../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);
jest.mock("../styles/ProductDetailsStyles.css", () => ({}), { virtual: true });

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useParams: () => mockUseParams(),
	useNavigate: () => mockNavigate,
}));

const baseProduct = {
	_id: "prod-001",
	name: "Mechanical Keyboard",
	description: "A high-quality mechanical keyboard for coders",
	price: 129.99,
	slug: "mechanical-keyboard",
	category: { _id: "cat-001", name: "Electronics" },
};

const relatedProducts = [
	{
		_id: "prod-002",
		name: "Wireless Mouse",
		description: "Ergonomic wireless mouse with long battery life and comfort",
		price: 49.99,
		slug: "wireless-mouse",
	},
	{
		_id: "prod-003",
		name: "USB Hub",
		description: "7-port USB 3.0 hub with fast data transfer speeds included",
		price: 29,
		slug: "usb-hub",
	},
];

const renderProductDetails = () =>
	render(
		<BrowserRouter>
			<CartProvider>
				<ProductDetails />
			</CartProvider>
		</BrowserRouter>,
	);

// mock getProduct, then mock get related products
const mockBothAPIs = (product = baseProduct, related = relatedProducts) => {
	axios.get.mockResolvedValueOnce({ data: { product } }).mockResolvedValueOnce({ data: { products: related } });
};

beforeEach(() => {
	jest.clearAllMocks();
	localStorage.clear();
	mockUseParams.mockReturnValue({ slug: "mechanical-keyboard" });
});

describe("getProduct API integration", () => {
	describe("API is called based on product slug", () => {
		it("getProduct API called with correct URL", async () => {
			mockBothAPIs();
			mockUseParams.mockReturnValue({ slug: "mechanical-keyboard" });

			renderProductDetails();

			await waitFor(() => expect(screen.getByText(/Mechanical Keyboard/)).toBeInTheDocument());
			await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/mechanical-keyboard"));
		});

		it("slug absent, API never called", async () => {
			mockUseParams.mockReturnValue({});

			renderProductDetails();
			await new Promise((r) => setTimeout(r, 50));
			expect(axios.get).not.toHaveBeenCalled();
		});
	});

	describe("Product fields rendered from API response", () => {
		it("product name is displayed", async () => {
			mockBothAPIs();
			renderProductDetails();
			await waitFor(() => expect(screen.getByText(/Mechanical Keyboard/)).toBeInTheDocument());
		});
		it("product description is displayed", async () => {
			mockBothAPIs();
			renderProductDetails();
			await waitFor(() => expect(screen.getByText(/A high-quality mechanical keyboard for coders/)).toBeInTheDocument());
		});
		it("product category name is displayed", async () => {
			mockBothAPIs();
			renderProductDetails();
			await waitFor(() => expect(screen.getByText(/Electronics/)).toBeInTheDocument());
		});
		it("product image uses correct photo API URL", async () => {
			mockBothAPIs();
			renderProductDetails();
			await waitFor(() => {
				const imgs = screen.getAllByRole("img");
				expect(imgs[0]).toHaveAttribute("src", "/api/v1/product/product-photo/prod-001");
				expect(imgs[0]).toHaveAttribute("alt", "Mechanical Keyboard");
			});
		});
	});

	describe("Price formatting", () => {
		it("integer price rendered as $X.00", async () => {
			mockBothAPIs({ ...baseProduct, price: 100 });
			renderProductDetails();
			await waitFor(() => expect(screen.getByText(/\$100\.00/)).toBeInTheDocument());
		});

		it("decimal price rounded to 2 dp", async () => {
			mockBothAPIs({ ...baseProduct, price: 129.99 });
			renderProductDetails();
			await waitFor(() => expect(screen.getByText(/\$129\.99/)).toBeInTheDocument());
		});

		it("price ≥ 1000 uses comma separator", async () => {
			mockBothAPIs({ ...baseProduct, price: 1299.99 });
			renderProductDetails();
			await waitFor(() => expect(screen.getByText(/\$1,299\.99/)).toBeInTheDocument());
		});
	});

	describe("API error handling", () => {
		it("getProduct throws → page renders without crashing, no product name", async () => {
			axios.get.mockRejectedValueOnce(new Error("Network error"));

			renderProductDetails();

			await waitFor(() => expect(axios.get).toHaveBeenCalled());
			// Page renders the skeleton (heading still present, no product name)
			expect(screen.getByText("Product Details")).toBeInTheDocument();
			expect(screen.queryByText("Mechanical Keyboard")).not.toBeInTheDocument();
		});
	});
});

describe("calls getProduct → getSimilarProduct", () => {
	it("getSimilarProduct called with pid and cid extracted from product response", async () => {
		mockBothAPIs();
		renderProductDetails();
		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
		expect(axios.get).toHaveBeenNthCalledWith(2, "/api/v1/product/related-product/prod-001/cat-001");
	});
	it("getSimilarProduct NOT called when getProduct fails (no pid/cid to pass)", async () => {
		axios.get.mockRejectedValueOnce(new Error("Product not found"));
		renderProductDetails();
		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
		expect(axios.get).not.toHaveBeenCalledWith(expect.stringContaining("related-product"));
	});
	it("getSimilarProduct throws, related section shows 'No Similar Products found'", async () => {
		axios.get.mockResolvedValueOnce({ data: { product: baseProduct } }).mockRejectedValueOnce(new Error("Related API error"));
		renderProductDetails();
		await waitFor(() => expect(screen.getByText("No Similar Products found")).toBeInTheDocument());
	});
});

describe("Related products rendering", () => {
	describe("Related products count", () => {
		it("No Similar Products found'", async () => {
			mockBothAPIs(baseProduct, []);
			renderProductDetails();
			await waitFor(() => screen.getByText(/Mechanical Keyboard/));
			await act(async () => {});
			expect(screen.getByText("No Similar Products found")).toBeInTheDocument();
		});

		it("1 related product", async () => {
			mockBothAPIs(baseProduct, [relatedProducts[0]]);
			renderProductDetails();
			await waitFor(() => {
				expect(screen.queryByText("No Similar Products found")).not.toBeInTheDocument();
				expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();
			});
		});

		it("2 related products", async () => {
			mockBothAPIs(baseProduct, relatedProducts);
			renderProductDetails();
			await waitFor(() => {
				expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();
				expect(screen.getByText("USB Hub")).toBeInTheDocument();
			});
		});
	});

	describe("Related product card fields", () => {
		it("related product name and price shown", async () => {
			mockBothAPIs(baseProduct, [relatedProducts[0]]);
			renderProductDetails();
			await waitFor(() => {
				expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();
				expect(screen.getByText(/\$49\.99/)).toBeInTheDocument();
			});
		});

		it("related product image uses correct photo API URL", async () => {
			mockBothAPIs(baseProduct, [relatedProducts[0]]);
			renderProductDetails();
			await waitFor(() => {
				const imgs = screen.getAllByRole("img");
				// imgs[0] = main product, imgs[1] = first related
				expect(imgs[1]).toHaveAttribute("src", "/api/v1/product/product-photo/prod-002");
				expect(imgs[1]).toHaveAttribute("alt", "Wireless Mouse");
			});
		});

		it("'More Details' button present for each related product", async () => {
			mockBothAPIs(baseProduct, relatedProducts);
			renderProductDetails();
			await waitFor(() => {
				expect(screen.getAllByText("More Details")).toHaveLength(2);
			});
		});

		it("'More Details' navigates to /product/:slug", async () => {
			mockBothAPIs(baseProduct, [relatedProducts[0]]);
			renderProductDetails();
			await waitFor(() => screen.getByText("More Details"));
			fireEvent.click(screen.getByText("More Details"));
			expect(mockNavigate).toHaveBeenCalledWith("/product/wireless-mouse");
		});

		it("each 'More Details' navigates to its own product slug", async () => {
			mockBothAPIs(baseProduct, relatedProducts);
			renderProductDetails();
			await waitFor(() => screen.getAllByText("More Details"));

			const buttons = screen.getAllByText("More Details");
			fireEvent.click(buttons[0]);
			expect(mockNavigate).toHaveBeenCalledWith("/product/wireless-mouse");

			fireEvent.click(buttons[1]);
			expect(mockNavigate).toHaveBeenCalledWith("/product/usb-hub");
		});
	});

	describe("Related product description truncated at 60 characters", () => {
		it("description < 60 chars", async () => {
			const desc = "Short description"; // 17 chars
			mockBothAPIs(baseProduct, [{ ...relatedProducts[0], description: desc }]);
			renderProductDetails();
			await waitFor(() => expect(screen.getByText(`${desc}...`)).toBeInTheDocument());
		});

		it("exactly 60 chars", async () => {
			const desc = "A".repeat(60);
			mockBothAPIs(baseProduct, [{ ...relatedProducts[0], description: desc }]);
			renderProductDetails();
			await waitFor(() => expect(screen.getByText(`${desc}...`)).toBeInTheDocument());
		});

		it("description of 61 chars", async () => {
			const desc = "C".repeat(61);
			mockBothAPIs(baseProduct, [{ ...relatedProducts[0], description: desc }]);
			renderProductDetails();
			await waitFor(() => expect(screen.getByText(`${"C".repeat(60)}...`)).toBeInTheDocument());
		});
	});
});

describe("ProductDetails & CartContext integration", () => {
	it("ADD TO CART adds the product to localStorage", async () => {
		mockBothAPIs();
		renderProductDetails();

		await waitFor(() => screen.getByText("Wireless Mouse")); // both API calls settled
		fireEvent.click(screen.getByText("ADD TO CART"));

		const saved = JSON.parse(localStorage.getItem("cart"));
		expect(saved).toHaveLength(1);
		expect(saved[0]._id).toBe("prod-001");
	});

	it("ADD TO CART appends product with 1 cart length", async () => {
		const existing = [{ _id: "prod-existing", name: "Old Item", price: 10 }];
		localStorage.setItem("cart", JSON.stringify(existing));

		mockBothAPIs();
		renderProductDetails();

		await waitFor(() => screen.getByText("Wireless Mouse"));
		fireEvent.click(screen.getByText("ADD TO CART"));

		await waitFor(() => {
			const saved = JSON.parse(localStorage.getItem("cart"));
			expect(saved).toHaveLength(2);
			expect(saved[1]._id).toBe("prod-001");
		});
	});

	it("toast.success shown when ADD TO CART clicked", async () => {
		mockBothAPIs();
		renderProductDetails();

		await waitFor(() => screen.getByText("Wireless Mouse"));
		fireEvent.click(screen.getByText("ADD TO CART"));

		expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
	});

	it("correct product object stored in localStorage", async () => {
		mockBothAPIs();
		renderProductDetails();

		await waitFor(() => screen.getByText("Wireless Mouse"));
		fireEvent.click(screen.getByText("ADD TO CART"));

		const saved = JSON.parse(localStorage.getItem("cart"));
		expect(saved[0]).toMatchObject({
			_id: "prod-001",
			name: "Mechanical Keyboard",
			price: 129.99,
		});
	});

	it("clicking ADD TO CART twice adds the same product twice", async () => {
		mockBothAPIs();
		renderProductDetails();

		await waitFor(() => screen.getByText("Wireless Mouse"));
		fireEvent.click(screen.getByText("ADD TO CART"));
		fireEvent.click(screen.getByText("ADD TO CART"));

		await waitFor(() => {
			const saved = JSON.parse(localStorage.getItem("cart"));
			expect(saved).toHaveLength(2);
		});
		expect(toast.success).toHaveBeenCalledTimes(2);
	});
});
