import { Session } from '@supabase/supabase-js';

/**
 * Interface for token information extracted from Supabase session
 */
export interface TokenInfo {
  token: string;
  isValid: boolean;
  expiresAt: Date | null;
  isExpired: boolean;
  userId?: string;
}

/**
 * Interface for copy operation state management
 */
export interface CopyState {
  status: 'idle' | 'copying' | 'success' | 'error';
  message: string;
  timestamp: number;
}

/**
 * Interface for token display data
 */
export interface TokenDisplayData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  isValid: boolean;
  userId: string;
}

/**
 * Extracts and validates token information from a Supabase session
 * @param session - The Supabase session object
 * @returns TokenInfo object or null if session is invalid
 */
export const getTokenInfo = (session: Session | null): TokenInfo | null => {
  if (!session || !session.access_token) {
    return null;
  }

  try {
    // Parse JWT payload to get expiration time
    const tokenParts = session.access_token.split('.');
    if (tokenParts.length !== 3) {
      return {
        token: session.access_token,
        isValid: false,
        expiresAt: null,
        isExpired: true,
        userId: session.user?.id
      };
    }

    // Decode JWT payload (base64url decode)
    const payload = JSON.parse(
      atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
    const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

    return {
      token: session.access_token,
      isValid: !isExpired && !!session.user,
      expiresAt,
      isExpired,
      userId: session.user?.id
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    return {
      token: session.access_token,
      isValid: false,
      expiresAt: null,
      isExpired: true,
      userId: session.user?.id
    };
  }
};

/**
 * Formats a JWT token for display with proper line breaks
 * @param token - The JWT token string
 * @returns Formatted token string
 */
export const formatTokenForDisplay = (token: string): string => {
  if (!token) return '';
  
  // Split JWT into its three parts (header.payload.signature)
  const parts = token.split('.');
  if (parts.length === 3) {
    // Add line breaks between JWT parts for better readability
    return parts.join('.\n');
  }
  
  // Fallback: add line breaks every 80 characters
  return token.replace(/(.{80})/g, '$1\n');
};

/**
 * Copies text to clipboard using modern Clipboard API with fallback
 * @param text - Text to copy to clipboard
 * @returns Promise<boolean> - Success status
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) {
    return false;
  }

  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers or non-secure contexts
    return fallbackCopyToClipboard(text);
  } catch (error) {
    console.error('Clipboard API failed:', error);
    // Try fallback method
    return fallbackCopyToClipboard(text);
  }
};

/**
 * Fallback clipboard copy method for older browsers
 * @param text - Text to copy
 * @returns boolean - Success status
 */
const fallbackCopyToClipboard = (text: string): boolean => {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    // Select and copy the text
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
};

/**
 * Creates initial copy state
 * @returns CopyState object with idle status
 */
export const createInitialCopyState = (): CopyState => ({
  status: 'idle',
  message: '',
  timestamp: Date.now()
});

/**
 * Validates if a token string appears to be a valid JWT format
 * @param token - Token string to validate
 * @returns boolean - Whether token appears to be valid JWT format
 */
export const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

/**
 * Gets user-friendly error messages for token-related errors
 * @param error - Error type or message
 * @returns User-friendly error message
 */
export const getTokenErrorMessage = (error: string | null): string => {
  if (!error) return '';
  
  switch (error.toLowerCase()) {
    case 'no_session':
      return 'Please log in to view your authentication token.';
    case 'invalid_session':
      return 'Your session has expired. Please refresh the page and log in again.';
    case 'token_expired':
      return 'Your token has expired. Please refresh the page to get a new token.';
    case 'network_error':
      return 'Unable to retrieve token. Please check your internet connection.';
    case 'invalid_token':
      return 'Invalid token format detected. Please try refreshing the page.';
    default:
      return 'An error occurred while retrieving your token. Please try again.';
  }
};