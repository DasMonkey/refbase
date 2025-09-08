import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DocumentationFile } from '../lib/documentationLoader';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { ErrorMessage } from './ui/ErrorMessage';

interface LoadingState {
  initial: boolean;
  content: boolean;
  refresh: boolean;
}

interface ErrorState {
  message: string | null;
  type: 'network' | 'not-found' | 'parse' | 'unknown' | null;
  retryable: boolean;
}

interface DocumentationSidebarProps {
  documentationFiles: DocumentationFile[];
  groupedDocs: Record<string, DocumentationFile[]>;
  activeDoc: DocumentationFile | null;
  loading: LoadingState;
  error: ErrorState;
  collapsed: boolean;
  onDocSelect: (id: string) => void;
  onToggleCollapse: () => void;
  onRefresh: () => void;
  clearError: () => void;
  isDark: boolean;
}

export const DocumentationSidebar: React.FC<DocumentationSidebarProps> = ({
  documentationFiles,
  groupedDocs,
  activeDoc,
  loading,
  error,
  collapsed,
  onDocSelect,
  onToggleCollapse,
  onRefresh,
  clearError,
  isDark
}) => {
  const handleDocSelect = (id: string) => {
    onDocSelect(id);
    // Auto-collapse on mobile after selection
    if (window.innerWidth < 1024) {
      onToggleCollapse();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggleCollapse}
        />
      )}
      
      <motion.div
        initial={false}
        animate={{ 
          x: collapsed ? -320 : 0,
          width: 320
        }}
        transition={{ 
          duration: 0.3,
          ease: "easeInOut"
        }}
        className={`fixed lg:relative top-0 left-0 h-full z-50 lg:z-auto border-r overflow-hidden ${collapsed ? 'lg:w-0' : 'lg:w-80'}`}
        style={{ 
          backgroundColor: isDark ? '#111111' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }}
      >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between`}
          style={{ 
            borderColor: isDark ? '#374151' : '#e5e7eb',
            minHeight: '72px'
          }}>
          <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Documentation
          </h1>
          
          {/* Mobile collapse button */}
          <button
            onClick={onToggleCollapse}
            className={`lg:hidden p-2 rounded-lg transition-colors w-8 h-8 flex items-center justify-center ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {loading.initial || loading.refresh ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <div className="text-center mb-6">
                  <LoadingSpinner size="md" isDark={isDark} className="mx-auto mb-2" />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {loading.refresh ? 'Refreshing documentation...' : 'Loading documentation...'}
                  </p>
                </div>
                
                {/* Skeleton loading for sidebar items */}
                <div className="space-y-4">
                  <div>
                    <SkeletonLoader variant="title" isDark={isDark} className="mb-2" />
                    <div className="space-y-1">
                      <SkeletonLoader variant="sidebar-item" isDark={isDark} />
                      <SkeletonLoader variant="sidebar-item" isDark={isDark} />
                      <SkeletonLoader variant="sidebar-item" isDark={isDark} />
                    </div>
                  </div>
                  <div>
                    <SkeletonLoader variant="title" isDark={isDark} className="mb-2" />
                    <div className="space-y-1">
                      <SkeletonLoader variant="sidebar-item" isDark={isDark} />
                      <SkeletonLoader variant="sidebar-item" isDark={isDark} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : error.message ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <ErrorMessage
                  title="Error Loading Documentation"
                  message={error.message}
                  isDark={isDark}
                  onRetry={error.retryable ? onRefresh : undefined}
                  onDismiss={clearError}
                  variant="card"
                />
              </motion.div>
            ) : (
              <motion.nav
                key="navigation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 sm:p-4"
              >
                {Object.entries(groupedDocs).map(([category, docs]) => (
                  <div key={category} className="mb-4 sm:mb-6">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-3 px-3 sm:px-0 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {category}
                    </h3>
                    <ul className="space-y-0.5 sm:space-y-1">
                      {docs.map((doc) => (
                        <li key={doc.id}>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDocSelect(doc.id)}
                            className={`w-full text-left px-3 py-2.5 sm:py-2 rounded-lg transition-all duration-200 touch-manipulation ${
                              activeDoc?.id === doc.id
                                ? isDark 
                                  ? 'bg-gray-700 text-white shadow-lg border border-gray-600' 
                                  : 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                                : isDark 
                                  ? 'text-gray-200 hover:bg-gray-700 hover:text-white active:bg-gray-600' 
                                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
                            }`}
                          >
                            <span className="text-sm font-medium block truncate leading-relaxed">
                              {doc.title}
                            </span>
                            {activeDoc?.id === doc.id && (
                              <motion.div
                                layoutId="activeIndicator"
                                className={`w-1 h-4 rounded-full absolute left-0 top-1/2 transform -translate-y-1/2 ${
                                  isDark ? 'bg-blue-400' : 'bg-blue-500'
                                }`}
                              />
                            )}
                          </motion.button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                
                {/* Footer info */}
                {documentationFiles.length > 0 && (
                  <div className={`mt-8 pt-4 border-t text-xs ${
                    isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
                  }`}>
                    <p>{documentationFiles.length} documentation files</p>
                  </div>
                )}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
    </>
  );
};