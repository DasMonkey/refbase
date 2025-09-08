import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ExternalLink, Hash } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DocumentationFile } from '../lib/documentationLoader';
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

interface DocumentationContentProps {
  activeDoc: DocumentationFile | null;
  loading: LoadingState;
  error: ErrorState;
  isDark: boolean;
  onRefresh?: () => void;
  clearError?: () => void;
}

interface CodeBlockProps {
  children: string;
  className?: string;
  isDark: boolean;
}

interface HeadingProps {
  children: React.ReactNode;
  level: number;
  isDark: boolean;
}

// Custom code block component with copy functionality
const CodeBlock: React.FC<CodeBlockProps> = ({ children, className, isDark }) => {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('lang-', '') || 'text';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className={`absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-lg opacity-0 group-hover:opacity-100 sm:opacity-0 opacity-100 sm:group-hover:opacity-100 transition-all duration-200 touch-manipulation ${
          copied
            ? isDark 
              ? 'bg-green-800 text-green-300 border border-green-700' 
              : 'bg-green-100 text-green-700 border border-green-200'
            : isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600' 
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
        }`}
        title={copied ? "Copied!" : "Copy code"}
      >
        {copied ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
      </button>
      
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          lineHeight: '1.4',
          backgroundColor: isDark ? '#1e1e1e' : '#f8f9fa',
          border: isDark ? '1px solid #374151' : '1px solid #e5e7eb'
        }}
        className="text-xs sm:text-sm"
        showLineNumbers={children.split('\n').length > 5}
        wrapLines={true}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

