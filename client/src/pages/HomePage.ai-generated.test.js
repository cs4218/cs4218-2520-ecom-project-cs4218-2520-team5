import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';
import { useCart } from '../context/cart';
import toast from 'react-hot-toast';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock('../context/cart', () => ({
  useCart: jest.fn(),
}));
jest.mock('react-hot-toast');

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue([[], jest.fn()]);
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
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

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
    const mockSetCart = jest.fn();
    useCart.mockReturnValue([[], mockSetCart]);

    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    const addToCartButton = screen.getByText('ADD TO CART');
    userEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }]);
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });

  test('handles API success and error states', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(6)); // 3 initial + 3 retries
  });

  test('handles load more functionality', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 2 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '2', name: 'Product 2', price: 200, description: 'Description', slug: 'product-2' }] } });

    const loadMoreButton = screen.getByText(/Loadmore/i);
    userEvent.click(loadMoreButton);

    await waitFor(() => expect(screen.getByText('Product 2')).toBeInTheDocument());
  });
});
