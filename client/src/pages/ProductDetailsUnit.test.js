// Koo Zhuo Hui, A0253417H
// Assisted with AI
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import ProductDetails from "./ProductDetails";

jest.mock("axios");

jest.mock("../components/Layout", () => ({
	__esModule: true,
	default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

jest.mock("../context/cart", () => ({
	useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("react-hot-toast", () => ({
	__esModule: true,
	default: { success: jest.fn() },
}));

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
	description: "A high-quality mechanical keyboard for coders and enthusiasts", // 62 chars
	price: 129.99,
	slug: "mechanical-keyboard",
	category: { _id: "cat-001", name: "Electronics" },
};

const relatedProduct1 = {
	_id: "prod-002",
	name: "Wireless Mouse",
	description: "Ergonomic wireless mouse with long battery life for daily use.", // 62 chars
	price: 49.99,
	slug: "wireless-mouse",
};

const relatedProduct2 = {
	_id: "prod-003",
	name: "USB Hub",
	description: "Compact USB hub with four ports for your desktop setup.",
	price: 19.99,
	slug: "usb-hub",
};

const renderComponent = () =>
	render(
		<BrowserRouter>
			<ProductDetails />
		</BrowserRouter>,
	);

const mockBothAPIs = (product = baseProduct, related = [relatedProduct1]) => {
	axios.get.mockResolvedValueOnce({ data: { product } }).mockResolvedValueOnce({ data: { products: related } });
};

beforeEach(() => {
	jest.clearAllMocks();
	mockUseParams.mockReturnValue({ slug: "mechanical-keyboard" });
	jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
	console.log.mockRestore();
});

describe("Initial render", () => {
	it("does NOT call axios when params has no slug", () => {
		mockUseParams.mockReturnValue({});
		renderComponent();
		expect(axios.get).not.toHaveBeenCalled();
	});

	it("TC2 – calls axios.get when a valid slug is present", async () => {
		mockBothAPIs();
		renderComponent();
		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
	});
});

describe("getProduct API — EP on slug", () => {
	it("calls correct URL for valid slug", async () => {
		mockBothAPIs();
		renderComponent();
		await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/mechanical-keyboard"));
	});

	it("does NOT call axios when slug is undefined", () => {
		mockUseParams.mockReturnValue({ slug: undefined });
		renderComponent();
		expect(axios.get).not.toHaveBeenCalled();
	});

	it("does NOT call axios when slug is empty string", () => {
		// EP – empty string (falsy guard: if (params?.slug))
		mockUseParams.mockReturnValue({ slug: "" });
		renderComponent();
		expect(axios.get).not.toHaveBeenCalled();
	});
});

describe("getSimilarProduct chain", () => {
	it("calls related-product with correct pid and cid from getProduct response", async () => {
		mockBothAPIs();
		renderComponent();
		await waitFor(() =>
			expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/related-product/${baseProduct._id}/${baseProduct.category._id}`),
		);
	});

	it("renders related product cards after both APIs resolve", async () => {
		mockBothAPIs(baseProduct, [relatedProduct1]);
		renderComponent();
		await waitFor(() => expect(screen.getByText("Wireless Mouse")).toBeInTheDocument());
	});
});

describe("Product details rendering", () => {
	beforeEach(() => {
		mockBothAPIs();
	});

	it("renders product name", async () => {
		renderComponent();
		await waitFor(() => expect(screen.getByText(/Mechanical Keyboard/)).toBeInTheDocument());
	});

	it("renders product description", async () => {
		renderComponent();
		await waitFor(() => expect(screen.getByText(/A high-quality mechanical keyboard/)).toBeInTheDocument());
	});

	it("renders product price formatted as USD", async () => {
		renderComponent();
		await waitFor(() => expect(screen.getByText(/\$129\.99/)).toBeInTheDocument());
	});

	it("renders product category name", async () => {
		renderComponent();
		await waitFor(() => expect(screen.getByText(/Electronics/)).toBeInTheDocument());
	});

	it("renders product image with correct src and alt", async () => {
		renderComponent();
		await waitFor(() => screen.getByAltText("Mechanical Keyboard"));
		const img = screen.getByAltText("Mechanical Keyboard");
		expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/prod-001");
	});
});

describe("Related products count — BVA", () => {
	it("BVA below boundary (0): shows 'No Similar Products found'", async () => {
		// BVA: 0 related products → boundary case
		mockBothAPIs(baseProduct, []);
		renderComponent();
		await waitFor(() => screen.getByText(/Mechanical Keyboard/));
		await waitFor(() => expect(screen.getByText("No Similar Products found")).toBeInTheDocument());
	});

	it("BVA at boundary (1): hides message and shows 1 card", async () => {
		mockBothAPIs(baseProduct, [relatedProduct1]);
		renderComponent();
		await waitFor(() => expect(screen.getByText("Wireless Mouse")).toBeInTheDocument());
		expect(screen.queryByText("No Similar Products found")).not.toBeInTheDocument();
	});

	it("BVA above boundary (2): renders 2 cards", async () => {
		mockBothAPIs(baseProduct, [relatedProduct1, relatedProduct2]);
		renderComponent();
		await waitFor(() => expect(screen.getByText("Wireless Mouse")).toBeInTheDocument());
		expect(screen.getByText("USB Hub")).toBeInTheDocument();
	});
});

describe("Description truncation", () => {
	const renderWithDescription = (desc) => {
		const product = { ...baseProduct, description: desc };
		mockBothAPIs(baseProduct, [{ ...relatedProduct1, description: desc }]);
		renderComponent();
	};

	it("59 chars: shows all 59 chars + '...'", async () => {
		const desc59 = "a".repeat(59); // 59 chars
		renderWithDescription(desc59);
		await waitFor(() => expect(screen.getByText(`${desc59}...`)).toBeInTheDocument());
	});

	it("shows all 60 chars + '...'", async () => {
		const desc60 = "a".repeat(60); // exactly 60 chars
		renderWithDescription(desc60);
		await waitFor(() => expect(screen.getByText(`${desc60}...`)).toBeInTheDocument());
	});

	it("truncates to first 60 chars + '...'", async () => {
		const desc61 = "a".repeat(61); // 61 chars — last char should be cut
		renderWithDescription(desc61);
		await waitFor(() => expect(screen.getByText(`${"a".repeat(60)}...`)).toBeInTheDocument());
		expect(screen.queryByText(`${desc61}...`)).not.toBeInTheDocument();
	});

	it("empty string: shows '...' only", async () => {
		renderWithDescription("");
		await waitFor(() => expect(screen.getByText("...")).toBeInTheDocument());
	});
});

describe("Price formatting", () => {
	const renderWithPrice = (price) => {
		mockBothAPIs(baseProduct, [{ ...relatedProduct1, price }]);
		renderComponent();
	};

	it("displays $100.00", async () => {
		renderWithPrice(100);
		await waitFor(() => expect(screen.getByText("$100.00")).toBeInTheDocument());
	});

	it("displays $49.99", async () => {
		renderWithPrice(49.99);
		await waitFor(() => expect(screen.getByText("$49.99")).toBeInTheDocument());
	});

	it("displays $0.00", async () => {
		renderWithPrice(0);
		await waitFor(() => expect(screen.getByText("$0.00")).toBeInTheDocument());
	});
});

describe("More Details navigation", () => {
	it("clicking More Details navigates to /product/<slug>", async () => {
		mockBothAPIs(baseProduct, [relatedProduct1]);
		renderComponent();
		await waitFor(() => expect(screen.getByText("More Details")).toBeInTheDocument());
		fireEvent.click(screen.getByText("More Details"));
		expect(mockNavigate).toHaveBeenCalledWith("/product/wireless-mouse");
	});
});

describe("Error handling", () => {
	it("getProduct API failure: no crash, console.log called", async () => {
		const error = new Error("Network error");
		axios.get.mockRejectedValueOnce(error);
		renderComponent();
		await waitFor(() => expect(console.log).toHaveBeenCalledWith(error));
	});

	it("getSimilarProduct API failure: no crash, console.log called", async () => {
		const error = new Error("Related products fetch failed");
		axios.get.mockResolvedValueOnce({ data: { product: baseProduct } }).mockRejectedValueOnce(error);
		renderComponent();
		await waitFor(() => expect(console.log).toHaveBeenCalledWith(error));
	});
});
