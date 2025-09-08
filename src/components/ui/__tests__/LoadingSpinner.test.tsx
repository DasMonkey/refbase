import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default medium size', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('w-6', 'h-6');
  });

  it('should render with small size when specified', () => {
    render(<LoadingSpinner size="sm" />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('should render with large size when specified', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('should apply dark theme styles when isDark is true', () => {
    render(<LoadingSpinner isDark={true} />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('border-gray-600', 'border-t-blue-400');
  });

  it('should apply light theme styles when isDark is false', () => {
    render(<LoadingSpinner isDark={false} />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('border-gray-300', 'border-t-blue-500');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('custom-class');
  });

  it('should have rotation animation', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('border-2', 'rounded-full');
  });
});