import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';

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
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Electronics' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { total: 10 },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Filter By Category')).toBeInTheDocument());
    expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    expect(screen.getByText('All Products')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });

  test('handles user interactions', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Electronics' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { total: 10 },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Electronics')).toBeInTheDocument());

    userEvent.click(screen.getByText('Electronics'));
    expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', expect.any(Object));

    userEvent.click(screen.getByText('ADD TO CART'));
    expect(localStorage.setItem).toHaveBeenCalledWith('cart', expect.any(String));
  });

  test('handles API success and error states', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Electronics' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { total: 10 },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    fireEvent.click(screen.getByText('Loadmore'));
    await waitFor(() => expect(screen.queryByText('Loading ...')).not.toBeInTheDocument());
  });

  test('handles load more functionality', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Electronics' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { total: 10 },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '2', name: 'Product 2', price: 200, description: 'Description 2', slug: 'product-2' }] },
    });

    fireEvent.click(screen.getByText('Loadmore'));
    await waitFor(() => expect(screen.getByText('Product 2')).toBeInTheDocument());
  });
});
