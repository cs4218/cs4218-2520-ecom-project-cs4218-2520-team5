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
    render(<HomePage />, { wrapper: MemoryRouter });
    expect(screen.getByAltText('bannerimage')).toBeInTheDocument();
  });

  test('displays expected UI elements', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Category 1' }] } });
    axios.get.mockResolvedValueOnce({ data: { products: [], total: 0 } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('Filter By Category')).toBeInTheDocument());
    expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    expect(screen.getByText('All Products')).toBeInTheDocument();
  });

  test('handles category filter interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Category 1' }] } });
    axios.get.mockResolvedValueOnce({ data: { products: [], total: 0 } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('Category 1')).toBeInTheDocument());

    const categoryCheckbox = screen.getByText('Category 1').closest('input');
    userEvent.click(categoryCheckbox);

    expect(categoryCheckbox.checked).toBe(true);
  });

  test('handles price filter interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { products: [], total: 0 } });

    render(<HomePage />, { wrapper: MemoryRouter });

    const priceCheckbox = screen.getByText('Filter By Price').closest('input');
    userEvent.click(priceCheckbox);

    expect(priceCheckbox.checked).toBe(true);
  });

  test('handles API success and error states', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('All Products')).toBeInTheDocument());
  });

  test('handles load more products', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }], total: 2 } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    const loadMoreButton = screen.getByText(/Loadmore/i);
    userEvent.click(loadMoreButton);

    expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2');
  });

  test('adds product to cart', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }], total: 1 } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    const addToCartButton = screen.getByText('ADD TO CART');
    userEvent.click(addToCartButton);

    expect(localStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify([{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }]));
  });
});
