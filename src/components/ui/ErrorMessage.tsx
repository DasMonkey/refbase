import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorMessageProps {
  title?: string;
  message: string;
  isDark?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'card' | 'banner';
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  isDark = false,
  onRetry,
  onDismiss,
  variant = 'card',
  className = ''
}) => {
  const baseClasses = `flex items-start space-x-3 ${
    isDark ? 'text-red-300' : 'text-red-700'
  }`;

  const variantClasses = {
    inline: `p-3 rounded-lg border ${
      isDark 
        ? 'border-red-600/30 bg-red-900/10' 
        : 'border-red-200 bg-red-50'
    }`,
    card: `p-4 rounded-lg border shadow-sm ${
      isDark 
        ? 'border-red-600/30 bg-red-900/10' 
        : 'border-red-200 bg-red-50'
    }`,
    banner: `p-4 border-l-4 ${
      isDark 
        ? 'border-red-500 bg-red-900/10' 
        : 'border-red-500 bg-red-50'
    }`
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${variantClasses[variant]} ${className}`}
    >
      <div className={baseClasses}>
        <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
          isDark ? 'text-red-400' : 'text-red-600'
        }`} />
        
        <div className="min-w-0 flex-1">
          <h4 className={`font-semibold ${
            isDark ? 'text-red-400' : 'text-red-800'
          } mb-1`}>
            {title}
          </h4>
          
          <p className={`text-sm ${
            isDark ? 'text-red-300' : 'text-red-700'
          } leading-relaxed`}>
            {message}
          </p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className={`inline-flex items-center mt-3 text-sm font-medium underline transition-colors ${
                isDark 
                  ? 'text-red-300 hover:text-red-200' 
                  : 'text-red-700 hover:text-red-800'
              }`}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Try again
            </button>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`p-1 rounded transition-colors ${
              isDark 
                ? 'hover:bg-red-800/50 text-red-400 hover:text-red-300' 
                : 'hover:bg-red-100 text-red-600 hover:text-red-700'
            }`}
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};