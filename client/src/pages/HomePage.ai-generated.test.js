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
  useParams: () => ({}),
}));
jest.mock('../context/cart', () => ({
  useCart: jest.fn(),
}));
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue([[], jest.fn()]);
  });

  test('renders without crashing', () => {
    render(<HomePage />, { wrapper: MemoryRouter });
    expect(screen.getByAltText('bannerimage')).toBeInTheDocument();
  });

  test('displays expected UI elements', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    render(<HomePage />, { wrapper: MemoryRouter });

    expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    expect(screen.getByText('All Products')).toBeInTheDocument();
  });

  test('handles user interactions', async () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    render(<HomePage />, { wrapper: MemoryRouter });

    const loadMoreButton = screen.getByText(/Loadmore/i);
    fireEvent.click(loadMoreButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('handles API success and error states', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-count');
    });

    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/1');
    });
  });

  test('adds product to cart and shows toast notification', async () => {
    const setCart = jest.fn();
    useCart.mockReturnValue([[], setCart]);

    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 1 } });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          { _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' },
        ],
      },
    });

    render(<HomePage />, { wrapper: MemoryRouter });

    const addToCartButton = await screen.findByText('ADD TO CART');
    userEvent.click(addToCartButton);

    expect(setCart).toHaveBeenCalledWith([{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }]);
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });
});
