import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import NeubrutalistLanding from '../app/dashboard/page';
import { setCookie } from 'nookies';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('nookies', () => ({
  setCookie: jest.fn(),
}));

describe('NeubrutalistLanding', () => {
  const mockRouterPush = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign-up buttons', () => {
    render(<NeubrutalistLanding />);
    expect(screen.getByText('Sign Up as Individual')).toBeInTheDocument();
    expect(screen.getByText('Sign Up as Organization')).toBeInTheDocument();
  });

  it('toggles individual sign-up form', () => {
    render(<NeubrutalistLanding />);
    fireEvent.click(screen.getByText('Sign Up as Individual'));
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('toggles organization sign-up form', () => {
    render(<NeubrutalistLanding />);
    fireEvent.click(screen.getByText('Sign Up as Organization'));
    expect(screen.getByLabelText('Organization Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('validates individual sign-up form', async () => {
    render(<NeubrutalistLanding />);
    fireEvent.click(screen.getByText('Sign Up as Individual'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } });

    fireEvent.click(screen.getByText('Connect Blockchain Wallet'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('validates organization sign-up form', async () => {
    render(<NeubrutalistLanding />);
    fireEvent.click(screen.getByText('Sign Up as Organization'));
    fireEvent.change(screen.getByLabelText('Organization Name'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } });

    fireEvent.click(screen.getByText('Connect Blockchain Wallet'));

    await waitFor(() => {
      expect(screen.getByText('Organization Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('submits individual sign-up form', async () => {
    render(<NeubrutalistLanding />);
    fireEvent.click(screen.getByText('Sign Up as Individual'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john.doe@example.com' } });

    fireEvent.click(screen.getByText('Connect Blockchain Wallet'));

    await waitFor(() => expect(setCookie).toHaveBeenCalledWith(null, 'user', expect.any(String), { path: '/' }));
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/dashboard'));
  });

  it('submits organization sign-up form', async () => {
    render(<NeubrutalistLanding />);
    fireEvent.click(screen.getByText('Sign Up as Organization'));
    fireEvent.change(screen.getByLabelText('Organization Name'), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'contact@acme.com' } });

    fireEvent.click(screen.getByText('Connect Blockchain Wallet'));

    await waitFor(() => expect(setCookie).toHaveBeenCalledWith(null, 'user', expect.any(String), { path: '/' }));
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/organization-dashboard'));
  });
});