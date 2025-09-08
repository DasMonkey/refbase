import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocumentationContent } from '../DocumentationContent';
import { DocumentationFile } from '../../lib/documentationLoader';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock react-syntax-highlighter
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: any) => <pre>{children}</pre>,
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
  oneLight: {},
}));

const mockDoc: DocumentationFile = {
  id: 'api',
  title: 'API Reference',
  filename: 'API.md',
  category: 'API Reference',
  order: 1,
  content: `# API Documentation

This is the main API documentation.

## Authentication

All API calls require authentication.

\`\`\`javascript
const token = 'your-token-here';
fetch('/api/data', {
  headers: { Authorization: \`Bearer \${token}\` }
});
\`\`\`

### Code Example

Here's an inline \`code example\`.

## Error Handling

> This is a blockquote with important information.

| Status | Description |
|--------|-------------|
| 200    | Success     |
| 401    | Unauthorized|

[External Link](https://example.com)
[Internal Link](#authentication)`
};

const defaultProps = {
  activeDoc: mockDoc,
  loading: false,
  error: null,
  isDark: false
};

describe('DocumentationContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders markdown content correctly', () => {
    render(<DocumentationContent {...defaultProps} />);
    
    expect(screen.getByText('API Documentation')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByText('Error Handling')).toBeInTheDocument();
    expect(screen.getByText('API Reference')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DocumentationContent {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
    expect(screen.queryByText('API Documentation')).not.toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const onRefresh = vi.fn();
    render(
      <DocumentationContent 
        {...defaultProps} 
        loading={false}
        error="Failed to load content"
        onRefresh={onRefresh}
      />
    );
    
    expect(screen.getByText('Error Loading Content')).toBeInTheDocument();
    expect(screen.getByText('Failed to load content')).toBeInTheDocument();
    
    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    fireEvent.click(retryButton);
    
    expect(onRefresh).toHaveBeenCalled();
  });

  it('shows welcome message when no document is active', () => {
    render(<DocumentationContent {...defaultProps} activeDoc={null} />);
    
    expect(screen.getByText('Welcome to RefBase Documentation')).toBeInTheDocument();
    expect(screen.getByText('Select a topic from the sidebar to get started.')).toBeInTheDocument();
  });

  it('renders code blocks with copy functionality', () => {
    render(<DocumentationContent {...defaultProps} />);
    
    // Code block should be rendered
    expect(screen.getByText(/const token = 'your-token-here'/)).toBeInTheDocument();
    
    // Copy button should be present (though hidden initially)
    const copyButtons = screen.getAllByTitle('Copy code');
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('renders inline code correctly', () => {
    render(<DocumentationContent {...defaultProps} />);
    
    const inlineCode = screen.getByText('code example');
    expect(inlineCode.closest('code')).toHaveClass('px-2', 'py-1', 'rounded');
  });

  it('renders tables correctly', () => {
    render(<DocumentationContent {...defaultProps} />);
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders blockquotes correctly', () => {
    render(<DocumentationContent {...defaultProps} />);
    
    const blockquote = screen.getByText('This is a blockquote with important information.');
    expect(blockquote.closest('blockquote')).toHaveClass('border-l-4');
  });

  it('renders external links with external icon', () => {
    render(<DocumentationContent {...defaultProps} />);
    
    const externalLink = screen.getByRole('link', { name: /External Link/ });
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders internal links without external attributes', () => {
    render(<DocumentationContent {...defaultProps} />);
    
    const internalLink = screen.getByRole('link', { name: 'Internal Link' });
    expect(internalLink).not.toHaveAttribute('target');
    expect(internalLink).not.toHaveAttribute('rel');
  });

  it('generates table of contents for headings', () => {
    render(<DocumentationContent {...defaultProps} />);
    
    // Table of contents should be visible on xl screens
    expect(screen.getByText('On This Page')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByText('Error Handling')).toBeInTheDocument();
  });

  it('applies dark theme styles', () => {
    render(<DocumentationContent {...defaultProps} isDark={true} />);
    
    const categoryLabel = screen.getByText('API Reference');
    expect(categoryLabel).toHaveClass('text-blue-400');
    
    const heading = screen.getByText('API Documentation');
    expect(heading).toHaveClass('text-white');
  });

  it('handles documents without content', () => {
    const docWithoutContent = { ...mockDoc, content: '' };
    render(<DocumentationContent {...defaultProps} activeDoc={docWithoutContent} />);
    
    expect(screen.getByText('API Reference')).toBeInTheDocument();
    expect(screen.getByText('API Reference')).toBeInTheDocument();
  });

  it('generates proper heading IDs for anchor links', () => {
    render(<DocumentationContent {...defaultProps} />);
    
    const authHeading = screen.getByText('Authentication');
    expect(authHeading.closest('h2')).toHaveAttribute('id', 'authentication');
    
    const errorHeading = screen.getByText('Error Handling');
    expect(errorHeading.closest('h2')).toHaveAttribute('id', 'error-handling');
  });
});