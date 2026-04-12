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

  test('renders without crashing', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

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
    const categories = [{ _id: '1', name: 'Electronics' }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: categories } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Electronics')).toBeInTheDocument());

    const checkbox = screen.getByText('Electronics').closest('div').querySelector('input');
    userEvent.click(checkbox);

    expect(checkbox.checked).toBe(true);
  });

  test('handles price filter interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const priceCheckbox = screen.getByText('$0 - $50').closest('div').querySelector('input');
    userEvent.click(priceCheckbox);

    expect(priceCheckbox.checked).toBe(true);
  });

  test('handles load more products', async () => {
    const products = [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 2 } });
    axios.get.mockResolvedValueOnce({ data: { products } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    const loadMoreButton = screen.getByText(/Loadmore/i);
    userEvent.click(loadMoreButton);

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2'));
  });

  test('handles API error states', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });

  test('adds product to cart', async () => {
    const products = [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 1 } });
    axios.get.mockResolvedValueOnce({ data: { products } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    const addToCartButton = screen.getByText('ADD TO CART');
    userEvent.click(addToCartButton);

    expect(localStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify(products));
  });
});
