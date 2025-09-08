import React from 'react';
import type { RenderOptions } from './types';

// Strategy Pattern for content rendering
export interface ContentRenderingStrategy {
  canHandle(contentType: string): boolean;
  render(content: string, options: RenderOptions): React.ReactNode;
}

export class MarkdownRenderingStrategy implements ContentRenderingStrategy {
  canHandle(contentType: string): boolean {
    return contentType === 'markdown' || contentType === 'md';
  }

  render(content: string, options: RenderOptions): React.ReactNode {
    // Markdown rendering logic here
    return null; // Implementation would go here
  }
}

export class PlainTextRenderingStrategy implements ContentRenderingStrategy {
  canHandle(contentType: string): boolean {
    return contentType === 'text' || contentType === 'txt';
  }

  render(content: string, options: RenderOptions): React.ReactNode {
    return React.createElement('pre', { 
      className: 'whitespace-pre-wrap',
      style: { 
        color: options.isDark ? '#e5e7eb' : '#374151',
        backgroundColor: options.isDark ? '#1f2937' : '#f9fafb'
      }
    }, content);
  }
}

export class ContentRenderer {
  private strategies: ContentRenderingStrategy[] = [];

  constructor() {
    this.strategies.push(
      new MarkdownRenderingStrategy(),
      new PlainTextRenderingStrategy()
    );
  }

  render(content: string, contentType: string, options: RenderOptions): React.ReactNode {
    const strategy = this.strategies.find(s => s.canHandle(contentType));
    if (!strategy) {
      throw new Error(`No rendering strategy found for content type: ${contentType}`);
    }
    return strategy.render(content, options);
  }

  addStrategy(strategy: ContentRenderingStrategy): void {
    this.strategies.unshift(strategy); // Add to beginning for priority
  }
}