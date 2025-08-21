import React, { useState } from 'react';
import { Key, Check, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { useApiKeys } from '../contexts/ApiKeyContext';
import { apiKeyService } from '../lib/apiKeyService';
import { ApiProvider } from '../types';

interface ApiStorageTabProps {
  isDark: boolean;
}

export const ApiStorageTab: React.FC<ApiStorageTabProps> = ({ isDark }) => {
  const { 
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
    isCustomKeyValid 
  } = useApiKeys();
  const [showCustomInput, setShowCustomInput] = useState(mode === 'custom' || !!customKey);

  const handleModeChange = (newMode: 'default' | 'custom') => {
    if (newMode === 'default') {
      setMode('default');
      setShowCustomInput(false);
    } else {
      setShowCustomInput(true);
      // Don't automatically switch to custom mode until a valid key is entered
    }
  };

  const handleProviderChange = (newProvider: ApiProvider) => {
    setProvider(newProvider);
  };

  const handleCustomKeyChange = (value: string) => {
    setCustomKey(value);
    // The context will automatically handle mode switching based on key validity
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleClearKey = () => {
    clearCustomKey();
    setShowCustomInput(false);
  };

  const getKeyValidationStatus = () => {
    if (!customKey) return null;
    
    if (isCustomKeyValid) {
      return {
        type: 'success' as const,
        message: 'API key format looks valid',
        icon: Check,
      };
    } else {
      return {
        type: 'warning' as const,
        message: 'API key format appears invalid',
        icon: AlertTriangle,
      };
    }
  };

  const validationStatus = getKeyValidationStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
          AI API Configuration
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose how you want to access AI features. Your custom API key is only stored during your current session.
        </p>
      </div>

      {/* API Options */}
      <div className="space-y-4">
        {/* Default Option */}
        <div className={`p-4 border rounded-lg ${
          mode === 'default' 
            ? `border-blue-500 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}` 
            : `${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`
        }`}>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="apiMode"
              value="default"
              checked={mode === 'default'}
              onChange={() => handleModeChange('default')}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Key size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Use RefBase AI (Default)
                </span>
                {mode === 'default' && (
                  <Check size={16} className="text-green-500" />
                )}
              </div>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Use our built-in AI service. No setup required.
              </p>
            </div>
          </label>
        </div>

        {/* Custom Option */}
        <div className={`p-4 border rounded-lg ${
          mode === 'custom' 
            ? `border-blue-500 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}` 
            : `${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`
        }`}>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="apiMode"
              value="custom"
              checked={showCustomInput}
              onChange={() => handleModeChange('custom')}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Key size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Use my own API key
                </span>
                {mode === 'custom' && isCustomKeyValid && (
                  <Check size={16} className="text-green-500" />
                )}
              </div>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Use your own OpenAI, Anthropic, or other AI provider key. Only stored during your session.
              </p>
            </div>
          </label>

          {/* Custom Configuration */}
          {showCustomInput && (
            <div className="mt-4 space-y-4">
              {/* Provider Selection */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  AI Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'openai', label: 'OpenAI', desc: 'GPT models' },
                    { id: 'openrouter', label: 'OpenRouter', desc: 'Multiple models' },
                    { id: 'custom', label: 'Custom', desc: 'Other provider' },
                  ].map((providerOption) => (
                    <button
                      key={providerOption.id}
                      onClick={() => handleProviderChange(providerOption.id as ApiProvider)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        provider === providerOption.id
                          ? `border-blue-500 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`
                          : `${isDark ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`
                      }`}
                    >
                      <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {providerOption.label}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {providerOption.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection for OpenRouter */}
              {provider === 'openrouter' && (
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Model
                  </label>
                  <div className="relative">
                    <select
                      value={selectedModel || ''}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className={`w-full p-3 pr-10 border ${
                        isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}
                    >
                      {availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                </div>
              )}

              {/* API Key Input */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={customKey || ''}
                    onChange={(e) => handleCustomKeyChange(e.target.value)}
                    placeholder={
                      provider === 'openai' ? 'sk-...' :
                      provider === 'openrouter' ? 'sk-or-v1-...' :
                      'Your API key'
                    }
                    className={`w-full p-3 pr-10 border ${
                      isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {customKey && (
                    <button
                      onClick={handleClearKey}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
                      title="Clear API key"
                    >
                      <X size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                    </button>
                  )}
                </div>
              </div>

              {/* Validation Status */}
              {validationStatus && (
                <div className={`flex items-center space-x-2 text-sm ${
                  validationStatus.type === 'success' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  <validationStatus.icon size={16} />
                  <span>{validationStatus.message}</span>
                </div>
              )}

              {/* Masked Key Display */}
              {customKey && isCustomKeyValid && (
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Key: {apiKeyService.maskApiKey(customKey)}
                </div>
              )}

              {/* Security Notice */}
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
                <div className="flex items-start space-x-2">
                  <Key size={14} className={`mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p className="font-medium mb-1">Security Notice:</p>
                    <p>Your API key is only stored in memory during this session and will be automatically cleared when you close your browser or log out.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Status */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
          Current Configuration
        </h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              mode === 'custom' && isCustomKeyValid ? 'bg-green-500' : 'bg-blue-500'
            }`} />
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {mode === 'custom' && isCustomKeyValid 
                ? `Using ${provider === 'openai' ? 'OpenAI' : provider === 'openrouter' ? 'OpenRouter' : 'Custom'} API` 
                : 'Using RefBase AI (default)'}
            </span>
          </div>
          {mode === 'custom' && isCustomKeyValid && provider === 'openrouter' && selectedModel && (
            <div className="flex items-center space-x-2 ml-4">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Model: {selectedModel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};