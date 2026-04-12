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

  test('renders without crashing', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    render(<HomePage />, { wrapper: MemoryRouter });
    await waitFor(() => expect(screen.getByAltText('bannerimage')).toBeInTheDocument());
  });

  test('displays expected UI elements', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Category 1' }] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('Filter By Category')).toBeInTheDocument();
      expect(screen.getByText('Filter By Price')).toBeInTheDocument();
      expect(screen.getByText('All Products')).toBeInTheDocument();
    });
  });

  test('handles category filter interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: '1', name: 'Category 1' }] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      const categoryCheckbox = screen.getByLabelText('Category 1');
      expect(categoryCheckbox).toBeInTheDocument();
      userEvent.click(categoryCheckbox);
    });
  });

  test('handles price filter interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      const priceCheckbox = screen.getByLabelText('Under $50');
      expect(priceCheckbox).toBeInTheDocument();
      userEvent.click(priceCheckbox);
    });
  });

  test('handles API success and error states', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(4));
  });

  test('handles adding product to cart', async () => {
    const mockSetCart = jest.fn();
    useCart.mockReturnValue([[], mockSetCart]);
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }] } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      const addToCartButton = screen.getByText('ADD TO CART');
      expect(addToCartButton).toBeInTheDocument();
      userEvent.click(addToCartButton);
      expect(mockSetCart).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
    });
  });

  test('handles load more products', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 2 } });
    axios.get.mockResolvedValueOnce({ data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }] } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      const loadMoreButton = screen.getByText(/Loadmore/i);
      expect(loadMoreButton).toBeInTheDocument();
      userEvent.click(loadMoreButton);
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2');
    });
  });
});
