import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Project, Document, Task, Bug, Feature, CalendarEvent, FileItem, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useSupabaseProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's data from Supabase
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Clear data when user logs out
      setProjects([]);
      setDocuments([]);
      setTasks([]);
      setFeatures([]);
      setBugs([]);
      setEvents([]);
      setFiles([]);
      setMessages([]);
      setLoading(false);
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        // Fallback to localStorage for now
        loadFromLocalStorage();
        return;
      }

      const formattedProjects = projectsData?.map(p => ({
        ...p,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at)
      })) || [];

      setProjects(formattedProjects);

      if (formattedProjects.length > 0) {
        const projectIds = formattedProjects.map(p => p.id);

        // Load all related data
        await Promise.all([
          loadDocuments(projectIds),
          loadTasks(projectIds),
          loadFeatures(projectIds),
          loadBugs(projectIds),
          loadMessages(projectIds),
          loadFiles(projectIds)
        ]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    // Fallback to localStorage with user-specific keys
    const userKey = `user_${user?.id}`;
    
    const loadUserData = (key: string) => {
      try {
        const data = localStorage.getItem(`${userKey}_${key}`);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    };

    setProjects(loadUserData('projects'));
    setDocuments(loadUserData('documents'));
    setTasks(loadUserData('tasks'));
    setFeatures(loadUserData('features'));
    setBugs(loadUserData('bugs'));
    setEvents(loadUserData('events'));
    setFiles(loadUserData('files'));
    setMessages(loadUserData('messages'));
  };

  const loadDocuments = async (projectIds: string[]) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedDocs = data.map(d => ({
        ...d,
        projectId: d.project_id,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at)
      }));
      setDocuments(formattedDocs);
    }
  };

  const loadTasks = async (projectIds: string[]) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedTasks = data.map(t => ({
        ...t,
        projectId: t.project_id,
        dueDate: t.due_date ? new Date(t.due_date) : undefined,
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at)
      }));
      setTasks(formattedTasks);
    }
  };

  const loadFeatures = async (projectIds: string[]) => {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedFeatures = data.map(f => ({
        ...f,
        projectId: f.project_id,
        createdAt: new Date(f.created_at),
        updatedAt: new Date(f.updated_at)
      }));
      setFeatures(formattedFeatures);
    }
  };

  const loadBugs = async (projectIds: string[]) => {
    const { data, error } = await supabase
      .from('bugs')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedBugs = data.map(b => ({
        ...b,
        projectId: b.project_id,
        createdAt: new Date(b.created_at),
        updatedAt: new Date(b.updated_at)
      }));
      setBugs(formattedBugs);
    }
  };

  const loadMessages = async (projectIds: string[]) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .in('project_id', projectIds)
      .order('timestamp', { ascending: true });

    if (!error && data) {
      const formattedMessages = data.map(m => ({
        ...m,
        projectId: m.project_id,
        timestamp: new Date(m.timestamp)
      }));
      setMessages(formattedMessages);
    }
  };

  const loadFiles = async (projectIds: string[]) => {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .in('project_id', projectIds)
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      const formattedFiles = data.map(f => ({
        ...f,
        projectId: f.project_id,
        size: f.size_bytes,
        type: f.file_type,
        uploadedAt: new Date(f.uploaded_at)
      }));
      setFiles(formattedFiles);
    }
  };

  const saveToLocalStorage = (key: string, data: any) => {
    if (!user) return;
    const userKey = `user_${user.id}`;
    localStorage.setItem(`${userKey}_${key}`, JSON.stringify(data));
  };

  const createProject = async (name: string, description: string, icon: string, color: string) => {
    if (!user) throw new Error('User not authenticated');

    const newProject: Project = {
      id: uuidv4(),
      name,
      description,
      icon,
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Try to save to Supabase first
      const { error } = await supabase
        .from('projects')
        .insert([{
          id: newProject.id,
          name: newProject.name,
          description: newProject.description,
          icon: newProject.icon,
          color: newProject.color,
          user_id: user.id
        }]);

      if (error) {
        console.error('Error creating project in Supabase:', error);
        // Fallback to localStorage
        const updated = [...projects, newProject];
        setProjects(updated);
        saveToLocalStorage('projects', updated);
        return newProject;
      }

      // Success - update local state
      const updated = [...projects, newProject];
      setProjects(updated);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      // Fallback to localStorage
      const updated = [...projects, newProject];
      setProjects(updated);
      saveToLocalStorage('projects', updated);
      return newProject;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Try to update in Supabase
      const { error } = await supabase
        .from('projects')
        .update({
          name: updates.name,
          description: updates.description,
          icon: updates.icon,
          color: updates.color,
          status: updates.status
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating project in Supabase:', error);
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }

    // Always update local state
    const updated = projects.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    );
    setProjects(updated);
    saveToLocalStorage('projects', updated);
  };

  const deleteProject = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Try to delete from Supabase
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting project from Supabase:', error);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }

    // Always update local state
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveToLocalStorage('projects', updated);
    
    // Clean up related data
    const updatedDocs = documents.filter(d => d.projectId !== id);
    const updatedTasks = tasks.filter(t => t.projectId !== id);
    const updatedFeatures = features.filter(f => f.projectId !== id);
    const updatedBugs = bugs.filter(b => b.projectId !== id);
    const updatedEvents = events.filter(e => e.projectId !== id);
    const updatedFiles = files.filter(f => f.projectId !== id);
    const updatedMessages = messages.filter(m => m.projectId !== id);

    setDocuments(updatedDocs);
    setTasks(updatedTasks);
    setFeatures(updatedFeatures);
    setBugs(updatedBugs);
    setEvents(updatedEvents);
    setFiles(updatedFiles);
    setMessages(updatedMessages);

    saveToLocalStorage('documents', updatedDocs);
    saveToLocalStorage('tasks', updatedTasks);
    saveToLocalStorage('features', updatedFeatures);
    saveToLocalStorage('bugs', updatedBugs);
    saveToLocalStorage('events', updatedEvents);
    saveToLocalStorage('files', updatedFiles);
    saveToLocalStorage('messages', updatedMessages);
  };

  const createDocument = async (projectId: string, title: string, type: Document['type']) => {
    if (!user) throw new Error('User not authenticated');

    const newDoc: Document = {
      id: uuidv4(),
      projectId,
      title,
      content: '',
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Try to save to Supabase
      const { error } = await supabase
        .from('documents')
        .insert([{
          id: newDoc.id,
          project_id: projectId,
          title: newDoc.title,
          content: newDoc.content,
          type: newDoc.type
        }]);

      if (error) {
        console.error('Error creating document in Supabase:', error);
      }
    } catch (error) {
      console.error('Error creating document:', error);
    }

    // Always update local state
    const updated = [...documents, newDoc];
    setDocuments(updated);
    saveToLocalStorage('documents', updated);
    return newDoc;
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Try to update in Supabase
      const { error } = await supabase
        .from('documents')
        .update({
          title: updates.title,
          content: updates.content,
          type: updates.type,
          language: updates.language
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating document in Supabase:', error);
      }
    } catch (error) {
      console.error('Error updating document:', error);
    }

    // Always update local state
    const updated = documents.map(d => 
      d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
    );
    setDocuments(updated);
    saveToLocalStorage('documents', updated);
  };

  const createFeature = async (projectId: string, title: string, type: Feature['type']) => {
    if (!user) throw new Error('User not authenticated');

    const newFeature: Feature = {
      id: uuidv4(),
      projectId,
      title,
      content: '',
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Try to save to Supabase
      const { error } = await supabase
        .from('features')
        .insert([{
          id: newFeature.id,
          project_id: projectId,
          title: newFeature.title,
          content: newFeature.content,
          type: newFeature.type
        }]);

      if (error) {
        console.error('Error creating feature in Supabase:', error);
      }
    } catch (error) {
      console.error('Error creating feature:', error);
    }

    // Always update local state
    const updated = [...features, newFeature];
    setFeatures(updated);
    saveToLocalStorage('features', updated);
    return newFeature;
  };

  const updateFeature = async (id: string, updates: Partial<Feature>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Try to update in Supabase
      const { error } = await supabase
        .from('features')
        .update({
          title: updates.title,
          content: updates.content,
          type: updates.type,
          language: updates.language
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating feature in Supabase:', error);
      }
    } catch (error) {
      console.error('Error updating feature:', error);
    }

    // Always update local state
    const updated = features.map(f => 
      f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f
    );
    setFeatures(updated);
    saveToLocalStorage('features', updated);
  };

  const deleteFeature = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Try to delete from Supabase
      const { error } = await supabase
        .from('features')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting feature from Supabase:', error);
      }
    } catch (error) {
      console.error('Error deleting feature:', error);
    }

    // Always update local state
    const updated = features.filter(f => f.id !== id);
    setFeatures(updated);
    saveToLocalStorage('features', updated);
  };

  const createTask = async (projectId: string, title: string, description: string, priority: Task['priority'] = 'medium', status: Task['status'] = 'todo') => {
    if (!user) throw new Error('User not authenticated');

    const newTask: Task = {
      id: uuidv4(),
      projectId,
      title,
      description,
      status,
      priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Try to save to Supabase
      const { error } = await supabase
        .from('tasks')
        .insert([{
          id: newTask.id,
          project_id: projectId,
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority
        }]);

      if (error) {
        console.error('Error creating task in Supabase:', error);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }

    // Always update local state
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveToLocalStorage('tasks', updated);
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Try to update in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description,
          status: updates.status,
          priority: updates.priority,
          assignee: updates.assignee,
          due_date: updates.dueDate?.toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating task in Supabase:', error);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }

    // Always update local state
    const updated = tasks.map(t => 
      t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
    );
    setTasks(updated);
    saveToLocalStorage('tasks', updated);
  };

  const deleteTask = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Try to delete from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting task from Supabase:', error);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }

    // Always update local state
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveToLocalStorage('tasks', updated);
  };

  const createBug = async (projectId: string, title: string, type: Bug['type']) => {
    if (!user) throw new Error('User not authenticated');

    const newBug: Bug = {
      id: uuidv4(),
      projectId,
      title,
      description: '',
      content: '',
      type,
      status: 'open',
      severity: 'medium',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Try to save to Supabase
      const { error } = await supabase
        .from('bugs')
        .insert([{
          id: newBug.id,
          project_id: projectId,
          title: newBug.title,
          description: newBug.description,
          content: newBug.content,
          type: newBug.type,
          status: newBug.status,
          severity: newBug.severity,
          attachments: newBug.attachments
        }]);

      if (error) {
        console.error('Error creating bug in Supabase:', error);
      }
    } catch (error) {
      console.error('Error creating bug:', error);
    }

    // Always update local state
    const updated = [...bugs, newBug];
    setBugs(updated);
    saveToLocalStorage('bugs', updated);
    return newBug;
  };

  const updateBug = async (id: string, updates: Partial<Bug>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Try to update in Supabase
      const { error } = await supabase
        .from('bugs')
        .update({
          title: updates.title,
          description: updates.description,
          content: updates.content,
          type: updates.type,
          language: updates.language,
          status: updates.status,
          severity: updates.severity,
          assignee: updates.assignee,
          attachments: updates.attachments
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating bug in Supabase:', error);
      }
    } catch (error) {
      console.error('Error updating bug:', error);
    }

    // Always update local state
    const updated = bugs.map(b => 
      b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b
    );
    setBugs(updated);
    saveToLocalStorage('bugs', updated);
  };

  const deleteBug = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Try to delete from Supabase
      const { error } = await supabase
        .from('bugs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting bug from Supabase:', error);
      }
    } catch (error) {
      console.error('Error deleting bug:', error);
    }

    // Always update local state
    const updated = bugs.filter(b => b.id !== id);
    setBugs(updated);
    saveToLocalStorage('bugs', updated);
  };

  const addMessage = async (projectId: string, author: string, content: string) => {
    if (!user) throw new Error('User not authenticated');

    const newMessage: ChatMessage = {
      id: uuidv4(),
      projectId,
      author,
      content,
      timestamp: new Date(),
    };

    try {
      // Try to save to Supabase
      const { error } = await supabase
        .from('messages')
        .insert([{
          id: newMessage.id,
          project_id: projectId,
          author: newMessage.author,
          content: newMessage.content
        }]);

      if (error) {
        console.error('Error creating message in Supabase:', error);
      }
    } catch (error) {
      console.error('Error creating message:', error);
    }

    // Always update local state
    const updated = [...messages, newMessage];
    setMessages(updated);
    saveToLocalStorage('messages', updated);
    return newMessage;
  };

  return {
    projects,
    documents,
    tasks,
    features,
    bugs,
    events,
    files,
    messages,
    loading,
    createProject,
    updateProject,
    deleteProject,
    createDocument,
    updateDocument,
    createFeature,
    updateFeature,
    deleteFeature,
    createTask,
    updateTask,
    deleteTask,
    createBug,
    updateBug,
    deleteBug,
    addMessage,
  };
};