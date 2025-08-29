import { ProjectTracker } from '../types';

// Retry configuration interface
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitterFactor: number; // 0-1, adds randomness to prevent thundering herd
  retryCondition: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
  onSuccess?: (result: any, attempts: number) => void;
  onFailure?: (error: any, attempts: number) => void;
}

// Default retry configuration for database operations
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  retryCondition: (error: any) => {
    // Retry on network errors, timeouts, and temporary server errors
    if (error?.name === 'NetworkError') return true;
    if (error?.message?.includes('timeout')) return true;
    if (error?.message?.includes('fetch')) return true;
    if (error?.status >= 500 && error?.status < 600) return true; // 5xx server errors
    if (error?.status === 429) return true; // Rate limiting
    return false;
  }
};

// Retry queue item interface
interface RetryQueueItem<T> {
  id: string;
  operation: () => Promise<T>;
  config: RetryConfig;
  attempts: number;
  lastError?: any;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  scheduledTime: number;
}

// Database operation types
export type DatabaseOperation = 
  | 'create_tracker'
  | 'update_tracker'
  | 'delete_tracker'
  | 'fetch_trackers'
  | 'bulk_update'
  | 'bulk_delete';

// Operation metadata
interface OperationMetadata {
  type: DatabaseOperation;
  trackerId?: string;
  trackerIds?: string[];
  data?: Partial<ProjectTracker>;
  timestamp: number;
}

// Main retry mechanism class
export class DatabaseRetryMechanism {
  private retryQueue: RetryQueueItem<any>[] = [];
  private processingQueue = false;
  private operationHistory: Map<string, OperationMetadata> = new Map();
  private activeOperations: Set<string> = new Set();

  // Execute operation with retry
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    metadata: OperationMetadata,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    
    // Store operation metadata
    this.operationHistory.set(operationId, metadata);
    this.activeOperations.add(operationId);

    try {
      const result = await this.attemptOperation(operation, fullConfig);
      
      // Success callback
      fullConfig.onSuccess?.(result, 1);
      
      return result;
    } catch (error) {
      // If immediate attempt fails, add to retry queue
      return this.addToRetryQueue(operation, operationId, fullConfig);
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  // Attempt operation with immediate execution
  private async attemptOperation<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    attemptNumber = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attemptNumber < config.maxRetries && config.retryCondition(error, attemptNumber)) {
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(config, attemptNumber);
        
        config.onRetry?.(error, attemptNumber);
        
        // Wait before retry
        await this.sleep(delay);
        
        // Recursive retry
        return this.attemptOperation(operation, config, attemptNumber + 1);
      }
      
      throw error;
    }
  }

  // Add operation to retry queue for later processing
  private async addToRetryQueue<T>(
    operation: () => Promise<T>,
    operationId: string,
    config: RetryConfig
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queueItem: RetryQueueItem<T> = {
        id: operationId,
        operation,
        config,
        attempts: 1, // First attempt already failed
        resolve,
        reject,
        scheduledTime: Date.now() + this.calculateDelay(config, 1)
      };

      this.retryQueue.push(queueItem);
      this.processQueue();
    });
  }

  // Process retry queue
  private async processQueue() {
    if (this.processingQueue) return;
    
    this.processingQueue = true;

    while (this.retryQueue.length > 0) {
      const now = Date.now();
      const readyItems = this.retryQueue.filter(item => item.scheduledTime <= now);
      
      if (readyItems.length === 0) {
        // Wait for next scheduled item
        const nextScheduled = Math.min(...this.retryQueue.map(item => item.scheduledTime));
        await this.sleep(Math.max(100, nextScheduled - now));
        continue;
      }

      // Process ready items
      for (const item of readyItems) {
        await this.processQueueItem(item);
      }
    }

    this.processingQueue = false;
  }

  // Process individual queue item
  private async processQueueItem<T>(item: RetryQueueItem<T>) {
    // Remove from queue
    this.retryQueue = this.retryQueue.filter(queueItem => queueItem.id !== item.id);

    try {
      const result = await item.operation();
      
      // Success
      item.config.onSuccess?.(result, item.attempts);
      item.resolve(result);
      
    } catch (error) {
      item.lastError = error;
      item.attempts++;

      // Check if we should retry
      if (
        item.attempts < item.config.maxRetries && 
        item.config.retryCondition(error, item.attempts)
      ) {
        // Schedule next retry
        item.scheduledTime = Date.now() + this.calculateDelay(item.config, item.attempts);
        this.retryQueue.push(item);
        
        item.config.onRetry?.(error, item.attempts);
      } else {
        // Max retries reached or non-retryable error
        item.config.onFailure?.(error, item.attempts);
        item.reject(error);
      }
    }
  }

  // Calculate delay with exponential backoff and jitter
  private calculateDelay(config: RetryConfig, attempt: number): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * config.jitterFactor * Math.random();
    
    return cappedDelay + jitter;
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get operation status
  getOperationStatus(operationId: string): {
    isActive: boolean;
    metadata?: OperationMetadata;
    inQueue: boolean;
  } {
    return {
      isActive: this.activeOperations.has(operationId),
      metadata: this.operationHistory.get(operationId),
      inQueue: this.retryQueue.some(item => item.id === operationId)
    };
  }

  // Get queue statistics
  getQueueStats(): {
    queueLength: number;
    activeOperations: number;
    failedOperations: number;
    nextRetryIn?: number;
  } {
    const now = Date.now();
    const nextRetry = this.retryQueue.length > 0 
      ? Math.min(...this.retryQueue.map(item => item.scheduledTime)) - now
      : undefined;

    return {
      queueLength: this.retryQueue.length,
      activeOperations: this.activeOperations.size,
      failedOperations: this.retryQueue.filter(item => item.attempts > 1).length,
      nextRetryIn: nextRetry && nextRetry > 0 ? nextRetry : undefined
    };
  }

  // Clear queue and reset
  clearQueue() {
    this.retryQueue.forEach(item => {
      item.reject(new Error('Operation cancelled'));
    });
    this.retryQueue = [];
    this.activeOperations.clear();
    this.operationHistory.clear();
  }

  // Cancel specific operation
  cancelOperation(operationId: string): boolean {
    const queueIndex = this.retryQueue.findIndex(item => item.id === operationId);
    
    if (queueIndex !== -1) {
      const item = this.retryQueue[queueIndex];
      item.reject(new Error('Operation cancelled'));
      this.retryQueue.splice(queueIndex, 1);
      return true;
    }
    
    return false;
  }
}

