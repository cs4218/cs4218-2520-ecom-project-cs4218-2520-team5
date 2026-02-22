// Ivan Ang, A0259256U
import { renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import useCategory from "./useCategory";

jest.mock("axios");

// Story 4: useCategory hook
describe("useCategory hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return categories fetched from the API on mount", async () => {
    const mockCategories = [
      { _id: "1", name: "Electronics" },
      { _id: "2", name: "Books" },
    ];
    axios.get.mockResolvedValueOnce({ data: { category: mockCategories } });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  it("should return an empty array initially before the API responds", () => {
    axios.get.mockResolvedValueOnce({ data: { category: [] } });

    const { result } = renderHook(() => useCategory());

    expect(result.current).toEqual([]);
  });

  it("should keep the empty array when the API call fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });
});
