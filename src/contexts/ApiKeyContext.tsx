import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ApiMode, ApiConfig, ApiProvider } from '../types';
import { apiKeyService } from '../lib/apiKeyService';

interface ApiKeyContextType {
  mode: ApiMode;
  provider?: ApiProvider;
  customKey?: string;
  selectedModel?: string;
  availableModels: string[];
  setMode: (mode: ApiMode) => void;
  setProvider: (provider: ApiProvider) => void;
  setCustomKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  clearCustomKey: () => void;
  getActiveApiConfig: () => ApiConfig;
  isCustomKeyValid: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

// Move useApiKeys outside of any conditional logic to make it compatible with Fast Refresh
const useApiKeys = () => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKeys must be used within an ApiKeyProvider');
  }
  return context;
};

export { useApiKeys };

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ApiMode>('default');
  const [provider, setProviderState] = useState<ApiProvider>('openai');
  const [customKey, setCustomKeyState] = useState<string>('');
  const [selectedModel, setSelectedModelState] = useState<string>('');

  // Computed values
  const isCustomKeyValid = apiKeyService.isCustomKeyValid(customKey, provider);
  const availableModels = provider === 'openrouter' ? apiKeyService.getOpenRouterModels() : [];

  // Set mode with automatic fallback logic
  const setMode = useCallback((newMode: ApiMode) => {
    if (newMode === 'custom' && !customKey) {
      // If trying to set custom mode but no key is set, stay on default
      return;
    }
    setModeState(newMode);
  }, [customKey]);

  // Set provider and update model if needed
  const setProvider = useCallback((newProvider: ApiProvider) => {
    setProviderState(newProvider);
    
    // Set default model for OpenRouter
    if (newProvider === 'openrouter') {
      const defaultModel = apiKeyService.getDefaultModel(newProvider);
      if (defaultModel) {
        setSelectedModelState(defaultModel);
      }
    } else {
      setSelectedModelState('');
    }
  }, []);

  // Set custom key with automatic mode switching
  const setCustomKey = useCallback((key: string) => {
    const trimmedKey = key.trim();
    setCustomKeyState(trimmedKey);
    
    // Automatically switch to custom mode if a valid key is entered
    if (trimmedKey && apiKeyService.validateApiKeyFormat(trimmedKey, provider)) {
      setModeState('custom');
    } else if (!trimmedKey) {
      // If key is cleared, switch back to default
      setModeState('default');
    }
  }, [provider]);

  // Set selected model
  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelState(model);
  }, []);

  // Clear custom key and switch to default
  const clearCustomKey = useCallback(() => {
    setCustomKeyState('');
    setSelectedModelState('');
    setModeState('default');
  }, []);

  // Get the active API configuration
  const getActiveApiConfig = useCallback((): ApiConfig => {
    return apiKeyService.getApiConfig(mode, customKey, provider, selectedModel);
  }, [mode, customKey, provider, selectedModel]);

  // Session cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear sensitive data when component unmounts
      apiKeyService.clearSessionData();
    };
  }, []);

  // Browser close/refresh cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      apiKeyService.clearSessionData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden (potentially closed)
        apiKeyService.clearSessionData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const value: ApiKeyContextType = {
    mode,
    provider,
    customKey,
    selectedModel,
    availableModels,
    setMode,
    setProvider,
    setCustomKey,
    setSelectedModel,
    clearCustomKey,
    getActiveApiConfig,
    isCustomKeyValid,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};