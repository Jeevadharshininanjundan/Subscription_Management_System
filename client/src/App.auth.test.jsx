import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { api } from './services/api.js';

vi.mock('./services/api.js', async () => {
  const actual = await vi.importActual('./services/api.js');
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } };
});

describe('authentication client flows', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
    api.get.mockRejectedValue(new Error('No session'));
    api.post.mockReset();
  });

  it('renders registration validation guidance and submits registration', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Register' }));
    expect(screen.getByText(/More than 8 characters/)).toBeInTheDocument();
    api.post.mockResolvedValue({
      data: { data: { accessToken: 'token', user: { email: 'customer@example.com', role: 'CUSTOMER' } } }
    });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Customer' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password!9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Customer',
      email: 'customer@example.com',
      password: 'Password!9'
    }));
  });

  it('handles login failures with a safe message', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Sign in' }));
    api.post.mockRejectedValue({ response: { data: { error: { message: 'Email or password is incorrect.' } } } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'WrongPassword!9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });

  it('supports forgot-password and reset-password pages with safe API errors', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Sign in' }));
    fireEvent.click(screen.getByRole('link', { name: 'Forgot password?' }));
    api.post.mockResolvedValueOnce({
      data: { data: { message: 'If an account exists for that email, a reset link has been sent.' } }
    });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
    cleanup();
    window.history.pushState({}, '', '/reset-password?token=one-time-token');
    render(<App />);
    api.post.mockRejectedValueOnce({
      response: { data: { error: { message: 'The reset link is invalid or expired.' } } }
    });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Password!9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid or expired');
  });

  it('redirects protected routes to login and shows admin navigation by role', async () => {
    window.history.pushState({}, '', '/account');
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument());
  });

  it('shows staff administration navigation only for an admin session', async () => {
    window.localStorage.setItem('brightloop.accessToken', 'admin-token');
    window.history.pushState({}, '', '/');
    api.get.mockResolvedValue({
      data: { data: { user: { email: 'admin@example.com', role: 'ADMIN' } } }
    });
    render(<App />);
    expect(await screen.findByRole('link', { name: 'Staff administration' })).toBeInTheDocument();
  });
});
