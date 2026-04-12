import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import HomePage from './HomePage';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useSearch } from '../context/search';
import useCategory from '../hooks/useCategory';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' }),
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

jest.mock('../hooks/useCategory', () => jest.fn(() => []));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const priceCheckbox = screen.getByLabelText('Under $50');
    userEvent.click(priceCheckbox);
    expect(priceCheckbox).toBeChecked();
  });

  test('handles API success and error states', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(new Error('Network Error'));
    });
  });

  test('handles load more products', async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText(/Loadmore/i);
    userEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  test('adds product to cart', async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });

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

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'cart',
      JSON.stringify([{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }])
    );
  });
});