// Custom heading component with anchor links
const CustomHeading: React.FC<HeadingProps> = ({ children, level, isDark }) => {
  const [showAnchor, setShowAnchor] = useState(false);
  
  // Generate ID from heading text
  const headingText = React.Children.toArray(children).join('');
  const headingId = headingText
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const headingClasses = {
    1: `text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`,
    2: `text-xl sm:text-2xl font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`,
    3: `text-lg sm:text-xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`,
    4: `text-base sm:text-lg font-medium mt-3 sm:mt-4 mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`,
    5: `text-sm sm:text-base font-medium mt-2 sm:mt-3 mb-1 sm:mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`,
    6: `text-xs sm:text-sm font-medium mt-2 mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`
  };

  return (
    <HeadingTag
      id={headingId}
      className={`${headingClasses[level as keyof typeof headingClasses]} relative group flex items-center`}
      onMouseEnter={() => setShowAnchor(true)}
      onMouseLeave={() => setShowAnchor(false)}
    >
      {children}
      {showAnchor && (
        <a
          href={`#${headingId}`}
          className={`ml-2 p-1 -m-1 opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation ${
            isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Link to this section"
        >
          <Hash className="w-3 h-3 sm:w-4 sm:h-4" />
        </a>
      )}
    </HeadingTag>
  );
};

export const DocumentationContent: React.FC<DocumentationContentProps> = ({
  activeDoc,
  loading,
  error,
  isDark,
  onRefresh,
  clearError
}) => {
  const [tableOfContents, setTableOfContents] = useState<Array<{ id: string; text: string; level: number }>>([]);

  // Generate table of contents from markdown headings
  useEffect(() => {
    if (activeDoc?.content) {
      const headings: Array<{ id: string; text: string; level: number }> = [];
      const lines = activeDoc.content.split('\n');
      
      lines.forEach(line => {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2];
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
          
          headings.push({ id, text, level });
        }
      });
      
      setTableOfContents(headings);
    }
  }, [activeDoc?.content]);

  // Custom markdown components
  const markdownOptions = {
    overrides: {
      code: {
        component: ({ children, className }: { children: string; className?: string }) => {
          // Inline code
          if (!className) {
            return (
              <code className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-mono break-words ${
                isDark ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {children}
              </code>
            );
          }
          // Code block
          return <CodeBlock className={className} isDark={isDark}>{children}</CodeBlock>;
        }
      },
      pre: {
        component: ({ children }: { children: React.ReactNode }) => {
          // Extract code from pre > code structure
          if (React.isValidElement(children) && children.props.className) {
            return <CodeBlock className={children.props.className} isDark={isDark}>{children.props.children}</CodeBlock>;
          }
          return <pre className={`p-4 rounded-lg overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>{children}</pre>;
        }
      },
      h1: { component: (props: { children: React.ReactNode }) => <CustomHeading {...props} level={1} isDark={isDark} /> },
      h2: { component: (props: { children: React.ReactNode }) => <CustomHeading {...props} level={2} isDark={isDark} /> },
      h3: { component: (props: { children: React.ReactNode }) => <CustomHeading {...props} level={3} isDark={isDark} /> },
      h4: { component: (props: { children: React.ReactNode }) => <CustomHeading {...props} level={4} isDark={isDark} /> },
      h5: { component: (props: { children: React.ReactNode }) => <CustomHeading {...props} level={5} isDark={isDark} /> },
      h6: { component: (props: { children: React.ReactNode }) => <CustomHeading {...props} level={6} isDark={isDark} /> },
      a: {
        component: ({ href, children }: { href: string; children: React.ReactNode }) => {
          const isExternal = href?.startsWith('http');
          return (
            <a
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className={`inline-flex items-center ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
              } underline`}
            >
              {children}
              {isExternal && <ExternalLink className="w-3 h-3 ml-1" />}
            </a>
          );
        }
      },
      blockquote: {
        component: ({ children }: { children: React.ReactNode }) => (
          <blockquote className={`border-l-4 pl-4 py-2 my-4 ${
            isDark ? 'border-blue-400 bg-gray-800/50 text-gray-200' : 'border-blue-500 bg-blue-50 text-gray-700'
          }`}>
            {children}
          </blockquote>
        )
      },
      table: {
        component: ({ children }: { children: React.ReactNode }) => (
          <div className="overflow-x-auto my-4 sm:my-6 -mx-4 sm:mx-0">
            <table className={`min-w-full border-collapse ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {children}
            </table>
          </div>
        )
      },
      th: {
        component: ({ children }: { children: React.ReactNode }) => (
          <th className={`border px-2 sm:px-4 py-1.5 sm:py-2 text-left font-semibold text-xs sm:text-sm ${
            isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-gray-50 text-gray-900'
          }`}>
            {children}
          </th>
        )
      },
      td: {
        component: ({ children }: { children: React.ReactNode }) => (
          <td className={`border px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${
            isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'
          }`}>
            {children}
          </td>
        )
      }
    }
  };

  // Show loading state for initial load or content loading
  if (loading.initial || loading.content) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Loading header */}
          <div className="mb-6 sm:mb-8">
            <SkeletonLoader variant="text" isDark={isDark} className="mb-2 w-24" />
            <SkeletonLoader variant="title" isDark={isDark} className="w-96" />
          </div>
          
          {/* Loading content */}
          <div className="space-y-6">
            <SkeletonLoader variant="paragraph" lines={3} isDark={isDark} />
            <SkeletonLoader variant="code" isDark={isDark} />
            <SkeletonLoader variant="paragraph" lines={2} isDark={isDark} />
            <SkeletonLoader variant="paragraph" lines={4} isDark={isDark} />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error.message) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto">
          <ErrorMessage
            title="Error Loading Content"
            message={error.message}
            isDark={isDark}
            onRetry={error.retryable && onRefresh ? onRefresh : undefined}
            onDismiss={clearError}
            variant="card"
          />
        </div>
      </div>
    );
  }

  if (!activeDoc) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className={`text-center max-w-md mx-auto px-4`}>
          <div className="mb-6">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <svg className={`w-10 h-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h3 className={`text-2xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome to RefBase Documentation
          </h3>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Select a topic from the sidebar to get started exploring our comprehensive API documentation and guides.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Table of contents - moved to left side */}
      {tableOfContents.length > 1 && (
        <div className={`hidden xl:block w-64 border-r overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`} style={{
          backgroundColor: isDark ? '#111111' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }}>
          <div className="p-4 xl:p-6">
            <h3 className={`text-xs xl:text-sm font-semibold uppercase tracking-wider mb-3 xl:mb-4 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              On This Page
            </h3>
            <nav>
              <ul className="space-y-1 xl:space-y-2">
                {tableOfContents.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className={`block text-xs xl:text-sm transition-colors duration-200 py-1 rounded touch-manipulation ${
                        isDark 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      style={{ 
                        paddingLeft: `${8 + (heading.level - 1) * 8}px`,
                        paddingRight: '8px'
                      }}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 overflow-auto overscroll-y-contain ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            key={activeDoc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Document header */}
            <div className="mb-6 sm:mb-8">
              <div className={`text-sm font-medium mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {activeDoc.category}
              </div>
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {activeDoc.title}
              </h1>
            </div>

            {/* Mobile table of contents */}
            {tableOfContents.length > 1 && (
              <div className="xl:hidden mb-6 sm:mb-8">
                <details className={`border rounded-lg overflow-hidden ${
                  isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
                }`}>
                  <summary className={`px-4 py-3 cursor-pointer font-medium text-sm flex items-center justify-between ${
                    isDark ? 'text-white hover:bg-gray-700/50' : 'text-gray-900 hover:bg-gray-100'
                  } transition-colors touch-manipulation`}>
                    <span>Table of Contents</span>
                    <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <nav className={`px-4 pb-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <ul className="space-y-1 pt-3">
                      {tableOfContents.map((heading) => (
                        <li key={heading.id}>
                          <a
                            href={`#${heading.id}`}
                            className={`block py-1.5 px-2 text-sm transition-colors rounded touch-manipulation ${
                              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            style={{ paddingLeft: `${8 + (heading.level - 1) * 12}px` }}
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </details>
              </div>
            )}

            {/* Markdown content */}
            <div className={`prose prose-sm sm:prose-base lg:prose-lg max-w-none ${
              isDark ? 'prose-invert' : ''
            } ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
            style={{
              '--tw-prose-body': isDark ? '#e5e7eb' : '#374151',
              '--tw-prose-headings': isDark ? '#ffffff' : '#111827',
              '--tw-prose-lead': isDark ? '#d1d5db' : '#4b5563',
              '--tw-prose-links': isDark ? '#60a5fa' : '#2563eb',
              '--tw-prose-bold': isDark ? '#ffffff' : '#111827',
              '--tw-prose-counters': isDark ? '#9ca3af' : '#6b7280',
              '--tw-prose-bullets': isDark ? '#6b7280' : '#9ca3af',
              '--tw-prose-hr': isDark ? '#374151' : '#e5e7eb',
              '--tw-prose-quotes': isDark ? '#e5e7eb' : '#111827',
              '--tw-prose-quote-borders': isDark ? '#374151' : '#e5e7eb',
              '--tw-prose-captions': isDark ? '#9ca3af' : '#6b7280',
              '--tw-prose-code': isDark ? '#e5e7eb' : '#111827',
              '--tw-prose-pre-code': isDark ? '#e5e7eb' : '#111827',
              '--tw-prose-pre-bg': isDark ? '#1f2937' : '#f9fafb',
              '--tw-prose-th-borders': isDark ? '#374151' : '#d1d5db',
              '--tw-prose-td-borders': isDark ? '#374151' : '#e5e7eb'
            } as React.CSSProperties}>
              <Markdown options={markdownOptions}>
                {activeDoc.content || ''}
              </Markdown>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};