// Specialized tracker operation retry mechanisms
export class TrackerOperationRetryMechanism {
  private retryMechanism: DatabaseRetryMechanism;
  private conflictResolver: ConflictResolver;

  constructor() {
    this.retryMechanism = new DatabaseRetryMechanism();
    this.conflictResolver = new ConflictResolver();
  }

  // Create tracker with retry
  async createTracker(
    trackerData: Omit<ProjectTracker, 'id'>,
    createFn: (data: Omit<ProjectTracker, 'id'>) => Promise<ProjectTracker>
  ): Promise<ProjectTracker> {
    const operationId = `create_${Date.now()}_${Math.random()}`;
    
    return this.retryMechanism.executeWithRetry(
      () => createFn(trackerData),
      operationId,
      {
        type: 'create_tracker',
        data: trackerData,
        timestamp: Date.now()
      },
      {
        onRetry: (error, attempt) => {
          console.warn(`Retrying tracker creation, attempt ${attempt}:`, error.message);
        },
        onSuccess: (result, attempts) => {
          if (attempts > 1) {
            console.info(`Tracker created successfully after ${attempts} attempts`);
          }
        }
      }
    );
  }

  // Update tracker with retry and conflict resolution
  async updateTracker(
    trackerId: string,
    updates: Partial<ProjectTracker>,
    updateFn: (id: string, data: Partial<ProjectTracker>) => Promise<ProjectTracker>,
    getCurrentFn?: (id: string) => Promise<ProjectTracker>
  ): Promise<ProjectTracker> {
    const operationId = `update_${trackerId}_${Date.now()}`;
    
    return this.retryMechanism.executeWithRetry(
      async () => {
        try {
          return await updateFn(trackerId, updates);
        } catch (error) {
          // Handle conflicts with automatic resolution
          if (this.isConflictError(error) && getCurrentFn) {
            const resolvedUpdates = await this.conflictResolver.resolveConflict(
              trackerId,
              updates,
              getCurrentFn
            );
            return await updateFn(trackerId, resolvedUpdates);
          }
          throw error;
        }
      },
      operationId,
      {
        type: 'update_tracker',
        trackerId,
        data: updates,
        timestamp: Date.now()
      },
      {
        retryCondition: (error, attempt) => {
          // Don't retry validation errors
          if (error?.type === 'validation_error') return false;
          return DEFAULT_RETRY_CONFIG.retryCondition(error, attempt);
        },
        onRetry: (error, attempt) => {
          console.warn(`Retrying tracker update for ${trackerId}, attempt ${attempt}:`, error.message);
        }
      }
    );
  }

