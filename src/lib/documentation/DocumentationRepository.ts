// Repository Pattern for documentation data access
export interface DocumentationFile {
  id: string;
  title: string;
  filename: string;
  category: string;
  order: number;
  content?: string;
  lastModified?: Date;
  tags?: string[];
  loadError?: string; // Track individual file load errors
}

// Error types for better error handling
export class DocumentationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly filename?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DocumentationError';
  }
}

export class FileNotFoundError extends DocumentationError {
  constructor(filename: string, cause?: Error) {
    super(`Documentation file not found: ${filename}`, 'FILE_NOT_FOUND', filename, cause);
    this.name = 'FileNotFoundError';
  }
}

export class NetworkError extends DocumentationError {
  constructor(filename: string, cause?: Error) {
    super(`Network error loading file: ${filename}`, 'NETWORK_ERROR', filename, cause);
    this.name = 'NetworkError';
  }
}

export class ParseError extends DocumentationError {
  constructor(filename: string, cause?: Error) {
    super(`Error parsing file: ${filename}`, 'PARSE_ERROR', filename, cause);
    this.name = 'ParseError';
  }
}

export interface DocumentationRepository {
  findAll(): Promise<DocumentationFile[]>;
  findById(id: string): Promise<DocumentationFile | null>;
  findByCategory(category: string): Promise<DocumentationFile[]>;
  search(query: string): Promise<DocumentationFile[]>;
}

// Configuration interface
interface DocumentationConfig {
  files: string[];
  categories: Record<string, { label: string; order: number }>;
}

// Default configuration
const DOCUMENTATION_CONFIG: DocumentationConfig = {
  files: [
    'API.md',
    'CLI.md', 
    'CONFIGURATION.md',
    'DEPLOYMENT-CHECKLIST.md',
    'DEPLOYMENT.md',
    'DEVELOPER.md',
    'EXAMPLES.md',
    'IDE-SETUP.md',
    'LOGGING.md',
    'TESTING.md',
    'TROUBLESHOOTING.md'
  ],
  categories: {
    'API': { label: 'API Reference', order: 1 },
    'CONFIGURATION': { label: 'Setup', order: 2 },
    'EXAMPLES': { label: 'Guides', order: 3 },
    'TESTING': { label: 'Development', order: 4 },
    'TROUBLESHOOTING': { label: 'Support', order: 5 }
  }
};

// Concrete implementation for file-based documentation
export class FileSystemDocumentationRepository implements DocumentationRepository {
  constructor(
    private readonly basePath: string = '/docs',
    private readonly fileLoader: FileLoader = new DefaultFileLoader(),
    private readonly config: DocumentationConfig = DOCUMENTATION_CONFIG
  ) {}

