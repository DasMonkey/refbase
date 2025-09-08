// Centralized type definitions for documentation system
export interface DocumentationFile {
  id: string;
  title: string;
  filename: string;
  category: string;
  order: number;
  content?: string;
  lastModified?: Date;
  tags?: string[];
}

export interface DocumentationConfig {
  files: string[];
  categories: Record<string, CategoryConfig>;
}

export interface CategoryConfig {
  label: string;
  order: number;
  icon?: string;
  description?: string;
}

export interface RenderOptions {
  isDark: boolean;
  enableSyntaxHighlighting?: boolean;
  enableTableOfContents?: boolean;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface DocumentationState extends LoadingState {
  documentationFiles: DocumentationFile[];
  groupedDocs: Record<string, DocumentationFile[]>;
  activeDoc: DocumentationFile | null;
}