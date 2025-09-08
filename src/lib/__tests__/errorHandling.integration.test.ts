/**
 * Integration test for error handling and loading states
 * This test verifies that the error handling implementation works correctly
 */

import { DocumentationError, FileNotFoundError, NetworkError, ParseError } from '../documentation/DocumentationRepository';

describe('Error Handling Integration', () => {
  describe('Error Types', () => {
    it('should create DocumentationError with correct properties', () => {
      const error = new DocumentationError('Test message', 'TEST_CODE', 'test.md');
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.filename).toBe('test.md');
      expect(error.name).toBe('DocumentationError');
    });

    it('should create FileNotFoundError with correct properties', () => {
      const error = new FileNotFoundError('missing.md');
      
      expect(error.message).toBe('Documentation file not found: missing.md');
      expect(error.code).toBe('FILE_NOT_FOUND');
      expect(error.filename).toBe('missing.md');
      expect(error.name).toBe('FileNotFoundError');
    });

    it('should create NetworkError with correct properties', () => {
      const error = new NetworkError('network.md');
      
      expect(error.message).toBe('Network error loading file: network.md');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.filename).toBe('network.md');
      expect(error.name).toBe('NetworkError');
    });

    it('should create ParseError with correct properties', () => {
      const error = new ParseError('parse.md');
      
      expect(error.message).toBe('Error parsing file: parse.md');
      expect(error.code).toBe('PARSE_ERROR');
      expect(error.filename).toBe('parse.md');
      expect(error.name).toBe('ParseError');
    });
  });

  describe('Error Inheritance', () => {
    it('should inherit from DocumentationError', () => {
      const fileError = new FileNotFoundError('test.md');
      const networkError = new NetworkError('test.md');
      const parseError = new ParseError('test.md');

      expect(fileError instanceof DocumentationError).toBe(true);
      expect(networkError instanceof DocumentationError).toBe(true);
      expect(parseError instanceof DocumentationError).toBe(true);
      expect(fileError instanceof Error).toBe(true);
      expect(networkError instanceof Error).toBe(true);
      expect(parseError instanceof Error).toBe(true);
    });
  });
});

// Mock test to verify components can be imported without errors
describe('Component Imports', () => {
  it('should import error handling components without errors', async () => {
    // Test that our components can be imported
    const { LoadingSpinner } = await import('../../../components/ui/LoadingSpinner');
    const { SkeletonLoader } = await import('../../../components/ui/SkeletonLoader');
    const { ErrorMessage } = await import('../../../components/ui/ErrorMessage');
    const { ErrorBoundary } = await import('../../../components/ui/ErrorBoundary');

    expect(LoadingSpinner).toBeDefined();
    expect(SkeletonLoader).toBeDefined();
    expect(ErrorMessage).toBeDefined();
    expect(ErrorBoundary).toBeDefined();
  });
});

// Test error handling logic
describe('Error Handling Logic', () => {
  it('should categorize errors correctly', () => {
    const parseError = (err: unknown) => {
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        
        if (message.includes('404') || message.includes('not found')) {
          return { type: 'not-found', retryable: false };
        }
        
        if (message.includes('network') || message.includes('fetch')) {
          return { type: 'network', retryable: true };
        }
        
        if (message.includes('parse') || message.includes('syntax')) {
          return { type: 'parse', retryable: false };
        }
        
        return { type: 'unknown', retryable: true };
      }
      
      return { type: 'unknown', retryable: true };
    };

    // Test different error types
    expect(parseError(new Error('404 Not Found'))).toEqual({ type: 'not-found', retryable: false });
    expect(parseError(new Error('Network timeout'))).toEqual({ type: 'network', retryable: true });
    expect(parseError(new Error('Parse error: invalid syntax'))).toEqual({ type: 'parse', retryable: false });
    expect(parseError(new Error('Unknown error'))).toEqual({ type: 'unknown', retryable: true });
    expect(parseError('string error')).toEqual({ type: 'unknown', retryable: true });
  });
});