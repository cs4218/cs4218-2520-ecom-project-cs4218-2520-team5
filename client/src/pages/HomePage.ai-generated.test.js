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

describe('HomePage Component', () => {
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
    expect(screen.getByTestId('homepage')).toBeInTheDocument();
  });

  it('displays expected UI elements', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    renderHomePage();
    await waitFor(() => expect(screen.getByText(/Featured Products/i)).toBeInTheDocument());
  });

  it('handles user interactions', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100 }] } });
    renderHomePage();
    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    const productLink = screen.getByText('Product 1');
    fireEvent.click(productLink);
    expect(mockNavigate).toHaveBeenCalledWith('/product/1');
  });

  it('handles API success state', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100 }] } });
    renderHomePage();
    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());
  });

  it('handles API error state', async () => {
    const error = new Error('Network error');
    axios.get.mockRejectedValueOnce(error);
    renderHomePage();
    await waitFor(() => expect(screen.getByText(/Error loading products/i)).toBeInTheDocument());
  });

  it('displays no products message when API returns empty list', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    renderHomePage();
    await waitFor(() => expect(screen.getByText(/No products available/i)).toBeInTheDocument());
  });

  it('displays multiple products correctly', async () => {
    const products = [
      { _id: '1', name: 'Product 1', price: 100 },
      { _id: '2', name: 'Product 2', price: 200 },
    ];
    axios.get.mockResolvedValueOnce({ data: { products } });
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('handles navigation to product details', async () => {
    const products = [{ _id: '1', name: 'Product 1', price: 100 }];
    axios.get.mockResolvedValueOnce({ data: { products } });
    renderHomePage();
    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Product 1'));
    expect(mockNavigate).toHaveBeenCalledWith('/product/1');
  });
});
