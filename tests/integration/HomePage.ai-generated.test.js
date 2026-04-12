import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { BrowserRouter as Router } from 'react-router-dom';
import HomePage from './HomePage';

// Mock axios
jest.mock('axios');

describe('HomePage', () => {
  const categoriesMock = {
    data: {
      success: true,
      category: [
        { _id: '1', name: 'Electronics' },
        { _id: '2', name: 'Books' },
      ],
    },
  };

  const productsMock = {
    data: {
      products: [
        { _id: '1', name: 'Laptop', price: 1000, description: 'A good laptop', slug: 'laptop' },
        { _id: '2', name: 'Book', price: 20, description: 'A good book', slug: 'book' },
      ],
    },
  };

  const productCountMock = {
    data: {
      total: 2,
    },
  };

  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve(categoriesMock);
      }
      if (url.includes('/api/v1/product/product-list')) {
        return Promise.resolve(productsMock);
      }
      if (url.includes('/api/v1/product/product-count')) {
        return Promise.resolve(productCountMock);
      }
      return Promise.reject(new Error('not found'));
    });

    axios.post.mockImplementation((url) => {
      if (url.includes('/api/v1/product/product-filters')) {
        return Promise.resolve(productsMock);
      }
      return Promise.reject(new Error('not found'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders HomePage and fetches categories and products', async () => {
    render(
      <Router>
        <HomePage />
      </Router>
    );

    expect(screen.getByText(/All Products/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Electronics/i)).toBeInTheDocument();
      expect(screen.getByText(/Books/i)).toBeInTheDocument();
      expect(screen.getByText(/Laptop/i)).toBeInTheDocument();
      expect(screen.getByText(/Book/i)).toBeInTheDocument();
    });
  });

  test('filters products by category', async () => {
    render(
      <Router>
        <HomePage />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText(/Electronics/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Electronics/i));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
        checked: ['1'],
        radio: [],
      });
    });
  });

  test('filters products by price', async () => {
    render(
      <Router>
        <HomePage />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText(/Filter By Price/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/$0 - $50/i));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
        checked: [],
        radio: [[0, 50]],
      });
    });
  });

  test('loads more products when "Loadmore" is clicked', async () => {
    render(
      <Router>
        <HomePage />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText(/Loadmore/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Loadmore/i));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2');
    });
  });
});
