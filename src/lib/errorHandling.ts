/**
 * Comprehensive Error Handling System
 * Implements Strategy Pattern for error classification and handling
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  originalError: any;
  retryable: boolean;
  userFriendly: boolean;
}

/**
 * Error Classification Strategy
 * Implements Strategy Pattern for different error types
 */
export const classifyError = (error: any): ClassifiedError => {
  if (!error) {
    return {
      type: ErrorType.UNKNOWN,
      message: 'An unknown error occurred',
      originalError: error,
      retryable: false,
      userFriendly: true
    };
  }

  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch failed')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Network connection failed. Please check your internet connection.',
      originalError: error,
      retryable: true,
      userFriendly: true
    };
  }

  // Validation errors
  if (error.message?.includes('validation failed') || error.message?.includes('required')) {
    return {
      type: ErrorType.VALIDATION,
      message: error.message,
      originalError: error,
      retryable: false,
      userFriendly: true
    };
  }

  // Permission errors
  if (error.status === 401 || error.status === 403) {
    return {
      type: ErrorType.PERMISSION,
      message: error.status === 401 ? 'Authentication required. Please log in.' : 'You do not have permission to perform this action.',
      originalError: error,
      retryable: false,
      userFriendly: true
    };
  }

  // Server errors
  if (error.status >= 500 || error.message?.includes('Internal Server Error')) {
    return {
      type: ErrorType.SERVER,
      message: 'Server error occurred. Please try again later.',
      originalError: error,
      retryable: true,
      userFriendly: true
    };
  }

  // PostgreSQL specific errors
  if (error.code === '23505') {
    return {
      type: ErrorType.VALIDATION,
      message: 'A tracker with this information already exists',
      originalError: error,
      retryable: false,
      userFriendly: true
    };
  }

  // Default case
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'Something went wrong',
    originalError: error,
    retryable: false,
    userFriendly: true
  };
};

/**
 * Tracker Data Validation
 * Implements comprehensive validation rules
 */
export const validateTrackerData = (tracker: any): string[] => {
  const errors: string[] = [];

  // Title validation
  if (!tracker.title?.trim()) {
    errors.push('Tracker title is required');
  } else if (tracker.title.length > 100) {
    errors.push('Tracker title must be less than 100 characters');
  }

  // Type validation
  if (!tracker.type) {
    errors.push('Tracker type is required');
  } else if (!['project', 'feature', 'bug'].includes(tracker.type)) {
    errors.push('Valid tracker type is required (project, feature, or bug)');
  }

  // Date validation
  if (!tracker.startDate) {
    errors.push('Start date is required');
  }
  if (!tracker.endDate) {
    errors.push('End date is required');
  }

  if (tracker.startDate && tracker.endDate) {
    if (tracker.endDate < tracker.startDate) {
      errors.push('End date must be on or after start date');
    }

    // Check if dates are too far in the future
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
    
    if (tracker.endDate > twoYearsFromNow) {
      errors.push('End date cannot be more than 2 years in the future');
    }
  }

  // Description validation
  if (tracker.description && tracker.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }

  // Status validation
  if (tracker.status && !['not_started', 'in_progress', 'completed'].includes(tracker.status)) {
    errors.push('Invalid status');
  }

  // Priority validation
  if (tracker.priority && !['low', 'medium', 'high', 'critical'].includes(tracker.priority)) {
    errors.push('Invalid priority');
  }

  return errors;
};

/**
 * Network Status Checker
 */
export const checkNetworkStatus = (): boolean => {
  return navigator.onLine;
};

/**
 * Retry Manager with Exponential Backoff
 * Implements Command Pattern for retryable operations
 */
export class RetryManager {
  private maxRetries: number = 3;
  private baseDelay: number = 1000; // 1 second

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        const classifiedError = classifyError(error);
        
        // Don't retry non-retryable errors
        if (!classifiedError.retryable || attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        const delay = this.baseDelay * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Error Handler Factory
 * Implements Factory Pattern for different error handling strategies
 */
export class ErrorHandlerFactory {
  static createHandler(context: 'ui' | 'service' | 'hook') {
    switch (context) {
      case 'ui':
        return new UIErrorHandler();
      case 'service':
        return new ServiceErrorHandler();
      case 'hook':
        return new HookErrorHandler();
      default:
        return new DefaultErrorHandler();
    }
  }
}

/**
 * Abstract Error Handler
 * Implements Template Method Pattern
 */
abstract class ErrorHandler {
  handle(error: any): ClassifiedError {
    const classified = classifyError(error);
    this.logError(classified);
    this.notifyUser(classified);
    return classified;
  }

  protected abstract logError(error: ClassifiedError): void;
  protected abstract notifyUser(error: ClassifiedError): void;
}

class UIErrorHandler extends ErrorHandler {
  protected logError(error: ClassifiedError): void {
    console.error('[UI Error]:', error);
  }

  protected notifyUser(error: ClassifiedError): void {
    // UI-specific error notification logic
    if (error.userFriendly) {
      // Could integrate with toast notification system
      console.warn('User notification:', error.message);
    }
  }
}

class ServiceErrorHandler extends ErrorHandler {
  protected logError(error: ClassifiedError): void {
    console.error('[Service Error]:', error);
    // Could integrate with error tracking service
  }

  protected notifyUser(error: ClassifiedError): void {
    // Services typically don't notify users directly
  }
}

class HookErrorHandler extends ErrorHandler {
  protected logError(error: ClassifiedError): void {
    console.error('[Hook Error]:', error);
  }

  protected notifyUser(error: ClassifiedError): void {
    // Hooks manage their own error state
  }
}

class DefaultErrorHandler extends ErrorHandler {
  protected logError(error: ClassifiedError): void {
    console.error('[Default Error]:', error);
  }

  protected notifyUser(error: ClassifiedError): void {
    console.warn('Error occurred:', error.message);
  }
}