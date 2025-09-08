import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocumentationSidebar } from '../DocumentationSidebar';
import { DocumentationFile } from '../../lib/documentationLoader';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockDocumentationFiles: DocumentationFile[] = [
  {
    id: 'api',
    title: 'API Reference',
    filename: 'API.md',
    category: 'API Reference',
    order: 1,
    content: '# API Documentation'
  },
  {
    id: 'configuration',
    title: 'Configuration',
    filename: 'CONFIGURATION.md',
    category: 'Setup',
    order: 2,
    content: '# Configuration Guide'
  },
  {
    id: 'examples',
    title: 'Examples',
    filename: 'EXAMPLES.md',
    category: 'Guides',
    order: 3,
    content: '# Examples'
  }
];

const mockGroupedDocs = {
  'API Reference': [mockDocumentationFiles[0]],
  'Setup': [mockDocumentationFiles[1]],
  'Guides': [mockDocumentationFiles[2]]
};

const defaultProps = {
  documentationFiles: mockDocumentationFiles,
  groupedDocs: mockGroupedDocs,
  activeDoc: mockDocumentationFiles[0],
  loading: false,
  error: null,
  collapsed: false,
  onDocSelect: vi.fn(),
  onToggleCollapse: vi.fn(),
  onRefresh: vi.fn(),
  isDark: false
};

describe('DocumentationSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders documentation categories and files', () => {
    render(<DocumentationSidebar {...defaultProps} />);
    
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText('API REFERENCE')).toBeInTheDocument();
    expect(screen.getByText('SETUP')).toBeInTheDocument();
    expect(screen.getByText('GUIDES')).toBeInTheDocument();
    
    expect(screen.getByText('API Reference')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Examples')).toBeInTheDocument();
  });

  it('highlights the active document', () => {
    render(<DocumentationSidebar {...defaultProps} />);
    
    const activeButton = screen.getByRole('button', { name: 'API Reference' });
    expect(activeButton).toHaveClass('bg-blue-50', 'text-blue-600');
  });

  it('calls onDocSelect when a document is clicked', () => {
    const onDocSelect = vi.fn();
    render(<DocumentationSidebar {...defaultProps} onDocSelect={onDocSelect} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Configuration' }));
    
    expect(onDocSelect).toHaveBeenCalledWith('configuration');
  });

  it('shows loading state', () => {
    render(<DocumentationSidebar {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Loading documentation...')).toBeInTheDocument();
    expect(screen.queryByText('API REFERENCE')).not.toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const onRefresh = vi.fn();
    render(
      <DocumentationSidebar 
        {...defaultProps} 
        loading={false}
        error="Failed to load documentation"
        onRefresh={onRefresh}
      />
    );
    
    expect(screen.getByText('Error Loading Documentation')).toBeInTheDocument();
    expect(screen.getByText('Failed to load documentation')).toBeInTheDocument();
    
    const retryButton = screen.getByRole('button', { name: 'Try again' });
    fireEvent.click(retryButton);
    
    expect(onRefresh).toHaveBeenCalled();
  });

  it('shows file count in footer', () => {
    render(<DocumentationSidebar {...defaultProps} />);
    
    expect(screen.getByText('3 documentation files')).toBeInTheDocument();
  });

  it('calls onToggleCollapse when collapse button is clicked', () => {
    const onToggleCollapse = vi.fn();
    render(<DocumentationSidebar {...defaultProps} onToggleCollapse={onToggleCollapse} />);
    
    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseButton);
    
    expect(onToggleCollapse).toHaveBeenCalled();
  });

  it('applies dark theme styles', () => {
    render(<DocumentationSidebar {...defaultProps} isDark={true} />);
    
    const sidebar = screen.getByText('Documentation').closest('div');
    expect(sidebar).toHaveClass('bg-gray-900', 'border-gray-700');
  });

  it('handles empty documentation list', () => {
    render(
      <DocumentationSidebar 
        {...defaultProps} 
        documentationFiles={[]}
        groupedDocs={{}}
      />
    );
    
    expect(screen.queryByText('documentation files')).not.toBeInTheDocument();
    expect(screen.queryByText('API REFERENCE')).not.toBeInTheDocument();
  });

  it('truncates long document titles', () => {
    const longTitleDoc: DocumentationFile = {
      id: 'long-title',
      title: 'This is a very long documentation title that should be truncated',
      filename: 'LONG.md',
      category: 'Test',
      order: 1
    };

    render(
      <DocumentationSidebar 
        {...defaultProps} 
        documentationFiles={[longTitleDoc]}
        groupedDocs={{ 'Test': [longTitleDoc] }}
      />
    );
    
    const titleElement = screen.getByText(longTitleDoc.title);
    expect(titleElement).toHaveClass('truncate');
  });
});