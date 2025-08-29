import {
  classifyError,
  ErrorType,
  validateTrackerData,
  checkNetworkStatus,
  RetryManager
} from '../errorHandling';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('errorHandling', () => {
  describe('classifyError', () => {
    it('should classify network errors', () => {
      const networkError = new Error('fetch failed');
      networkError.name = 'NetworkError';
      
      const result = classifyError(networkError);
      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.message).toContain('Network connection failed');
    });

    it('should classify validation errors', () => {
      const validationError = new Error('validation failed: title is required');
      
      const result = classifyError(validationError);
      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.message).toBe('validation failed: title is required');
    });

    it('should classify permission errors', () => {
      const permissionError = { status: 401, message: 'Unauthorized' };
      
      const result = classifyError(permissionError);
      expect(result.type).toBe(ErrorType.PERMISSION);
      expect(result.message).toContain('Authentication required');
    });

    it('should classify server errors', () => {
      const serverError = { status: 500, message: 'Internal Server Error' };
      
      const result = classifyError(serverError);
      expect(result.type).toBe(ErrorType.SERVER);
      expect(result.message).toContain('Server error');
    });

    it('should classify PostgreSQL unique violation', () => {
      const pgError = { code: '23505', message: 'duplicate key value' };
      
      const result = classifyError(pgError);
      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.message).toContain('A tracker with this information already exists');
    });

    it('should classify unknown errors', () => {
      const unknownError = new Error('Something went wrong');
      
      const result = classifyError(unknownError);
      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle null/undefined errors', () => {
      const result = classifyError(null);
      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe('An unknown error occurred');
    });
  });

  describe('validateTrackerData', () => {
    const validTracker = {
      title: 'Test Tracker',
      type: 'feature',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-20'),
      description: 'Test description',
      status: 'not_started',
      priority: 'medium'
    };

    it('should pass validation for valid tracker', () => {
      const errors = validateTrackerData(validTracker);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for missing title', () => {
      const invalidTracker = { ...validTracker, title: '' };
      const errors = validateTrackerData(invalidTracker);
      expect(errors).toContain('Tracker title is required');
    });

    it('should fail validation for title too long', () => {
      const invalidTracker = { ...validTracker, title: 'a'.repeat(101) };
      const errors = validateTrackerData(invalidTracker);
      expect(errors).toContain('Tracker title must be less than 100 characters');
    });

    it('should fail validation for invalid type', () => {
      const invalidTracker = { ...validTracker, type: 'invalid' };
      const errors = validateTrackerData(invalidTracker);
      expect(errors).toContain('Valid tracker type is required (project, feature, or bug)');
    });

    it('should fail validation for missing dates', () => {
      const invalidTracker = { ...validTracker, startDate: null, endDate: null };
      const errors = validateTrackerData(invalidTracker);
      expect(errors).toContain('Start date is required');
      expect(errors).toContain('End date is required');
    });

    it('should fail validation for end date before start date', () => {
      const invalidTracker = {
        ...validTracker,
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-15')
      };
      const errors = validateTrackerData(invalidTracker);
      expect(errors).toContain('End date must be on or after start date');
    });

    it('should fail validation for description too long', () => {
      const invalidTracker = { ...validTracker, description: 'a'.repeat(501) };
      const errors = validateTrackerData(invalidTracker);
      expect(errors).toContain('Description must be less than 500 characters');
    });

    it('should fail validation for dates too far in future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 3);
      
      const invalidTracker = { ...validTracker, endDate: futureDate };
      const errors = validateTrackerData(invalidTracker);
      expect(errors).toContain('End date cannot be more than 2 years in the future');
    });
  });

  describe('checkNetworkStatus', () => {
    it('should return true when online', () => {
      (navigator as any).onLine = true;
      expect(checkNetworkStatus()).toBe(true);
    });

    it('should return false when offline', () => {
      (navigator as any).onLine = false;
      expect(checkNetworkStatus()).toBe(false);
    });
  });

  describe('RetryManager', () => {
    let retryManager: RetryManager;

    beforeEach(() => {
      retryManager = new RetryManager();
      jest.clearAllTimers();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should execute operation successfully on first try', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryManager.executeWithRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');
      
      const resultPromise = retryManager.executeWithRetry(mockOperation);
      
      // Fast-forward through retry delays
      jest.advanceTimersByTime(1000); // First retry
      await Promise.resolve(); // Let promises resolve
      jest.advanceTimersByTime(2000); // Second retry
      await Promise.resolve();
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry validation errors', async () => {
      const validationError = new Error('Validation failed');
      const mockOperation = jest.fn().mockRejectedValue(validationError);
      
      await expect(retryManager.executeWithRetry(mockOperation))
        .rejects.toThrow('Validation failed');
      
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const mockOperation = jest.fn().mockRejectedValue(networkError);
      
      const resultPromise = retryManager.executeWithRetry(mockOperation);
      
      // Fast-forward through all retry attempts
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(Math.pow(2, i) * 1000);
        await Promise.resolve();
      }
      
      await expect(resultPromise).rejects.toThrow('Network error');
      expect(mockOperation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });
});