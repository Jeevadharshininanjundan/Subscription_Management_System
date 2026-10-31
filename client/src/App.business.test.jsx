import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { api } from './services/api.js';

vi.mock('./services/api.js', async () => {
  const actual = await vi.importActual('./services/api.js');
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } };
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

  it('allows an admin to list, add, and deactivate staff', async () => {
    window.history.pushState({}, '', '/account');
    api.get.mockImplementation(path => {
      if (path === '/auth/me') return Promise.resolve({ data: { data: { user: { name: 'Admin', email: 'admin@example.com', role: 'ADMIN' } } } });
      if (path === '/staff') return Promise.resolve({ data: { data: { users: [{ id: 'staff-1', name: 'Staff User', email: 'staff@example.com', role: 'STAFF', status: 'ACTIVE', createdAt: '2026-01-01' }] } } });
      return Promise.resolve({ data: { data: [] } });
    });
    api.post.mockResolvedValue({ data: { data: { user: {} } } });
    api.patch.mockResolvedValue({ data: { data: { user: {} } } });
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Staff administration' })).toBeInTheDocument();
    expect(await screen.findByText('staff@example.com')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add staff member' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Staff' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass!9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create staff member' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/staff', {
      name: 'New Staff', email: 'new@example.com', password: 'StrongPass!9'
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/staff/staff-1', { status: 'INACTIVE' }));
  });

  it('redirects non-admin users away from staff administration', async () => {
    window.history.pushState({}, '', '/account');
    api.get.mockImplementation(path => {
      if (path === '/auth/me') return Promise.resolve({ data: { data: { user: { name: 'Staff', email: 'staff@example.com', role: 'STAFF' } } } });
      return Promise.resolve({ data: { data: { users: [] } } });
    });
    render(<App />);
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Staff administration' })).not.toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'Staff administration' })).not.toBeInTheDocument();
  });
});
