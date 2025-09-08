// Configuration Management with validation and hot-reloading
export interface DocumentationConfiguration {
  categories: Record<string, CategoryConfig>;
  files: string[];
  rendering: RenderingConfig;
  plugins: PluginConfig[];
  cache: CacheConfig;
  search: SearchConfig;
}

export interface CategoryConfig {
  label: string;
  order: number;
  icon?: string;
  description?: string;
}

export interface RenderingConfig {
  syntaxHighlighting: boolean;
  tableOfContents: boolean;
  codeBlockCopy: boolean;
  theme: 'auto' | 'light' | 'dark';
}

export interface PluginConfig {
  name: string;
  enabled: boolean;
  options: Record<string, any>;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number;
}

export interface SearchConfig {
  enabled: boolean;
  indexFields: string[];
  fuzzySearch: boolean;
}

export class ConfigurationManager {
  private config: DocumentationConfiguration;
  private watchers: Set<(config: DocumentationConfiguration) => void> = new Set();

  constructor(initialConfig?: Partial<DocumentationConfiguration>) {
    this.config = this.mergeWithDefaults(initialConfig || {});
  }

  getConfig(): DocumentationConfiguration {
    return { ...this.config };
  }

  updateConfig(updates: Partial<DocumentationConfiguration>): void {
    const newConfig = { ...this.config, ...updates };
    this.validateConfig(newConfig);
    this.config = newConfig;
    this.notifyWatchers();
  }

  watchConfig(callback: (config: DocumentationConfiguration) => void): () => void {
    this.watchers.add(callback);
    return () => this.watchers.delete(callback);
  }

  private mergeWithDefaults(config: Partial<DocumentationConfiguration>): DocumentationConfiguration {
    return {
      categories: {
        'API': { label: 'API Reference', order: 1 },
        'CONFIGURATION': { label: 'Setup', order: 2 },
        'EXAMPLES': { label: 'Guides', order: 3 },
        'TESTING': { label: 'Development', order: 4 },
        'TROUBLESHOOTING': { label: 'Support', order: 5 },
        ...config.categories
      },
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
        'TROUBLESHOOTING.md',
        ...(config.files || [])
      ],
      rendering: {
        syntaxHighlighting: true,
        tableOfContents: true,
        codeBlockCopy: true,
        theme: 'auto',
        ...config.rendering
      },
      plugins: config.plugins || [],
      cache: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100,
        ...config.cache
      },
      search: {
        enabled: true,
        indexFields: ['title', 'content', 'tags'],
        fuzzySearch: true,
        ...config.search
      }
    };
  }

  private validateConfig(config: DocumentationConfiguration): void {
    // Validate configuration structure
    if (!config.categories || typeof config.categories !== 'object') {
      throw new Error('Invalid categories configuration');
    }

    if (!Array.isArray(config.files)) {
      throw new Error('Files must be an array');
    }

    // Additional validation rules...
  }

  private notifyWatchers(): void {
    this.watchers.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.error('Configuration watcher error:', error);
      }
    });
  }
}