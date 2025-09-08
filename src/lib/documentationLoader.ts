// Facade Pattern - Simple interface for complex subsystem
import { DocumentationServiceFactory } from './documentation/DocumentationServiceFactory';
import type { DocumentationService } from './documentation/DocumentationService';

// Re-export types for backward compatibility
export type { DocumentationFile } from './documentation/types';

// Singleton service instance
let documentationService: DocumentationService = DocumentationServiceFactory.createDefault();

/**
 * Load all documentation files
 * Facade method that delegates to the service layer
 */
export async function loadAllDocumentation() {
  return documentationService.getAllDocumentation();
}

/**
 * Load a specific documentation file by ID
 * Facade method that delegates to the service layer
 */
export async function loadDocumentationById(id: string) {
  return documentationService.getDocumentationById(id);
}

/**
 * Group documentation files by category
 * Facade method that delegates to the service layer
 */
export function groupDocumentationByCategory(docs: Parameters<typeof documentationService.groupDocumentationByCategory>[0]) {
  return documentationService.groupDocumentationByCategory(docs);
}

/**
 * Replace the service instance (useful for testing)
 */
export function setDocumentationService(service: DocumentationService) {
  documentationService = service;
}