import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('should render error message with default title', () => {
    render(<ErrorMessage message="Test error message" />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should render custom title when provided', () => {
    render(
      <ErrorMessage 
        title="Custom Error Title" 
        message="Test error message" 
      />
    );

    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
  });

  it('should show retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    
    render(
      <ErrorMessage 
        message="Test error message" 
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByText(/try again/i);
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should show dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    
    render(
      <ErrorMessage 
        message="Test error message" 
        onDismiss={onDismiss}
      />
    );

    const dismissButton = screen.getByTitle('Dismiss');
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should apply different variant styles', () => {
    const { rerender } = render(
      <ErrorMessage 
        message="Test error message" 
        variant="card"
      />
    );

    let container = screen.getByText('Test error message').closest('div');
    expect(container).toHaveClass('shadow-sm');

    rerender(
      <ErrorMessage 
        message="Test error message" 
        variant="banner"
      />
    );

    container = screen.getByText('Test error message').closest('div');
    expect(container).toHaveClass('border-l-4');
  });

  it('should apply dark theme styles when isDark is true', () => {
    render(
      <ErrorMessage 
        message="Test error message" 
        isDark={true}
      />
    );

    const title = screen.getByText('Error');
    expect(title).toHaveClass('text-red-400');
  });

  it('should apply light theme styles when isDark is false', () => {
    render(
      <ErrorMessage 
        message="Test error message" 
        isDark={false}
      />
    );

    const title = screen.getByText('Error');
    expect(title).toHaveClass('text-red-800');
  });
});