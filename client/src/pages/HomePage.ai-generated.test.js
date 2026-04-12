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

    await waitFor(() => {
      expect(screen.getByAltText('bannerimage')).toBeInTheDocument();
    });
  });

  test('displays expected UI elements', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

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

  test('handles category filter interaction', async () => {
    const categories = [{ _id: '1', name: 'Electronics' }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: categories } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const categoryCheckbox = screen.getByLabelText('Electronics');
      expect(categoryCheckbox).toBeInTheDocument();
      userEvent.click(categoryCheckbox);
    });

    expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
      checked: ['1'],
      radio: [],
    });
  });

  test('handles price filter interaction', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const priceCheckbox = screen.getByLabelText('Under $50');
      expect(priceCheckbox).toBeInTheDocument();
      userEvent.click(priceCheckbox);
    });

    expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
      checked: [],
      radio: [[0, 50]],
    });
  });

  test('handles add to cart interaction', async () => {
    const products = [{ _id: '1', name: 'Product 1', price: 100, slug: 'product-1', description: 'Description 1' }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 1 } });
    axios.get.mockResolvedValueOnce({ data: { products } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const addToCartButton = screen.getByText('ADD TO CART');
      expect(addToCartButton).toBeInTheDocument();
      userEvent.click(addToCartButton);
    });

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, products[0]]);
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });

  test('handles API error states', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('All Products')).toBeInTheDocument();
    });
  });

  test('handles load more products interaction', async () => {
    const products = [{ _id: '1', name: 'Product 1', price: 100, slug: 'product-1', description: 'Description 1' }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 2 } });
    axios.get.mockResolvedValueOnce({ data: { products } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const loadMoreButton = screen.getByText('Loadmore');
      expect(loadMoreButton).toBeInTheDocument();
      userEvent.click(loadMoreButton);
    });

    expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2');
  });
});
