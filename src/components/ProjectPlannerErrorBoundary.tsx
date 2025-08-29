import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  isDark?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ProjectPlannerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Project Planner Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      const { isDark = false } = this.props;
      
      return (
        <div className="flex-1 flex items-center justify-center p-8" style={{ 
          backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' 
        }}>
          <div className={`text-center max-w-md ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
              isDark ? 'bg-red-900/20' : 'bg-red-50'
            }`}>
              <AlertTriangle className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            </div>
            
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Something went wrong
            </h3>
            
            <p className="text-sm mb-6">
              The project planner encountered an unexpected error. This has been logged for investigation.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className={`
                  flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${isDark 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                `}
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className={`text-left p-4 rounded-lg text-xs ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
                  <pre className="whitespace-pre-wrap overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}