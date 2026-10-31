import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('foundation client', () => {
  it('renders the foundation landing page', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Subscription Management' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View system status' })).toBeInTheDocument();
  });
});
