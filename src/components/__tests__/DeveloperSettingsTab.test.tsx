import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeveloperSettingsTab } from '../DeveloperSettingsTab';
import { useAuth } from '../../contexts/AuthContext';
import * as tokenUtils from '../../lib/tokenUtils';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the supabase module
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    refreshSession: jest.fn(),
  },
};

jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock token utilities
jest.mock('../../lib/tokenUtils', () => ({
  ...jest.requireActual('../../lib/tokenUtils'),
  getTokenInfo: jest.fn(),
  copyToClipboard: jest.fn(),
  createInitialCopyState: jest.fn(() => ({
    status: 'idle',
    message: '',
    timestamp: Date.now(),
  })),
}));

const mockTokenUtils = tokenUtils as jest.Mocked<typeof tokenUtils>;

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    p: ({ children, ...props }: any) => React.createElement('p', props, children),
  },
}));

describe('DeveloperSettingsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockTokenUtils.getTokenInfo.mockReturnValue({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      isValid: true,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      isExpired: false,
      userId: 'user123',
    });
    
    mockTokenUtils.copyToClipboard.mockResolvedValue(true);
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          user: { id: 'user123' },
        },
      },
      error: null,
    });
  });

  const renderComponent = (isDark = false) => {
    return render(React.createElement(DeveloperSettingsTab, { isDark }));
  };

  describe('Authentication States', () => {
    it('should show authentication required message when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: false,
      });

      renderComponent();

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to view your authentication token for MCP tool configuration.')).toBeInTheDocument();
    });

    it('should show loading state initially when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user123' } as any,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: true,
      });

      renderComponent();

      expect(screen.getByText('Loading token information...')).toBeInTheDocument();
    });

    it('should show token information when authenticated and loaded', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user123' } as any,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: true,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Developer Settings')).toBeInTheDocument();
        expect(screen.getByText('Authentication Token')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Support', () => {
    it('should apply dark theme styles when isDark is true', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user123' } as any,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: true,
      });

      renderComponent(true);

      await waitFor(() => {
        const heading = screen.getByText('Developer Settings');
        expect(heading).toHaveClass('text-white');
      });
    });

    it('should apply light theme styles when isDark is false', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user123' } as any,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: true,
      });

      renderComponent(false);

      await waitFor(() => {
        const heading = screen.getByText('Developer Settings');
        expect(heading).toHaveClass('text-gray-900');
      });
    });
  });

  describe('Token Display', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user123' } as any,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: true,
      });
    });

    it('should display token information correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Authentication Token')).toBeInTheDocument();
        expect(screen.getByText('Valid')).toBeInTheDocument();
        expect(screen.getByText(/remaining/)).toBeInTheDocument();
      });
    });

    it('should show expired status for expired tokens', async () => {
      mockTokenUtils.getTokenInfo.mockReturnValue({
        token: 'expired-token',
        isValid: false,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        isExpired: true,
        userId: 'user123',
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Invalid')).toBeInTheDocument();
        expect(screen.getByText('Expired')).toBeInTheDocument();
      });
    });

    it('should format token display correctly', async () => {
      const mockToken = 'header.payload.signature';
      mockTokenUtils.getTokenInfo.mockReturnValue({
        token: mockToken,
        isValid: true,
        expiresAt: new Date(Date.now() + 3600000),
        isExpired: false,
        userId: 'user123',
      });

      renderComponent();

      await waitFor(() => {
        // The token should be displayed in a pre element with monospace font
        const tokenDisplay = screen.getByText(/header\./);
        expect(tokenDisplay).toBeInTheDocument();
        expect(tokenDisplay.tagName).toBe('PRE');
      });
    });
  });

  describe('Copy Functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user123' } as any,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: true,
      });
    });

    it('should copy token to clipboard when copy button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        const copyButton = screen.getByText('Copy Token');
        fireEvent.click(copyButton);
      });

      expect(mockTokenUtils.copyToClipboard).toHaveBeenCalledWith(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      );
    });

    it('should show success message when copy succeeds', async () => {
      renderComponent();

      await waitFor(() => {
        const copyButton = screen.getByText('Copy Token');
        fireEvent.click(copyButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
        expect(screen.getByText('Token copied to clipboard!')).toBeInTheDocument();
      });
    });

    it('should show error message when copy fails', async () => {
      mockTokenUtils.copyToClipboard.mockResolvedValue(false);

      renderComponent();

      await waitFor(() => {
        const copyButton = screen.getByText('Copy Token');
        fireEvent.click(copyButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to copy token. Please select and copy manually.')).toBeInTheDocument();
      });
    });

    it('should show copying state during copy operation', async () => {
      // Make copy operation take some time
      mockTokenUtils.copyToClipboard.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 100))
      );

      renderComponent();

      await waitFor(() => {
        const copyButton = screen.getByText('Copy Token');
        fireEvent.click(copyButton);
      });

      expect(screen.getByText('Copying...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user123' } as any,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: true,
      });
    });

    it('should show error message when session is invalid', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Token Unavailable')).toBeInTheDocument();
        expect(screen.getByText(/session has expired/)).toBeInTheDocument();
      });
    });

    it('should show network error message', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Token Unavailable')).toBeInTheDocument();
        expect(screen.getByText(/check your internet connection/)).toBeInTheDocument();
      });
    });

    it('should show retry button for errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should show re-authenticate button for expired tokens', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid Refresh Token' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Re-authenticate')).toBeInTheDocument();
      });
    });
  });

  describe('Instructions and Security', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user123' } as any,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: true,
      });
    });

    it('should display MCP configuration instructions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('MCP Tool Configuration')).toBeInTheDocument();
        expect(screen.getByText(/Copy your authentication token below/)).toBeInTheDocument();
        expect(screen.getByText(/https:\/\/refbase\.dev\/api/)).toBeInTheDocument();
        expect(screen.getByText(/Bearer YOUR_TOKEN/)).toBeInTheDocument();
      });
    });

    it('should display security warning', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Security Notice')).toBeInTheDocument();
        expect(screen.getByText(/Keep this token confidential/)).toBeInTheDocument();
        expect(screen.getByText(/Do not share it publicly/)).toBeInTheDocument();
      });
    });

    it('should display API documentation link', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('API Documentation')).toBeInTheDocument();
        const docLink = screen.getByText('View Docs');
        expect(docLink.closest('a')).toHaveAttribute('href', 'https://refbase.dev/docs/api');
        expect(docLink.closest('a')).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user123' } as any,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: true,
      });
    });

    it('should refresh token when retry button is clicked', async () => {
      // First make it fail
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Invalid session' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Then make it succeed
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'new-token',
            user: { id: 'user123' },
          },
        },
        error: null,
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(2);
      });
    });

    it('should show refreshing state during refresh', async () => {
      // First make it fail
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Invalid session' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Make refresh take some time
      mockSupabase.auth.getSession.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          data: { session: { access_token: 'new-token', user: { id: 'user123' } } },
          error: null,
        }), 100))
      );

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user123' } as any,
        loading: false,
        signOut: jest.fn(),
        isAuthenticated: true,
      });
    });

    it('should have proper heading structure', async () => {
      renderComponent();

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 3, name: 'Developer Settings' });
        expect(mainHeading).toBeInTheDocument();
        
        const tokenHeading = screen.getByRole('heading', { level: 4, name: 'Authentication Token' });
        expect(tokenHeading).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', async () => {
      renderComponent();

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /Copy Token/ });
        expect(copyButton).toBeInTheDocument();
        expect(copyButton).not.toBeDisabled();
      });
    });

    it('should disable copy button when copying', async () => {
      mockTokenUtils.copyToClipboard.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 100))
      );

      renderComponent();

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /Copy Token/ });
        fireEvent.click(copyButton);
        
        expect(screen.getByRole('button', { name: /Copying/ })).toBeDisabled();
      });
    });
  });
});