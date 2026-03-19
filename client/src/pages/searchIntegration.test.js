// Koo Zhuo Hui, A0253417H

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";
import SearchInput from "../components/Form/SearchInput";
import Search from "./Search";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({ success: jest.fn() }));
jest.mock("../components/Layout", () => ({ children, title }) => (
	<div data-testid="layout" data-title={title}>
		{children}
	</div>
));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: () => mockNavigate,
}));

const renderSearchInput = () =>
	render(
		<BrowserRouter>
			<SearchProvider>
				<SearchInput />
			</SearchProvider>
		</BrowserRouter>,
	);

const renderSearchPage = (results = [], keyword = "") =>
	render(
		<BrowserRouter>
			<SearchProvider>
				<SearchPageSeeded results={results} keyword={keyword} />
			</SearchProvider>
		</BrowserRouter>,
	);

const SearchPageSeeded = ({ results, keyword }) => {
	const { useSearch } = require("../context/search");
	const [, setValues] = useSearch();
	React.useEffect(() => {
		setValues({ keyword, results });
	}, []);
	return (
		<CartProvider>
			<Search />
		</CartProvider>
	);
};

// For full integration test
const renderFull = () =>
	render(
		<BrowserRouter>
			<SearchProvider>
				<CartProvider>
					<SearchInput />
					<Search />
				</CartProvider>
			</SearchProvider>
		</BrowserRouter>,
	);

const sampleProducts = [
	{
		_id: "prod-1",
		name: "Laptop",
		description: "A powerful laptop for work",
		price: 999,
		slug: "laptop",
	},
	{
		_id: "prod-2",
		name: "Mouse",
		description: "Ergonomic wireless mouse with extra long description text",
		price: 29.99,
		slug: "mouse",
	},
	{
		_id: "prod-3",
		name: "Keyboard",
		description: "Mechanical keyboard",
		price: 79,
		slug: "keyboard",
	},
];

beforeEach(() => {
	jest.clearAllMocks();
	localStorage.clear();
});

describe("SearchContext & SearchInput integration", () => {
	describe("Search input partitions", () => {
		it("empty keyword initially empty", () => {
			renderSearchInput();
			expect(screen.getByPlaceholderText("Search")).toHaveValue("");
		});

		it("alphanumeric", () => {
			renderSearchInput();
			const input = screen.getByPlaceholderText("Search");
			fireEvent.change(input, { target: { value: "laptop" } });
			expect(input).toHaveValue("laptop");
		});

		it("special characters", () => {
			renderSearchInput();
			const input = screen.getByPlaceholderText("Search");
			fireEvent.change(input, { target: { value: "!@# $%" } });
			expect(input).toHaveValue("!@# $%");
		});

		it("numberics", () => {
			renderSearchInput();
			const input = screen.getByPlaceholderText("Search");
			fireEvent.change(input, { target: { value: "12345" } });
			expect(input).toHaveValue("12345");
		});
	});

	describe("Search input boundary values", () => {
		it("zero-length", async () => {
			axios.get.mockResolvedValueOnce({ data: [] });
			renderSearchInput();
			fireEvent.submit(screen.getByRole("search"));
			await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/"));
		});

		it("1 char", async () => {
			axios.get.mockResolvedValueOnce({ data: [] });
			renderSearchInput();
			fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "a" } });
			fireEvent.submit(screen.getByRole("search"));
			await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/a"));
		});

		it("multiple car", async () => {
			axios.get.mockResolvedValueOnce({ data: [] });
			renderSearchInput();
			fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "keyboard" } });
			fireEvent.submit(screen.getByRole("search"));
			await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/keyboard"));
		});
	});

	describe("API response -> SearchContext results partitions", () => {
		it("empty API response", async () => {
			axios.get.mockResolvedValueOnce({ data: [] });
			const { useSearch } = require("../context/search");

			const ResultSpy = () => {
				const [values] = useSearch();
				return <span data-testid="count">{values.results.length}</span>;
			};

			render(
				<BrowserRouter>
					<SearchProvider>
						<SearchInput />
						<ResultSpy />
					</SearchProvider>
				</BrowserRouter>,
			);

			fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "xyz" } });
			fireEvent.submit(screen.getByRole("search"));

			await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));
		});

		it("API response returns 1 result", async () => {
			axios.get.mockResolvedValueOnce({ data: [sampleProducts[0]] });
			const { useSearch } = require("../context/search");

			const ResultSpy = () => {
				const [values] = useSearch();
				return <span data-testid="count">{values.results.length}</span>;
			};

			render(
				<BrowserRouter>
					<SearchProvider>
						<SearchInput />
						<ResultSpy />
					</SearchProvider>
				</BrowserRouter>,
			);

			fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "laptop" } });
			fireEvent.submit(screen.getByRole("search"));

			await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
		});

		it("API returns 3 results", async () => {
			axios.get.mockResolvedValueOnce({ data: sampleProducts });
			const { useSearch } = require("../context/search");

			const ResultSpy = () => {
				const [values] = useSearch();
				return <span data-testid="count">{values.results.length}</span>;
			};

			render(
				<BrowserRouter>
					<SearchProvider>
						<SearchInput />
						<ResultSpy />
					</SearchProvider>
				</BrowserRouter>,
			);

			fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "all products" } });
			fireEvent.submit(screen.getByRole("search"));

			await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("3"));
		});

		it("API error", async () => {
			axios.get.mockRejectedValueOnce(new Error("Network error"));
			const { useSearch } = require("../context/search");

			const ResultSpy = () => {
				const [values] = useSearch();
				return <span data-testid="count">{values.results.length}</span>;
			};

			render(
				<BrowserRouter>
					<SearchProvider>
						<SearchInput />
						<ResultSpy />
					</SearchProvider>
				</BrowserRouter>,
			);

			fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "fail" } });
			fireEvent.submit(screen.getByRole("search"));

			await waitFor(() => expect(axios.get).toHaveBeenCalled());
			expect(screen.getByTestId("count")).toHaveTextContent("0");
		});
	});

	it("navigate('/search') is called after successful submission", async () => {
		axios.get.mockResolvedValueOnce({ data: [] });
		renderSearchInput();
		fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "test" } });
		fireEvent.submit(screen.getByRole("search"));
		await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/search"));
	});

	it("navigate NOT called when API throws", async () => {
		axios.get.mockRejectedValueOnce(new Error("fail"));
		renderSearchInput();
		fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "test" } });
		fireEvent.submit(screen.getByRole("search"));
		await waitFor(() => expect(axios.get).toHaveBeenCalled());
		expect(mockNavigate).not.toHaveBeenCalled();
	});
});

