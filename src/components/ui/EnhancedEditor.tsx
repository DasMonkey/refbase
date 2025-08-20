import React, { useState, useEffect, useRef, useMemo } from 'react';
import Markdown from 'markdown-to-jsx';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Code, Eye, Edit3, FileText, Settings, Copy, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface EnhancedEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  language?: string;
  onLanguageChange?: (language: string) => void;
  fileName?: string; // Add fileName for auto-detection
}

const supportedLanguages = [
  { id: 'markdown', label: 'Markdown', extension: '.md', extensions: ['.md', '.markdown'] },
  { id: 'javascript', label: 'JavaScript', extension: '.js', extensions: ['.js', '.mjs'] },
  { id: 'typescript', label: 'TypeScript', extension: '.ts', extensions: ['.ts'] },
  { id: 'python', label: 'Python', extension: '.py', extensions: ['.py', '.pyw'] },
  { id: 'json', label: 'JSON', extension: '.json', extensions: ['.json', '.jsonc'] },
  { id: 'yaml', label: 'YAML', extension: '.yml', extensions: ['.yml', '.yaml'] },
  { id: 'sql', label: 'SQL', extension: '.sql', extensions: ['.sql'] },
  { id: 'bash', label: 'Bash', extension: '.sh', extensions: ['.sh', '.bash', '.zsh'] },
  { id: 'css', label: 'CSS', extension: '.css', extensions: ['.css', '.scss', '.sass', '.less'] },
  { id: 'html', label: 'HTML', extension: '.html', extensions: ['.html', '.htm', '.xhtml'] },
  { id: 'jsx', label: 'JSX', extension: '.jsx', extensions: ['.jsx'] },
  { id: 'tsx', label: 'TSX', extension: '.tsx', extensions: ['.tsx'] },
  { id: 'java', label: 'Java', extension: '.java', extensions: ['.java'] },
  { id: 'cpp', label: 'C++', extension: '.cpp', extensions: ['.cpp', '.cc', '.cxx', '.c++', '.c', '.h', '.hpp'] },
  { id: 'rust', label: 'Rust', extension: '.rs', extensions: ['.rs'] },
  { id: 'go', label: 'Go', extension: '.go', extensions: ['.go'] },
  { id: 'php', label: 'PHP', extension: '.php', extensions: ['.php', '.phtml'] },
  { id: 'ruby', label: 'Ruby', extension: '.rb', extensions: ['.rb', '.rbx'] },
  { id: 'text', label: 'Plain Text', extension: '.txt', extensions: ['.txt', '.text', '.log'] },
];

// Auto-detect language from filename
const detectLanguageFromFileName = (fileName: string): string => {
  if (!fileName) return 'markdown';
  
  const extension = '.' + fileName.split('.').pop()?.toLowerCase();
  
  for (const lang of supportedLanguages) {
    if (lang.extensions.includes(extension)) {
      return lang.id;
    }
  }
  
  // Check if filename looks like code even without extension
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('component') || lowerName.includes('page') || lowerName.includes('hook')) {
    return 'typescript';
  }
  if (lowerName.includes('config') || lowerName.includes('package')) {
    return 'json';
  }
  if (lowerName.includes('readme') || lowerName.includes('doc')) {
    return 'markdown';
  }
  
  return 'markdown'; // Default to markdown instead of text
};

type ViewMode = 'edit' | 'preview' | 'split';

// Copy Button Component
const CopyButton: React.FC<{ code: string; isDark: boolean }> = ({ code, isDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className={`absolute top-2 right-2 p-1.5 rounded transition-colors z-10 ${
          isDark 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800'
        }`}
        title="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      {copied && (
        <div 
          className={`absolute top-12 right-2 px-2 py-1 text-xs rounded shadow-lg z-20 ${
            isDark 
              ? 'bg-gray-800 text-green-400 border border-gray-700' 
              : 'bg-white text-green-600 border border-gray-200'
          }`}
        >
          Copied!
        </div>
      )}
    </div>
  );
};

