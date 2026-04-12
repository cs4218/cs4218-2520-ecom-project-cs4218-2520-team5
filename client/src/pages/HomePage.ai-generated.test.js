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
jest.mock('react-hot-toast');

describe('HomePage', () => {
  const mockSetCart = jest.fn();
  const mockCart = [];

  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue([mockCart, mockSetCart]);
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
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [], total: 0 },
    });

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
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [], total: 0 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const categoryCheckbox = screen.getByLabelText('Category 1');
      userEvent.click(categoryCheckbox);
      expect(categoryCheckbox).toBeChecked();
    });
  });

  test('handles price filter interaction', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [], total: 0 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const priceCheckbox = screen.getByLabelText('Price Range 1');
      userEvent.click(priceCheckbox);
      expect(priceCheckbox).toBeChecked();
    });
  });

  test('handles add to cart interaction', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }], total: 1 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const addToCartButton = screen.getByText('ADD TO CART');
      userEvent.click(addToCartButton);
      expect(mockSetCart).toHaveBeenCalledWith([...mockCart, { _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }]);
      expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
    });
  });

  test('handles load more interaction', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description', slug: 'product-1' }], total: 2 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const loadMoreButton = screen.getByText(/Loadmore/i);
      userEvent.click(loadMoreButton);
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2');
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
      expect(console.log).toHaveBeenCalledWith(new Error('API Error'));
    });
  });
});
