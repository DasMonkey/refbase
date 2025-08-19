import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { testSupabaseConnection } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

export const ConnectionStatus: React.FC = () => {
  // Hide the connection status from users - this is for internal use only
  return null;
  
  const { isDark } = useTheme();
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    error: string | null;
    loading: boolean;
  }>({
    connected: false,
    error: null,
    loading: true,
  });

  const checkConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await testSupabaseConnection();
      setConnectionStatus({
        connected: result.connected,
        error: result.error,
        loading: false,
      });
    } catch (err) {
      setConnectionStatus({
        connected: false,
        error: 'Connection test failed',
        loading: false,
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const getStatusIcon = () => {
    if (connectionStatus.loading) {
      return <RefreshCw size={16} className="animate-spin text-blue-500" />;
    }
    
    if (connectionStatus.connected) {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    
    return <XCircle size={16} className="text-red-500" />;
  };

  const getStatusText = () => {
    if (connectionStatus.loading) {
      return 'Testing connection...';
    }
    
    if (connectionStatus.connected) {
      return 'Supabase Connected';
    }
    
    return 'Supabase Disconnected';
  };

  const getStatusColor = () => {
    if (connectionStatus.loading) {
      return 'text-blue-600';
    }
    
    if (connectionStatus.connected) {
      return 'text-green-600';
    }
    
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-4 right-4 z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg p-4 max-w-sm`}
    >
      <div className="flex items-center space-x-3">
        <Database size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          {connectionStatus.error && (
            <div className="mt-2">
              <div className="flex items-start space-x-2">
                <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {connectionStatus.error}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    Make sure your Supabase environment variables are set correctly.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {!connectionStatus.connected && !connectionStatus.loading && (
            <div className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Required environment variables:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          )}
        </div>
        
        <button
          onClick={checkConnection}
          disabled={connectionStatus.loading}
          className={`p-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors disabled:opacity-50`}
          title="Retry connection"
        >
          <RefreshCw size={16} className={connectionStatus.loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </motion.div>
  );
};