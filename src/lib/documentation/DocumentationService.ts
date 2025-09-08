// Import types from repository
import type { DocumentationFile, DocumentationRepository } from './DocumentationRepository';

// Service Layer with proper dependency injection
export interface DocumentationService {
  getAllDocumentation(): Promise<DocumentationFile[]>;
  getDocumentationById(id: string): Promise<DocumentationFile | null>;
  getDocumentationByCategory(category: string): Promise<DocumentationFile[]>;
  searchDocumentation(query: string): Promise<DocumentationFile[]>;
  groupDocumentationByCategory(docs: DocumentationFile[]): Record<string, DocumentationFile[]>;
  refreshCache(): Promise<void>;
}

export class DefaultDocumentationService implements DocumentationService {
  private cache: Map<string, DocumentationFile[]> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheTime: number = 0;

  constructor(
    private readonly repository: DocumentationRepository,
    private readonly categoryMapper: CategoryMapper = new DefaultCategoryMapper()
  ) {}

  async getAllDocumentation(): Promise<DocumentationFile[]> {
    if (this.isCacheValid()) {
      return this.cache.get('all') || [];
    }

    const docs = await this.repository.findAll();
    this.cache.set('all', docs);
    this.lastCacheTime = Date.now();
    
    return docs;
  }

  async getDocumentationById(id: string): Promise<DocumentationFile | null> {
    // Try cache first
    const cachedDocs = this.cache.get('all');
    if (cachedDocs) {
      const doc = cachedDocs.find(d => d.id === id);
      if (doc) return doc;
    }

    // Fallback to repository
    return this.repository.findById(id);
  }

  async getDocumentationByCategory(category: string): Promise<DocumentationFile[]> {
    const cacheKey = `category:${category}`;
    if (this.isCacheValid() && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || [];
    }

    const docs = await this.repository.findByCategory(category);
    this.cache.set(cacheKey, docs);
    
    return docs;
  }

  async searchDocumentation(query: string): Promise<DocumentationFile[]> {
    return this.repository.search(query);
  }

  groupDocumentationByCategory(docs: DocumentationFile[]): Record<string, DocumentationFile[]> {
    return this.categoryMapper.groupByCategory(docs);
  }

  async refreshCache(): Promise<void> {
    this.cache.clear();
    this.lastCacheTime = 0;
    await this.getAllDocumentation();
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheTime < this.cacheExpiry;
  }
}

// Separate concern for category mapping
export interface CategoryMapper {
  groupByCategory(docs: DocumentationFile[]): Record<string, DocumentationFile[]>;
  getCategoryOrder(category: string): number;
}

export class DefaultCategoryMapper implements CategoryMapper {
  groupByCategory(docs: DocumentationFile[]): Record<string, DocumentationFile[]> {
    const grouped = docs.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    }, {} as Record<string, DocumentationFile[]>);

    // Sort within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a: DocumentationFile, b: DocumentationFile) => a.title.localeCompare(b.title));
    });

    return grouped;
  }

  getCategoryOrder(category: string): number {
    // Simple implementation - could be enhanced with configuration
    const categoryOrders: Record<string, number> = {
      'API Reference': 1,
      'Setup': 2,
      'Guides': 3,
      'Development': 4,
      'Support': 5
    };
    return categoryOrders[category] || 999;
  }
}