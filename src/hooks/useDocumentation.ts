import { useState, useEffect, useCallback } from 'react';
import { DocumentationFile, loadAllDocumentation, loadDocumentationById, groupDocumentationByCategory } from '../lib/documentationLoader';

interface LoadingState {
  initial: boolean;
  content: boolean;
  refresh: boolean;
}

interface ErrorState {
  message: string | null;
  type: 'network' | 'not-found' | 'parse' | 'unknown' | null;
  retryable: boolean;
}

interface UseDocumentationReturn {
  documentationFiles: DocumentationFile[];
  groupedDocs: Record<string, DocumentationFile[]>;
  activeDoc: DocumentationFile | null;
  loading: LoadingState;
  error: ErrorState;
  loadDocumentation: (id: string) => Promise<void>;
  refreshDocumentation: () => Promise<void>;
  clearError: () => void;
}

export function useDocumentation(): UseDocumentationReturn {
  const [documentationFiles, setDocumentationFiles] = useState<DocumentationFile[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentationFile | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    initial: true,
    content: false,
    refresh: false
  });
  const [error, setError] = useState<ErrorState>({
    message: null,
    type: null,
    retryable: false
  });

  // Helper function to determine error type and retryability
  const parseError = useCallback((err: unknown): ErrorState => {
    if (err instanceof Error) {
      const message = err.message.toLowerCase();
      
      if (message.includes('404') || message.includes('not found')) {
        return {
          message: 'Documentation file not found',
          type: 'not-found',
          retryable: false
        };
      }
      
      if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
        return {
          message: 'Network error - please check your connection',
          type: 'network',
          retryable: true
        };
      }
      
      if (message.includes('parse') || message.includes('syntax')) {
        return {
          message: 'Error parsing documentation content',
          type: 'parse',
          retryable: false
        };
      }
      
      return {
        message: err.message,
        type: 'unknown',
        retryable: true
      };
    }
    
    return {
      message: 'An unexpected error occurred',
      type: 'unknown',
      retryable: true
    };
  }, []);

  const clearError = useCallback(() => {
    setError({
      message: null,
      type: null,
      retryable: false
    });
  }, []);

  // Load all documentation files on mount
  useEffect(() => {
    loadAllDocs();
  }, []);

  const loadAllDocs = async () => {
    try {
      setLoading(prev => ({ ...prev, initial: true, refresh: false }));
      clearError();
      
      const docs = await loadAllDocumentation();
      setDocumentationFiles(docs);
      
      // Set the first doc as active if none is selected
      if (docs.length > 0 && !activeDoc) {
        setActiveDoc(docs[0]);
      }
      
      // If no docs were loaded, show a helpful message
      if (docs.length === 0) {
        setError({
          message: 'No documentation files found. Please check that documentation files exist in the docs/ folder.',
          type: 'not-found',
          retryable: true
        });
      }
    } catch (err) {
      console.error('Error loading documentation:', err);
      setError(parseError(err));
    } finally {
      setLoading(prev => ({ ...prev, initial: false, refresh: false }));
    }
  };

  const loadDocumentation = async (id: string) => {
    try {
      setLoading(prev => ({ ...prev, content: true }));
      clearError();
      
      // First check if we already have this doc loaded
      const existingDoc = documentationFiles.find(doc => doc.id === id);
      if (existingDoc) {
        setActiveDoc(existingDoc);
        return;
      }
      
      // Load the specific document
      const doc = await loadDocumentationById(id);
      if (doc) {
        setActiveDoc(doc);
        
        // Add to the list if not already there
        setDocumentationFiles(prev => {
          const exists = prev.some(d => d.id === doc.id);
          if (exists) return prev;
          return [...prev, doc].sort((a, b) => {
            if (a.order !== b.order) {
              return a.order - b.order;
            }
            return a.title.localeCompare(b.title);
          });
        });
      } else {
        setError({
          message: `Documentation not found: ${id}`,
          type: 'not-found',
          retryable: false
        });
      }
    } catch (err) {
      console.error('Error loading documentation:', err);
      setError(parseError(err));
    } finally {
      setLoading(prev => ({ ...prev, content: false }));
    }
  };

  const refreshDocumentation = async () => {
    setLoading(prev => ({ ...prev, refresh: true }));
    await loadAllDocs();
  };

  const groupedDocs = groupDocumentationByCategory(documentationFiles);

  return {
    documentationFiles,
    groupedDocs,
    activeDoc,
    loading,
    error,
    loadDocumentation,
    refreshDocumentation,
    clearError
  };
}