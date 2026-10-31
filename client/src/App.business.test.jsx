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

  it('loads active discounts, submits only the selected discount id, and renders server totals', async () => {
    window.history.pushState({}, '', '/quotations/new');
    api.get.mockImplementation(path => {
      if (path === '/auth/me') return Promise.resolve({ data: { data: { user: { name: 'Staff', email: 'staff@example.com', role: 'STAFF' } } } });
      if (path === '/customers') return Promise.resolve({ data: { data: [{ _id: 'customer-1', name: 'Acme' }] } });
      if (path === '/plans') return Promise.resolve({ data: { data: [{ _id: 'plan-1', name: 'Pro', basePriceMinor: 10000, currency: 'USD' }] } });
      if (path === '/discounts') return Promise.resolve({ data: { data: [{ _id: 'discount-1', name: 'Spring offer', kind: 'PERCENTAGE', value: 10, scope: 'SUBSCRIPTION', status: 'ACTIVE' }, { _id: 'discount-2', name: 'Archived', kind: 'FIXED', value: 500, currency: 'USD', status: 'ARCHIVED' }] } });
      return Promise.resolve({ data: { data: [] } });
    });
    api.post.mockResolvedValue({ data: { data: { _id: 'quotation-1', quotationNumber: 'QUO-1', subtotalMinor: 10000, discountMinor: 1000, taxMinor: 1800, totalMinor: 10800, currency: 'USD', calculationSnapshot: { discount: { name: 'Spring offer', amountMinor: 1000, kind: 'PERCENTAGE', value: 10 } } } } });
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Create quotation' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'customer-1' } });
    fireEvent.change(screen.getByLabelText('Plan'), { target: { value: 'plan-1' } });
    fireEvent.change(screen.getByLabelText('Valid until'), { target: { value: '2026-12-31' } });
    fireEvent.change(screen.getByLabelText('Discount'), { target: { value: 'discount-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create quotation' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/quotations', expect.objectContaining({ discountId: 'discount-1' })));
    expect(await screen.findByText('Server-calculated financial breakdown')).toBeInTheDocument();
    expect(screen.getByText('$108.00')).toBeInTheDocument();
    expect(screen.queryByText('Archived')).not.toBeInTheDocument();
  });

  it('renders persisted quotation and invoice financial breakdowns', async () => {
    api.get.mockImplementation(path => {
      if (path === '/auth/me') return Promise.resolve({ data: { data: { user: { name: 'Staff', email: 'staff@example.com', role: 'STAFF' } } } });
      if (path === '/quotations/q1') return Promise.resolve({ data: { data: { _id: 'q1', quotationNumber: 'QUO-1', customerId: 'customer-1', status: 'ACCEPTED', issuedAt: '2026-01-01', validUntil: '2026-12-31', currency: 'USD', lines: [], subtotalMinor: 10000, discountMinor: 1000, taxMinor: 1800, totalMinor: 10800, calculationSnapshot: { discount: { name: 'Spring offer', amountMinor: 1000, kind: 'PERCENTAGE', value: 10 } } } } });
      return Promise.resolve({ data: { data: [] } });
    });
    window.history.pushState({}, '', '/quotations/q1');
    render(<App />);
    expect((await screen.findAllByText(/Spring offer/)).length).toBeGreaterThan(0);
    expect(screen.getByText('$108.00')).toBeInTheDocument();
  });

  it('renders the persisted invoice breakdown, print action, and payment balance', async () => {
    api.get.mockImplementation(path => {
      if (path === '/auth/me') return Promise.resolve({ data: { data: { user: { name: 'Staff', email: 'staff@example.com', role: 'STAFF' } } } });
      if (path === '/invoices/i1') return Promise.resolve({ data: { data: { invoiceNumber: 'INV-1', customerId: 'customer-1', issueDate: '2026-01-01', dueDate: '2026-02-01', status: 'PARTIALLY_PAID', currency: 'USD', lines: [{ name: 'Pro', quantity: 1, unitPriceMinor: 10000, taxAmountMinor: 1800, totalMinor: 10800, currency: 'USD' }], subtotalMinor: 10000, discountMinor: 1000, taxMinor: 1800, totalMinor: 10800, paidAmountMinor: 5000, balanceDueMinor: 5800, calculationSnapshot: { discount: { name: 'Spring offer', amountMinor: 1000, kind: 'PERCENTAGE', value: 10 } } } } });
      if (path === '/invoices/i1/payments') return Promise.resolve({ data: { data: [{ _id: 'payment-1', amountMinor: 5000, currency: 'USD', method: 'CARD' }] } });
      return Promise.resolve({ data: { data: [] } });
    });
    window.history.pushState({}, '', '/invoices/i1');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'INV-1' })).toBeInTheDocument();
    expect(screen.getByText('Print invoice')).toBeInTheDocument();
    expect(screen.getByText('$58.00')).toBeInTheDocument();
    expect(screen.getByText('CARD')).toBeInTheDocument();
  });
});
