import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Project, Document, Task, Bug, Feature, FeatureData, FeatureFile, CalendarEvent, FileItem, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Note: Removed global state to fix state synchronization issues

export const useSupabaseProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [featureData, setFeatureData] = useState<FeatureData[]>([]);
  const [featureFiles, setFeatureFiles] = useState<FeatureFile[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load user's data from Supabase
  useEffect(() => {
    if (user && !dataLoaded) {
      loadAllData();
    } else if (!user) {
      // Clear data when user logs out
      setProjects([]);
      setDocuments([]);
      setTasks([]);
      setFeatures([]);
      setFeatureData([]);
      setFeatureFiles([]);
      setBugs([]);
      setEvents([]);
      setFiles([]);
      setMessages([]);
      setLoading(false);
      setDataLoaded(false);
    }
  }, [user, dataLoaded]);

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
          loadFeatureData(projectIds),
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
      setDataLoaded(true);
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
    setFeatureData(loadUserData('featureData'));
    setFeatureFiles(loadUserData('featureFiles'));
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
        featureId: t.feature_id || undefined,
        bugId: t.bug_id || undefined,
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

  const loadFeatureData = async (projectIds: string[]) => {
    const { data, error } = await supabase
      .from('feature_data')
      .select('*')
      .in('project_id', projectIds)
      .order('feature_id', { ascending: false })
      .order('order', { ascending: true });

    if (!error && data) {
      const formattedData = data.map(fd => ({
        ...fd,
        featureId: fd.feature_id,
        projectId: fd.project_id,
        dataType: fd.data_type,
        contentType: fd.content_type,
        parentId: fd.parent_id,
        fileSize: fd.file_size || 0,
        tags: fd.tags || [],
        metadata: fd.metadata || {},
        settings: fd.settings || {},
        createdAt: new Date(fd.created_at),
        updatedAt: new Date(fd.updated_at),
        accessedAt: new Date(fd.accessed_at),
        createdBy: fd.created_by,
        updatedBy: fd.updated_by
      }));
      setFeatureData(formattedData);
      
      // Filter info files for backward compatibility
      const infoFiles = formattedData
        .filter(fd => fd.dataType === 'info_file')
        .map(fd => ({
          ...fd,
          type: fd.metadata?.fileType || 'custom'
        })) as FeatureFile[];
      setFeatureFiles(infoFiles);
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

  const deleteDocument = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Try to delete from Supabase
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting document from Supabase:', error);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }

    // Always update local state
    const updated = documents.filter(d => d.id !== id);
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

    // Also delete related feature data
    const updatedData = featureData.filter(fd => fd.featureId !== id);
    setFeatureData(updatedData);
    saveToLocalStorage('featureData', updatedData);
    
    const updatedFiles = featureFiles.filter(ff => ff.featureId !== id);
    setFeatureFiles(updatedFiles);
    saveToLocalStorage('featureFiles', updatedFiles);
  };

  const createFeatureFile = async (featureId: string, name: string, type: FeatureFile['type'], existingFeature?: Feature) => {
    if (!user) throw new Error('User not authenticated');

    const feature = existingFeature || features.find(f => f.id === featureId);
    if (!feature) throw new Error('Feature not found');

    // Find the highest order number for this feature's info files
    const existingFiles = featureData.filter(fd => fd.featureId === featureId && fd.dataType === 'info_file');
    const maxOrder = existingFiles.length > 0 ? Math.max(...existingFiles.map(ff => ff.order)) : 0;

    const newData: FeatureData = {
      id: uuidv4(),
      featureId,
      projectId: feature.projectId,
      dataType: 'info_file',
      name,
      content: '',
      contentType: 'markdown',
      order: maxOrder + 1,
      fileSize: 0,
      tags: [],
      status: 'active',
      priority: 'medium',
      metadata: { fileType: type },
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      accessedAt: new Date(),
    };

    const newFile: FeatureFile = {
      ...newData,
      type
    };

    try {
      // Save to Supabase
      const { error } = await supabase
        .from('feature_data')
        .insert([{
          id: newData.id,
          feature_id: featureId,
          project_id: feature.projectId,
          data_type: 'info_file',
          name: newData.name,
          content: newData.content,
          content_type: 'markdown',
          order: newData.order,
          file_size: 0,
          tags: [],
          status: 'active',
          priority: 'medium',
          metadata: { fileType: type },
          settings: {}
        }]);

      if (error) {
        console.error('Error creating feature file in Supabase:', error);
      }
    } catch (error) {
      console.error('Error creating feature file:', error);
    }

    // Update local state using functional setState to avoid race conditions
    setFeatureData(prevData => {
      const updatedData = [...prevData, newData];
      saveToLocalStorage('featureData', updatedData);
      return updatedData;
    });
    
    setFeatureFiles(prevFiles => {
      const updatedFiles = [...prevFiles, newFile];
      saveToLocalStorage('featureFiles', updatedFiles);
      return updatedFiles;
    });
    
    return newFile;
  };

  const updateFeatureFile = async (id: string, updates: Partial<FeatureFile>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Prepare updates for the new table structure
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.content) dbUpdates.content = updates.content;
      if (updates.language) dbUpdates.language = updates.language;
      if (updates.order) dbUpdates.order = updates.order;
      if (updates.type) dbUpdates.metadata = { fileType: updates.type };
      
      // Update in Supabase
      const { error } = await supabase
        .from('feature_data')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating feature file in Supabase:', error);
      }
    } catch (error) {
      console.error('Error updating feature file:', error);
    }

    // Update local state
    const updatedData = featureData.map(fd => 
      fd.id === id ? { ...fd, ...updates, updatedAt: new Date() } : fd
    );
    setFeatureData(updatedData);
    saveToLocalStorage('featureData', updatedData);
    
    const updatedFiles = featureFiles.map(ff => 
      ff.id === id ? { ...ff, ...updates, updatedAt: new Date() } : ff
    );
    setFeatureFiles(updatedFiles);
    saveToLocalStorage('featureFiles', updatedFiles);
  };

  const deleteFeatureFile = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('feature_data')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting feature file from Supabase:', error);
      }
    } catch (error) {
      console.error('Error deleting feature file:', error);
    }

    // Update local state
    const updatedData = featureData.filter(fd => fd.id !== id);
    setFeatureData(updatedData);
    saveToLocalStorage('featureData', updatedData);
    
    const updatedFiles = featureFiles.filter(ff => ff.id !== id);
    setFeatureFiles(updatedFiles);
    saveToLocalStorage('featureFiles', updatedFiles);
  };

  const createTask = async (projectId: string, title: string, description: string, priority: Task['priority'] = 'medium', status: Task['status'] = 'todo', featureId?: string, bugId?: string) => {
    if (!user) throw new Error('User not authenticated');

    const newTask: Task = {
      id: uuidv4(),
      projectId,
      title,
      description,
      status,
      priority,
      featureId,
      bugId,
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
          priority: newTask.priority,
          feature_id: featureId,
          bug_id: bugId
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
      // Try to save to Supabase (only using existing columns)
      const { error } = await supabase
        .from('bugs')
        .insert([{
          id: newBug.id,
          project_id: projectId,
          title: newBug.title,
          description: newBug.description,
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
    featureData,
    featureFiles,
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
    deleteDocument,
    createFeature,
    updateFeature,
    deleteFeature,
    createFeatureFile,
    updateFeatureFile,
    deleteFeatureFile,
    createTask,
    updateTask,
    deleteTask,
    createBug,
    updateBug,
    deleteBug,
    addMessage,
  };
};