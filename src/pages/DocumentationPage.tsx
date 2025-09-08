import React, { useState } from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useDocumentation } from '../hooks/useDocumentation';
import { DocumentationSidebar } from '../components/DocumentationSidebar';
import { DocumentationContent } from '../components/DocumentationContent';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

interface DocumentationPageProps {
  onBack?: () => void;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ onBack }) => {
  const { isDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { 
    documentationFiles, 
    groupedDocs, 
    activeDoc, 
    loading, 
    error, 
    loadDocumentation, 
    refreshDocumentation,
    clearError
  } = useDocumentation();

  return (
    <ErrorBoundary isDark={isDark}>
      <div className={`h-screen flex overflow-hidden relative`} style={{ backgroundColor: isDark ? '#09090b' : '#f9fafb' }}>
        {/* Sidebar */}
        <ErrorBoundary isDark={isDark}>
          <DocumentationSidebar
            documentationFiles={documentationFiles}
            groupedDocs={groupedDocs}
            activeDoc={activeDoc}
            loading={loading}
            error={error}
            collapsed={sidebarCollapsed}
            onDocSelect={loadDocumentation}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onRefresh={refreshDocumentation}
            clearError={clearError}
            isDark={isDark}
          />
        </ErrorBoundary>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div 
            className={`px-6 py-4 border-b flex items-center justify-between`}
            style={{ 
              backgroundColor: isDark ? '#111111' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb',
              minHeight: '72px'
            }}
          >
            <div className="flex items-center space-x-4">
              {/* Back button */}
              {onBack && (
                <button
                  onClick={onBack}
                  className={`p-2 rounded-lg border transition-colors ${
                    isDark 
                      ? 'border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white' 
                      : 'border-gray-300 hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                  title="Back to app"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`lg:hidden p-2 rounded-lg border transition-colors ${
                  isDark 
                    ? 'border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white' 
                    : 'border-gray-300 hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                MCP Documentation
              </h2>
            </div>
          </div>

          {/* Content Area */}
          <ErrorBoundary isDark={isDark}>
            <DocumentationContent
              activeDoc={activeDoc}
              loading={loading}
              error={error}
              isDark={isDark}
              onRefresh={refreshDocumentation}
              clearError={clearError}
            />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};