// Koo Zhuo Hui, A0253417H
import React from "react";
import { fireEvent, render, screen, renderHook, act, getAllByRole, getByTestId } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

const TestComponent = () => {
	const [search, setSearch] = useSearch();
	return (
		<>
			<div data-testid="keyword">{search.keyword}</div>
			<div data-testid="results-length">{search.results.length}</div>
			<button
				onClick={() =>
					setSearch({
						keyword: "laptop",
						results: [{ name: "MacBook" }],
					})
				}
			>
				Update Search
			</button>
		</>
	);
};

const TestComponent2 = () => {
	const [search, setSearch] = useSearch();
	return <button onClick={() => setSearch({ keyword: "shared", results: [] })}>Update</button>;
};

describe("SearchContext", () => {
	describe("SearchProvider", () => {
		test("renders children correctly", () => {
			render(
				<SearchProvider>
					<div>Test Child</div>
				</SearchProvider>,
			);

			expect(screen.getByText("Test Child")).toBeInTheDocument();
		});
	});

	test("provides default search values", () => {
		render(
			<SearchProvider>
				<TestComponent />
			</SearchProvider>,
		);

		expect(screen.getByTestId("keyword")).toHaveTextContent("");
		expect(screen.getByTestId("results-length")).toHaveTextContent("0");
	});

	test("updates search state", () => {
		render(
			<SearchProvider>
				<TestComponent />
			</SearchProvider>,
		);

		fireEvent.click(screen.getByRole("button"));

		expect(screen.getByTestId("keyword")).toHaveTextContent("laptop");
		expect(screen.getByTestId("results-length")).toHaveTextContent("1");
	});

	test("maintains state across multiple updates", () => {
		const { result } = renderHook(() => useSearch(), {
			wrapper: SearchProvider,
		});

		act(() => {
			const [, setSearch] = result.current;
			setSearch({ keyword: "first", results: [{ id: 1 }] });
		});

		expect(result.current[0].keyword).toBe("first");

		act(() => {
			const [, setSearch] = result.current;
			setSearch({ keyword: "second", results: [{ id: 2 }] });
		});

		expect(result.current[0].keyword).toBe("second");
		expect(result.current[0].results).toEqual([{ id: 2 }]);
	});

	test("state persists across multiple components", () => {
		render(
			<SearchProvider>
				<TestComponent />
				<TestComponent2 />
			</SearchProvider>,
		);
		expect(screen.getByTestId("keyword")).toHaveTextContent("");

		const buttons = screen.getAllByRole("button");
		act(() => {
			buttons[1].click();
		});

		expect(screen.getByTestId("keyword")).toHaveTextContent("shared");
	});

	test("clear search state", () => {
		const { result } = renderHook(() => useSearch(), {
			wrapper: SearchProvider,
		});

		act(() => {
			const [, setSearch] = result.current;
			setSearch({ keyword: "test", results: [{ id: 1 }] });
		});

		act(() => {
			const [, setSearch] = result.current;
			setSearch({ keyword: "", results: [] });
		});

		const [search] = result.current;
		expect(search.keyword).toBe("");
		expect(search.results).toEqual([]);
	});
});
