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
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Electronics' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [], total: 0 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Filter By Category')).toBeInTheDocument());
    expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    expect(screen.getByText('All Products')).toBeInTheDocument();
  });

  test('handles user interactions', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Electronics' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Laptop', price: 999, description: 'A great laptop', slug: 'laptop' }], total: 1 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Electronics')).toBeInTheDocument());

    const categoryCheckbox = screen.getByText('Electronics').closest('input');
    fireEvent.click(categoryCheckbox);

    expect(categoryCheckbox.checked).toBe(true);

    const addToCartButton = screen.getByText('ADD TO CART');
    fireEvent.click(addToCartButton);

    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });

  test('handles API success and error states', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Electronics' }] },
    });
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Filter By Category')).toBeInTheDocument());
    expect(screen.queryByText('All Products')).not.toBeInTheDocument();
  });

  test('handles load more functionality', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Electronics' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Laptop', price: 999, description: 'A great laptop', slug: 'laptop' }], total: 2 },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '2', name: 'Phone', price: 499, description: 'A great phone', slug: 'phone' }] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Laptop')).toBeInTheDocument());

    const loadMoreButton = screen.getByText(/Loadmore/i);
    fireEvent.click(loadMoreButton);

    await waitFor(() => expect(screen.getByText('Phone')).toBeInTheDocument());
  });
});
