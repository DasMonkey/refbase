import { useState, useEffect } from 'react';
import { Project, Document, Task, Bug, CalendarEvent, FileItem, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  PROJECTS: 'projects',
  DOCUMENTS: 'documents',
  TASKS: 'tasks',
  BUGS: 'bugs',
  EVENTS: 'events',
  FILES: 'files',
  MESSAGES: 'messages',
};

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Load data from localStorage
    const loadData = (key: string) => {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    };

    setProjects(loadData(STORAGE_KEYS.PROJECTS));
    setDocuments(loadData(STORAGE_KEYS.DOCUMENTS));
    setTasks(loadData(STORAGE_KEYS.TASKS));
    setBugs(loadData(STORAGE_KEYS.BUGS));
    setEvents(loadData(STORAGE_KEYS.EVENTS));
    setFiles(loadData(STORAGE_KEYS.FILES));
    setMessages(loadData(STORAGE_KEYS.MESSAGES));
  }, []);

  const saveData = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const createProject = (name: string, description: string, icon: string, color: string) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      description,
      icon,
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    saveData(STORAGE_KEYS.PROJECTS, updated);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updated = projects.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    );
    setProjects(updated);
    saveData(STORAGE_KEYS.PROJECTS, updated);
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveData(STORAGE_KEYS.PROJECTS, updated);
    
    // Clean up related data
    setDocuments(prev => prev.filter(d => d.projectId !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    setBugs(prev => prev.filter(b => b.projectId !== id));
    setEvents(prev => prev.filter(e => e.projectId !== id));
    setFiles(prev => prev.filter(f => f.projectId !== id));
    setMessages(prev => prev.filter(m => m.projectId !== id));
  };

  const createDocument = (projectId: string, title: string, type: Document['type']) => {
    const newDoc: Document = {
      id: uuidv4(),
      projectId,
      title,
      content: '',
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [...documents, newDoc];
    setDocuments(updated);
    saveData(STORAGE_KEYS.DOCUMENTS, updated);
    return newDoc;
  };

  const updateDocument = (id: string, updates: Partial<Document>) => {
    const updated = documents.map(d => 
      d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
    );
    setDocuments(updated);
    saveData(STORAGE_KEYS.DOCUMENTS, updated);
  };

  const createTask = (projectId: string, title: string, description: string, priority: Task['priority'] = 'medium') => {
    const newTask: Task = {
      id: uuidv4(),
      projectId,
      title,
      description,
      status: 'todo',
      priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveData(STORAGE_KEYS.TASKS, updated);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => 
      t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
    );
    setTasks(updated);
    saveData(STORAGE_KEYS.TASKS, updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveData(STORAGE_KEYS.TASKS, updated);
  };

  const createBug = (projectId: string, title: string, description: string) => {
    const newBug: Bug = {
      id: uuidv4(),
      projectId,
      title,
      description,
      status: 'open',
      severity: 'medium',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [...bugs, newBug];
    setBugs(updated);
    saveData(STORAGE_KEYS.BUGS, updated);
    return newBug;
  };

  const updateBug = (id: string, updates: Partial<Bug>) => {
    const updated = bugs.map(b => 
      b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b
    );
    setBugs(updated);
    saveData(STORAGE_KEYS.BUGS, updated);
  };

  const deleteBug = (id: string) => {
    const updated = bugs.filter(b => b.id !== id);
    setBugs(updated);
    saveData(STORAGE_KEYS.BUGS, updated);
  };

  const addMessage = (projectId: string, author: string, content: string) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      projectId,
      author,
      content,
      timestamp: new Date(),
    };
    const updated = [...messages, newMessage];
    setMessages(updated);
    saveData(STORAGE_KEYS.MESSAGES, updated);
    return newMessage;
  };

  return {
    projects,
    documents,
    tasks,
    bugs,
    events,
    files,
    messages,
    createProject,
    updateProject,
    deleteProject,
    createDocument,
    updateDocument,
    createTask,
    updateTask,
    deleteTask,
    createBug,
    updateBug,
    deleteBug,
    addMessage,
  };
};