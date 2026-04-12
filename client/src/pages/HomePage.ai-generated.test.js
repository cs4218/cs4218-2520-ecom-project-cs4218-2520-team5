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
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    expect(screen.getByText('All Products')).toBeInTheDocument();
  });

  test('handles category filter interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Electronics' }] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Electronics')).toBeInTheDocument());
    userEvent.click(screen.getByText('Electronics'));
    expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', expect.anything());
  });

  test('handles price filter interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Filter By Price')).toBeInTheDocument());
    userEvent.click(screen.getByText('Filter By Price'));
    expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', expect.anything());
  });

  test('handles load more products', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 2 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] } });
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());
    userEvent.click(screen.getByText('Loadmore'));
    expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2');
  });

  test('handles API error states', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });

  test('adds product to cart', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 1 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] } });
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());
    userEvent.click(screen.getByText('ADD TO CART'));
    expect(localStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify([{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }]));
  });
});
