export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
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
  language?: string; // For syntax highlighting
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'fix-later' | 'done';
  priority: 'low' | 'medium' | 'high' | 'top';
  assignee?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  type: 'task' | 'bug' | 'milestone' | 'meeting';
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

export type TabType = 'dashboard' | 'docs' | 'tasks' | 'features' | 'bugs' | 'calendar' | 'files' | 'chat';