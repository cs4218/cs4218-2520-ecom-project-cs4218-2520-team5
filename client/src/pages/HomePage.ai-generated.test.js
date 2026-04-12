// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import HomePage from './HomePage';
import '@testing-library/jest-dom';

// Mock external dependencies for isolation
jest.mock('axios');
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock context hooks
jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [{}, jest.fn()]),
}));

jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{}, jest.fn()]),
}));

jest.mock('../hooks/useCategory', () => jest.fn(() => []));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHomePage = () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  it('renders without crashing', () => {
    renderHomePage();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('displays expected UI elements', async () => {
    renderHomePage();
    expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/Featured Products/i)).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    renderHomePage();
    const searchInput = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchInput, { target: { value: 'Laptop' } });
    expect(searchInput.value).toBe('Laptop');
  });

  it('handles API success state', async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Laptop', price: 1000 }] },
    });

    renderHomePage();

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/Laptop/i)).toBeInTheDocument();
  });

  it('handles API error state', async () => {
    const error = new Error('Network error');
    axios.get.mockRejectedValueOnce(error);

    renderHomePage();

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/Error loading products/i)).toBeInTheDocument();
  });

  it('navigates to product details on click', async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Laptop', price: 1000 }] },
    });

    renderHomePage();

    await waitFor(() => expect(screen.getByText(/Laptop/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Laptop/i));
    expect(mockNavigate).toHaveBeenCalledWith('/product/1');
  });

  it('displays no products message when no products are available', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    renderHomePage();

    await waitFor(() => expect(screen.getByText(/No products available/i)).toBeInTheDocument());
  });
});
