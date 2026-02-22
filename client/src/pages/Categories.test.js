// Ivan Ang, A0259256U
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Categories from "./Categories";

jest.mock("../hooks/useCategory", () => jest.fn());
jest.mock("../components/Layout", () => ({ children }) => <>{children}</>);

import useCategory from "../hooks/useCategory";

// Story 4: Categories page
describe("Categories page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render a link for each category returned by useCategory", () => {
    useCategory.mockReturnValue([
      { _id: "1", name: "Electronics", slug: "electronics" },
      { _id: "2", name: "Books", slug: "books" },
    ]);

    const { getByText } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(getByText("Electronics")).toBeInTheDocument();
    expect(getByText("Books")).toBeInTheDocument();
  });

  it("should render links pointing to the correct category routes", () => {
    useCategory.mockReturnValue([
      { _id: "1", name: "Electronics", slug: "electronics" },
    ]);

    const { getByText } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const link = getByText("Electronics").closest("a");
    expect(link).toHaveAttribute("href", "/category/electronics");
  });

  it("should render no links when there are no categories", () => {
    useCategory.mockReturnValue([]);

    const { container } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(container.querySelectorAll("a")).toHaveLength(0);
  });
});