  // Delete tracker with retry
  async deleteTracker(
    trackerId: string,
    deleteFn: (id: string) => Promise<void>
  ): Promise<void> {
    const operationId = `delete_${trackerId}_${Date.now()}`;
    
    return this.retryMechanism.executeWithRetry(
      () => deleteFn(trackerId),
      operationId,
      {
        type: 'delete_tracker',
        trackerId,
        timestamp: Date.now()
      },
      {
        onRetry: (error, attempt) => {
          console.warn(`Retrying tracker deletion for ${trackerId}, attempt ${attempt}:`, error.message);
        }
      }
    );
  }

  // Bulk operations with retry
  async bulkUpdateTrackers(
    trackerIds: string[],
    updates: Partial<ProjectTracker>,
    bulkUpdateFn: (ids: string[], data: Partial<ProjectTracker>) => Promise<ProjectTracker[]>
  ): Promise<ProjectTracker[]> {
    const operationId = `bulk_update_${trackerIds.join(',')}_${Date.now()}`;
    
    return this.retryMechanism.executeWithRetry(
      () => bulkUpdateFn(trackerIds, updates),
      operationId,
      {
        type: 'bulk_update',
        trackerIds,
        data: updates,
        timestamp: Date.now()
      },
      {
        maxRetries: 2, // Fewer retries for bulk operations
        onRetry: (error, attempt) => {
          console.warn(`Retrying bulk update for ${trackerIds.length} trackers, attempt ${attempt}:`, error.message);
        }
      }
    );
  }

  // Check if error is a conflict error
  private isConflictError(error: any): boolean {
    return (
      error?.status === 409 ||
      error?.message?.includes('conflict') ||
      error?.type === 'conflict_error'
    );
  }

  // Get retry mechanism stats
  getStats() {
    return this.retryMechanism.getQueueStats();
  }

  // Clear all pending operations
  clearAllOperations() {
    this.retryMechanism.clearQueue();
  }
}

// Conflict resolution for concurrent updates
class ConflictResolver {
  async resolveConflict(
    trackerId: string,
    attemptedUpdates: Partial<ProjectTracker>,
    getCurrentFn: (id: string) => Promise<ProjectTracker>
  ): Promise<Partial<ProjectTracker>> {
    try {
      // Get current state from server
      const currentTracker = await getCurrentFn(trackerId);
      
      // Merge changes intelligently
      const resolvedUpdates = this.mergeUpdates(currentTracker, attemptedUpdates);
      
      console.info(`Resolved conflict for tracker ${trackerId}`, {
        attempted: attemptedUpdates,
        resolved: resolvedUpdates
      });
      
      return resolvedUpdates;
    } catch (error) {
      console.error(`Failed to resolve conflict for tracker ${trackerId}:`, error);
      throw new Error('Conflict resolution failed');
    }
  }

  private mergeUpdates(
    current: ProjectTracker,
    attempted: Partial<ProjectTracker>
  ): Partial<ProjectTracker> {
    const merged = { ...attempted };

    // Resolve date conflicts by taking the latest end date
    if (attempted.endDate && current.endDate) {
      merged.endDate = attempted.endDate > current.endDate ? attempted.endDate : current.endDate;
    }

    // Resolve status conflicts by prioritizing progress
    if (attempted.status && current.status) {
      const statusPriority = { 'not_started': 0, 'in_progress': 1, 'completed': 2 };
      const currentPriority = statusPriority[current.status] || 0;
      const attemptedPriority = statusPriority[attempted.status] || 0;
      
      merged.status = attemptedPriority >= currentPriority ? attempted.status : current.status;
    }

    // Resolve priority conflicts by taking higher priority
    if (attempted.priority && current.priority) {
      const priorityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3 };
      const currentPriority = priorityOrder[current.priority] || 0;
      const attemptedPriority = priorityOrder[attempted.priority] || 0;
      
      merged.priority = attemptedPriority >= currentPriority ? attempted.priority : current.priority;
    }

    return merged;
  }
}

// Hook for using retry mechanisms in React components
export const useRetryMechanism = () => {
  const retryMechanism = React.useMemo(() => new TrackerOperationRetryMechanism(), []);

  const [stats, setStats] = React.useState(retryMechanism.getStats());

  // Update stats periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(retryMechanism.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [retryMechanism]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      retryMechanism.clearAllOperations();
    };
  }, [retryMechanism]);

  return {
    createTracker: retryMechanism.createTracker.bind(retryMechanism),
    updateTracker: retryMechanism.updateTracker.bind(retryMechanism),
    deleteTracker: retryMechanism.deleteTracker.bind(retryMechanism),
    bulkUpdateTrackers: retryMechanism.bulkUpdateTrackers.bind(retryMechanism),
    stats,
    clearAllOperations: retryMechanism.clearAllOperations.bind(retryMechanism)
  };
};