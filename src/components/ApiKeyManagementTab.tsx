import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Shield,
  User,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  scopes: string[];
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface ApiKeyManagementTabProps {
  isDark: boolean;
}

export const ApiKeyManagementTab: React.FC<ApiKeyManagementTabProps> = ({ isDark }) => {
  const { user, isAuthenticated } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{
    name: string;
    permissions: string[];
    scopes: string[];
    expiresInDays: number | null;
  }>({
    name: '',
    permissions: ['read', 'write'],
    scopes: ['conversations', 'bugs', 'features', 'documents'],
    expiresInDays: null
  });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{
    key: string;
    keyData: ApiKey;
  } | null>(null);
  const [copyStatus, setCopyStatus] = useState<{
    keyId: string;
    status: 'idle' | 'copying' | 'success' | 'error';
    message: string;
  }>({ keyId: '', status: 'idle', message: '' });
  const [showFullKey, setShowFullKey] = useState(false);

  // Load API keys
  useEffect(() => {
    if (isAuthenticated && user) {
      loadApiKeys();
    }
  }, [isAuthenticated, user]);

  const loadApiKeys = async (retryCount = 0) => {
    try {
      setIsLoading(true);
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshedSession?.access_token) {
          setError('Authentication required. Please try signing out and signing back in.');
          return;
        }
      }

      const currentSession = session?.access_token ? session : await supabase.auth.getSession().then(res => res.data.session);
      
      if (!currentSession?.access_token) {
        setError('Unable to authenticate. Please try refreshing the page.');
        return;
      }

      const response = await fetch('https://refbase.dev/api/api-keys', {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 && retryCount < 2) {
        // Try to refresh session and retry
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && newSession?.access_token) {
          return loadApiKeys(retryCount + 1);
        }
      }

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please try signing out and back in.');
        }
        throw new Error(result.error || `HTTP ${response.status}: Failed to load API keys`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to load API keys');
      }

      setApiKeys(result.data || []);
      setError(null);
    } catch (error) {
      console.error('Error loading API keys:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Failed to load API keys. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      setIsCreating(true);
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('https://refbase.dev/api/api-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newKeyData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create API key');
      }

      // Store the newly created key data temporarily
      setNewlyCreatedKey({
        key: result.data.key,
        keyData: result.data
      });

      // Refresh the list
      await loadApiKeys();

      // Reset form
      setNewKeyData({
        name: '',
        permissions: ['read', 'write'],
        scopes: ['conversations', 'bugs', 'features', 'documents'],
        expiresInDays: null
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`https://refbase.dev/api/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete API key');
      }

      // Refresh the list
      await loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete API key');
    }
  };

  const toggleApiKey = async (keyId: string, currentStatus: boolean) => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`https://refbase.dev/api/api-keys/${keyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update API key');
      }

      // Refresh the list
      await loadApiKeys();
    } catch (error) {
      console.error('Error updating API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to update API key');
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    setCopyStatus({ keyId, status: 'copying', message: '' });

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopyStatus({
        keyId,
        status: 'success',
        message: 'Copied to clipboard!'
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setCopyStatus({ keyId: '', status: 'idle', message: '' });
      }, 3000);
    } catch {
      setCopyStatus({
        keyId,
        status: 'error',
        message: 'Failed to copy'
      });

      // Reset after 5 seconds
      setTimeout(() => {
        setCopyStatus({ keyId: '', status: 'idle', message: '' });
      }, 5000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div 
          className={`p-6 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg text-center`}
        >
          <User size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            Authentication Required
          </h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Please log in to manage your API keys for MCP tool configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Header */}
      <div className="px-1 sm:px-0">
        <h3 className={`text-lg sm:text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-3`}>
          API Key Management
        </h3>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Create permanent API keys for MCP (Model Context Protocol) tool integration. These keys don't expire and work independently of your login session.
        </p>
      </div>


      {/* Error Message */}
      {error && (
        <div className={`p-4 border ${isDark ? 'border-red-600/30 bg-red-900/10' : 'border-red-200 bg-red-50'} rounded-lg`}>
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className={`mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <div className="flex-1">
              <h4 className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-800'} mb-1`}>
                Error
              </h4>
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                {error}
              </p>
              <div className="mt-3 flex items-center space-x-3">
                <button
                  onClick={() => {
                    setError(null);
                    loadApiKeys();
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-red-800 hover:bg-red-700 text-red-100' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  Try Again
                </button>
                <button
                  onClick={() => setError(null)}
                  className={`text-sm underline ${isDark ? 'text-red-300 hover:text-red-200' : 'text-red-700 hover:text-red-800'}`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Newly Created Key Display */}
      {newlyCreatedKey && (
        <div className={`p-4 border ${isDark ? 'border-green-600/30 bg-green-900/10' : 'border-green-200 bg-green-50'} rounded-lg`}>
          <div className="flex items-start space-x-3">
            <Key size={20} className={`mt-0.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-800'} mb-2`}>
                API Key Created Successfully!
              </h4>
              <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'} mb-3`}>
                Save this key now - it will never be shown again for security reasons.
              </p>
              
              <div className={`p-3 border ${isDark ? 'border-green-600/30 bg-green-900/20' : 'border-green-300 bg-green-100'} rounded-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                    {newlyCreatedKey.keyData.name}
                  </span>
                  <button
                    onClick={() => setShowFullKey(!showFullKey)}
                    className={`p-1 rounded hover:bg-green-600/20 ${isDark ? 'text-green-300' : 'text-green-700'}`}
                  >
                    {showFullKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <div className={`p-2 ${isDark ? 'bg-green-900/40' : 'bg-green-50'} rounded font-mono text-sm break-all`}>
                  {showFullKey ? newlyCreatedKey.key : `${newlyCreatedKey.key.substring(0, 12)}${'*'.repeat(32)}`}
                </div>
                
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey.key, 'new-key')}
                  disabled={copyStatus.keyId === 'new-key' && copyStatus.status === 'copying'}
                  className={`mt-3 flex items-center justify-center px-4 py-2 text-sm rounded-lg transition-colors w-full ${
                    copyStatus.keyId === 'new-key' && copyStatus.status === 'success'
                      ? isDark ? 'bg-green-800 text-green-200' : 'bg-green-200 text-green-800'
                      : isDark ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {copyStatus.keyId === 'new-key' && copyStatus.status === 'copying' ? (
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                  ) : copyStatus.keyId === 'new-key' && copyStatus.status === 'success' ? (
                    <Check size={16} className="mr-2" />
                  ) : (
                    <Copy size={16} className="mr-2" />
                  )}
                  {copyStatus.keyId === 'new-key' && copyStatus.status === 'copying' ? 'Copying...' :
                    copyStatus.keyId === 'new-key' && copyStatus.status === 'success' ? 'Copied!' :
                      'Copy API Key'}
                </button>
              </div>
              
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className={`mt-3 text-sm underline ${isDark ? 'text-green-300 hover:text-green-200' : 'text-green-700 hover:text-green-800'}`}
              >
                I've saved the key, dismiss this message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Key Button */}
      <div className="flex justify-between items-center">
        <h4 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Your API Keys
        </h4>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
          className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
            isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50`}
        >
          <Plus size={16} className="mr-2" />
          Create API Key
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className={`p-4 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
          <h5 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            Create New API Key
          </h5>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Name
              </label>
              <input
                type="text"
                value={newKeyData.name}
                onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                placeholder="e.g., MCP Tool - Claude Code"
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDark 
                    ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={createApiKey}
                disabled={!newKeyData.name.trim() || isCreating}
                className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                  isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50`}
              >
                {isCreating ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}
                {isCreating ? 'Creating...' : 'Create Key'}
              </button>
              
              <button
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      {isLoading ? (
        <div className={`p-6 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg text-center`}>
          <RefreshCw size={24} className={`mx-auto mb-2 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading API keys...
          </p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className={`p-6 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg text-center`}>
          <Key size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            No API Keys
          </h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Create your first API key to start using MCP tools with RefBase.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Create API Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className={`p-4 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h5 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {apiKey.name}
                  </h5>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {apiKey.key_prefix}{'*'.repeat(32)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    apiKey.is_active
                      ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                      : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                  }`}>
                    {apiKey.is_active ? 'Active' : 'Inactive'}
                  </div>
                  
                  <button
                    onClick={() => toggleApiKey(apiKey.id, apiKey.is_active)}
                    className={`p-1 rounded hover:bg-gray-600/20 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    title={apiKey.is_active ? 'Deactivate key' : 'Activate key'}
                  >
                    <RefreshCw size={16} />
                  </button>
                  
                  <button
                    onClick={() => deleteApiKey(apiKey.id)}
                    className={`p-1 rounded hover:bg-red-600/20 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                    title="Delete key"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className={`block font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Created
                  </span>
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatDate(apiKey.created_at)}
                  </span>
                </div>
                
                <div>
                  <span className={`block font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Last Used
                  </span>
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {apiKey.last_used_at ? formatDate(apiKey.last_used_at) : 'Never'}
                  </span>
                </div>
                
                <div>
                  <span className={`block font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Usage
                  </span>
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {apiKey.usage_count} requests
                  </span>
                </div>
                
                <div>
                  <span className={`block font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expires
                  </span>
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {apiKey.expires_at ? formatDate(apiKey.expires_at) : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Warning */}
      <div className={`p-4 border ${isDark ? 'border-yellow-600/30 bg-yellow-900/10' : 'border-yellow-200 bg-yellow-50'} rounded-lg`}>
        <div className="flex items-start space-x-3">
          <Shield size={20} className={`mt-0.5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
          <div>
            <h4 className={`font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-800'} mb-2`}>
              Security Notice
            </h4>
            <ul className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'} space-y-1 list-disc list-inside`}>
              <li>API keys are permanent and don't expire (unless you set an expiration)</li>
              <li>Keep your API keys confidential and secure</li>
              <li>Don't share them publicly or commit them to version control</li>
              <li>Deactivate or delete compromised keys immediately</li>
              <li>Monitor usage regularly to detect unauthorized access</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};