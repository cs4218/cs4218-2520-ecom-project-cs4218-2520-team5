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
  useLocation: () => ({ pathname: '/' }),
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
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });
    axios.get.mockResolvedValueOnce({ data: { total: 1 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Filter By Category')).toBeInTheDocument();
      expect(screen.getByText('Filter By Price')).toBeInTheDocument();
      expect(screen.getByText('All Products')).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  test('handles category filter interaction', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });
    axios.get.mockResolvedValueOnce({ data: { total: 1 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const categoryCheckbox = screen.getByText('Category 1').closest('input');
    fireEvent.click(categoryCheckbox);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
        checked: ['1'],
        radio: [],
      });
    });
  });

  test('handles price filter interaction', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });
    axios.get.mockResolvedValueOnce({ data: { total: 1 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const priceCheckbox = screen.getByText('Filter By Price').closest('input');
    fireEvent.click(priceCheckbox);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
        checked: [],
        radio: [undefined],
      });
    });
  });

  test('handles API error states', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('All Products')).not.toBeInTheDocument();
    });
  });

  test('handles load more interaction', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });
    axios.get.mockResolvedValueOnce({ data: { total: 2 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Loadmore')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText('Loadmore');
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2');
    });
  });

  test('handles add to cart interaction', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });
    axios.get.mockResolvedValueOnce({ data: { total: 1 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ADD TO CART')).toBeInTheDocument();
    });

    const addToCartButton = screen.getByText('ADD TO CART');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cart',
        JSON.stringify([{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }])
      );
    });
  });
});
