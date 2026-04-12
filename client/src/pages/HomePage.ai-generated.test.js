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
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
}));

describe('HomePage', () => {
  const mockSetCart = jest.fn();
  const mockCart = [];

  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue([mockCart, mockSetCart]);
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

  test('handles user interactions', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const resetButton = screen.getByText('RESET FILTERS');
    fireEvent.click(resetButton);

    expect(window.location.reload).toHaveBeenCalled();
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

    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  test('adds product to cart and shows toast notification', async () => {
    const product = { _id: '1', name: 'Product 1', price: 100, slug: 'product-1' };
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 1 } });
    axios.get.mockResolvedValueOnce({ data: { products: [product] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const addToCartButton = screen.getByText('ADD TO CART');
    userEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, product]);
    expect(localStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify([...mockCart, product]));
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });

  test('loads more products when "Loadmore" button is clicked', async () => {
    const product = { _id: '1', name: 'Product 1', price: 100, slug: 'product-1' };
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 2 } });
    axios.get.mockResolvedValueOnce({ data: { products: [product] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText('Loadmore');
    userEvent.click(loadMoreButton);

    expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2');
  });
});
