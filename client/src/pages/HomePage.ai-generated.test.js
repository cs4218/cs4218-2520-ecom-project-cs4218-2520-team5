import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import HomePage from './HomePage';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useSearch } from '../context/search';
import { useCategory } from '../hooks/useCategory';
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

jest.mock('../hooks/useCategory', () => ({
  useCategory: () => [],
}));

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
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Category1' }] } });
    axios.get.mockResolvedValueOnce({ data: { products: [], total: 0 } });

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

  test('handles user interactions', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Category1' }] } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product1', price: 100, description: 'Description1', slug: 'product1' }], total: 1 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Product1')).toBeInTheDocument();
    });

    const moreDetailsButton = screen.getByText('More Details');
    fireEvent.click(moreDetailsButton);

    const addToCartButton = screen.getByText('ADD TO CART');
    fireEvent.click(addToCartButton);

    expect(localStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify([{ _id: '1', name: 'Product1', price: 100, description: 'Description1', slug: 'product1' }]));
  });

  test('handles API success and error states', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Category1' }] } });
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    });

    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    fireEvent.click(screen.getByText('RESET FILTERS'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test('handles load more functionality', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Category1' }] } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product1', price: 100, description: 'Description1', slug: 'product1' }], total: 2 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Product1')).toBeInTheDocument();
    });

    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '2', name: 'Product2', price: 200, description: 'Description2', slug: 'product2' }] } });

    const loadMoreButton = screen.getByText(/Loadmore/i);
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText('Product2')).toBeInTheDocument();
    });
  });
});
