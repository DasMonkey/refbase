import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiStorageTab } from '../ApiStorageTab';
import { ApiKeyProvider } from '../../contexts/ApiKeyContext';

// Mock the apiKeyService
jest.mock('../../lib/apiKeyService', () => ({
  apiKeyService: {
    validateApiKeyFormat: jest.fn(),
    getApiConfig: jest.fn(),
    clearSessionData: jest.fn(),
    isCustomKeyValid: jest.fn(),
    maskApiKey: jest.fn((key) => `••••••••${key.slice(-4)}`),
  },
}));

const mockApiKeyService = require('../../lib/apiKeyService').apiKeyService;

describe('ApiStorageTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockApiKeyService.validateApiKeyFormat.mockReturnValue(true);
    mockApiKeyService.getApiConfig.mockReturnValue({ provider: 'default', useDefault: true });
    mockApiKeyService.isCustomKeyValid.mockReturnValue(false);
  });

  const renderWithProvider = (isDark = false) => {
    return render(
      <ApiKeyProvider>
        <ApiStorageTab isDark={isDark} />
      </ApiKeyProvider>
    );
  };

  describe('Initial Render', () => {
    it('should render with default option selected', () => {
      renderWithProvider();
      
      expect(screen.getByText('AI API Configuration')).toBeInTheDocument();
      expect(screen.getByText('Use RefBase AI (Default)')).toBeInTheDocument();
      expect(screen.getByText('Use my own API key')).toBeInTheDocument();
      
      const defaultRadio = screen.getByDisplayValue('default');
      expect(defaultRadio).toBeChecked();
    });

    it('should show current configuration as default', () => {
      renderWithProvider();
      
      expect(screen.getByText('Using RefBase AI (default)')).toBeInTheDocument();
    });

    it('should apply dark theme styles when isDark is true', () => {
      renderWithProvider(true);
      
      const heading = screen.getByText('AI API Configuration');
      expect(heading).toHaveClass('text-white');
    });
  });

  describe('Mode Selection', () => {
    it('should show custom input when custom option is selected', async () => {
      renderWithProvider();
      
      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/sk-... or your provider's API key format/)).toBeInTheDocument();
      });
    });

    it('should hide custom input when switching back to default', async () => {
      renderWithProvider();
      
      // First select custom
      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/sk-... or your provider's API key format/)).toBeInTheDocument();
      });
      
      // Then switch back to default
      const defaultRadio = screen.getByDisplayValue('default');
      fireEvent.click(defaultRadio);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/sk-... or your provider's API key format/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom Key Input', () => {
    beforeEach(() => {
      mockApiKeyService.validateApiKeyFormat.mockReturnValue(true);
      mockApiKeyService.isCustomKeyValid.mockReturnValue(true);
    });

    it('should handle custom key input', async () => {
      renderWithProvider();
      
      // Select custom option
      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/sk-... or your provider's API key format/);
        expect(input).toBeInTheDocument();
        
        fireEvent.change(input, { target: { value: 'sk-test123456789012345678901234' } });
        expect(input).toHaveValue('sk-test123456789012345678901234');
      });
    });

    it('should show validation success for valid keys', async () => {
      renderWithProvider();
      
      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/sk-... or your provider's API key format/);
        fireEvent.change(input, { target: { value: 'sk-test123456789012345678901234' } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('API key format looks valid')).toBeInTheDocument();
      });
    });

    it('should show validation warning for invalid keys', async () => {
      mockApiKeyService.validateApiKeyFormat.mockReturnValue(false);
      mockApiKeyService.isCustomKeyValid.mockReturnValue(false);
      
      renderWithProvider();
      
      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/sk-... or your provider's API key format/);
        fireEvent.change(input, { target: { value: 'invalid' } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('API key format appears invalid')).toBeInTheDocument();
      });
    });

    it('should show masked key for valid keys', async () => {
      renderWithProvider();
      
      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/sk-... or your provider's API key format/);
        fireEvent.change(input, { target: { value: 'sk-test123456789012345678901234' } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Key: ••••••••1234/)).toBeInTheDocument();
      });
    });

    it('should clear key when clear button is clicked', async () => {
      renderWithProvider();
      
      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/sk-... or your provider's API key format/);
        fireEvent.change(input, { target: { value: 'sk-test123456789012345678901234' } });
      });
      
      const clearButton = screen.getByTitle('Clear API key');
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/sk-... or your provider's API key format/);
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Status Display', () => {
    it('should show default status when no custom key is set', () => {
      renderWithProvider();
      
      expect(screen.getByText('Using RefBase AI (default)')).toBeInTheDocument();
    });

    it('should show custom status when valid custom key is set', async () => {
      mockApiKeyService.validateApiKeyFormat.mockReturnValue(true);
      mockApiKeyService.isCustomKeyValid.mockReturnValue(true);
      
      renderWithProvider();
      
      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/sk-... or your provider's API key format/);
        fireEvent.change(input, { target: { value: 'sk-test123456789012345678901234' } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Using your custom API key')).toBeInTheDocument();
      });
    });
  });

  describe('Security Notice', () => {
    it('should show security notice when custom input is visible', async () => {
      renderWithProvider();
      
      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);
      
      await waitFor(() => {
        expect(screen.getByText('Security Notice:')).toBeInTheDocument();
        expect(screen.getByText(/only stored in memory during this session/)).toBeInTheDocument();
      });
    });
  });
});