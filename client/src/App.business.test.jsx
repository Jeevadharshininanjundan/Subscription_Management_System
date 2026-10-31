import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { api } from './services/api.js';

vi.mock('./services/api.js', async () => {
  const actual = await vi.importActual('./services/api.js');
  return { ...actual, api: { get: vi.fn(), post: vi.fn() } };
});

describe('business workspace', () => {
  beforeEach(() => {
    window.localStorage.setItem('brightloop.accessToken', 'token');
    window.history.pushState({}, '', '/dashboard');
    api.get.mockImplementation(path => {
      if (path === '/auth/me') return Promise.resolve({ data: { data: { user: { name: 'Admin', email: 'admin@example.com', role: 'ADMIN' } } } });
      return Promise.resolve({ data: { data: [] } });
    });
    api.post.mockResolvedValue({ data: { data: {} } });
  });
  afterEach(() => { cleanup(); window.localStorage.clear(); vi.clearAllMocks(); });

  it('renders live dashboard metric labels and navigation', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Good to see you' })).toBeInTheDocument();
    expect(screen.getByText('Total customers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();
  });

  it('loads the product form and submits to the implemented products endpoint', async () => {
    window.history.pushState({}, '', '/products');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Support' } });
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'SERVICE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create product' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/products', expect.objectContaining({ name: 'Support', type: 'SERVICE' })));
  });
});
