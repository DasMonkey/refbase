import { DocumentationFile, CategoryConfig } from '../types';

// Factory Pattern for different parsing strategies
export interface DocumentationParser {
  parse(filename: string, content: string): DocumentationFile;
}

export class MarkdownDocumentationParser implements DocumentationParser {
  constructor(private categories: Record<string, CategoryConfig>) {}

  parse(filename: string, content: string): DocumentationFile {
    const { category, title } = this.parseFilename(filename);
    
    return {
      id: filename.replace('.md', '').toLowerCase(),
      title,
      filename,
      category,
      order: this.getCategoryOrder(filename),
      content
    };
  }

  private parseFilename(filename: string): { category: string; title: string } {
    const nameWithoutExt = filename.replace('.md', '');
    const categoryInfo = this.categories[nameWithoutExt];
    
    if (categoryInfo) {
      return {
        category: categoryInfo.label,
        title: this.formatTitle(nameWithoutExt)
      };
    }
    
    return {
      category: 'Other',
      title: this.formatTitle(nameWithoutExt)
    };
  }

  private formatTitle(filename: string): string {
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Api/g, 'API')
      .replace(/Ide/g, 'IDE');
  }

  private getCategoryOrder(filename: string): number {
    const nameWithoutExt = filename.replace('.md', '');
    const categoryInfo = this.categories[nameWithoutExt];
    return categoryInfo?.order || 999;
  }
}