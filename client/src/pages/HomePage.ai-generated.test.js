// Koo Zhuo Hui, A0253417H
// Assisted with AI

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import HomePage from './HomePage';

jest.mock('axios');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
}));

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
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  describe('Initial render', () => {
    it('renders without crashing', () => {
      renderHomePage();
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('displays expected UI elements', () => {
      renderHomePage();
      expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
      expect(screen.getByText(/Featured Products/i)).toBeInTheDocument();
    });
  });

  describe('API interactions', () => {
    it('fetches featured products on mount', async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/product/featured'));
    });

    it('handles API error gracefully', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'));
      renderHomePage();
      await waitFor(() => expect(screen.getByText(/Error loading products/i)).toBeInTheDocument());
    });
  });

  describe('User interactions', () => {
    it('navigates to product details on product click', async () => {
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
      }));

      axios.get.mockResolvedValueOnce({
        data: {
          products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Test product' }],
        },
      });

      renderHomePage();
      await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Product 1'));
      expect(mockNavigate).toHaveBeenCalledWith('/product/1');
    });
  });

  describe('Boundary value analysis', () => {
    it('displays "No Products Found" when no products are returned', async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText(/No Products Found/i)).toBeInTheDocument());
    });

    it('displays all products returned by API', async () => {
      const products = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Test product 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'Test product 2' },
      ];
      axios.get.mockResolvedValueOnce({ data: { products } });

      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Product 2')).toBeInTheDocument();
      });
    });
  });
});
