import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { ApiKeyProvider, useApiKeys } from '../ApiKeyContext';

// Mock the apiKeyService
jest.mock('../../lib/apiKeyService', () => ({
  apiKeyService: {
    validateApiKeyFormat: jest.fn(),
    getApiConfig: jest.fn(),
    clearSessionData: jest.fn(),
    isCustomKeyValid: jest.fn(),
  },
}));

const mockApiKeyService = require('../../lib/apiKeyService').apiKeyService;

describe('ApiKeyContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockApiKeyService.validateApiKeyFormat.mockReturnValue(true);
    mockApiKeyService.getApiConfig.mockReturnValue({ provider: 'default', useDefault: true });
    mockApiKeyService.isCustomKeyValid.mockReturnValue(false);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ApiKeyProvider>{children}</ApiKeyProvider>
  );

  describe('useApiKeys hook', () => {
    it('should throw error when used outside provider', () => {
      const { result } = renderHook(() => useApiKeys());
      expect(result.error).toEqual(
        new Error('useApiKeys must be used within an ApiKeyProvider')
      );
    });

    it('should provide initial values', () => {
      const { result } = renderHook(() => useApiKeys(), { wrapper });
      
      expect(result.current.mode).toBe('default');
      expect(result.current.customKey).toBe('');
      expect(result.current.isCustomKeyValid).toBe(false);
    });
  });

  describe('setCustomKey', () => {
    it('should set custom key and switch to custom mode for valid keys', () => {
      mockApiKeyService.validateApiKeyFormat.mockReturnValue(true);
      mockApiKeyService.isCustomKeyValid.mockReturnValue(true);
      
      const { result } = renderHook(() => useApiKeys(), { wrapper });
      
      act(() => {
        result.current.setCustomKey('sk-validkey123456789012345678901234');
      });
      
      expect(result.current.customKey).toBe('sk-validkey123456789012345678901234');
      expect(result.current.mode).toBe('custom');
    });

    it('should trim whitespace from custom keys', () => {
      mockApiKeyService.validateApiKeyFormat.mockReturnValue(true);
      
      const { result } = renderHook(() => useApiKeys(), { wrapper });
      
      act(() => {
        result.current.setCustomKey('  sk-validkey123456789012345678901234  ');
      });
      
      expect(result.current.customKey).toBe('sk-validkey123456789012345678901234');
    });

    it('should switch to default mode when key is cleared', () => {
      const { result } = renderHook(() => useApiKeys(), { wrapper });
      
      // First set a valid key
      act(() => {
        result.current.setCustomKey('sk-validkey123456789012345678901234');
      });
      
      // Then clear it
      act(() => {
        result.current.setCustomKey('');
      });
      
      expect(result.current.customKey).toBe('');
      expect(result.current.mode).toBe('default');
    });

    it('should not switch to custom mode for invalid keys', () => {
      mockApiKeyService.validateApiKeyFormat.mockReturnValue(false);
      
      const { result } = renderHook(() => useApiKeys(), { wrapper });
      
      act(() => {
        result.current.setCustomKey('invalid');
      });
      
      expect(result.current.customKey).toBe('invalid');
      expect(result.current.mode).toBe('default');
    });
  });

  describe('setMode', () => {
    it('should set mode to default', () => {
      const { result } = renderHook(() => useApiKeys(), { wrapper });
      
      act(() => {
        result.current.setMode('default');
      });
      
      expect(result.current.mode).toBe('default');
    });

    it('should not switch to custom mode if no custom key is set', () => {
      const { result } = renderHook(() => useApiKeys(), { wrapper });
      
      act(() => {
        result.current.setMode('custom');
      });
      
      expect(result.current.mode).toBe('default');
    });

    it('should switch to custom mode if custom key is already set', () => {
      mockApiKeyService.validateApiKeyFormat.mockReturnValue(true);
      
      const { result } = renderHook(() => useApiKeys(), { wrapper });
      
      // First set a custom key
      act(() => {
        result.current.setCustomKey('sk-validkey123456789012345678901234');
      });
      
      // Then explicitly set mode to default
      act(() => {
        result.current.setMode('default');
      });
      
      expect(result.current.mode).toBe('default');
      
      // Then switch back to custom
      act(() => {
        result.current.setMode('custom');
      });
      
      expect(result.current.mode).toBe('custom');
    });
  });

  describe('clearCustomKey', () => {
    it('should clear custom key and switch to default mode', () => {
      mockApiKeyService.validateApiKeyFormat.mockReturnValue(true);
      
      const { result } = renderHook(() => useApiKeys(), { wrapper });
      
      // First set a custom key
      act(() => {
        result.current.setCustomKey('sk-validkey123456789012345678901234');
      });
      
      expect(result.current.mode).toBe('custom');
      expect(result.current.customKey).toBe('sk-validkey123456789012345678901234');
      
      // Then clear it
      act(() => {
        result.current.clearCustomKey();
      });
      
      expect(result.current.customKey).toBe('');
      expect(result.current.mode).toBe('default');
    });
  });

  describe('getActiveApiConfig', () => {
    it('should call apiKeyService.getApiConfig with current state', () => {
      const mockConfig = { provider: 'default', useDefault: true };
      mockApiKeyService.getApiConfig.mockReturnValue(mockConfig);
      
      const { result } = renderHook(() => useApiKeys(), { wrapper });
      
      const config = result.current.getActiveApiConfig();
      
      expect(mockApiKeyService.getApiConfig).toHaveBeenCalledWith('default', '');
      expect(config).toBe(mockConfig);
    });
  });

  describe('cleanup', () => {
    it('should call clearSessionData on unmount', () => {
      const { unmount } = renderHook(() => useApiKeys(), { wrapper });
      
      unmount();
      
      expect(mockApiKeyService.clearSessionData).toHaveBeenCalled();
    });
  });
});