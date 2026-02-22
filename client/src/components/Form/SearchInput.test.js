import React from "react";
import { SearchProvider, useSearch } from "../../context/search";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SearchInput from "./SearchInput";
import axios from "axios";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: () => mockNavigate,
}));

const renderWithProviders = (component) => {
	return render(
		<BrowserRouter>
			<SearchProvider>{component}</SearchProvider>
		</BrowserRouter>,
	);
};

const mockData = [
	{
		_id: "1",
		name: "Product A",
		description: "Description A",
		price: 10,
	},
	{
		_id: "2",
		name: "Product B",
		description: "This is a very very very long description for Product B",
		price: 20,
	},
];

describe("Search input", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Rendering", () => {
		test("renders search form correctly", () => {
			renderWithProviders(<SearchInput />);

			expect(screen.getByRole("search")).toBeInTheDocument();
			expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
		});

		test("renders button correctly", () => {
			renderWithProviders(<SearchInput />);

			const button = screen.getByRole("button", { name: /search/i });
			expect(button).toHaveAttribute("type", "submit");
			expect(button).toHaveClass("btn", "btn-outline-success");
		});

		test("input is empty initially", () => {
			renderWithProviders(<SearchInput />);

			const input = screen.getByPlaceholderText("Search");
			expect(input).toHaveValue("");
		});
	});

	describe("Input value changes", () => {
		test("updates to input values", () => {
			renderWithProviders(<SearchInput />);

			const input = screen.getByPlaceholderText("Search");
			fireEvent.change(input, { target: { value: "abc" } });
			expect(input).toHaveValue("abc");

			fireEvent.change(input, { target: { value: "123456" } });
			expect(input).toHaveValue("123456");

			fireEvent.change(input, { target: { value: "!@#!@#" } });
			expect(input).toHaveValue("!@#!@#");
		});

		test("clear values on input", () => {
			renderWithProviders(<SearchInput />);

			const input = screen.getByPlaceholderText("Search");
			fireEvent.change(input, { target: { value: "abc" } });

			fireEvent.change(input, { target: { value: "" } });
			expect(input).toHaveValue("");
		});
	});

	describe("Form submission", () => {
		test("calls API correctly and navigate to /search", async () => {
			axios.get.mockResolvedValueOnce({
				data: [],
			});

			renderWithProviders(<SearchInput />);

			const input = screen.getByPlaceholderText("Search");
			const form = screen.getByRole("search");

			fireEvent.change(input, { target: { value: "Product A" } });
			fireEvent.submit(form);

			await waitFor(() => {
				expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/Product A");
				expect(axios.get).toHaveBeenCalledTimes(1);
				expect(mockNavigate).toHaveBeenCalledWith("/search");
				expect(mockNavigate).toHaveBeenCalledTimes(1);
			});
		});

		test("updates search context with API results", async () => {
			axios.get.mockResolvedValueOnce({ data: mockData });

			const TestComponent = () => {
				const [values] = useSearch();
				return (
					<div>
						<SearchInput />
						<div data-testid="results-count">{values.results.length}</div>
					</div>
				);
			};

			render(
				<BrowserRouter>
					<SearchProvider>
						<TestComponent />
					</SearchProvider>
				</BrowserRouter>,
			);

			const input = screen.getByPlaceholderText("Search");
			const form = screen.getByRole("search");

			fireEvent.change(input, { target: { value: "test" } });
			fireEvent.submit(form);

			await waitFor(() => {
				expect(screen.getByTestId("results-count")).toHaveTextContent("2");
			});
		});

		test("handles empty search", async () => {
			axios.get.mockResolvedValueOnce({ data: [] });

			renderWithProviders(<SearchInput />);
			const form = screen.getByRole("search");
			fireEvent.submit(form);

			await waitFor(() => {
				expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/");
			});
		});

		test("multiple form submissions", async () => {
			axios.get.mockResolvedValue({ data: [] });

			renderWithProviders(<SearchInput />);

			const input = screen.getByPlaceholderText("Search");
			const form = screen.getByRole("search");

			fireEvent.change(input, { target: { value: "test1" } });
			fireEvent.submit(form);

			fireEvent.change(input, { target: { value: "test2" } });
			fireEvent.submit(form);

			await waitFor(() => {
				expect(axios.get).toHaveBeenCalledTimes(2);
			});
		});
	});

	describe("Form submission error", () => {
		test("handle submit error catch", async () => {
			const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
			const errorResponse = {
				response: {
					status: 400,
					data: {
						success: false,
						message: "Error In Search Product API",
						error: {
							message: "Something went wrong",
						},
					},
				},
			};
			axios.get.mockRejectedValueOnce(errorResponse);

			renderWithProviders(<SearchInput />);

			const input = screen.getByPlaceholderText("Search");
			const form = screen.getByRole("search");

			fireEvent.change(input, { target: { value: "laptop" } });
			fireEvent.submit(form);

			await waitFor(() => {
				const loggedError = consoleLogSpy.mock.calls[0][0];
				expect(loggedError.response.status).toBe(400);
				expect(loggedError.response.data.success).toBe(false);
				expect(loggedError.response.data.message).toBe("Error In Search Product API");
			});

			consoleLogSpy.mockRestore();
		});
	});
});
