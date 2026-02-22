// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Spinner from "./Spinner";

// Mock external dependencies to achieve isolation (unit test requirement)
const mockNavigate = jest.fn();
const mockLocation = { pathname: "/protected-page" };

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe("Spinner Component - Unit Tests", () => {
  beforeEach(() => {
    // Use fake timers to control time-based behavior
    jest.useFakeTimers();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    // Clean up timers after each test
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  // ===== TEST 1: Initial Render with Default Countdown (Output-based) =====
  it("should display initial countdown of 3 seconds", () => {
    // Arrange & Act
    render(<Spinner />);

    // Assert (verify countdown starts at 3)
    expect(
      screen.getByText(/redirecting to you in 3 second/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 2: Loading Spinner Display (Output-based) =====
  it("should display loading spinner element", () => {
    // Arrange & Act
    render(<Spinner />);

    // Assert (verify spinner is visible)
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("spinner-border");
  });

  // ===== TEST 3: Hidden Loading Text (Output-based) =====
  it("should display visually hidden loading text for accessibility", () => {
    // Arrange & Act
    render(<Spinner />);

    // Assert (verify accessible loading text)
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // ===== TEST 4: Countdown Decrements After 1 Second (State-based) =====
  it("should decrement countdown to 2 after 1 second", () => {
    // Arrange
    render(<Spinner />);

    // Act (advance time by 1 second)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Assert (verify countdown decremented)
    expect(
      screen.getByText(/redirecting to you in 2 second/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 5: Countdown Decrements to 1 After 2 Seconds (State-based) =====
  it("should decrement countdown to 1 after 2 seconds", () => {
    // Arrange
    render(<Spinner />);

    // Act (advance time by 2 seconds)
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Assert (verify countdown at 1)
    expect(
      screen.getByText(/redirecting to you in 1 second/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 6: Navigation Triggered After 3 Seconds (Communication-based) =====
  it("should trigger navigation to default login path after countdown completes", () => {
    // Arrange
    render(<Spinner />);

    // Act (advance time to complete countdown)
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert (verify navigate was called with correct path)
    expect(mockNavigate).toHaveBeenCalledWith("/login", {
      state: mockLocation.pathname,
    });
  });

  // ===== TEST 7: Custom Path Navigation (Communication-based) =====
  it("should navigate to custom path when provided", () => {
    // Arrange
    const customPath = "dashboard";

    // Act
    render(<Spinner path={customPath} />);
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert (verify navigation to custom path)
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
      state: mockLocation.pathname,
    });
  });

  // ===== TEST 8: Location State Preservation (Communication-based) =====
  it("should pass current location pathname as state during navigation", () => {
    // Arrange
    render(<Spinner />);

    // Act (complete countdown)
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert (verify location state is preserved)
    expect(mockNavigate).toHaveBeenCalledWith(expect.any(String), {
      state: "/protected-page",
    });
  });

  // ===== TEST 9: No Premature Navigation (Communication-based) =====
  it("should not navigate before countdown reaches 0", () => {
    // Arrange
    render(<Spinner />);

    // Act (advance time but not enough to trigger navigation)
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Assert (verify navigate NOT called yet)
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ===== TEST 10: Timer Cleanup on Unmount (State-based) =====
  it("should clean up interval timer when component unmounts", () => {
    // Arrange
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    const { unmount } = render(<Spinner />);

    // Act (unmount before countdown completes)
    unmount();

    // Assert (verify cleanup was called)
    expect(clearIntervalSpy).toHaveBeenCalled();

    // Cleanup
    clearIntervalSpy.mockRestore();
  });

  // ===== TEST 11: Full Container Layout Structure (Output-based) =====
  it("should render full-height centered container layout", () => {
    // Arrange & Act
    render(<Spinner />);

    // Assert (verify container is present with full viewport height)
    const container = screen.getByText(
      /redirecting to you in 3 second/i,
    ).parentElement;
    expect(container).toHaveStyle({ height: "100vh" });
  });

  // ===== TEST 12: Multiple Path Formats (Output-based) =====
  it("should handle path without leading slash", () => {
    // Arrange & Act
    render(<Spinner path="admin" />);
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert (verify navigation adds leading slash)
    expect(mockNavigate).toHaveBeenCalledWith("/admin", expect.any(Object));
  });
});
