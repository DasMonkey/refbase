// Plugin Architecture for extensibility
export interface DocumentationPlugin {
  name: string;
  version: string;
  initialize(context: PluginContext): Promise<void>;
  beforeRender?(content: string, metadata: DocumentationFile): Promise<string>;
  afterRender?(renderedContent: React.ReactNode, metadata: DocumentationFile): Promise<React.ReactNode>;
  onDocumentLoad?(document: DocumentationFile): Promise<DocumentationFile>;
  onNavigate?(fromDoc: DocumentationFile | null, toDoc: DocumentationFile): Promise<void>;
}

export interface PluginContext {
  config: DocumentationConfig;
  repository: DocumentationRepository;
  renderer: ContentRenderer;
  logger: Logger;
}

export class DocumentationPluginManager {
  private plugins: Map<string, DocumentationPlugin> = new Map();
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async registerPlugin(plugin: DocumentationPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    await plugin.initialize(this.context);
    this.plugins.set(plugin.name, plugin);
    
    this.context.logger.info(`Plugin ${plugin.name} v${plugin.version} registered`);
  }

  async executeHook<T>(
    hookName: keyof DocumentationPlugin,
    defaultValue: T,
    ...args: any[]
  ): Promise<T> {
    let result = defaultValue;

    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName] as Function;
      if (typeof hook === 'function') {
        try {
          result = await hook.call(plugin, result, ...args);
        } catch (error) {
          this.context.logger.error(`Plugin ${plugin.name} hook ${hookName} failed:`, error);
        }
      }
    }

    return result;
  }

  getPlugin(name: string): DocumentationPlugin | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): DocumentationPlugin[] {
    return Array.from(this.plugins.values());
  }
}

// Example plugins
export class TableOfContentsPlugin implements DocumentationPlugin {
  name = 'table-of-contents';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Plugin initialization
  }

  async afterRender(
    renderedContent: React.ReactNode,
    metadata: DocumentationFile
  ): Promise<React.ReactNode> {
    // Add table of contents to rendered content
    return renderedContent;
  }
}

export class SearchPlugin implements DocumentationPlugin {
  name = 'search';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Initialize search index
  }

  async onDocumentLoad(document: DocumentationFile): Promise<DocumentationFile> {
    // Index document for search
    return document;
  }
}