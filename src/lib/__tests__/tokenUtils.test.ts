import { Session } from '@supabase/supabase-js';
import {
  getTokenInfo,
  formatTokenForDisplay,
  copyToClipboard,
  createInitialCopyState,
  isValidJWTFormat,
  getTokenErrorMessage,
  TokenInfo
} from '../tokenUtils';

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn()
};

// Mock document.execCommand
const mockExecCommand = jest.fn();

describe('tokenUtils', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true
    });
    
    // Mock window.isSecureContext
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true
    });
    
    // Mock document.execCommand
    Object.defineProperty(document, 'execCommand', {
      value: mockExecCommand,
      writable: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTokenInfo', () => {
    it('should return null for null session', () => {
      const result = getTokenInfo(null);
      expect(result).toBeNull();
    });

    it('should return null for session without access_token', () => {
      const session = { access_token: '' } as Session;
      const result = getTokenInfo(session);
      expect(result).toBeNull();
    });

    it('should parse valid JWT token correctly', () => {
      // Create a mock JWT token (header.payload.signature)
      const mockPayload = { exp: Math.floor(Date.now() / 1000) + 3600, sub: 'user123' };
      const encodedPayload = btoa(JSON.stringify(mockPayload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const session = {
        access_token: mockToken,
        user: { id: 'user123' }
      } as Session;

      const result = getTokenInfo(session);
      
      expect(result).not.toBeNull();
      expect(result!.token).toBe(mockToken);
      expect(result!.isValid).toBe(true);
      expect(result!.isExpired).toBe(false);
      expect(result!.userId).toBe('user123');
      expect(result!.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle expired token correctly', () => {
      // Create expired token
      const mockPayload = { exp: Math.floor(Date.now() / 1000) - 3600, sub: 'user123' };
      const encodedPayload = btoa(JSON.stringify(mockPayload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const session = {
        access_token: mockToken,
        user: { id: 'user123' }
      } as Session;

      const result = getTokenInfo(session);
      
      expect(result).not.toBeNull();
      expect(result!.isExpired).toBe(true);
      expect(result!.isValid).toBe(false);
    });

    it('should handle malformed JWT token', () => {
      const session = {
        access_token: 'invalid.token',
        user: { id: 'user123' }
      } as Session;

      const result = getTokenInfo(session);
      
      expect(result).not.toBeNull();
      expect(result!.isValid).toBe(false);
      expect(result!.isExpired).toBe(true);
    });
  });

  describe('formatTokenForDisplay', () => {
    it('should return empty string for empty token', () => {
      expect(formatTokenForDisplay('')).toBe('');
    });

    it('should format JWT token with line breaks between parts', () => {
      const token = 'header.payload.signature';
      const result = formatTokenForDisplay(token);
      expect(result).toBe('header.\npayload.\nsignature');
    });

    it('should handle non-JWT tokens with line breaks every 80 characters', () => {
      const longToken = 'a'.repeat(160);
      const result = formatTokenForDisplay(longToken);
      expect(result).toContain('\n');
      expect(result.split('\n')[0]).toHaveLength(80);
    });
  });

  describe('copyToClipboard', () => {
    it('should return false for empty text', async () => {
      const result = await copyToClipboard('');
      expect(result).toBe(false);
    });

    it('should use Clipboard API when available', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);
      
      const result = await copyToClipboard('test text');
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
      expect(result).toBe(true);
    });

    it('should fallback to execCommand when Clipboard API fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('API failed'));
      mockExecCommand.mockReturnValue(true);
      
      // Mock DOM methods
      const mockTextArea = {
        focus: jest.fn(),
        select: jest.fn(),
        style: {},
        value: ''
      };
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockTextArea as any);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockTextArea as any);
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockTextArea as any);
      
      const result = await copyToClipboard('test text');
      
      expect(createElementSpy).toHaveBeenCalledWith('textarea');
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(result).toBe(true);
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should handle fallback failure gracefully', async () => {
      // Make both methods fail
      mockClipboard.writeText.mockRejectedValue(new Error('API failed'));
      mockExecCommand.mockReturnValue(false);
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
        focus: jest.fn(),
        select: jest.fn(),
        style: {},
        value: ''
      } as any);
      
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any));
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any));
      
      const result = await copyToClipboard('test text');
      
      expect(result).toBe(false);
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('createInitialCopyState', () => {
    it('should create initial copy state with idle status', () => {
      const state = createInitialCopyState();
      
      expect(state.status).toBe('idle');
      expect(state.message).toBe('');
      expect(state.timestamp).toBeCloseTo(Date.now(), -2); // Within 100ms
    });
  });

  describe('isValidJWTFormat', () => {
    it('should return false for empty or null token', () => {
      expect(isValidJWTFormat('')).toBe(false);
      expect(isValidJWTFormat(null as any)).toBe(false);
      expect(isValidJWTFormat(undefined as any)).toBe(false);
    });

    it('should return true for valid JWT format', () => {
      expect(isValidJWTFormat('header.payload.signature')).toBe(true);
    });

    it('should return false for invalid JWT format', () => {
      expect(isValidJWTFormat('invalid')).toBe(false);
      expect(isValidJWTFormat('header.payload')).toBe(false);
      expect(isValidJWTFormat('header..signature')).toBe(false);
    });
  });

  describe('getTokenErrorMessage', () => {
    it('should return empty string for null error', () => {
      expect(getTokenErrorMessage(null)).toBe('');
    });

    it('should return appropriate message for known error types', () => {
      expect(getTokenErrorMessage('no_session')).toContain('log in');
      expect(getTokenErrorMessage('invalid_session')).toContain('expired');
      expect(getTokenErrorMessage('token_expired')).toContain('expired');
      expect(getTokenErrorMessage('network_error')).toContain('connection');
      expect(getTokenErrorMessage('invalid_token')).toContain('Invalid token');
    });

    it('should return generic message for unknown error types', () => {
      const result = getTokenErrorMessage('unknown_error');
      expect(result).toContain('An error occurred');
    });

    it('should handle case insensitive error types', () => {
      expect(getTokenErrorMessage('NO_SESSION')).toContain('log in');
      expect(getTokenErrorMessage('Invalid_Session')).toContain('expired');
    });
  });
});