import { ApiConfig, ApiMode, ApiProvider } from '../types';

export class ApiKeyService {
  /**
   * Validates the format of an API key based on provider
   */
  validateApiKeyFormat(apiKey: string, provider?: ApiProvider): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // Remove whitespace
    const trimmedKey = apiKey.trim();

    // Check minimum length (most API keys are at least 20 characters)
    if (trimmedKey.length < 20) {
      return false;
    }

    // Provider-specific validation patterns
    switch (provider) {
      case 'openai':
        return /^sk-[a-zA-Z0-9]{20,}$/.test(trimmedKey);
      
      case 'openrouter':
        return /^sk-or-v1-[a-zA-Z0-9]{20,}$/.test(trimmedKey);
      
      case 'custom':
      default:
        // Generic patterns for unknown providers
        const commonPatterns = [
          /^sk-[a-zA-Z0-9]{20,}$/, // OpenAI pattern
          /^sk-or-v1-[a-zA-Z0-9]{20,}$/, // OpenRouter pattern
          /^[a-zA-Z0-9_-]{20,}$/, // Generic alphanumeric with dashes/underscores
          /^[a-zA-Z0-9]{20,}$/, // Pure alphanumeric
        ];
        return commonPatterns.some(pattern => pattern.test(trimmedKey));
    }
  }

  /**
   * Generates API configuration based on mode, provider, and custom key
   */
  getApiConfig(mode: ApiMode, customKey?: string, provider?: ApiProvider, model?: string): ApiConfig {
    if (mode === 'custom' && customKey && provider && this.validateApiKeyFormat(customKey, provider)) {
      const config: ApiConfig = {
        provider,
        apiKey: customKey.trim(),
        useDefault: false,
      };

      // Add provider-specific configuration
      switch (provider) {
        case 'openai':
          config.baseUrl = 'https://api.openai.com/v1';
          break;
        
        case 'openrouter':
          config.baseUrl = 'https://openrouter.ai/api/v1';
          if (model) {
            config.model = model;
          }
          break;
        
        case 'custom':
          // Custom provider - no specific baseUrl
          if (model) {
            config.model = model;
          }
          break;
      }

      return config;
    }

    // Default configuration
    return {
      provider: 'default',
      useDefault: true,
    };
  }

  /**
   * Clears any session data (for future use)
   */
  clearSessionData(): void {
    // Currently no persistent data to clear
    // This method is here for future extensibility
  }

  /**
   * Masks an API key for display purposes
   * Shows only the last 4 characters
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '••••••••';
    }
    
    const lastFour = apiKey.slice(-4);
    const maskedPortion = '•'.repeat(Math.max(4, apiKey.length - 4));
    return maskedPortion + lastFour;
  }

  /**
   * Determines if a custom key is considered valid for the given provider
   */
  isCustomKeyValid(customKey?: string, provider?: ApiProvider): boolean {
    return customKey ? this.validateApiKeyFormat(customKey, provider) : false;
  }

  /**
   * Gets available models for OpenRouter
   */
  getOpenRouterModels(): string[] {
    return [
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/gpt-4-turbo',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct',
      'mistralai/mistral-large',
      'mistralai/mistral-nemo',
      'google/gemini-pro-1.5',
      'cohere/command-r-plus',
    ];
  }

  /**
   * Gets the default model for a provider
   */
  getDefaultModel(provider: ApiProvider): string | undefined {
    switch (provider) {
      case 'openrouter':
        return 'openai/gpt-4o-mini'; // Good balance of performance and cost
      default:
        return undefined;
    }
  }
}

// Export singleton instance
export const apiKeyService = new ApiKeyService();