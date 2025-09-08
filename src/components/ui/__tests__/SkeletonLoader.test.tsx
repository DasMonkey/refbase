import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonLoader } from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('should render with default text variant', () => {
    render(<SkeletonLoader />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('h-4', 'w-3/4', 'animate-pulse', 'rounded');
  });

  it('should render title variant with correct dimensions', () => {
    render(<SkeletonLoader variant="title" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('h-6', 'w-1/2');
  });

  it('should render code variant with correct dimensions', () => {
    render(<SkeletonLoader variant="code" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('h-20', 'w-full');
  });

  it('should render sidebar-item variant with correct dimensions', () => {
    render(<SkeletonLoader variant="sidebar-item" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('h-8', 'w-full');
  });

  it('should render multiple lines for paragraph variant', () => {
    render(<SkeletonLoader variant="paragraph" lines={3} />);
    
    const container = screen.getByRole('generic');
    const lines = container.querySelectorAll('div');
    expect(lines).toHaveLength(3);
  });

  it('should make last line shorter for multi-line paragraphs', () => {
    render(<SkeletonLoader variant="paragraph" lines={3} />);
    
    const container = screen.getByRole('generic');
    const lines = container.querySelectorAll('div');
    const lastLine = lines[lines.length - 1];
    
    expect(lastLine).toHaveClass('w-2/3');
  });

  it('should apply dark theme styles when isDark is true', () => {
    render(<SkeletonLoader isDark={true} />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('bg-gray-700');
  });

  it('should apply light theme styles when isDark is false', () => {
    render(<SkeletonLoader isDark={false} />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('bg-gray-200');
  });

  it('should apply custom className', () => {
    render(<SkeletonLoader className="custom-class" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('custom-class');
  });

  it('should have pulse animation', () => {
    render(<SkeletonLoader />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('animate-pulse');
  });
});