export const EnhancedEditor: React.FC<EnhancedEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing...",
  language = 'markdown',
  onLanguageChange,
  fileName
}) => {
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const hasAutoDetected = useRef(false);

  // Auto-detect language from filename only on first load for each file
  useEffect(() => {
    if (fileName && onLanguageChange && !hasAutoDetected.current) {
      const detectedLanguage = detectLanguageFromFileName(fileName);
      onLanguageChange(detectedLanguage);
      hasAutoDetected.current = true;
    }
  }, [fileName, onLanguageChange]);

  // Reset auto-detection flag only when filename changes to a different file
  const previousFileName = useRef<string>('');
  useEffect(() => {
    if (fileName && fileName !== previousFileName.current) {
      hasAutoDetected.current = false;
      previousFileName.current = fileName;
    }
  }, [fileName]);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLanguageSelector(false);
      }
    };

    if (showLanguageSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageSelector]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Ultra-smooth scroll synchronization using RAF
  const isSyncingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    
    // Sync to preview in split mode using RAF for smooth performance
    if (viewMode === 'split' && !isSyncingRef.current && previewRef.current) {
      const editorElement = e.currentTarget;
      const previewElement = previewRef.current;
      
      // Cancel any pending sync
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Schedule sync for next frame
      rafIdRef.current = requestAnimationFrame(() => {
        if (!isSyncingRef.current && previewElement) {
          isSyncingRef.current = true;
          
          const scrollPercent = scrollTop / Math.max(1, editorElement.scrollHeight - editorElement.clientHeight);
          previewElement.scrollTop = scrollPercent * Math.max(1, previewElement.scrollHeight - previewElement.clientHeight);
          
          isSyncingRef.current = false;
        }
      });
    }
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Sync to editor in split mode using RAF for smooth performance
    if (viewMode === 'split' && !isSyncingRef.current && editorRef.current) {
      const previewElement = e.currentTarget;
      const editorElement = editorRef.current;
      
      // Cancel any pending sync
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Schedule sync for next frame
      rafIdRef.current = requestAnimationFrame(() => {
        if (!isSyncingRef.current && editorElement) {
          isSyncingRef.current = true;
          
          const scrollPercent = previewElement.scrollTop / Math.max(1, previewElement.scrollHeight - previewElement.clientHeight);
          const newScrollTop = scrollPercent * Math.max(1, editorElement.scrollHeight - editorElement.clientHeight);
          editorElement.scrollTop = newScrollTop;
          setScrollTop(newScrollTop);
          
          isSyncingRef.current = false;
        }
      });
    }
  };

  // Calculate line numbers for textarea
  const getLineNumbers = (text: string) => {
    const lines = (text || '').split('\n');
    return Array.from({ length: lines.length }, (_, i) => i + 1);
  };

  // Memoized render content for optimal performance
  const renderContent = useMemo(() => {
    if (language === 'markdown') {
      const CodeBlock = ({ className, children, ...props }: any) => {
        // Handle inline code (no className or no language-)
        if (!className || !className.includes('language-')) {
          return (
            <code 
              className={className} 
              {...props}
              style={{
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                color: isDark ? '#e5e7eb' : '#374151',
                padding: '0.125rem 0.25rem',
                borderRadius: '0.25rem',
                fontSize: '0.875em'
              }}
            >
              {children}
            </code>
          );
        }

        // Handle code blocks with language
        const match = /language-(\w+)/.exec(className);
        const codeLanguage = match ? match[1] : 'text';
        
        return (
          <div className="my-4">
            <SyntaxHighlighter
              style={isDark ? oneDark : oneLight}
              language={codeLanguage}
              showLineNumbers={false}
              wrapLongLines={false}
              customStyle={{
                margin: 0,
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: '1.5',
                padding: '1rem'
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      };

      const PreBlock = ({ children, className, ...props }: any) => {
        // Function to recursively extract text content
        const extractTextContent = (node: any): string => {
          if (typeof node === 'string') {
            return node;
          }
          if (typeof node === 'number') {
            return String(node);
          }
          if (Array.isArray(node)) {
            return node.map(extractTextContent).join('');
          }
          if (node && typeof node === 'object') {
            if (node.props && node.props.children) {
              return extractTextContent(node.props.children);
            }
            if (node.children) {
              return extractTextContent(node.children);
            }
            return '';
          }
          return '';
        };

        // Extract language from className
        let codeLanguage = 'text';
        if (children && children.props && children.props.className) {
          const match = /language-(\w+)/.exec(children.props.className);
          codeLanguage = match ? match[1] : 'text';
        }

        // Extract the actual code content
        const codeContent = extractTextContent(children);
        
        // Debug log to see what we're getting
        console.log('Code block - Language:', codeLanguage, 'Content:', codeContent.substring(0, 50));
        console.log('Theme being used:', isDark ? 'oneDark' : 'oneLight');
        
        return (
          <div className="my-4 relative">
            <CopyButton code={codeContent.trim()} isDark={isDark} />
            <div className={`overflow-auto rounded-md ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
              <SyntaxHighlighter
                style={isDark ? oneDark : oneLight}
                language="javascript"
                showLineNumbers={false}
                wrapLongLines={false}
                customStyle={{
                  margin: 0,
                  borderRadius: '6px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  padding: '1rem',
                  minWidth: '100%',
                  width: 'fit-content',
                  display: 'block',
                  background: isDark ? '#0d1117' : '#f6f8fa'
                }}
                codeTagProps={{
                  style: {
                    display: 'block',
                    width: 'max-content',
                    minWidth: '100%',
                    background: 'inherit'
                  }
                }}
                useInlineStyles={true}
                PreTag={({ children, ...props }: any) => (
                  <div 
                    {...props} 
                    style={{
                      ...props.style,
                      width: 'max-content',
                      minWidth: '100%',
                      background: isDark ? '#0d1117' : '#f6f8fa',
                      borderRadius: '6px'
                    }}
                  >
                    {children}
                  </div>
                )}
              >
                {codeContent.trim()}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      };

      return (
        <div 
          className="prose max-w-none" 
          style={{ 
            color: isDark ? '#e5e5e5' : '#111111',
            lineHeight: '1.5rem',
            fontSize: '14px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
          }}
        >
          <Markdown
            options={{
              overrides: {
                code: CodeBlock,
                pre: PreBlock,
                h1: { props: { style: { color: isDark ? '#ffffff' : '#000000', fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' } } },
                h2: { props: { style: { color: isDark ? '#ffffff' : '#000000', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' } } },
                h3: { props: { style: { color: isDark ? '#ffffff' : '#000000', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' } } },
                p: { props: { style: { marginBottom: '1rem' } } },
                a: { props: { style: { color: isDark ? '#60a5fa' : '#2563eb' } } },
                blockquote: { 
                  props: { 
                    style: { 
                      borderLeft: `4px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      paddingLeft: '1rem',
                      margin: '1rem 0',
                      fontStyle: 'italic',
                      color: isDark ? '#d1d5db' : '#6b7280'
                    } 
                  } 
                }
              }
            }}
          >
            {content || '*No content*'}
          </Markdown>
        </div>
      );
    } else {
      return (
        <div className={`overflow-auto h-full relative ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
          <CopyButton code={content || '// No content'} isDark={isDark} />
          <SyntaxHighlighter
            language={language}
            style={isDark ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '14px',
              lineHeight: '1.5rem',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              minWidth: '100%',
              width: 'fit-content',
              display: 'block',
              background: isDark ? '#0d1117' : '#f6f8fa'
            }}
            codeTagProps={{
              style: {
                display: 'block',
                width: 'max-content',
                minWidth: '100%',
                background: 'inherit'
              }
            }}
            showLineNumbers={true}
            wrapLongLines={false}
            PreTag={({ children, ...props }: any) => (
              <div 
                {...props} 
                style={{
                  ...props.style,
                  width: 'max-content',
                  minWidth: '100%',
                  background: isDark ? '#0d1117' : '#f6f8fa'
                }}
              >
                {children}
              </div>
            )}
          >
            {content || '// No content'}
          </SyntaxHighlighter>
        </div>
      );
    }
  }, [content, language, isDark]);

  const currentLanguage = supportedLanguages.find(lang => lang.id === language);

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b flex-shrink-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className={`flex items-center px-3 py-1 text-xs font-medium rounded border ${
                isDark 
                  ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FileText size={12} className="mr-1" />
              {currentLanguage?.label || language}
              <Settings size={12} className="ml-1" />
            </button>
            
            {showLanguageSelector && (
              <div className={`absolute top-full left-0 mt-1 w-48 max-h-64 overflow-y-auto border rounded-lg shadow-lg z-50 ${
                isDark ? 'bg-gray-800 border-gray-700 dark-scrollbar' : 'bg-white border-gray-200 light-scrollbar'
              }`}>
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      onLanguageChange?.(lang.id);
                      setShowLanguageSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'} ${
                      language === lang.id ? (isDark ? 'bg-gray-700' : 'bg-gray-100') : ''
                    }`}
                  >
                    <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {lang.label}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {lang.extensions.join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('edit')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'edit'
                ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
            }`}
            title="Edit Mode"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'preview'
                ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
            }`}
            title="Preview Mode"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'split'
                ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
            }`}
            title="Split View"
          >
            <Code size={14} />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'split' ? (
          <div className="h-full flex">
            {/* Editor Pane - Fixed 50% */}
            <div className="w-1/2 flex min-w-0 relative overflow-hidden border-r" style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
              {/* Line Numbers */}
              <div 
                className={`flex flex-col text-right select-none flex-shrink-0 absolute left-0 top-0 z-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                style={{ 
                  width: '56px',
                  backgroundColor: isDark ? '#111111' : '#ffffff',
                  borderRight: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                  fontSize: '14px',
                  lineHeight: '1.5rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  paddingTop: '1rem',
                  paddingRight: '0.75rem',
                  paddingBottom: '1rem',
                  transform: `translate3d(0, -${scrollTop}px, 0)`,
                  minHeight: `${getLineNumbers(content).length * 24 + 32}px`,
                  willChange: 'transform'
                }}
              >
                {getLineNumbers(content).map((lineNum) => (
                  <div key={lineNum} style={{ height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.5rem' }}>
                    {lineNum}
                  </div>
                ))}
              </div>
              
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleEditorScroll}
                placeholder={placeholder}
                className={`w-full h-full resize-none focus:outline-none text-sm font-mono leading-relaxed overflow-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}
                style={{
                  backgroundColor: isDark ? '#111111' : '#ffffff',
                  color: isDark ? '#e5e5e5' : '#111111',
                  border: 'none',
                  lineHeight: '1.5rem',
                  paddingLeft: '60px',
                  paddingTop: '1rem',
                  paddingRight: '1rem',
                  paddingBottom: '1rem'
                }}
              />
            </div>
            
            {/* Preview Pane - Fixed 50% */}
            <div className="w-1/2 flex min-w-0 relative overflow-hidden">
              {/* Preview Line Numbers */}
              <div 
                className={`flex flex-col text-right select-none flex-shrink-0 absolute left-0 top-0 z-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                style={{ 
                  width: '56px',
                  backgroundColor: isDark ? '#111111' : '#ffffff',
                  borderRight: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                  fontSize: '14px',
                  lineHeight: '1.5rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  paddingTop: '1rem',
                  paddingRight: '0.75rem',
                  paddingBottom: '1rem',
                  transform: `translate3d(0, -${scrollTop}px, 0)`,
                  minHeight: `${getLineNumbers(content).length * 24 + 32}px`,
                  willChange: 'transform'
                }}
              >
                {getLineNumbers(content).map((lineNum) => (
                  <div key={lineNum} style={{ height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.5rem' }}>
                    {lineNum}
                  </div>
                ))}
              </div>
              
              {/* Preview Content */}
              <div 
                ref={previewRef}
                className={`w-full p-4 overflow-auto h-full ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}
                onScroll={handlePreviewScroll}
                style={{ 
                  backgroundColor: isDark ? '#111111' : '#ffffff',
                  paddingLeft: '60px'
                }}
              >
                {renderContent}
              </div>
            </div>
          </div>
        ) : viewMode === 'edit' ? (
          <div className="h-full flex min-w-0 relative">
            {/* Line Numbers */}
            <div 
              className={`flex flex-col text-right select-none flex-shrink-0 absolute left-0 top-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
              style={{ 
                width: '56px',
                backgroundColor: isDark ? '#111111' : '#ffffff',
                borderRight: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                fontSize: '14px',
                lineHeight: '1.5rem',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                paddingTop: '1rem',
                paddingRight: '0.75rem',
                paddingBottom: '1rem',
                transform: `translate3d(0, -${scrollTop}px, 0)`,
                minHeight: `${getLineNumbers(content).length * 24 + 32}px`,
                willChange: 'transform'
              }}
            >
              {getLineNumbers(content).map((lineNum) => (
                <div key={lineNum} style={{ height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.5rem' }}>
                  {lineNum}
                </div>
              ))}
            </div>
            
            {/* Textarea */}
            <textarea
              ref={editorRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleEditorScroll}
              placeholder={placeholder}
              className={`flex-1 h-full resize-none focus:outline-none text-sm font-mono leading-relaxed min-w-0 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}
              style={{
                backgroundColor: isDark ? '#111111' : '#ffffff',
                color: isDark ? '#e5e5e5' : '#111111',
                border: 'none',
                lineHeight: '1.5rem',
                paddingLeft: '60px',
                paddingTop: '1rem',
                paddingRight: '1rem',
                paddingBottom: '1rem'
              }}
            />
          </div>
        ) : (
          <div className={`h-full p-4 overflow-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
            {renderContent}
          </div>
        )}
      </div>
    </div>
  );
};