  async findAll(): Promise<DocumentationFile[]> {
    const results = await Promise.allSettled(
      this.config.files.map((filename: string) => this.loadDocumentationFile(filename))
    );

    const successfulFiles: DocumentationFile[] = [];
    const failedFiles: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value !== null) {
        successfulFiles.push(result.value);
      } else {
        const filename = this.config.files[index];
        failedFiles.push(filename);
        
        // Create placeholder entry for failed files to maintain graceful degradation
        const placeholderFile: DocumentationFile = {
          id: this.generateIdFromFilename(filename),
          title: this.generateTitleFromFilename(filename),
          filename,
          category: this.getCategoryFromFilename(filename),
          order: this.getOrderFromCategory(this.getCategoryFromFilename(filename)),
          content: undefined,
          loadError: result.status === 'rejected' 
            ? (result.reason instanceof Error ? result.reason.message : 'Unknown error')
            : 'File not found'
        };
        
        // Only add placeholder if we want to show failed files in the UI
        // For now, we'll skip them to avoid cluttering the interface
        // successfulFiles.push(placeholderFile);
      }
    });

    // Log failed files for debugging
    if (failedFiles.length > 0) {
      console.warn(`Failed to load ${failedFiles.length} documentation files:`, failedFiles);
    }

    return successfulFiles.sort((a: DocumentationFile, b: DocumentationFile) => 
      a.order - b.order || a.title.localeCompare(b.title)
    );
  }

  async findById(id: string): Promise<DocumentationFile | null> {
    const filename = this.getFilenameFromId(id);
    if (!filename) return null;
    return this.loadDocumentationFile(filename);
  }

  async findByCategory(category: string): Promise<DocumentationFile[]> {
    const allDocs = await this.findAll();
    return allDocs.filter(doc => doc.category === category);
  }

  async search(query: string): Promise<DocumentationFile[]> {
    const allDocs = await this.findAll();
    const searchTerm = query.toLowerCase();
    
    return allDocs.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm) ||
      doc.content?.toLowerCase().includes(searchTerm) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  private getFilenameFromId(id: string): string | null {
    const filename = this.config.files.find(f => 
      f.toLowerCase().replace('.md', '') === id.toLowerCase()
    );
    return filename || null;
  }

  private async loadDocumentationFile(filename: string): Promise<DocumentationFile | null> {
    try {
      const content = await this.fileLoader.loadFile(`${this.basePath}/${filename}`);
      return this.parseDocumentationFile(filename, content);
    } catch (error) {
      // Enhanced error handling with specific error types
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          throw new FileNotFoundError(filename, error);
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new NetworkError(filename, error);
        } else {
          throw new ParseError(filename, error);
        }
      }
      
      throw new DocumentationError(`Unknown error loading ${filename}`, 'UNKNOWN_ERROR', filename, error as Error);
    }
  }

  private parseDocumentationFile(filename: string, content: string): DocumentationFile {
    const id = this.generateIdFromFilename(filename);
    const title = this.extractTitleFromContent(content) || this.generateTitleFromFilename(filename);
    const category = this.getCategoryFromFilename(filename);
    const order = this.getOrderFromCategory(category);

    return {
      id,
      title,
      filename,
      category,
      order,
      content,
      lastModified: new Date(),
      tags: this.extractTagsFromContent(content)
    };
  }

  private generateIdFromFilename(filename: string): string {
    return filename.toLowerCase().replace('.md', '').replace(/[^a-z0-9]/g, '-');
  }

  private extractTitleFromContent(content: string): string | null {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  private generateTitleFromFilename(filename: string): string {
    return filename.replace('.md', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getCategoryFromFilename(filename: string): string {
    const baseName = filename.replace('.md', '').toUpperCase();
    const categoryConfig = this.config.categories[baseName];
    return categoryConfig ? categoryConfig.label : 'General';
  }

  private getOrderFromCategory(category: string): number {
    const categoryEntry = Object.values(this.config.categories).find(c => c.label === category);
    return categoryEntry ? categoryEntry.order : 999;
  }

  private extractTagsFromContent(content: string): string[] {
    // Simple tag extraction - could be enhanced
    const tagMatches = content.match(/(?:^|\s)#(\w+)/g);
    return tagMatches ? tagMatches.map(tag => tag.trim().substring(1)) : [];
  }
}

// Abstraction for file loading (enables testing and different sources)
export interface FileLoader {
  loadFile(path: string): Promise<string>;
}

export class DefaultFileLoader implements FileLoader {
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000; // 1 second

  async loadFile(path: string): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(path);
        
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          
          // Don't retry on 404s
          if (response.status === 404) {
            throw error;
          }
          
          // Retry on other errors if we have attempts left
          if (attempt < this.retryAttempts) {
            lastError = error;
            await this.delay(this.retryDelay * attempt);
            continue;
          }
          
          throw error;
        }
        
        return await response.text();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on network errors that are likely permanent
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          if (attempt < this.retryAttempts) {
            await this.delay(this.retryDelay * attempt);
            continue;
          }
        }
        
        // If this is the last attempt, throw the error
        if (attempt === this.retryAttempts) {
          throw error;
        }
        
        // Wait before retrying
        await this.delay(this.retryDelay * attempt);
      }
    }
    
    throw lastError || new Error(`Failed to load file after ${this.retryAttempts} attempts: ${path}`);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}