describe("Search Context & Search page integration", () => {
	describe("Boundary values for search page rendering", () => {
		it("No result", async () => {
			renderSearchPage([]);
			await waitFor(() => expect(screen.getByText("No Products Found")).toBeInTheDocument());
			expect(screen.queryByRole("img")).not.toBeInTheDocument();
		});

		it("1 result", async () => {
			renderSearchPage([sampleProducts[0]]);
			await waitFor(() => expect(screen.getByText("Found 1")).toBeInTheDocument());
			expect(screen.getAllByRole("img")).toHaveLength(1);
		});

		it("Multiple results", async () => {
			renderSearchPage(sampleProducts);
			await waitFor(() => expect(screen.getByText("Found 3")).toBeInTheDocument());
			expect(screen.getAllByRole("img")).toHaveLength(3);
		});
	});

	describe("Product details to be displayed", () => {
		it("product name and price are rendered from context", async () => {
			renderSearchPage([sampleProducts[0]]);
			await waitFor(() => expect(screen.getByText("Laptop")).toBeInTheDocument());
			expect(screen.getByText("$ 999")).toBeInTheDocument();
		});

		it("product image have correct API URL and alt text from context", async () => {
			renderSearchPage([sampleProducts[0]]);
			await waitFor(() => {
				const img = screen.getByRole("img");
				expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/prod-1");
				expect(img).toHaveAttribute("alt", "Laptop");
			});
		});

		it("each product has 'More Details' and 'ADD TO CART' buttons", async () => {
			renderSearchPage(sampleProducts.slice(0, 2));
			await waitFor(() => {
				expect(screen.getAllByText("More Details")).toHaveLength(2);
				expect(screen.getAllByText("ADD TO CART")).toHaveLength(2);
			});
		});
	});

	describe("Boundary values for product description", () => {
		it("less than 30 chars", async () => {
			const product = { ...sampleProducts[2], description: "Short desc" };
			renderSearchPage([product]);
			await waitFor(() => expect(screen.getByText("Short desc...")).toBeInTheDocument());
		});

		it("exactly 30 chars", async () => {
			const desc30 = "A".repeat(30); // 30 chars exactly
			const product = { ...sampleProducts[0], description: desc30 };
			renderSearchPage([product]);
			await waitFor(() => expect(screen.getByText(`${desc30}...`)).toBeInTheDocument());
		});

		it("over 30 chars", async () => {
			const longDesc = "A".repeat(50);
			const product = { ...sampleProducts[1], description: longDesc };
			renderSearchPage([product]);
			await waitFor(() => {
				expect(screen.getByText(`${longDesc.substring(0, 30)}...`)).toBeInTheDocument();
				expect(screen.queryByText(longDesc + "...")).not.toBeInTheDocument();
			});
		});
	});

	it("'More Details' navigates to /product/:slug via context slug", async () => {
		renderSearchPage([sampleProducts[0]]);
		await waitFor(() => screen.getByText("More Details"));
		fireEvent.click(screen.getByText("More Details"));
		expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
	});
});

