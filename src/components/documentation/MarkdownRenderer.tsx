import React from 'react';
import Markdown from 'markdown-to-jsx';
import { CodeBlock } from './CodeBlock';
import { CustomHeading } from './CustomHeading';
import { ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isDark: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isDark
}) => {
  const markdownOptions = {
    overrides: {
      code: {
        component: ({ children, className }: { children: string; className?: string }) => {
          if (!className) {
            return (
              <code className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-mono break-words ${
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
              }`}>
                {children}
              </code>
            );
          }
          return <CodeBlock className={className} isDark={isDark}>{children}</CodeBlock>;
        }
      },
      pre: {
        component: ({ children }: { children: React.ReactNode }) => {
          if (React.isValidElement(children) && children.props.className) {
            return <CodeBlock className={children.props.className} isDark={isDark}>{children.props.children}</CodeBlock>;
          }
          return <pre className={`p-4 rounded-lg overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>{children}</pre>;
        }
      },
      h1: { component: (props: any) => <CustomHeading {...props} level={1} isDark={isDark} /> },
      h2: { component: (props: any) => <CustomHeading {...props} level={2} isDark={isDark} /> },
      h3: { component: (props: any) => <CustomHeading {...props} level={3} isDark={isDark} /> },
      h4: { component: (props: any) => <CustomHeading {...props} level={4} isDark={isDark} /> },
      h5: { component: (props: any) => <CustomHeading {...props} level={5} isDark={isDark} /> },
      h6: { component: (props: any) => <CustomHeading {...props} level={6} isDark={isDark} /> },
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
      // ... other overrides
    }
  };

  return (
    <div className={`prose prose-sm sm:prose-base lg:prose-lg max-w-none ${
      isDark ? 'prose-invert' : ''
    } ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      <Markdown options={markdownOptions}>
        {content}
      </Markdown>
    </div>
  );
};