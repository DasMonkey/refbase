import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsModal } from '../SettingsModal';
import { ThemeProvider } from '../../contexts/ThemeContext';
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

describe('SettingsModal Integration with API Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockApiKeyService.validateApiKeyFormat.mockReturnValue(true);
    mockApiKeyService.getApiConfig.mockReturnValue({ provider: 'default', useDefault: true });
    mockApiKeyService.isCustomKeyValid.mockReturnValue(false);
  });

  const renderWithProviders = (isOpen = true) => {
    return render(
      <ThemeProvider>
        <ApiKeyProvider>
          <SettingsModal isOpen={isOpen} onClose={() => {}} />
        </ApiKeyProvider>
      </ThemeProvider>
    );
  };

  describe('API Storage Tab Integration', () => {
    it('should show API Storage tab in the settings modal', () => {
      renderWithProviders();
      
      expect(screen.getByText('API Storage')).toBeInTheDocument();
    });

    it('should navigate to API Storage tab when clicked', async () => {
      renderWithProviders();
      
      const apiStorageTab = screen.getByText('API Storage');
      fireEvent.click(apiStorageTab);
      
      await waitFor(() => {
        expect(screen.getByText('AI API Configuration')).toBeInTheDocument();
        expect(screen.getByText('Use RefBase AI (Default)')).toBeInTheDocument();
        expect(screen.getByText('Use my own API key')).toBeInTheDocument();
      });
    });

    it('should maintain API key state when switching between tabs', async () => {
      mockApiKeyService.validateApiKeyFormat.mockReturnValue(true);
      mockApiKeyService.isCustomKeyValid.mockReturnValue(true);
      
      renderWithProviders();
      
      // Navigate to API Storage tab
      const apiStorageTab = screen.getByText('API Storage');
      fireEvent.click(apiStorageTab);
      
      await waitFor(() => {
        expect(screen.getByText('AI API Configuration')).toBeInTheDocument();
      });
      
      // Select custom option and enter key
      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/sk-... or your provider's API key format/);
        fireEvent.change(input, { target: { value: 'sk-test123456789012345678901234' } });
      });
      
      // Switch to another tab
      const profileTab = screen.getByText('Profile');
      fireEvent.click(profileTab);
      
      await waitFor(() => {
        expect(screen.getByText('Profile Picture')).toBeInTheDocument();
      });
      
      // Switch back to API Storage tab
      fireEvent.click(apiStorageTab);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/sk-... or your provider's API key format/);
        expect(input).toHaveValue('sk-test123456789012345678901234');
        expect(screen.getByText('Using your custom API key')).toBeInTheDocument();
      });
    });

    it('should show API Storage tab with correct icon', () => {
      renderWithProviders();
      
      // The Key icon should be present in the API Storage tab
      const apiStorageTab = screen.getByText('API Storage').closest('button');
      expect(apiStorageTab).toBeInTheDocument();
    });

    it('should handle theme switching in API Storage tab', async () => {
      renderWithProviders();
      
      // Navigate to API Storage tab
      const apiStorageTab = screen.getByText('API Storage');
      fireEvent.click(apiStorageTab);
      
      await waitFor(() => {
        expect(screen.getByText('AI API Configuration')).toBeInTheDocument();
      });
      
      // Switch to Appearance tab to toggle theme
      const appearanceTab = screen.getByText('Appearance');
      fireEvent.click(appearanceTab);
      
      await waitFor(() => {
        const darkModeToggle = screen.getByRole('checkbox');
        fireEvent.click(darkModeToggle);
      });
      
      // Switch back to API Storage tab
      fireEvent.click(apiStorageTab);
      
      await waitFor(() => {
        const heading = screen.getByText('AI API Configuration');
        // In dark mode, the heading should have dark theme classes
        expect(heading).toHaveClass('text-white');
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(false);
      
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('API Storage')).not.toBeInTheDocument();
    });

    it('should render all tabs including API Storage when open', () => {
      renderWithProviders();
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Language & Region')).toBeInTheDocument();
      expect(screen.getByText('API Storage')).toBeInTheDocument();
      expect(screen.getByText('Data & Storage')).toBeInTheDocument();
    });
  });
});