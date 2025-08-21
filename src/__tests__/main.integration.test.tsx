import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ApiKeyProvider } from '../contexts/ApiKeyContext';
import { useTheme } from '../contexts/ThemeContext';
import { useApiKeys } from '../contexts/ApiKeyContext';

// Mock the apiKeyService
jest.mock('../lib/apiKeyService', () => ({
  apiKeyService: {
    validateApiKeyFormat: jest.fn(),
    getApiConfig: jest.fn(),
    clearSessionData: jest.fn(),
    isCustomKeyValid: jest.fn(),
    maskApiKey: jest.fn(),
  },
}));

// Test component that uses both contexts
const TestComponent: React.FC = () => {
  const { isDark } = useTheme();
  const { mode, getActiveApiConfig } = useApiKeys();
  
  return (
    <div>
      <div data-testid="theme-status">{isDark ? 'dark' : 'light'}</div>
      <div data-testid="api-mode">{mode}</div>
      <div data-testid="api-config">{JSON.stringify(getActiveApiConfig())}</div>
    </div>
  );
};

describe('Provider Integration', () => {
  beforeEach(() => {
    const mockApiKeyService = require('../lib/apiKeyService').apiKeyService;
    mockApiKeyService.getApiConfig.mockReturnValue({ provider: 'default', useDefault: true });
    mockApiKeyService.isCustomKeyValid.mockReturnValue(false);
  });

  it('should provide both theme and API key contexts', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ApiKeyProvider>
          <TestComponent />
        </ApiKeyProvider>
      </ThemeProvider>
    );

    // Both contexts should be available
    expect(getByTestId('theme-status')).toBeInTheDocument();
    expect(getByTestId('api-mode')).toBeInTheDocument();
    expect(getByTestId('api-config')).toBeInTheDocument();
    
    // Default values should be present
    expect(getByTestId('theme-status')).toHaveTextContent('dark'); // Default theme
    expect(getByTestId('api-mode')).toHaveTextContent('default');
    expect(getByTestId('api-config')).toHaveTextContent('{"provider":"default","useDefault":true}');
  });

  it('should work with nested provider order (ThemeProvider > ApiKeyProvider)', () => {
    // This tests the exact order we use in main.tsx
    const { getByTestId } = render(
      <ThemeProvider>
        <ApiKeyProvider>
          <TestComponent />
        </ApiKeyProvider>
      </ThemeProvider>
    );

    expect(getByTestId('theme-status')).toHaveTextContent('dark');
    expect(getByTestId('api-mode')).toHaveTextContent('default');
  });

  it('should throw error when ApiKeyProvider is missing', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
    }).toThrow('useApiKeys must be used within an ApiKeyProvider');
    
    consoleSpy.mockRestore();
  });

  it('should throw error when ThemeProvider is missing', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(
        <ApiKeyProvider>
          <TestComponent />
        </ApiKeyProvider>
      );
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleSpy.mockRestore();
  });
});