describe("SearchInput -> API → SearchContext → Search Integration tests", () => {
	it("search returns results → Search page renders product cards", async () => {
		axios.get.mockResolvedValueOnce({ data: sampleProducts.slice(0, 2) });

		renderFull();

		fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "test" } });
		fireEvent.submit(screen.getByRole("search"));

		await waitFor(() => expect(screen.getByText("Found 2")).toBeInTheDocument());
		expect(screen.getByText("Laptop")).toBeInTheDocument();
		expect(screen.getByText("Mouse")).toBeInTheDocument();
	});

	it("search returns empty → Search page shows 'No Products Found'", async () => {
		axios.get.mockResolvedValueOnce({ data: [] });

		renderFull();

		expect(screen.getByText("No Products Found")).toBeInTheDocument();

		fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "unknown" } });
		fireEvent.submit(screen.getByRole("search"));

		await waitFor(() => expect(axios.get).toHaveBeenCalled());
		expect(screen.getByText("No Products Found")).toBeInTheDocument();
	});

	it("API error, but Search page results displays no products found", async () => {
		axios.get.mockRejectedValueOnce(new Error("500 Internal"));

		renderFull();
		fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "crash" } });
		fireEvent.submit(screen.getByRole("search"));

		await waitFor(() => expect(axios.get).toHaveBeenCalled());
		expect(screen.getByText("No Products Found")).toBeInTheDocument();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("second search overwrites first results in context", async () => {
		axios.get.mockResolvedValueOnce({ data: [sampleProducts[0]] }).mockResolvedValueOnce({ data: sampleProducts.slice(0, 2) });

		renderFull();

		const input = screen.getByPlaceholderText("Search");
		const form = screen.getByRole("search");

		fireEvent.change(input, { target: { value: "first" } });
		fireEvent.submit(form);
		await waitFor(() => expect(screen.getByText("Found 1")).toBeInTheDocument());

		fireEvent.change(input, { target: { value: "second" } });
		fireEvent.submit(form);
		await waitFor(() => expect(screen.getByText("Found 2")).toBeInTheDocument());

		expect(axios.get).toHaveBeenCalledTimes(2);
	});
});

describe("Search page & CartContext integration", () => {
	it("add 1 item to initially empty cart", async () => {
		renderSearchPage([sampleProducts[0]]);
		await waitFor(() => screen.getByText("ADD TO CART"));

		fireEvent.click(screen.getByText("ADD TO CART"));

		expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
		expect(JSON.parse(localStorage.getItem("cart"))).toEqual([sampleProducts[0]]);
	});

	it("add 1 item to cart with 1 item", async () => {
		localStorage.setItem("cart", JSON.stringify([sampleProducts[0]]));
		renderSearchPage([sampleProducts[1]]);

		await waitFor(() => screen.getByText("ADD TO CART"));
		fireEvent.click(screen.getByText("ADD TO CART"));

		await waitFor(() => {
			const cart = JSON.parse(localStorage.getItem("cart"));
			expect(cart).toHaveLength(2);
			expect(cart[1]._id).toBe("prod-2");
		});
	});

	it("add two different items to cart", async () => {
		renderSearchPage(sampleProducts.slice(0, 2));
		await waitFor(() => screen.getAllByText("ADD TO CART"));

		const buttons = screen.getAllByText("ADD TO CART");
		fireEvent.click(buttons[0]);
		fireEvent.click(buttons[1]);

		await waitFor(() => {
			const cart = JSON.parse(localStorage.getItem("cart"));
			expect(cart).toHaveLength(2);
			expect(cart.map((p) => p._id)).toEqual(["prod-1", "prod-2"]);
		});
	});

	it("toast shown for each ADD TO CART click", async () => {
		renderSearchPage(sampleProducts.slice(0, 2));
		await waitFor(() => screen.getAllByText("ADD TO CART"));

		const buttons = screen.getAllByText("ADD TO CART");
		fireEvent.click(buttons[0]);
		fireEvent.click(buttons[1]);

		expect(toast.success).toHaveBeenCalledTimes(2);
		expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
	});
});
