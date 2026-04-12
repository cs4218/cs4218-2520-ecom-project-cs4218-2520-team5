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

  test('handles user interactions', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const resetButton = screen.getByText('RESET FILTERS');
    userEvent.click(resetButton);
    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  test('handles API success and error states', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-count');
    });

    axios.get.mockRejectedValueOnce(new Error('API Error'));
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(new Error('API Error'));
    });
  });

  test('loads more products when "Loadmore" button is clicked', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 2 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] } });
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '2', name: 'Product 2', price: 200, description: 'Description 2', slug: 'product-2' }] } });
    const loadMoreButton = screen.getByText(/Loadmore/i);
    userEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });
});
