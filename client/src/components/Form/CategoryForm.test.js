// Ivan Ang, A0259256U
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import CategoryForm from "./CategoryForm";

// Story 1: CategoryForm component
describe("CategoryForm", () => {
  it("should render the input field and submit button", () => {
    const handleSubmit = jest.fn();
    const setValue = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <CategoryForm handleSubmit={handleSubmit} value="" setValue={setValue} />
    );

    expect(getByPlaceholderText("Enter new category")).toBeInTheDocument();
    expect(getByText("Submit")).toBeInTheDocument();
  });

  it("should display the provided value in the input", () => {
    const handleSubmit = jest.fn();
    const setValue = jest.fn();

    const { getByPlaceholderText } = render(
      <CategoryForm handleSubmit={handleSubmit} value="Existing" setValue={setValue} />
    );

    expect(getByPlaceholderText("Enter new category").value).toBe("Existing");
  });

  it("should call setValue with the new value when the input changes", () => {
    const handleSubmit = jest.fn();
    const setValue = jest.fn();
    const { getByPlaceholderText } = render(
      <CategoryForm handleSubmit={handleSubmit} value="" setValue={setValue} />
    );

    fireEvent.change(getByPlaceholderText("Enter new category"), {
      target: { value: "Electronics" },
    });

    expect(setValue).toHaveBeenCalledWith("Electronics");
  });

  it("should call handleSubmit when the form is submitted", () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    const setValue = jest.fn();
    const { getByText } = render(
      <CategoryForm handleSubmit={handleSubmit} value="Electronics" setValue={setValue} />
    );

    fireEvent.click(getByText("Submit"));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
