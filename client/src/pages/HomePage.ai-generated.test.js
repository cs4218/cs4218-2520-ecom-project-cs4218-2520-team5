import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';
import { useCart } from '../context/cart';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock('../context/cart', () => ({
  useCart: jest.fn(),
}));

describe('HomePage', () => {
  let mockSetCart;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetCart = jest.fn();
    useCart.mockReturnValue([[], mockSetCart]);
  });

  test('renders without crashing', () => {
    render(<HomePage />, { wrapper: MemoryRouter });
    expect(screen.getByAltText('bannerimage')).toBeInTheDocument();
  });

  test('displays expected UI elements', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

    render(<HomePage />, { wrapper: MemoryRouter });

    expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    expect(screen.getByText('All Products')).toBeInTheDocument();
  });

  test('handles category filter interaction', async () => {
    const categories = [{ _id: '1', name: 'Electronics' }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: categories } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('Electronics')).toBeInTheDocument());

    const checkbox = screen.getByLabelText('Electronics');
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  test('handles price filter interaction', async () => {
    const prices = [{ _id: '1', name: '$0 - $50', array: [0, 50] }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 0 } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('$0 - $50')).toBeInTheDocument());

    const priceCheckbox = screen.getByLabelText('$0 - $50');
    fireEvent.click(priceCheckbox);

    expect(priceCheckbox).toBeChecked();
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
    const products = [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 1 } });
    axios.get.mockResolvedValueOnce({ data: { products } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    const addToCartButton = screen.getByText('ADD TO CART');
    userEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith(expect.arrayContaining([products[0]]));
  });

  test('handles load more products', async () => {
    const products = [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }];
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.get.mockResolvedValueOnce({ data: { total: 2 } });
    axios.get.mockResolvedValueOnce({ data: { products } });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    const loadMoreButton = screen.getByText(/Loadmore/i);
    userEvent.click(loadMoreButton);

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('product-list/2')));
  });
});
