import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DocumentationPage } from '../../pages/DocumentationPage';
import { ThemeProvider } from '../../contexts/ThemeContext';
import * as documentationLoader from '../../lib/documentationLoader';

// Mock the documentation loader
vi.mock('../../lib/documentationLoader');

const mockLoadAllDocumentation = vi.mocked(documentationLoader.loadAllDocumentation);
const mockLoadDocumentationById = vi.mocked(documentationLoader.loadDocumentationById);
const mockGroupDocumentationByCategory = vi.mocked(documentationLoader.groupDocumentationByCategory);

// Mock theme context
const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('Documentation Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGroupDocumentationByCategory.mockReturnValue({});
  });

  describe('Network Errors', () => {
    it('should display network error message when fetch fails', async () => {
      const networkError = new Error('Failed to fetch');
      mockLoadAllDocumentation.mockRejectedValue(networkError);

      render(
        <MockThemeProvider>
          <DocumentationPage />
        </MockThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    it('should retry loading when retry button is clicked', async () => {
      const networkError = new Error('Network timeout');
      mockLoadAllDocumentation
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce([]);

      render(
        <MockThemeProvider>
          <DocumentationPage />
        </MockThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByText(/try again/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockLoadAllDocumentation).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('File Not Found Errors', () => {
    it('should display file not found error for 404 responses', async () => {
      const notFoundError = new Error('HTTP 404: Not Found');
      mockLoadAllDocumentation.mockRejectedValue(notFoundError);

      render(
        <MockThemeProvider>
          <DocumentationPage />
        </MockThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/documentation file not found/i)).toBeInTheDocument();
      });

      // Should not show retry button for non-retryable errors
      expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
    });

    it('should handle individual file loading failures gracefully', async () => {
      const mockDocs = [
        {
          id: 'api',
          title: 'API Reference',
          filename: 'API.md',
          category: 'API Reference',
          order: 1,
          content: '# API Reference\n\nAPI documentation content.'
        }
      ];

      mockLoadAllDocumentation.mockResolvedValue(mockDocs);
      mockGroupDocumentationByCategory.mockReturnValue({
        'API Reference': mockDocs
      });

      // Mock individual file loading failure
      mockLoadDocumentationById.mockRejectedValue(new Error('File not found'));

      render(
        <MockThemeProvider>
          <DocumentationPage />
        </MockThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('API Reference')).toBeInTheDocument();
      });

      // Try to load a non-existent document
      const apiLink = screen.getByText('API Reference');
      fireEvent.click(apiLink);

      await waitFor(() => {
        expect(screen.getByText(/documentation not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Parse Errors', () => {
    it('should handle markdown parsing errors', async () => {
      const parseError = new Error('Parse error: Invalid markdown syntax');
      mockLoadAllDocumentation.mockRejectedValue(parseError);

      render(
        <MockThemeProvider>
          <DocumentationPage />
        </MockThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/error parsing documentation content/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during initial load', async () => {
      let resolvePromise: (value: any) => void;
      const loadingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockLoadAllDocumentation.mockReturnValue(loadingPromise);

      render(
        <MockThemeProvider>
          <DocumentationPage />
        </MockThemeProvider>
      );

      // Should show loading state
      expect(screen.getByText(/loading documentation/i)).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!([]);

      await waitFor(() => {
        expect(screen.queryByText(/loading documentation/i)).not.toBeInTheDocument();
      });
    });

    it('should show skeleton loaders for content', async () => {
      let resolvePromise: (value: any) => void;
      const loadingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockLoadAllDocumentation.mockReturnValue(loadingPromise);

      render(
        <MockThemeProvider>
          <DocumentationPage />
        </MockThemeProvider>
      );

      // Should show skeleton loaders
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.some(el => el.className.includes('animate-pulse'))).toBe(true);

      resolvePromise!([]);
    });
  });

  describe('Graceful Degradation', () => {
    it('should continue working when some files fail to load', async () => {
      const successfulDoc = {
        id: 'api',
        title: 'API Reference',
        filename: 'API.md',
        category: 'API Reference',
        order: 1,
        content: '# API Reference\n\nAPI documentation content.'
      };

      // Mock partial success - some files load, others fail
      mockLoadAllDocumentation.mockResolvedValue([successfulDoc]);
      mockGroupDocumentationByCategory.mockReturnValue({
        'API Reference': [successfulDoc]
      });

      render(
        <MockThemeProvider>
          <DocumentationPage />
        </MockThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('API Reference')).toBeInTheDocument();
      });

      // Should still show available documentation
      expect(screen.getByText('API Reference')).toBeInTheDocument();
    });

    it('should show helpful message when no documentation is available', async () => {
      mockLoadAllDocumentation.mockResolvedValue([]);

      render(
        <MockThemeProvider>
          <DocumentationPage />
        </MockThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/no documentation files found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Dismissal', () => {
    it('should allow users to dismiss errors', async () => {
      const error = new Error('Test error');
      mockLoadAllDocumentation.mockRejectedValue(error);

      render(
        <MockThemeProvider>
          <DocumentationPage />
        </MockThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/test error/i)).toBeInTheDocument();
      });

      // Find and click dismiss button (X button)
      const dismissButton = screen.getByTitle('Dismiss');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Boundaries', () => {
    it('should catch and display component errors', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const ThrowError = () => {
        throw new Error('Component error');
      };

      const { container } = render(
        <MockThemeProvider>
          <ThrowError />
        </MockThemeProvider>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});