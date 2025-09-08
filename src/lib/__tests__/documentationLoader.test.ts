import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadAllDocumentation, loadDocumentationById, groupDocumentationByCategory } from '../documentationLoader';

// Mock fetch
global.fetch = vi.fn();

describe('documentationLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadAllDocumentation', () => {
    it('should load and parse documentation files successfully', async () => {
      // Mock successful fetch responses
      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('API.md')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('# API Documentation\n\nThis is the API documentation.')
          });
        }
        if (url.includes('CONFIGURATION.md')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('# Configuration\n\nThis is the configuration guide.')
          });
        }
        return Promise.resolve({ ok: false });
      });

      const docs = await loadAllDocumentation();
      
      expect(docs).toHaveLength(2);
      expect(docs[0]).toMatchObject({
        id: 'api',
        title: 'API',
        filename: 'API.md',
        category: 'API Reference',
        order: 1
      });
      expect(docs[1]).toMatchObject({
        id: 'configuration',
        title: 'Configuration',
        filename: 'CONFIGURATION.md',
        category: 'Setup',
        order: 2
      });
    });

    it('should handle failed file loads gracefully', async () => {
      // Mock all requests to fail
      (fetch as any).mockResolvedValue({ ok: false });

      const docs = await loadAllDocumentation();
      
      expect(docs).toHaveLength(0);
    });

    it('should sort documentation files by category order and title', async () => {
      // Mock responses for files that should be sorted
      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('TROUBLESHOOTING.md')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('# Troubleshooting')
          });
        }
        if (url.includes('API.md')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('# API Documentation')
          });
        }
        if (url.includes('EXAMPLES.md')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('# Examples')
          });
        }
        return Promise.resolve({ ok: false });
      });

      const docs = await loadAllDocumentation();
      
      expect(docs).toHaveLength(3);
      // Should be sorted by order: API (1), Examples (3), Troubleshooting (5)
      expect(docs[0].category).toBe('API Reference');
      expect(docs[1].category).toBe('Guides');
      expect(docs[2].category).toBe('Support');
    });
  });

  describe('loadDocumentationById', () => {
    it('should load a specific documentation file', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('# API Documentation\n\nContent here.')
      });

      const doc = await loadDocumentationById('api');
      
      expect(doc).toMatchObject({
        id: 'api',
        title: 'API',
        filename: 'API.md',
        category: 'API Reference',
        content: '# API Documentation\n\nContent here.'
      });
    });

    it('should return null for non-existent files', async () => {
      const doc = await loadDocumentationById('nonexistent');
      
      expect(doc).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const doc = await loadDocumentationById('api');
      
      expect(doc).toBeNull();
    });
  });

  describe('groupDocumentationByCategory', () => {
    it('should group documentation files by category', () => {
      const docs = [
        {
          id: 'api',
          title: 'API',
          filename: 'API.md',
          category: 'API Reference',
          order: 1
        },
        {
          id: 'configuration',
          title: 'Configuration',
          filename: 'CONFIGURATION.md',
          category: 'Setup',
          order: 2
        },
        {
          id: 'deployment',
          title: 'Deployment',
          filename: 'DEPLOYMENT.md',
          category: 'Setup',
          order: 2
        }
      ];

      const grouped = groupDocumentationByCategory(docs);
      
      expect(grouped).toHaveProperty('API Reference');
      expect(grouped).toHaveProperty('Setup');
      expect(grouped['API Reference']).toHaveLength(1);
      expect(grouped['Setup']).toHaveLength(2);
    });

    it('should sort files within each category alphabetically', () => {
      const docs = [
        {
          id: 'deployment',
          title: 'Deployment',
          filename: 'DEPLOYMENT.md',
          category: 'Setup',
          order: 2
        },
        {
          id: 'configuration',
          title: 'Configuration',
          filename: 'CONFIGURATION.md',
          category: 'Setup',
          order: 2
        }
      ];

      const grouped = groupDocumentationByCategory(docs);
      
      expect(grouped['Setup'][0].title).toBe('Configuration');
      expect(grouped['Setup'][1].title).toBe('Deployment');
    });
  });
});