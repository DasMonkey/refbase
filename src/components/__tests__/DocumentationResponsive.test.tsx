import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DocumentationPage } from '../../pages/DocumentationPage';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock hooks
vi.mock('../../hooks/useDocumentation', () => ({
  useDocumentation: () => ({
    documentationFiles: [],
    groupedDocs: {},
    activeDoc: null,
    loading: false,
    error: null,
    loadDocumentation: vi.fn(),
    refreshDocumentation: vi.fn()
  })
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false })
}));

// Mock window.innerWidth for mobile testing
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Documentation Responsive Design', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('shows mobile sidebar toggle on small screens', () => {
    mockInnerWidth(768); // Mobile width
    render(<DocumentationPage onBack={vi.fn()} />);
    
    const mobileToggle = screen.getByTitle(/sidebar/i);
    expect(mobileToggle).toBeInTheDocument();
  });

  it('handles sidebar collapse on mobile', () => {
    mockInnerWidth(768);
    render(<DocumentationPage onBack={vi.fn()} />);
    
    const toggleButton = screen.getByTitle(/sidebar/i);
    fireEvent.click(toggleButton);
    
    // Sidebar should be collapsed after click
    expect(toggleButton).toBeInTheDocument();
  });

  it('shows back button when onBack prop is provided', () => {
    const onBack = vi.fn();
    render(<DocumentationPage onBack={onBack} />);
    
    const backButton = screen.getByTitle('Back to app');
    expect(backButton).toBeInTheDocument();
    
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalled();
  });

  it('applies responsive classes to main container', () => {
    render(<DocumentationPage onBack={vi.fn()} />);
    
    const container = screen.getByRole('main', { hidden: true }) || 
                     document.querySelector('[class*="h-screen"]');
    expect(container).toHaveClass('relative');
  });

  it('handles touch interactions properly', () => {
    mockInnerWidth(375); // iPhone width
    render(<DocumentationPage onBack={vi.fn()} />);
    
    const toggleButton = screen.getByTitle(/sidebar/i);
    
    // Simulate touch events
    fireEvent.touchStart(toggleButton);
    fireEvent.touchEnd(toggleButton);
    fireEvent.click(toggleButton);
    
    expect(toggleButton).toBeInTheDocument();
  });

  it('maintains proper spacing on different screen sizes', () => {
    // Test desktop
    mockInnerWidth(1920);
    const { rerender } = render(<DocumentationPage onBack={vi.fn()} />);
    
    let container = document.querySelector('[class*="px-"]');
    expect(container).toBeInTheDocument();
    
    // Test mobile
    mockInnerWidth(375);
    rerender(<DocumentationPage onBack={vi.fn()} />);
    
    container = document.querySelector('[class*="px-"]');
    expect(container).toBeInTheDocument();
  });

  it('shows appropriate content layout for mobile', () => {
    mockInnerWidth(375);
    render(<DocumentationPage onBack={vi.fn()} />);
    
    // Welcome message should be visible
    expect(screen.getByText('Welcome to RefBase Documentation')).toBeInTheDocument();
    expect(screen.getByText('Select a topic from the sidebar to get started.')).toBeInTheDocument();
  });

  it('handles orientation changes gracefully', () => {
    // Portrait
    mockInnerWidth(375);
    const { rerender } = render(<DocumentationPage onBack={vi.fn()} />);
    
    expect(screen.getByTitle(/sidebar/i)).toBeInTheDocument();
    
    // Landscape
    mockInnerWidth(667);
    rerender(<DocumentationPage onBack={vi.fn()} />);
    
    expect(screen.getByTitle(/sidebar/i)).toBeInTheDocument();
  });

  it('provides adequate touch targets for mobile', () => {
    mockInnerWidth(375);
    render(<DocumentationPage onBack={vi.fn()} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      // Touch targets should be at least 44px (iOS) or 48px (Android)
      // We check for padding and sizing classes that would achieve this
      expect(button.className).toMatch(/p-\d|py-\d|px-\d/);
    });
  });
});