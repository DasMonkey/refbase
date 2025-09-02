export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status?: 'planned' | 'in-progress' | 'implemented' | 'testing';
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: 'prd' | 'ux-flow' | 'feature-list' | 'bug-list' | 'custom';
  language?: string; // For syntax highlighting
  createdAt: Date;
  updatedAt: Date;
}

export interface Feature {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: 'user-story' | 'enhancement' | 'new-feature' | 'integration' | 'performance' | 'custom';
  status: 'planned' | 'in-progress' | 'implemented' | 'testing';
  language?: string; // For syntax highlighting
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureData {
  id: string;
  featureId: string;
  projectId: string;
  dataType: 'info_file' | 'kanban_board' | 'ai_summary' | 'chat_history' | 'imported_file' | 'logs' | 'attachments' | 'metadata';
  name: string;
  content: string;
  contentType: string; // 'markdown', 'javascript', 'typescript', 'json', 'text', etc.
  order: number;
  parentId?: string;
  fileSize: number;
  language?: string;
  tags: string[];
  status: 'active' | 'archived' | 'deleted' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, unknown>;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  accessedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Convenience type for info files specifically
export interface FeatureFile extends Omit<FeatureData, 'dataType'> {
  dataType: 'info_file';
  type: 'requirement' | 'structure' | 'implementation' | 'testing' | 'documentation' | 'notes' | 'custom';
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'fix-later' | 'done';
  priority: 'low' | 'medium' | 'high' | 'top';
  assignee?: string;
  featureId?: string; // Link to specific feature
  bugId?: string; // Link to specific bug
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bug {
  id: string;
  projectId: string;
  title: string;
  description: string;
  content: string;
  type: 'ui-bug' | 'functional-bug' | 'performance-bug' | 'security-bug' | 'data-bug' | 'integration-bug';
  language?: string; // For syntax highlighting
  status: 'open' | 'in-progress' | 'fixed' | 'wont-fix';
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  attachments: string[];
  featureId?: string; // Link to related feature
  // Detailed bug information fields
  symptoms?: string[]; // Observable symptoms of the bug
  reproduction?: string; // Steps to reproduce the bug
  solution?: string; // Proposed solution or fix
  affectedFiles?: string[]; // Files affected by this bug
  errorMessages?: string[]; // Error messages associated with the bug
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'task' | 'milestone' | 'bug';
  attendees?: string[];
}

export interface ProjectTracker {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description?: string;
  type: 'project' | 'feature' | 'bug';
  startDate: Date;
  endDate: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  linkedItems?: {
    taskIds?: string[];
    featureIds?: string[];
    bugIds?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FileItem {
  id: string;
  projectId: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  author: string;
  content: string;
  timestamp: Date;
}

export type TabType = 'dashboard' | 'docs' | 'tasks' | 'features' | 'bugs' | 'conversations' | 'calendar' | 'files' | 'chat';

// AI API Key Management Types
export interface ApiKeyState {
  mode: 'default' | 'custom';
  provider?: 'openai' | 'openrouter' | 'custom';
  customKey?: string;
  selectedModel?: string;
}

export interface ApiConfig {
  provider: 'default' | 'openai' | 'openrouter' | 'custom';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  useDefault: boolean;
}

export type ApiMode = 'default' | 'custom';
export type ApiProvider = 'openai' | 'openrouter' | 'custom';