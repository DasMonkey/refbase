import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Code,
  ExternalLink,
  Shield,
  Clock,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getTokenInfo,
  formatTokenForDisplay,
  copyToClipboard,
  createInitialCopyState,
  getTokenErrorMessage,
  TokenInfo,
  CopyState
} from '../lib/tokenUtils';

interface DeveloperSettingsTabProps {
  isDark: boolean;
  onViewDocs?: () => void;
}

export const DeveloperSettingsTab: React.FC<DeveloperSettingsTabProps> = ({ isDark, onViewDocs }) => {
  const { user, isAuthenticated } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [copyState, setCopyState] = useState<CopyState>(createInitialCopyState());
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get token info when component mounts or user changes
  useEffect(() => {
    const loadTokenInfo = async () => {
      setIsLoading(true);

      if (isAuthenticated && user) {
        try {
          const { supabase } = await import('../lib/supabase');
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Session error:', error);
            // Handle specific error types
            if (error.message.includes('Invalid Refresh Token') ||
              error.message.includes('Refresh Token Not Found')) {
              setTokenError('token_expired');
            } else if (error.message.includes('network') ||
              error.message.includes('fetch')) {
              setTokenError('network_error');
            } else {
              setTokenError('invalid_session');
            }
            setTokenInfo(null);
          } else if (!session) {
            setTokenError('no_session');
            setTokenInfo(null);
          } else {
            const info = getTokenInfo(session);
            if (!info) {
              setTokenError('invalid_token');
              setTokenInfo(null);
            } else {
              setTokenInfo(info);
              setTokenError(null);
            }
          }
        } catch (error) {
          console.error('Error getting token info:', error);
          // Determine error type based on error message
          const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
          if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            setTokenError('network_error');
          } else {
            setTokenError('invalid_session');
          }
          setTokenInfo(null);
        }
      } else {
        setTokenError('no_session');
        setTokenInfo(null);
      }

      setIsLoading(false);
    };

    loadTokenInfo();
  }, [isAuthenticated, user]);

  const handleCopyToken = async (retryCount = 0) => {
    if (!tokenInfo?.token) return;

    setCopyState({ status: 'copying', message: '', timestamp: Date.now() });

    try {
      const success = await copyToClipboard(tokenInfo.token);

      if (success) {
        // Provide haptic feedback on mobile devices
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        setCopyState({
          status: 'success',
          message: 'Token copied to clipboard!',
          timestamp: Date.now()
        });

        // Reset status after 3 seconds
        setTimeout(() => {
          setCopyState(createInitialCopyState());
        }, 3000);
      } else {
        // Retry once if it's the first attempt
        if (retryCount === 0) {
          setTimeout(() => handleCopyToken(1), 500);
          return;
        }

        setCopyState({
          status: 'error',
          message: 'Failed to copy token. Please select and copy manually.',
          timestamp: Date.now()
        });

        // Reset error state after 5 seconds
        setTimeout(() => {
          setCopyState(createInitialCopyState());
        }, 5000);
      }
    } catch (error) {
      console.error('Copy error:', error);

      // Retry once if it's the first attempt
      if (retryCount === 0) {
        setTimeout(() => handleCopyToken(1), 500);
        return;
      }

      setCopyState({
        status: 'error',
        message: 'Copy operation failed. Please try again.',
        timestamp: Date.now()
      });

      // Reset error state after 5 seconds
      setTimeout(() => {
        setCopyState(createInitialCopyState());
      }, 5000);
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    setTokenError(null);

    try {
      const { supabase } = await import('../lib/supabase');

      // First try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.warn('Session refresh failed, trying getSession:', refreshError);
        // Fallback to getSession
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('GetSession error:', error);
          if (error.message.includes('Invalid Refresh Token') ||
            error.message.includes('Refresh Token Not Found')) {
            setTokenError('token_expired');
          } else if (error.message.includes('network') ||
            error.message.includes('fetch')) {
            setTokenError('network_error');
          } else {
            setTokenError('invalid_session');
          }
          setTokenInfo(null);
        } else if (!session) {
          setTokenError('no_session');
          setTokenInfo(null);
        } else {
          const info = getTokenInfo(session);
          if (!info) {
            setTokenError('invalid_token');
            setTokenInfo(null);
          } else {
            setTokenInfo(info);
            setTokenError(null);
          }
        }
      } else {
        // Use refreshed session
        const info = getTokenInfo(refreshedSession);
        if (!info) {
          setTokenError('invalid_token');
          setTokenInfo(null);
        } else {
          setTokenInfo(info);
          setTokenError(null);
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setTokenError('network_error');
      } else {
        setTokenError('invalid_session');
      }
      setTokenInfo(null);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatExpirationTime = (expiresAt: Date | null): string => {
    if (!expiresAt) return 'Unknown';

    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
      return 'Expired';
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m remaining`;
    } else {
      return 'Expires soon';
    }
  };

  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div 
          className={`p-6 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg text-center`}
          role="status"
          aria-live="polite"
        >
          <User 
            size={48} 
            className={`mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            aria-hidden="true"
          />
          <h3 
            className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}
            id="auth-required-heading"
          >
            Authentication Required
          </h3>
          <p 
            className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            aria-describedby="auth-required-heading"
          >
            Please log in to view your authentication token for MCP tool configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Header */}
      <div className="px-1 sm:px-0">
        <h3 
          id="developer-settings-heading"
          className={`text-lg sm:text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-3`}
        >
          Developer Settings
        </h3>
        <p 
          className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          aria-describedby="developer-settings-heading"
        >
          Access your authentication token for MCP (Model Context Protocol) tool integration with IDEs like Kiro, Cursor, and Claude Code.
        </p>
      </div>

      {/* Instructions */}
      <div 
        className={`p-4 sm:p-5 border ${isDark ? 'border-blue-600/30 bg-blue-900/10' : 'border-blue-200 bg-blue-50'} rounded-lg`}
        role="region"
        aria-labelledby="mcp-instructions-heading"
      >
        <div className="flex items-start space-x-3 sm:space-x-4">
          <Code 
            size={20} 
            className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h4 
              id="mcp-instructions-heading"
              className={`font-semibold text-base ${isDark ? 'text-blue-400' : 'text-blue-800'} mb-3`}
            >
              MCP Tool Configuration
            </h4>
            <div className={`text-sm leading-relaxed ${isDark ? 'text-blue-300' : 'text-blue-700'} space-y-3`}>
              <p>Use this token to configure MCP tools in your IDE:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2 sm:ml-4" role="list">
                <li className="pl-1">Copy your authentication token below</li>
                <li className="pl-1">Add it to your MCP server configuration</li>
                <li className="break-words pl-1">
                  Use the RefBase API base URL: 
                  <br className="sm:hidden" />
                  <code className={`px-2 py-1 rounded text-xs font-mono mt-1 inline-block ${isDark ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                    https://refbase.dev/api
                  </code>
                </li>
                <li className="break-words pl-1">
                  Include the token in the Authorization header: 
                  <br className="sm:hidden" />
                  <code className={`px-2 py-1 rounded text-xs font-mono mt-1 inline-block ${isDark ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                    Bearer YOUR_TOKEN
                  </code>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Token Display */}
      {tokenError ? (
        <div 
          className={`p-4 border ${isDark ? 'border-red-600/30 bg-red-900/10' : 'border-red-200 bg-red-50'} rounded-lg`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle 
              size={20} 
              className={`mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`}
              aria-hidden="true"
            />
            <div className="flex-1">
              <h4 
                className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-800'} mb-1`}
                id="token-error-heading"
              >
                Token Unavailable
              </h4>
              <p 
                className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'} mb-3`}
                aria-describedby="token-error-heading"
              >
                {getTokenErrorMessage(tokenError)}
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={handleRefreshToken}
                  disabled={isRefreshing}
                  className={`flex items-center justify-center px-4 py-3 sm:py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto min-h-[44px] touch-manipulation ${isDark
                    ? 'bg-red-800 hover:bg-red-700 active:bg-red-900 text-red-100 focus:ring-red-500'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span className="font-medium">
                    {isRefreshing ? 'Refreshing...' : 'Retry'}
                  </span>
                </button>

                {tokenError === 'token_expired' && (
                  <button
                    onClick={() => window.location.reload()}
                    aria-label="Re-authenticate to get a new token"
                    className={`flex items-center justify-center px-4 py-3 sm:py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto min-h-[44px] touch-manipulation ${isDark
                      ? 'bg-blue-800 hover:bg-blue-700 active:bg-blue-900 text-blue-100 focus:ring-blue-500'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500'
                      }`}
                  >
                    <User size={16} className="mr-2" aria-hidden="true" />
                    <span className="font-medium">Re-authenticate</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : tokenInfo ? (
        <div className="space-y-4">
          {/* Token Status */}
          <div className={`p-4 sm:p-5 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h4 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Authentication Token
              </h4>
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                {tokenInfo.expiresAt && (
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className={`flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm font-medium ${tokenInfo.isExpired
                      ? 'text-red-500'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      {formatExpirationTime(tokenInfo.expiresAt)}
                    </span>
                  </div>
                )}
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium self-start sm:self-auto ${tokenInfo.isValid && !tokenInfo.isExpired
                  ? isDark ? 'bg-green-900/30 text-green-400 border border-green-600/30' : 'bg-green-100 text-green-800 border border-green-200'
                  : isDark ? 'bg-red-900/30 text-red-400 border border-red-600/30' : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                  {tokenInfo.isValid && !tokenInfo.isExpired ? 'Valid' : 'Invalid'}
                </div>
              </div>
            </div>

            {/* Token Display */}
            <div className="relative">
              <div 
                className={`p-3 sm:p-4 border ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} rounded-lg cursor-pointer select-all touch-manipulation`}
                role="textbox"
                aria-readonly="true"
                aria-label="Authentication token - tap to select all text"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCopyToken();
                  }
                }}
                onClick={(e) => {
                  // On mobile, select all text when tapped
                  if (window.getSelection) {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                  }
                }}
              >
                <pre 
                  className={`text-xs sm:text-sm font-mono whitespace-pre-wrap break-all leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  aria-label="JWT authentication token"
                >
                  {formatTokenForDisplay(tokenInfo.token)}
                </pre>
              </div>

              {/* Copy Button */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <button
                  onClick={() => handleCopyToken()}
                  disabled={copyState.status === 'copying'}
                  aria-describedby="copy-status-message"
                  aria-label={`Copy authentication token to clipboard. Status: ${
                    copyState.status === 'copying' ? 'Copying in progress' :
                    copyState.status === 'success' ? 'Successfully copied' :
                    copyState.status === 'error' ? 'Copy failed' :
                    'Ready to copy'
                  }`}
                  className={`flex items-center justify-center px-4 py-3 sm:py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto min-h-[44px] touch-manipulation ${copyState.status === 'success'
                    ? isDark ? 'bg-green-900/30 text-green-400 focus:ring-green-500' : 'bg-green-100 text-green-800 focus:ring-green-500'
                    : copyState.status === 'error'
                      ? isDark ? 'bg-red-900/30 text-red-400 focus:ring-red-500' : 'bg-red-100 text-red-800 focus:ring-red-500'
                      : isDark ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copyState.status === 'copying' ? (
                    <RefreshCw size={18} className="mr-2 animate-spin" aria-hidden="true" />
                  ) : copyState.status === 'success' ? (
                    <Check size={18} className="mr-2" aria-hidden="true" />
                  ) : (
                    <Copy size={18} className="mr-2" aria-hidden="true" />
                  )}
                  <span className="font-medium">
                    {copyState.status === 'copying' ? 'Copying...' :
                      copyState.status === 'success' ? 'Copied!' :
                        'Copy Token'}
                  </span>
                </button>

                {copyState.message && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="copy-status-message"
                    role="status"
                    aria-live="polite"
                    className={`text-sm leading-relaxed ${copyState.status === 'success'
                      ? isDark ? 'text-green-400' : 'text-green-600'
                      : isDark ? 'text-red-400' : 'text-red-600'
                      }`}
                  >
                    {copyState.message}
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          {/* Security Warning */}
          <div 
            className={`p-4 border ${isDark ? 'border-yellow-600/30 bg-yellow-900/10' : 'border-yellow-200 bg-yellow-50'} rounded-lg`}
            role="region"
            aria-labelledby="security-notice-heading"
          >
            <div className="flex items-start space-x-3">
              <Shield 
                size={20} 
                className={`mt-0.5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}
                aria-hidden="true"
              />
              <div>
                <h4 
                  id="security-notice-heading"
                  className={`font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-800'} mb-2`}
                >
                  Security Notice
                </h4>
                <ul 
                  className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'} space-y-1 list-disc list-inside`}
                  role="list"
                >
                  <li>Keep this token confidential and secure</li>
                  <li>Do not share it publicly or commit it to version control</li>
                  <li>The token provides access to your RefBase account</li>
                  <li>If compromised, refresh your session to invalidate it</li>
                </ul>
              </div>
            </div>
          </div>

          {/* API Documentation Link */}
          <div className={`p-3 sm:p-4 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  API Documentation
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Learn more about RefBase API endpoints and usage
                </p>
              </div>
              <button
                onClick={onViewDocs}
                aria-label="View RefBase API documentation"
                className={`flex items-center justify-center px-4 py-3 sm:py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto min-h-[44px] touch-manipulation ${isDark
                  ? 'bg-gray-600 hover:bg-gray-500 active:bg-gray-700 text-gray-200 focus:ring-gray-500'
                  : 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 focus:ring-gray-500'
                  }`}
              >
                <span className="font-medium">View Docs</span>
                <ExternalLink size={16} className="ml-2" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        // Loading state
        <div className={`p-6 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg text-center`}>
          <RefreshCw size={24} className={`mx-auto mb-2 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading token information...
          </p>
        </div>
      ) : (
        // Fallback state (should not happen)
        <div className={`p-6 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg text-center`}>
          <AlertTriangle size={24} className={`mx-auto mb-2 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Unable to load token information. Please refresh the page.
          </p>
        </div>
      )}
    </div>
  );
};