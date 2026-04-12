import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import HomePage from './HomePage';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useSearch } from '../context/search';
import useCategory from '../hooks/useCategory';
import userEvent from '@testing-library/user-event';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
}));

jest.mock('../context/auth', () => ({
  useAuth: () => [{}, jest.fn()],
}));

jest.mock('../context/cart', () => ({
  useCart: () => [[], jest.fn()],
}));

jest.mock('../context/search', () => ({
  useSearch: () => [{}, jest.fn()],
}));

jest.mock('../hooks/useCategory', () => () => []);

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByAltText('bannerimage')).toBeInTheDocument();
  });

  test('displays expected UI elements', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }] },
    }).mockResolvedValueOnce({
      data: { products: [], total: 0 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Filter By Category')).toBeInTheDocument();
      expect(screen.getByText('Filter By Price')).toBeInTheDocument();
      expect(screen.getByText('All Products')).toBeInTheDocument();
    });
  });

  test('handles category filter interaction', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }] },
    }).mockResolvedValueOnce({
      data: { products: [], total: 0 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const categoryCheckbox = screen.getByText('Category 1').closest('input');
      userEvent.click(categoryCheckbox);
      expect(categoryCheckbox.checked).toBe(true);
    });
  });

  test('handles price filter interaction', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    }).mockResolvedValueOnce({
      data: { products: [], total: 0 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const priceCheckbox = screen.getByText('Under $50').closest('input');
      userEvent.click(priceCheckbox);
      expect(priceCheckbox.checked).toBe(true);
    });
  });

  test('handles API success and error states', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    }).mockRejectedValueOnce(new Error('Network Error'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('All Products')).toBeInTheDocument();
    });
  });

  test('handles load more products', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    }).mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }], total: 2 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText(/Loadmore/i);
    userEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(3); // Initial load + load more
    });
  });

  test('handles add to cart interaction', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    }).mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }], total: 1 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const addToCartButton = screen.getByText('ADD TO CART');
    userEvent.click(addToCartButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cart',
        JSON.stringify([{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }])
      );
    });
  });
});
