/**
 * Centralized Error Handling Hook
 * Implements Observer Pattern for error state management
 */

import { useState, useCallback } from 'react';
import { 
  classifyError, 
  ErrorHandlerFactory, 
  ClassifiedError, 
  RetryManager 
} from '../lib/errorHandling';

export interface UseErrorHandlerReturn {
  error: ClassifiedError | null;
  isLoading: boolean;
  clearError: () => void;
  handleError: (error: any) => ClassifiedError;
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    options?: ErrorHandlingOptions
  ) => Promise<T>;
}

export interface ErrorHandlingOptions {
  showToast?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  context?: 'ui' | 'service' | 'hook';
}

export const useErrorHandler = (
  defaultOptions: ErrorHandlingOptions = {}
): UseErrorHandlerReturn => {
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const retryManager = new RetryManager();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any): ClassifiedError => {
    const handler = ErrorHandlerFactory.createHandler(defaultOptions.context || 'hook');
    const classifiedError = handler.handle(error);
    setError(classifiedError);
    return classifiedError;
  }, [defaultOptions.context]);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options: ErrorHandlingOptions = {}
  ): Promise<T> => {
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      setIsLoading(true);
      clearError();

      if (mergedOptions.retryable) {
        return await retryManager.executeWithRetry(operation, mergedOptions.maxRetries);
      } else {
        return await operation();
      }
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [defaultOptions, retryManager, handleError, clearError]);

  return {
    error,
    isLoading,
    clearError,
    handleError,
    executeWithErrorHandling
  };
};

/**
 * Specialized hook for tracker operations
 * Implements specific error handling for tracker domain
 */
export const useTrackerErrorHandler = () => {
  return useErrorHandler({
    context: 'service',
    retryable: true,
    maxRetries: 3,
    showToast: true
  });
};