import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useSearch } from '../context/search';
import useCategory from '../hooks/useCategory';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({}),
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
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Electronics' }] } });
    axios.get.mockResolvedValueOnce({ data: { total: 10 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] } });

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
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Electronics' }] } });
    axios.get.mockResolvedValueOnce({ data: { total: 10 } });
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    axios.post.mockResolvedValueOnce({ data: { products: [{ _id: '2', name: 'Filtered Product', price: 150, description: 'Filtered Description', slug: 'filtered-product' }] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('Electronics'));

    await waitFor(() => {
      expect(screen.getByText('Filtered Product')).toBeInTheDocument();
    });
  });

  test('handles price filter interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 10 } });
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    axios.post.mockResolvedValueOnce({ data: { products: [{ _id: '3', name: 'Price Filtered Product', price: 200, description: 'Price Filtered Description', slug: 'price-filtered-product' }] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('Price Range 1'));

    await waitFor(() => {
      expect(screen.getByText('Price Filtered Product')).toBeInTheDocument();
    });
  });

  test('handles load more products', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 20 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '4', name: 'Initial Product', price: 100, description: 'Initial Description', slug: 'initial-product' }] } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '5', name: 'Loaded Product', price: 150, description: 'Loaded Description', slug: 'loaded-product' }] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Initial Product')).toBeInTheDocument();
    });

    userEvent.click(screen.getByText(/Loadmore/i));

    await waitFor(() => {
      expect(screen.getByText('Loaded Product')).toBeInTheDocument();
    });
  });

  test('handles add to cart interaction', async () => {
    const setCartMock = jest.fn();
    useCart.mockReturnValue([[], setCartMock]);

    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 10 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '6', name: 'Cart Product', price: 100, description: 'Cart Description', slug: 'cart-product' }] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cart Product')).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('ADD TO CART'));

    expect(setCartMock).toHaveBeenCalledWith([{ _id: '6', name: 'Cart Product', price: 100, description: 'Cart Description', slug: 'cart-product' }]);
  });

  test('handles API error states', async () => {
    axios.get.mockRejectedValueOnce(new Error('API Error'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('All Products')).not.toBeInTheDocument();
    });
  });
});
