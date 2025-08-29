import React, { Component, ReactNode, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectTracker } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  CheckCircle,
  X
} from 'lucide-react';

// Error types for timeline operations
export type TimelineErrorType = 
  | 'drag_failed'
  | 'resize_failed'
  | 'network_error'
  | 'validation_error'
  | 'database_error'
  | 'permission_error'
  | 'conflict_error'
  | 'timeout_error';

export interface TimelineError {
  id: string;
  type: TimelineErrorType;
  message: string;
  details?: string;
  trackerId?: string;
  trackerTitle?: string;
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface ErrorState {
  errors: TimelineError[];
  isRetrying: boolean;
  lastError?: TimelineError;
}

// Error boundary component for timeline
interface TimelineErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface TimelineErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isDark?: boolean;
}

export class TimelineErrorBoundary extends Component<
  TimelineErrorBoundaryProps,
  TimelineErrorBoundaryState
> {
  constructor(props: TimelineErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TimelineErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Timeline Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <TimelineErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          isDark={this.props.isDark}
        />
      );
    }

    return this.props.children;
  }
}

// Error fallback UI
interface TimelineErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
  isDark?: boolean;
}

const TimelineErrorFallback: React.FC<TimelineErrorFallbackProps> = ({
  error,
  onRetry,
  isDark = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex-1 flex items-center justify-center p-8
        ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}
      `}
    >
      <div className="text-center max-w-md">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <AlertTriangle 
            size={48} 
            className={`mx-auto ${isDark ? 'text-red-400' : 'text-red-500'}`} 
          />
        </motion.div>
        
        <h3 className="text-xl font-semibold mb-2">Timeline Error</h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Something went wrong with the timeline. This might be due to a network issue or data problem.
        </p>
        
        {error && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm font-medium mb-2">
              Error Details
            </summary>
            <pre className={`
              text-xs p-3 rounded-lg overflow-auto
              ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}
            `}>
              {error.message}
            </pre>
          </details>
        )}
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className={`
            px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto
            ${isDark 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
          `}
        >
          <RefreshCw size={16} />
          <span>Try Again</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

// Drag operation error handler
export interface DragErrorHandlerOptions {
  maxRetries: number;
  retryDelay: number;
  rollbackOnFailure: boolean;
  showUserFeedback: boolean;
}

export class DragOperationErrorHandler {
  private errors: Map<string, TimelineError> = new Map();
  private rollbackData: Map<string, { tracker: ProjectTracker; originalLane: number }> = new Map();
  private options: DragErrorHandlerOptions;

  constructor(options: Partial<DragErrorHandlerOptions> = {}) {
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      rollbackOnFailure: true,
      showUserFeedback: true,
      ...options
    };
  }

  // Store original state before drag operation
  storeDragState(trackerId: string, tracker: ProjectTracker, originalLane: number) {
    this.rollbackData.set(trackerId, { tracker: { ...tracker }, originalLane });
  }

  // Handle drag operation error
  async handleDragError(
    trackerId: string,
    error: Error,
    operation: 'move' | 'resize',
    onRollback?: (tracker: ProjectTracker, lane: number) => void,
    onRetry?: () => Promise<void>
  ): Promise<boolean> {
    const errorId = `${operation}_${trackerId}_${Date.now()}`;
    const rollbackData = this.rollbackData.get(trackerId);
    
    const timelineError: TimelineError = {
      id: errorId,
      type: operation === 'move' ? 'drag_failed' : 'resize_failed',
      message: `Failed to ${operation} tracker`,
      details: error.message,
      trackerId,
      trackerTitle: rollbackData?.tracker.title,
      timestamp: new Date(),
      recoverable: true,
      retryCount: 0,
      maxRetries: this.options.maxRetries
    };

    this.errors.set(errorId, timelineError);

    // Immediate rollback if enabled
    if (this.options.rollbackOnFailure && rollbackData && onRollback) {
      console.warn(`Rolling back ${operation} operation for tracker ${trackerId}`);
      onRollback(rollbackData.tracker, rollbackData.originalLane);
    }

    // Attempt retry if available
    if (onRetry && timelineError.retryCount < timelineError.maxRetries) {
      return await this.retryOperation(errorId, onRetry);
    }

    return false;
  }

  // Retry operation with exponential backoff
  private async retryOperation(errorId: string, retryFn: () => Promise<void>): Promise<boolean> {
    const error = this.errors.get(errorId);
    if (!error) return false;

    error.retryCount++;
    this.errors.set(errorId, error);

    const delay = this.options.retryDelay * Math.pow(2, error.retryCount - 1);
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      await retryFn();
      
      // Success - remove error
      this.errors.delete(errorId);
      return true;
    } catch (retryError) {
      console.error(`Retry ${error.retryCount} failed for ${errorId}:`, retryError);
      
      if (error.retryCount >= error.maxRetries) {
        error.recoverable = false;
        this.errors.set(errorId, error);
      }
      
      return false;
    }
  }

  // Clean up completed operations
  clearDragState(trackerId: string) {
    this.rollbackData.delete(trackerId);
    // Remove related errors
    for (const [errorId, error] of this.errors) {
      if (error.trackerId === trackerId) {
        this.errors.delete(errorId);
      }
    }
  }

  // Get current errors
  getErrors(): TimelineError[] {
    return Array.from(this.errors.values());
  }

  // Clear all errors
  clearAllErrors() {
    this.errors.clear();
    this.rollbackData.clear();
  }
}

// Network error handler
export class NetworkErrorHandler {
  private retryQueue: Array<{
    id: string;
    operation: () => Promise<void>;
    retries: number;
    maxRetries: number;
  }> = [];

  private isOnline = navigator.onLine;
  private listeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners(true);
    this.processRetryQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners(false);
  };

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline));
  }

  // Add network status listener
  onNetworkChange(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Handle network error with retry
  async handleNetworkError<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries = 3
  ): Promise<T> {
    if (!this.isOnline) {
      throw new Error('No network connection');
    }

    try {
      return await operation();
    } catch (error) {
      if (this.isNetworkError(error)) {
        return this.addToRetryQueue(operation, operationId, maxRetries);
      }
      throw error;
    }
  }

  private isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('NetworkError') ||
        error.name === 'NetworkError'
      );
    }
    return false;
  }

  private async addToRetryQueue<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const retryItem = {
        id: operationId,
        operation: async () => {
          try {
            const result = await operation();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        retries: 0,
        maxRetries
      };

      this.retryQueue.push(retryItem);
      
      if (this.isOnline) {
        this.processRetryQueue();
      }
    });
  }

  private async processRetryQueue() {
    while (this.retryQueue.length > 0 && this.isOnline) {
      const item = this.retryQueue[0];
      
      try {
        await item.operation();
        this.retryQueue.shift(); // Remove successful operation
      } catch (error) {
        item.retries++;
        
        if (item.retries >= item.maxRetries) {
          this.retryQueue.shift(); // Remove failed operation
          console.error(`Operation ${item.id} failed after ${item.maxRetries} retries`);
        } else {
          // Move to end of queue for next retry
          this.retryQueue.push(this.retryQueue.shift()!);
          
          // Wait before next retry
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, item.retries) * 1000)
          );
        }
      }
    }
  }

  // Get current network status
  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.retryQueue.length
    };
  }

  // Cleanup
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.retryQueue.length = 0;
    this.listeners.length = 0;
  }
}

// Error notification component
interface ErrorNotificationProps {
  errors: TimelineError[];
  onDismiss: (errorId: string) => void;
  onRetry?: (errorId: string) => void;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  errors,
  onDismiss,
  onRetry
}) => {
  const { isDark } = useTheme();

  const getErrorIcon = (type: TimelineErrorType) => {
    switch (type) {
      case 'network_error':
        return <WifiOff size={16} />;
      case 'validation_error':
        return <AlertCircle size={16} />;
      case 'permission_error':
        return <XCircle size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  const getErrorColor = (type: TimelineErrorType) => {
    switch (type) {
      case 'validation_error':
        return isDark ? 'bg-yellow-900 border-yellow-700 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'permission_error':
        return isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800';
      case 'network_error':
        return isDark ? 'bg-orange-900 border-orange-700 text-orange-200' : 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {errors.map((error) => (
          <motion.div
            key={error.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`
              p-4 rounded-lg border shadow-lg
              ${getErrorColor(error.type)}
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getErrorIcon(error.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1">
                  {error.trackerTitle && `${error.trackerTitle}: `}
                  {error.message}
                </h4>
                
                {error.details && (
                  <p className="text-xs opacity-80 mb-2">
                    {error.details}
                  </p>
                )}
                
                {error.retryCount > 0 && (
                  <p className="text-xs opacity-60">
                    Retry attempt {error.retryCount}/{error.maxRetries}
                  </p>
                )}
                
                {error.recoverable && onRetry && (
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => onRetry(error.id)}
                      className="text-xs underline opacity-80 hover:opacity-100"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => onDismiss(error.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Network status indicator
export const NetworkStatusIndicator: React.FC = () => {
  const { isDark } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      
      // Hide message after 5 seconds
      setTimeout(() => setShowOfflineMessage(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(!isOnline || showOfflineMessage) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`
            fixed top-4 left-1/2 transform -translate-x-1/2 z-50
            px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2
            ${isOnline 
              ? (isDark ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800')
              : (isDark ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800')
            }
          `}
        >
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span className="text-sm font-medium">
            {isOnline ? 'Back online' : 'No internet connection'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};