import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import HomePage from './HomePage';
import userEvent from '@testing-library/user-event';

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
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Category 1' }] } });
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
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Category 1' }] } });
    axios.get.mockResolvedValueOnce({ data: { total: 10 } });
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    axios.post.mockResolvedValueOnce({ data: { products: [{ _id: '2', name: 'Filtered Product', price: 200, description: 'Filtered Description', slug: 'filtered-product' }] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('Category 1'));

    await waitFor(() => {
      expect(screen.getByText('Filtered Product')).toBeInTheDocument();
    });
  });

  test('handles price filter interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 10 } });
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    axios.post.mockResolvedValueOnce({ data: { products: [{ _id: '3', name: 'Price Filtered Product', price: 300, description: 'Price Filtered Description', slug: 'price-filtered-product' }] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('Price Range 1')); // Assuming 'Price Range 1' is a valid price range name

    await waitFor(() => {
      expect(screen.getByText('Price Filtered Product')).toBeInTheDocument();
    });
  });

  test('handles load more interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 10 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '2', name: 'Product 2', price: 200, description: 'Description 2', slug: 'product-2' }] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('Loadmore'));

    await waitFor(() => {
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
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
