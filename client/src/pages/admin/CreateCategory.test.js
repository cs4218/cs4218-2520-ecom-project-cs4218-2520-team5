// Ivan Ang, A0259256U
import React from "react";
import { render, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => null,
}));

// Render children directly so Layout internals are bypassed
jest.mock("../../components/Layout", () => ({ children }) => <>{children}</>);

jest.mock("../../components/AdminMenu", () => () => null);

// Minimal Modal mock: renders children + a close button when visible
jest.mock("antd", () => {
  const React = require("react");
  return {
    Modal: ({ visible, children, onCancel }) => {
      if (!visible) return null;
      return React.createElement(
        "div",
        { "data-testid": "edit-modal" },
        React.createElement(
          "button",
          { "data-testid": "modal-close", onClick: onCancel },
          "Close Modal"
        ),
        children
      );
    },
  };
});

// ─── Browser API stub ────────────────────────────────────────────────────────

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

// ─── Story 1: CreateCategory page ────────────────────────────────────────────

describe("CreateCategory page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { success: true, category: [] } });
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  it("should render the Manage Category heading and input form", async () => {
    const { getByText, getByPlaceholderText } = render(<CreateCategory />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    expect(getByText("Manage Category")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter new category")).toBeInTheDocument();
  });

  // ── getAllCategory ──────────────────────────────────────────────────────────

  it("should fetch and display categories on mount", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics" },
          { _id: "2", name: "Books" },
        ],
      },
    });

    const { getByText } = render(<CreateCategory />);

    await waitFor(() => {
      expect(getByText("Electronics")).toBeInTheDocument();
      expect(getByText("Books")).toBeInTheDocument();
    });
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  it("should show an error toast when fetching categories fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    render(<CreateCategory />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Something wwent wrong in getting catgeory"
      )
    );
  });

  // ── handleSubmit (create) ──────────────────────────────────────────────────

  it("should create a category and refresh the list on success", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    const { getByPlaceholderText, getByText } = render(<CreateCategory />);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    fireEvent.change(getByPlaceholderText("Enter new category"), {
      target: { value: "Electronics" },
    });
    fireEvent.click(getByText("Submit"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "Electronics" }
      );
      expect(toast.success).toHaveBeenCalledWith("Electronics is created");
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  it("should show an error toast when the server returns success=false on creation", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Category Already Exisits" },
    });
    const { getByPlaceholderText, getByText } = render(<CreateCategory />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    fireEvent.change(getByPlaceholderText("Enter new category"), {
      target: { value: "Electronics" },
    });
    fireEvent.click(getByText("Submit"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Category Already Exisits")
    );
  });

  it("should show an error toast when creation throws a network error", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));
    const { getByPlaceholderText, getByText } = render(<CreateCategory />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    fireEvent.change(getByPlaceholderText("Enter new category"), {
      target: { value: "Electronics" },
    });
    fireEvent.click(getByText("Submit"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("somthing went wrong in input form")
    );
  });

  // ── Edit / handleUpdate ────────────────────────────────────────────────────

  it("should open the edit modal pre-filled with the category name when Edit is clicked", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });
    const { getByText, getByTestId } = render(<CreateCategory />);
    await waitFor(() => expect(getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(getByText("Edit"));

    const modal = getByTestId("edit-modal");
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByDisplayValue("Electronics")).toBeInTheDocument();
  });

  it("should update a category successfully and close the modal", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    const { getByText, getByTestId } = render(<CreateCategory />);
    await waitFor(() => expect(getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(getByText("Edit"));
    const modal = getByTestId("edit-modal");
    fireEvent.change(within(modal).getByPlaceholderText("Enter new category"), {
      target: { value: "Updated Electronics" },
    });
    fireEvent.click(within(modal).getByText("Submit"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "Updated Electronics" }
      );
      expect(toast.success).toHaveBeenCalledWith("Updated Electronics is updated");
    });
  });

  it("should show an error toast when update returns success=false", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });
    axios.put.mockResolvedValueOnce({
      data: { success: false, message: "Update failed" },
    });
    const { getByText, getByTestId } = render(<CreateCategory />);
    await waitFor(() => expect(getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(getByText("Edit"));
    fireEvent.click(within(getByTestId("edit-modal")).getByText("Submit"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Update failed")
    );
  });

  it("should show an error toast when update throws a network error", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });
    axios.put.mockRejectedValueOnce(new Error("Network error"));
    const { getByText, getByTestId } = render(<CreateCategory />);
    await waitFor(() => expect(getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(getByText("Edit"));
    fireEvent.click(within(getByTestId("edit-modal")).getByText("Submit"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong")
    );
  });

  it("should close the edit modal when the cancel button is clicked", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });
    const { getByText, getByTestId, queryByTestId } = render(<CreateCategory />);
    await waitFor(() => expect(getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(getByText("Edit"));
    expect(getByTestId("edit-modal")).toBeInTheDocument();
    fireEvent.click(getByTestId("modal-close"));

    expect(queryByTestId("edit-modal")).not.toBeInTheDocument();
  });

  // ── Delete / handleDelete ──────────────────────────────────────────────────

  it("should delete a category successfully and refresh the list", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    const { getByText } = render(<CreateCategory />);
    await waitFor(() => expect(getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(getByText("Delete"));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/1"
      );
      expect(toast.success).toHaveBeenCalledWith("category is deleted");
    });
  });

  it("should show an error toast when delete returns success=false", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });
    axios.delete.mockResolvedValueOnce({
      data: { success: false, message: "Delete failed" },
    });
    const { getByText } = render(<CreateCategory />);
    await waitFor(() => expect(getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(getByText("Delete"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Delete failed")
    );
  });

  it("should show an error toast when delete throws a network error", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });
    axios.delete.mockRejectedValueOnce(new Error("Network error"));
    const { getByText } = render(<CreateCategory />);
    await waitFor(() => expect(getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(getByText("Delete"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong")
    );
  });
});
