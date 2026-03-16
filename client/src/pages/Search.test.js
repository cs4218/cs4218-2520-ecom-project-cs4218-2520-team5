// Koo Zhuo Hui, A0253417H
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Search from "./Search";
import { useSearch } from "../context/search";
import { describe } from "node:test";
import { useCart } from "../context/cart";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

jest.mock("../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

jest.mock("../context/search", () => ({
	useSearch: jest.fn(),
}));

jest.mock("../context/cart", () => ({
	useCart: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
	useNavigate: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
}));

const mockNavigate = jest.fn();
const sampleProducts = [
	{
		_id: "1",
		name: "Product A",
		description: "Description A",
		price: 10,
		slug: "product-a",
	},
	{
		_id: "2",
		name: "Product B",
		description: "This is a very very very long description for Product B",
		price: 20,
		slug: "product-b",
	},
];

function useSearchWithSampleProducts(mockSetCart = jest.fn()) {
	useSearch.mockReturnValue([
		{
			results: sampleProducts,
		},
		jest.fn(),
	]);
	useCart.mockReturnValue([[], mockSetCart]);
	useNavigate.mockReturnValue(mockNavigate);
}

describe("Search", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("renders search page correctly", () => {
		useSearch.mockReturnValue([{ results: [] }, jest.fn()]);
		useCart.mockReturnValue([[], jest.fn()]);
		useNavigate.mockReturnValue(mockNavigate);
		render(<Search />);

		expect(screen.getByText("Search Resuts")).toBeInTheDocument();
		expect(screen.getByText("No Products Found")).toBeInTheDocument();
	});

	it("shows 'No Products Found' when result array is empty", () => {
		useSearch.mockReturnValue([{ results: [] }, jest.fn()]);
		useCart.mockReturnValue([[], jest.fn()]);
		useNavigate.mockReturnValue(mockNavigate);
		render(<Search />);

		expect(screen.getByText("No Products Found")).toBeInTheDocument();
		expect(screen.queryByRole("img")).not.toBeInTheDocument();
	});

	it("displays correct number of products", () => {
		useSearchWithSampleProducts();

		render(<Search />);

		expect(screen.getByText("Found 2")).toBeInTheDocument();
	});

	it("renders a product card for each result", () => {
		useSearchWithSampleProducts();

		render(<Search />);

		const cards = screen.getAllByText(/ADD TO CART/i);
		expect(cards.length).toBe(2);
	});

	it("displays product details correctly", () => {
		useSearchWithSampleProducts();

		render(<Search />);

		expect(screen.getByText("Product A")).toBeInTheDocument();
		expect(screen.getByText("Product B")).toBeInTheDocument();
		expect(screen.queryByText("Product C")).not.toBeInTheDocument();
		expect(screen.getByText("$ 10")).toBeInTheDocument();
		expect(screen.getByText("$ 20")).toBeInTheDocument();
		expect(screen.queryByText("$ 30")).not.toBeInTheDocument();
	});

	it("displays description correctly", () => {
		useSearchWithSampleProducts();

		render(<Search />);

		expect(screen.getByText(/Description A/)).toBeInTheDocument();
		expect(screen.queryByText(/This is a very very very long description/)).not.toBeInTheDocument();
	});

	it("renders product image correcly", () => {
		useSearchWithSampleProducts();

		render(<Search />);

		const images = screen.getAllByRole("img");

		expect(images.length).toBe(2);
		expect(images[0]).toHaveAttribute("src", "/api/v1/product/product-photo/1");
		expect(images[1]).toHaveAttribute("src", "/api/v1/product/product-photo/2");
		expect(images[0]).toHaveAttribute("alt", "Product A");
		expect(images[1]).toHaveAttribute("alt", "Product B");
	});

	it("renders button for each product", () => {
		useSearchWithSampleProducts();

		render(<Search />);

		const buttons = screen.getAllByRole("button");
		expect(buttons.length).toBe(4);
		expect(buttons[0]).toHaveTextContent("More Details");
		expect(buttons[1]).toHaveTextContent("ADD TO CART");
	});

	it("should navigate to product page when 'More Details' is clicked", () => {
		useSearchWithSampleProducts();
		render(<Search />);

		const moreDetailsButtons = screen.getAllByText("More Details");
		fireEvent.click(moreDetailsButtons[0]);

		expect(mockNavigate).toHaveBeenCalledWith("/product/product-a");
	});

	it("should navigate to correct product for each card", () => {
		useSearchWithSampleProducts();
		render(<Search />);

		const moreDetailsButtons = screen.getAllByText("More Details");

		fireEvent.click(moreDetailsButtons[0]);
		expect(mockNavigate).toHaveBeenCalledWith("/product/product-a");

		fireEvent.click(moreDetailsButtons[1]);
		expect(mockNavigate).toHaveBeenCalledWith("/product/product-b");

		expect(mockNavigate).toHaveBeenCalledTimes(2);
	});

	it("should call setCart with product when 'ADD TO CART' is clicked", () => {
		const mockSetCart = jest.fn();
		useSearchWithSampleProducts(mockSetCart);

		render(<Search />);

		const addToCartButtons = screen.getAllByText("ADD TO CART");
		fireEvent.click(addToCartButtons[0]);

		expect(mockSetCart).toHaveBeenCalledWith([sampleProducts[0]]);
	});

	it("should append product to existing cart", () => {
		const existingCart = [sampleProducts[0]];
		const mockSetCart = jest.fn();
		useSearch.mockReturnValue([{ results: sampleProducts }, jest.fn()]);
		useCart.mockReturnValue([existingCart, mockSetCart]);
		useNavigate.mockReturnValue(mockNavigate);

		render(<Search />);

		const addToCartButtons = screen.getAllByText("ADD TO CART");
		fireEvent.click(addToCartButtons[1]);

		expect(mockSetCart).toHaveBeenCalledWith([sampleProducts[0], sampleProducts[1]]);
	});

	it("should save cart to localStorage when 'ADD TO CART' is clicked", () => {
		const localStorageSpy = jest.spyOn(Storage.prototype, "setItem");
		useSearchWithSampleProducts();
		render(<Search />);

		const addToCartButtons = screen.getAllByText("ADD TO CART");
		fireEvent.click(addToCartButtons[0]);

		expect(localStorageSpy).toHaveBeenCalledWith("cart", JSON.stringify([sampleProducts[0]]));
	});

	it("should show success toast when 'ADD TO CART' is clicked", () => {
		useSearchWithSampleProducts();
		render(<Search />);

		const addToCartButtons = screen.getAllByText("ADD TO CART");
		fireEvent.click(addToCartButtons[0]);

		expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
	});
});
