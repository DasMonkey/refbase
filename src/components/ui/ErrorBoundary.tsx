import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isDark?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { isDark = false } = this.props;

      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md mx-auto">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-red-900/20' : 'bg-red-50'
            }`}>
              <AlertTriangle className={`w-8 h-8 ${
                isDark ? 'text-red-400' : 'text-red-500'
              }`} />
            </div>
            
            <h3 className={`text-xl font-semibold mb-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Something went wrong
            </h3>
            
            <p className={`text-sm mb-6 leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              An unexpected error occurred while rendering this component. 
              Please try refreshing the page or contact support if the problem persists.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={`text-left mb-6 p-4 rounded-lg border ${
                isDark 
                  ? 'border-red-600/30 bg-red-900/10' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <summary className={`cursor-pointer font-medium ${
                  isDark ? 'text-red-400' : 'text-red-700'
                }`}>
                  Error Details
                </summary>
                <pre className={`mt-2 text-xs overflow-auto ${
                  isDark ? 'text-red-300' : 'text-red-600'
                }`}>
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
            
            <button
              onClick={this.handleRetry}
              className={`inline-flex items-center px-6 py-2.5 rounded-lg font-medium transition-colors ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}