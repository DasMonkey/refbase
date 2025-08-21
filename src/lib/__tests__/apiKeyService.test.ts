import { ApiKeyService } from '../apiKeyService';

describe('ApiKeyService', () => {
  let service: ApiKeyService;

  beforeEach(() => {
    service = new ApiKeyService();
  });

  describe('validateApiKeyFormat', () => {
    it('should return false for empty or null keys', () => {
      expect(service.validateApiKeyFormat('')).toBe(false);
      expect(service.validateApiKeyFormat(null as any)).toBe(false);
      expect(service.validateApiKeyFormat(undefined as any)).toBe(false);
    });

    it('should return false for keys that are too short', () => {
      expect(service.validateApiKeyFormat('short')).toBe(false);
      expect(service.validateApiKeyFormat('1234567890123456789')).toBe(false); // 19 chars
    });

    it('should return true for valid OpenAI-style keys', () => {
      expect(service.validateApiKeyFormat('sk-1234567890abcdef1234567890abcdef')).toBe(true);
      expect(service.validateApiKeyFormat('sk-proj-1234567890abcdef1234567890abcdef')).toBe(true);
    });

    it('should return true for valid generic API keys', () => {
      expect(service.validateApiKeyFormat('abcdef1234567890abcdef1234567890')).toBe(true);
      expect(service.validateApiKeyFormat('abc-def_123456789012345678901234567890')).toBe(true);
    });

    it('should handle whitespace correctly', () => {
      expect(service.validateApiKeyFormat('  sk-1234567890abcdef1234567890abcdef  ')).toBe(true);
      expect(service.validateApiKeyFormat('\n\tsk-1234567890abcdef1234567890abcdef\n\t')).toBe(true);
    });
  });

  describe('getApiConfig', () => {
    it('should return default config when mode is default', () => {
      const config = service.getApiConfig('default');
      expect(config).toEqual({
        provider: 'default',
        useDefault: true,
      });
    });

    it('should return default config when custom key is invalid', () => {
      const config = service.getApiConfig('custom', 'invalid');
      expect(config).toEqual({
        provider: 'default',
        useDefault: true,
      });
    });

    it('should return custom config when custom key is valid', () => {
      const validKey = 'sk-1234567890abcdef1234567890abcdef';
      const config = service.getApiConfig('custom', validKey);
      expect(config).toEqual({
        provider: 'custom',
        apiKey: validKey,
        useDefault: false,
      });
    });

    it('should trim whitespace from custom keys', () => {
      const validKey = '  sk-1234567890abcdef1234567890abcdef  ';
      const config = service.getApiConfig('custom', validKey);
      expect(config.apiKey).toBe('sk-1234567890abcdef1234567890abcdef');
    });
  });

  describe('maskApiKey', () => {
    it('should mask short keys completely', () => {
      expect(service.maskApiKey('short')).toBe('••••••••');
      expect(service.maskApiKey('1234567')).toBe('••••••••');
    });

    it('should show last 4 characters for longer keys', () => {
      expect(service.maskApiKey('sk-1234567890abcdef1234567890abcdef')).toBe('••••••••••••••••••••••••••••••cdef');
      expect(service.maskApiKey('abcdefghijklmnop')).toBe('••••••••••••mnop');
    });

    it('should handle empty keys', () => {
      expect(service.maskApiKey('')).toBe('••••••••');
      expect(service.maskApiKey(null as any)).toBe('••••••••');
    });
  });

  describe('isCustomKeyValid', () => {
    it('should return false for undefined or empty keys', () => {
      expect(service.isCustomKeyValid()).toBe(false);
      expect(service.isCustomKeyValid('')).toBe(false);
    });

    it('should return true for valid keys', () => {
      expect(service.isCustomKeyValid('sk-1234567890abcdef1234567890abcdef')).toBe(true);
    });

    it('should return false for invalid keys', () => {
      expect(service.isCustomKeyValid('invalid')).toBe(false);
    });
  });

  describe('clearSessionData', () => {
    it('should not throw when called', () => {
      expect(() => service.clearSessionData()).not.toThrow();
    });
  });
});