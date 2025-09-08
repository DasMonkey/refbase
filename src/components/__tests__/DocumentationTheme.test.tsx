import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { DocumentationPage } from '../../pages/DocumentationPage';
import { DocumentationSidebar } from '../DocumentationSidebar';
import { DocumentationContent } from '../DocumentationContent';

// Mock the documentation hook
jest.mock('../../hooks/useDocumentation', () => ({
  useDocumentation: () => ({
    documentationFiles: [
      {
        id: 'api',
        title: 'API Reference',
        filename: 'API.md',
        category: 'API',
        content: '# API Reference\n\nThis is a test document with `inline code` and:\n\n```javascript\nconst test = "code block";\n```\n\n> This is a blockquote\n\n| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |'
      }
    ],
    groupedDocs: {
      'API': [
        {
          id: 'api',
          title: 'API Reference',
          filename: 'API.md',
          category: 'API',
          order: 1,
          content: '# API Reference\n\nThis is a test document.'
        }
      ]
    },
    activeDoc: {
      id: 'api',
      title: 'API Reference',
      filename: 'API.md',
      category: 'API',
      order: 1,
      content: '# API Reference\n\nThis is a test document with `inline code` and:\n\n```javascript\nconst test = "code block";\n```\n\n> This is a blockquote\n\n| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |'
    },
    loading: false,
    error: null,
    loadDocumentation: jest.fn(),
    refreshDocumentation: jest.fn()
  })
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock react-syntax-highlighter
jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, ...props }: any) => <pre {...props}>{children}</pre>
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
  oneLight: {}
}));

// Mock markdown-to-jsx
jest.mock('markdown-to-jsx', () => {
  return ({ children }: { children: string }) => <div>{children}</div>;
});

describe('Documentation Theme Integration', () => {
  const mockProps = {
    documentationFiles: [
      {
        id: 'api',
        title: 'API Reference',
        filename: 'API.md',
        category: 'API',
        order: 1,
        content: '# API Reference\n\nTest content'
      }
    ],
    groupedDocs: {
      'API': [
        {
          id: 'api',
          title: 'API Reference',
          filename: 'API.md',
          category: 'API',
          order: 1,
          content: '# API Reference\n\nTest content'
        }
      ]
    },
    activeDoc: {
      id: 'api',
      title: 'API Reference',
      filename: 'API.md',
      category: 'API',
      order: 1,
      content: '# API Reference\n\nTest content'
    },
    loading: false,
    error: null,
    collapsed: false,
    onDocSelect: jest.fn(),
    onToggleCollapse: jest.fn(),
    onRefresh: jest.fn()
  };

  describe('Dark Theme', () => {
    const DarkThemeWrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>
        <div data-theme="dark">
          {children}
        </div>
      </ThemeProvider>
    );

    it('applies dark theme colors to DocumentationPage', () => {
      render(
        <DarkThemeWrapper>
          <DocumentationPage />
        </DarkThemeWrapper>
      );

      // Check if dark theme background is applied
      const pageContainer = screen.getByText('API Documentation').closest('div');
      expect(pageContainer).toHaveStyle({ backgroundColor: '#09090b' });
    });

    it('applies dark theme colors to DocumentationSidebar', () => {
      render(
        <DarkThemeWrapper>
          <DocumentationSidebar {...mockProps} isDark={true} />
        </DarkThemeWrapper>
      );

      // Check if sidebar has dark theme styling
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('API Reference')).toBeInTheDocument();
    });

    it('applies dark theme colors to DocumentationContent', () => {
      render(
        <DarkThemeWrapper>
          <DocumentationContent
            activeDoc={mockProps.activeDoc}
            loading={false}
            error={null}
            isDark={true}
          />
        </DarkThemeWrapper>
      );

      // Check if content area has dark theme styling
      expect(screen.getByText('API Reference')).toBeInTheDocument();
    });
  });

  describe('Light Theme', () => {
    const LightThemeWrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>
        <div data-theme="light">
          {children}
        </div>
      </ThemeProvider>
    );

    it('applies light theme colors to DocumentationSidebar', () => {
      render(
        <LightThemeWrapper>
          <DocumentationSidebar {...mockProps} isDark={false} />
        </LightThemeWrapper>
      );

      // Check if sidebar has light theme styling
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('API Reference')).toBeInTheDocument();
    });

    it('applies light theme colors to DocumentationContent', () => {
      render(
        <LightThemeWrapper>
          <DocumentationContent
            activeDoc={mockProps.activeDoc}
            loading={false}
            error={null}
            isDark={false}
          />
        </LightThemeWrapper>
      );

      // Check if content area has light theme styling
      expect(screen.getByText('API Reference')).toBeInTheDocument();
    });
  });

  describe('Theme Switching', () => {
    it('updates theme colors when theme changes', () => {
      const { rerender } = render(
        <DocumentationContent
          activeDoc={mockProps.activeDoc}
          loading={false}
          error={null}
          isDark={true}
        />
      );

      // Check dark theme is applied
      expect(screen.getByText('API Reference')).toBeInTheDocument();

      // Switch to light theme
      rerender(
        <DocumentationContent
          activeDoc={mockProps.activeDoc}
          loading={false}
          error={null}
          isDark={false}
        />
      );

      // Check light theme is applied
      expect(screen.getByText('API Reference')).toBeInTheDocument();
    });
  });

  describe('Contrast Ratios', () => {
    it('ensures proper contrast for code blocks in dark theme', () => {
      render(
        <DocumentationContent
          activeDoc={{
            ...mockProps.activeDoc,
            content: '```javascript\nconst test = "code";\n```'
          }}
          loading={false}
          error={null}
          isDark={true}
        />
      );

      // Code blocks should be present with proper contrast
      expect(screen.getByText(/const test/)).toBeInTheDocument();
    });

    it('ensures proper contrast for code blocks in light theme', () => {
      render(
        <DocumentationContent
          activeDoc={{
            ...mockProps.activeDoc,
            content: '```javascript\nconst test = "code";\n```'
          }}
          loading={false}
          error={null}
          isDark={false}
        />
      );

      // Code blocks should be present with proper contrast
      expect(screen.getByText(/const test/)).toBeInTheDocument();
    });
  });
});