import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Edit3, Brain, MessageSquare, Upload, History, Info, CheckSquare, Edit, Search, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { FiPlus, FiTrash } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { Project, Feature, FeatureFile, Task } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useTheme } from '../contexts/ThemeContext';
import { EnhancedEditor } from './ui/EnhancedEditor';
import { DeleteConfirmationModal } from './ui/DeleteConfirmationModal';
import { KanbanBoard } from './KanbanBoard';

// Custom sorting icons
const SortAscIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" className={className}>
    <rect x="2" y="10" width="10" height="1.5" rx="0.75" />
    <rect x="2" y="6" width="7" height="1.5" rx="0.75" />
    <rect x="2" y="2" width="4" height="1.5" rx="0.75" />
  </svg>
);

const SortDescIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" className={className}>
    <rect x="2" y="2" width="10" height="1.5" rx="0.75" />
    <rect x="2" y="6" width="7" height="1.5" rx="0.75" />
    <rect x="2" y="10" width="4" height="1.5" rx="0.75" />
  </svg>
);

interface FeaturesTabProps {
  project: Project;
}

const featureTypes = [
  { id: 'user-story', label: 'User Story', description: 'Feature from user perspective' },
  { id: 'enhancement', label: 'Enhancement', description: 'Improvement to existing functionality' },
  { id: 'new-feature', label: 'New Feature', description: 'Completely new functionality' },
  { id: 'integration', label: 'Integration', description: 'Third-party service integration' },
  { id: 'performance', label: 'Performance', description: 'Performance optimization feature' },
  { id: 'custom', label: 'Custom Feature', description: 'Create a custom feature' },
];

const statusOptions = [
  { id: 'planned' as const, label: 'Planned', description: 'Feature is planned for development' },
  { id: 'in-progress' as const, label: 'In Progress', description: 'Feature is currently being developed' },
  { id: 'testing' as const, label: 'Testing', description: 'Feature is being tested' },
  { id: 'implemented' as const, label: 'Implemented', description: 'Feature has been implemented' },
];

const statusColors = {
  planned: 'bg-purple-100 text-purple-800 border-purple-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  implemented: 'bg-green-100 text-green-800 border-green-200',
  testing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const statusColorsDark = {
  planned: 'bg-purple-900/50 text-purple-200 border-purple-700',
  'in-progress': 'bg-blue-900/50 text-blue-200 border-blue-700',
  implemented: 'bg-green-900/50 text-green-200 border-green-700',
  testing: 'bg-yellow-900/50 text-yellow-200 border-yellow-700',
};

const featureFileTypes = [
  { id: 'requirement' as const, label: 'Requirements', description: 'Feature requirements and specifications', icon: FileText, defaultName: 'requirements.md' },
  { id: 'structure' as const, label: 'Structure', description: 'Architecture and data structures', icon: Edit3, defaultName: 'structure.md' },
  { id: 'implementation' as const, label: 'Implementation', description: 'Implementation details and code', icon: Edit, defaultName: 'implementation.md' },
  { id: 'testing' as const, label: 'Testing', description: 'Test cases and testing strategy', icon: CheckSquare, defaultName: 'testing.md' },
  { id: 'documentation' as const, label: 'Documentation', description: 'User documentation and guides', icon: FileText, defaultName: 'documentation.md' },
  { id: 'notes' as const, label: 'Notes', description: 'Additional notes and thoughts', icon: Edit3, defaultName: 'notes.md' },
  { id: 'chat' as const, label: 'Chat History', description: 'Imported conversation or chat logs', icon: MessageSquare, defaultName: 'conversation.md' },
  { id: 'custom' as const, label: 'Custom', description: 'Custom file type', icon: FileText, defaultName: 'custom.md' },
];

export const FeaturesTab: React.FC<FeaturesTabProps> = ({ project }) => {
  const { features, featureFiles, createFeature, updateFeature, deleteFeature, createFeatureFile, updateFeatureFile, deleteFeatureFile, tasks, createTask, updateTask, deleteTask } = useSupabaseProjects();
  const { isDark } = useTheme();
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(() => {
    const savedFeatureId = localStorage.getItem(`selectedFeature_${project.id}`);
    if (savedFeatureId) {
      // We'll set this properly after features are loaded
      return null;
    }
    return null;
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [newFeatureType, setNewFeatureType] = useState<Feature['type']>('custom');
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'tasks' | 'ai-summary' | 'chat-history'>(() => {
    const saved = localStorage.getItem(`featureSubTab_${project.id}`);
    return (saved as 'info' | 'tasks' | 'ai-summary' | 'chat-history') || 'info';
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [selectedFeatureFile, setSelectedFeatureFile] = useState<FeatureFile | null>(null);
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<FeatureFile['type']>('requirement');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFileFilterPopup, setShowFileFilterPopup] = useState(false);
  const [fileSortBy, setFileSortBy] = useState<'name' | 'created' | 'updated'>('created');
  const [fileSortOrder, setFileSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isPlannedExpanded, setIsPlannedExpanded] = useState(() => {
    const saved = localStorage.getItem(`plannedFeaturesExpanded_${project.id}`);
    return saved ? JSON.parse(saved) : true; // Default open
  });
  const [isInProgressExpanded, setIsInProgressExpanded] = useState(() => {
    const saved = localStorage.getItem(`inProgressFeaturesExpanded_${project.id}`);
    return saved ? JSON.parse(saved) : true; // Default open
  });
  const [isImplementedExpanded, setIsImplementedExpanded] = useState(() => {
    const saved = localStorage.getItem(`implementedFeaturesExpanded_${project.id}`);
    return saved ? JSON.parse(saved) : false; // Default collapsed
  });
  const [isTestingExpanded, setIsTestingExpanded] = useState(() => {
    const saved = localStorage.getItem(`testingFeaturesExpanded_${project.id}`);
    return saved ? JSON.parse(saved) : true; // Default open
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  
  // Chat History specific states
  const [selectedChatFile, setSelectedChatFile] = useState<FeatureFile | null>(null);
  const [showCreateChatFileModal, setShowCreateChatFileModal] = useState(false);
  const [newChatFileName, setNewChatFileName] = useState('');
  const [chatFileSearchQuery, setChatFileSearchQuery] = useState('');
  const [showChatFileFilterPopup, setShowChatFileFilterPopup] = useState(false);
  const [chatFileSortBy, setChatFileSortBy] = useState<'name' | 'created' | 'updated'>('created');
  const [chatFileSortOrder, setChatFileSortOrder] = useState<'asc' | 'desc'>('desc');
  const [importText, setImportText] = useState('');

  // Check if filters are active (not default)
  const isFilterActive = sortBy !== 'created' || sortOrder !== 'desc';
  const isFileFilterActive = fileSortBy !== 'created' || fileSortOrder !== 'desc';

  // Reset filters to default
  const resetFilter = () => {
    setSortBy('created');
    setSortOrder('desc');
  };

  const resetFileFilter = () => {
    setFileSortBy('created');
    setFileSortOrder('desc');
  };

  // Chat file specific filter helpers
  const isChatFileFilterActive = chatFileSortBy !== 'created' || chatFileSortOrder !== 'desc';
  
  const resetChatFileFilter = () => {
    setChatFileSortBy('created');
    setChatFileSortOrder('desc');
  };

  const projectFeatures = features.filter(f => f.projectId === project.id);
  
  // Filter and sort features based on search query and sort options
  const filteredFeatures = projectFeatures
    .filter(feature => 
      searchQuery === '' || 
      feature.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.content?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Split filtered features by status
  const plannedFeatures = filteredFeatures.filter(feature => feature.status === 'planned');
  const inProgressFeatures = filteredFeatures.filter(feature => feature.status === 'in-progress');
  const implementedFeatures = filteredFeatures.filter(feature => feature.status === 'implemented');
  const testingFeatures = filteredFeatures.filter(feature => feature.status === 'testing');

  // Filter and sort feature files based on search query and sort options
  const currentFeatureFiles = selectedFeature ? featureFiles.filter(f => f.featureId === selectedFeature.id) : [];
  const filteredFeatureFiles = currentFeatureFiles
    .filter(file => 
      fileSearchQuery === '' || 
      file.name?.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
      file.content?.toLowerCase().includes(fileSearchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (fileSortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return fileSortOrder === 'asc' ? comparison : -comparison;
    });

  // Filter and sort chat files specifically
  const currentChatFiles = selectedFeature ? featureFiles.filter(f => f.featureId === selectedFeature.id && f.type === 'chat') : [];
  const filteredChatFiles = currentChatFiles
    .filter(file => 
      chatFileSearchQuery === '' || 
      file.name?.toLowerCase().includes(chatFileSearchQuery.toLowerCase()) ||
      file.content?.toLowerCase().includes(chatFileSearchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (chatFileSortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return chatFileSortOrder === 'asc' ? comparison : -comparison;
    });

  // Tasks for selected feature
  const featureTasks = React.useMemo(() => 
    selectedFeature ? tasks.filter(t => t.projectId === project.id && t.featureId === selectedFeature.id) : [], 
    [tasks, project.id, selectedFeature?.id]
  );

  // Sync localTasks with featureTasks
  useEffect(() => {
    setLocalTasks(featureTasks);
  }, [featureTasks]);


  // Restore selected feature when features are loaded
  useEffect(() => {
    const savedFeatureId = localStorage.getItem(`selectedFeature_${project.id}`);
    if (savedFeatureId && features.length > 0 && !selectedFeature) {
      const feature = features.find(f => f.id === savedFeatureId && f.projectId === project.id);
      if (feature) {
        setSelectedFeature(feature);
      }
    }
  }, [features, project.id, selectedFeature]);

  // Save selectedFeature to localStorage whenever it changes
  useEffect(() => {
    if (selectedFeature) {
      localStorage.setItem(`selectedFeature_${project.id}`, selectedFeature.id);
    } else {
      localStorage.removeItem(`selectedFeature_${project.id}`);
    }
  }, [selectedFeature, project.id]);

  // Save activeSubTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`featureSubTab_${project.id}`, activeSubTab);
  }, [activeSubTab, project.id]);

  // Save section expanded states
  useEffect(() => {
    localStorage.setItem(`plannedFeaturesExpanded_${project.id}`, JSON.stringify(isPlannedExpanded));
    localStorage.setItem(`inProgressFeaturesExpanded_${project.id}`, JSON.stringify(isInProgressExpanded));
    localStorage.setItem(`implementedFeaturesExpanded_${project.id}`, JSON.stringify(isImplementedExpanded));
    localStorage.setItem(`testingFeaturesExpanded_${project.id}`, JSON.stringify(isTestingExpanded));
  }, [isPlannedExpanded, isInProgressExpanded, isImplementedExpanded, isTestingExpanded, project.id]);

  // Reset scroll position and selected files when switching features
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    // Clear selected chat file when switching features
    setSelectedChatFile(null);
    // Don't reset to 'info' - keep the user's preferred sub-tab
  }, [selectedFeature?.id]);

  const handleTasksChange = async (newTasks: Task[]) => {
    setLocalTasks(newTasks);
    
    for (const task of newTasks) {
      const originalTask = featureTasks.find(t => t.id === task.id);
      
      if (originalTask && originalTask.status !== task.status) {
        await updateTask(task.id, { status: task.status });
      } else if (!originalTask && task.id.startsWith('temp-')) {
        try {
          const createdTask = await createTask(project.id, task.title, task.description, task.priority, task.status, selectedFeature?.id);
          setLocalTasks(prevTasks => 
            prevTasks.map(t => t.id === task.id ? { ...t, id: createdTask.id, projectId: project.id, featureId: selectedFeature?.id } : t)
          );
        } catch (error) {
          console.error('Failed to create task:', error);
        }
      }
    }

    const permanentTasks = newTasks.filter(t => !t.id.startsWith('temp-'));
    featureTasks.forEach(originalTask => {
      if (!permanentTasks.find(t => t.id === originalTask.id)) {
        deleteTask(originalTask.id);
      }
    });
  };

  const handleUpdateTask = async (taskId: string, newTitle: string) => {
    const updatedTasks = localTasks.map(task => 
      task.id === taskId ? { ...task, title: newTitle } : task
    );
    setLocalTasks(updatedTasks);
    
    if (!taskId.startsWith('temp-')) {
      try {
        await updateTask(taskId, { title: newTitle });
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    }
  };

  const handleCreateFeature = async () => {
    if (newFeatureTitle.trim()) {
      const feature = await createFeature(project.id, newFeatureTitle, newFeatureType);
      
      // Create default files for the new feature
      const defaultFiles = [
        { name: 'requirements.md', type: 'requirement' as const },
        { name: 'structure.md', type: 'structure' as const },
        { name: 'implementation.md', type: 'implementation' as const },
      ];
      
      const createdFiles = [];
      for (const file of defaultFiles) {
        const createdFile = await createFeatureFile(feature.id, file.name, file.type, feature);
        createdFiles.push(createdFile);
      }
      
      setSelectedFeature(feature);
      setShowCreateModal(false);
      setNewFeatureTitle('');
      setNewFeatureType('custom');
      
      // Auto-select the first file (requirements) - use the actual created file
      const firstFile = createdFiles.find(file => file.name === 'requirements.md');
      if (firstFile) {
        setSelectedFeatureFile(firstFile);
      }
    }
  };

  const handleDeleteFeature = () => {
    if (selectedFeature) {
      setShowDeleteConfirmation(true);
    }
  };

  const confirmDeleteFeature = () => {
    if (selectedFeature) {
      deleteFeature(selectedFeature.id);
      setSelectedFeature(null);
      setShowDeleteConfirmation(false);
    }
  };

  const handleDeleteFeatureFile = () => {
    if (selectedFeatureFile) {
      setShowDeleteConfirmation(true);
    }
  };

  const confirmDeleteFeatureFile = () => {
    if (selectedFeatureFile) {
      deleteFeatureFile(selectedFeatureFile.id);
      setSelectedFeatureFile(null);
      setShowDeleteConfirmation(false);
    }
  };

  const handleStartTitleEdit = () => {
    if (selectedFeature) {
      setEditingTitle(selectedFeature.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitleEdit = async () => {
    if (selectedFeature && editingTitle.trim() && editingTitle.trim() !== selectedFeature.title) {
      await updateFeature(selectedFeature.id, { title: editingTitle.trim() });
      setSelectedFeature({ ...selectedFeature, title: editingTitle.trim() });
    }
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitleEdit();
    } else if (e.key === 'Escape') {
      handleCancelTitleEdit();
    }
  };

  const handleStatusChange = async (newStatus: Feature['status']) => {
    if (selectedFeature && newStatus !== selectedFeature.status) {
      await updateFeature(selectedFeature.id, { status: newStatus });
      setSelectedFeature({ ...selectedFeature, status: newStatus });
    }
    setShowStatusPopup(false);
  };

  const handleCreateFeatureFile = async () => {
    if (selectedFeature && newFileName.trim()) {
      const newFile = await createFeatureFile(selectedFeature.id, newFileName.trim(), newFileType);
      setSelectedFeatureFile(newFile);
      setShowCreateFileModal(false);
      setNewFileName('');
      setNewFileType('requirement');
    }
  };

  const handleSaveFeatureFile = () => {
    if (selectedFeatureFile) {
      updateFeatureFile(selectedFeatureFile.id, { 
        content: selectedFeatureFile.content,
        language: selectedFeatureFile.language 
      });
    }
  };

  const handleFileContentChange = (content: string) => {
    if (selectedFeatureFile) {
      setSelectedFeatureFile({ ...selectedFeatureFile, content });
    }
  };

  const handleFileLanguageChange = (language: string) => {
    if (selectedFeatureFile) {
      setSelectedFeatureFile({ ...selectedFeatureFile, language });
    }
  };

  // Chat file handlers
  const handleCreateChatFile = async () => {
    if (selectedFeature && newChatFileName.trim()) {
      const newFile = await createFeatureFile(selectedFeature.id, newChatFileName.trim(), 'chat');
      setSelectedChatFile(newFile);
      setShowCreateChatFileModal(false);
      setNewChatFileName('');
    }
  };

  const handleSaveChatFile = () => {
    if (selectedChatFile) {
      updateFeatureFile(selectedChatFile.id, { 
        content: selectedChatFile.content,
        language: selectedChatFile.language 
      });
    }
  };

  const handleChatFileContentChange = (content: string) => {
    if (selectedChatFile) {
      setSelectedChatFile({ ...selectedChatFile, content });
    }
  };

  const handleChatFileLanguageChange = (language: string) => {
    if (selectedChatFile) {
      setSelectedChatFile({ ...selectedChatFile, language });
    }
  };

  const handleImportText = async () => {
    if (selectedFeature && importText.trim()) {
      const fileName = `chat-${new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')}.md`;
      const newFile = await createFeatureFile(selectedFeature.id, fileName, 'chat');
      
      // Update the file with the imported content
      const updatedFile = { ...newFile, content: importText.trim() };
      setSelectedChatFile(updatedFile);
      await updateFeatureFile(newFile.id, { content: importText.trim() });
      
      setImportText('');
    }
  };

  const subTabs = [
    { id: 'info' as const, label: 'Info', icon: Info },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
    { id: 'ai-summary' as const, label: 'AI Summary', icon: Brain },
    { id: 'chat-history' as const, label: 'Chat History', icon: MessageSquare },
  ];

  const renderSubTabContent = () => {
    if (!selectedFeature) return null;

    switch (activeSubTab) {
      case 'info':
        return renderInfoSection();
      case 'tasks':
        return renderTasksSection();
      case 'ai-summary':
        return renderAISummarySection();
      case 'chat-history':
        return renderChatHistorySection();
      default:
        return renderInfoSection();
    }
  };

  const renderInfoSection = () => {
    if (!selectedFeature) return null;

    // Get files for this feature
    // const currentFeatureFiles = featureFiles
    //   .filter(ff => ff.featureId === selectedFeature.id)
    //   .sort((a, b) => a.order - b.order);

    return (
      <div className="flex h-full w-full overflow-hidden">
        {/* File List Sidebar */}
        <div className={`w-64 border-r flex flex-col flex-shrink-0`} style={{ 
          backgroundColor: isDark ? '#0f0f0f' : '#f8fafc',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}>
          <div className={`p-4 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
            <button
              onClick={() => setShowCreateFileModal(true)}
              className={`w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium transition-all duration-200 border ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600' 
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Plus size={16} className="mr-2" />
              <span>New File</span>
            </button>
          </div>

          <div className={`p-3`}>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search 
                  size={16} 
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} 
                />
                <input
                  type="text"
                  value={fileSearchQuery}
                  onChange={(e) => setFileSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  style={{ 
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    backgroundColor: isDark ? '#111111' : '#ffffff',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowFileFilterPopup(!showFileFilterPopup)}
                  className={`relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Filter size={16} />
                  {isFileFilterActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </button>
                
                {showFileFilterPopup && (
                  <>
                    <div 
                      className="fixed inset-0 z-50" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFileFilterPopup(false);
                      }}
                    />
                    <div 
                      className="absolute top-full right-0 mt-1 w-48 rounded-lg shadow-xl z-[9999]"
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                      }}
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sort by</div>
                          {isFileFilterActive && (
                            <button
                              onClick={() => {
                                resetFileFilter();
                                setShowFileFilterPopup(false);
                              }}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {[
                            { key: 'name' as const, label: 'Name' },
                            { key: 'created' as const, label: 'Date Created' },
                            { key: 'updated' as const, label: 'Date Updated' }
                          ].map((option) => (
                            <button
                              key={option.key}
                              onClick={() => {
                                if (fileSortBy === option.key) {
                                  setFileSortOrder(fileSortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setFileSortBy(option.key);
                                  setFileSortOrder('desc');
                                }
                                setShowFileFilterPopup(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 text-sm rounded transition-colors ${
                                fileSortBy === option.key 
                                  ? (isDark ? 'bg-gray-700' : 'bg-gray-100') 
                                  : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                              }`}
                            >
                              <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{option.label}</span>
                              {fileSortBy === option.key && (
                                fileSortOrder === 'desc' 
                                  ? <SortDescIcon size={14} className={isDark ? 'fill-gray-200' : 'fill-gray-800'} />
                                  : <SortAscIcon size={14} className={isDark ? 'fill-gray-200' : 'fill-gray-800'} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto px-3 pb-3 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
            <div className="space-y-1">
              {filteredFeatureFiles.map((file) => {
                const fileTypeInfo = featureFileTypes.find(ft => ft.id === file.type);
                const Icon = fileTypeInfo?.icon || FileText;
                
                return (
                  <div key={file.id} className="relative group">
                    <motion.button
                      onClick={() => setSelectedFeatureFile(file)}
                      className={`w-full text-left p-3 pr-10 transition-all duration-100 border-l-2 ${
                        selectedFeatureFile?.id === file.id
                          ? `${isDark ? 'bg-gray-800 border-l-gray-600' : 'bg-gray-100 border-l-gray-400'}`
                          : `hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-l-transparent`
                      }`}
                      whileHover={{ x: 8 }}
                      transition={{ duration: 0.08, ease: "easeOut" }}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={14} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} truncate`}>{file.name}</div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} capitalize`}>
                              {fileTypeInfo?.label || file.type}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                            <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                              {new Date(file.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                    
                    {/* Inline file delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFeatureFile(file); // Select file first to ensure it's set for deletion
                        handleDeleteFeatureFile();
                      }}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                        isDark 
                          ? 'hover:bg-red-900/50 text-red-400 hover:text-red-300' 
                          : 'hover:bg-red-100 text-red-500 hover:text-red-600'
                      }`}
                      title="Delete File"
                    >
                      <FiTrash size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredFeatureFiles.length === 0 && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                <FileText className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                {fileSearchQuery ? (
                  <>
                    <p className="text-sm font-medium mb-1">No files found</p>
                    <p className="text-xs">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">No files yet</p>
                    <p className="text-xs">Create your first file</p>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* File Counter */}
          <div className={`px-3 py-2 border-t text-center`} style={{ 
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
            backgroundColor: isDark ? '#0f0f0f' : '#f8fafc'
          }}>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {filteredFeatureFiles.length} {filteredFeatureFiles.length === 1 ? 'file' : 'files'}
              {fileSearchQuery && ` (filtered from ${featureFiles.filter(f => f.featureId === selectedFeature?.id).length})`}
            </span>
          </div>
        </div>

        {/* File Editor */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {selectedFeatureFile ? (
            <>
              {/* File Content Editor */}
              <div className={`flex-1 min-h-0`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
                <div className="h-full p-4">
                  <div className={`h-full border rounded-lg overflow-hidden`} style={{ 
                    backgroundColor: isDark ? '#111111' : '#ffffff',
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
                  }}>
                    <EnhancedEditor
                      content={selectedFeatureFile.content}
                      onChange={handleFileContentChange}
                      language={selectedFeatureFile.language || 'markdown'}
                      onLanguageChange={handleFileLanguageChange}
                      placeholder={`Add ${selectedFeatureFile.type} details...`}
                      fileName={selectedFeatureFile.name}
                      onBlur={handleSaveFeatureFile}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={`flex-1 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
              <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                <FileText className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium mb-1">Select a file to edit</p>
                <p className="text-xs">Choose from the file list or create a new file</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTasksSection = () => {
    if (!selectedFeature) return null;

    return (
      <div className={`flex-1 min-h-0 overflow-hidden`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <KanbanBoard 
          tasks={localTasks}
          onTasksChange={handleTasksChange}
          onUpdateTask={handleUpdateTask}
        />
      </div>
    );
  };


  const renderAISummarySection = () => {
    if (!selectedFeature) return null;

    return (
      <div className={`flex-1 min-h-0 p-4`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div 
          className={`w-full h-full border rounded-lg overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`} 
          style={{ 
            backgroundColor: isDark ? '#111111' : '#ffffff',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}
        >
          <div className="p-6 space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-2`}>AI Summary & Analysis</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Generate clean implementation guides from your imported chat conversations
              </p>
            </div>

            {/* Available Chat Files */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Available Chat Files ({filteredChatFiles.length})
                </h4>
                {filteredChatFiles.length === 0 && (
                  <button
                    onClick={() => setActiveSubTab('chat-history')}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Import Chats
                  </button>
                )}
              </div>

              {filteredChatFiles.length > 0 ? (
                <div className="space-y-2">
                  {filteredChatFiles.map((file) => (
                    <div 
                      key={file.id}
                      className={`p-3 border rounded-lg ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <MessageSquare size={14} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                              {file.name}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {new Date(file.updatedAt).toLocaleDateString()} • {file.content?.length || 0} characters
                            </div>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          className="rounded"
                          defaultChecked={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <MessageSquare className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium mb-1">No chat files available</p>
                  <p className="text-xs">Import conversations in the Chat History tab first</p>
                </div>
              )}
            </div>

            {/* Generation Options */}
            {filteredChatFiles.length > 0 && (
              <div className="space-y-4">
                <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Generate Documentation
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    className={`p-4 text-left border rounded-lg transition-colors ${
                      isDark 
                        ? 'border-gray-600 hover:bg-gray-800 text-gray-200' 
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className="font-medium">Requirements</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Extract feature requirements from conversations
                    </p>
                  </button>

                  <button 
                    className={`p-4 text-left border rounded-lg transition-colors ${
                      isDark 
                        ? 'border-gray-600 hover:bg-gray-800 text-gray-200' 
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Edit3 size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className="font-medium">Structure</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Generate architecture and data structures
                    </p>
                  </button>

                  <button 
                    className={`p-4 text-left border rounded-lg transition-colors ${
                      isDark 
                        ? 'border-gray-600 hover:bg-gray-800 text-gray-200' 
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Edit size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className="font-medium">Implementation</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Create implementation guides and code examples
                    </p>
                  </button>

                  <button 
                    className={`p-4 text-left border rounded-lg transition-colors ${
                      isDark 
                        ? 'border-gray-600 hover:bg-gray-800 text-gray-200' 
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Brain size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className="font-medium">Full Summary</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Generate complete documentation package
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Generated Content Preview */}
            <div className="space-y-4">
              <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Preview & Actions
              </h4>
              
              <div className={`p-4 border rounded-lg ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <Brain className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium mb-1">No content generated yet</p>
                  <p className="text-xs">Select generation options above to create documentation</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <button 
                    disabled
                    className={`px-3 py-1.5 text-xs rounded border transition-colors opacity-50 cursor-not-allowed ${
                      isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
                    }`}
                  >
                    Copy to Info Tab
                  </button>
                  <button 
                    disabled
                    className={`px-3 py-1.5 text-xs rounded border transition-colors opacity-50 cursor-not-allowed ${
                      isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
                    }`}
                  >
                    Export
                  </button>
                </div>
                <button 
                  disabled
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed text-sm"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChatHistorySection = () => {
    if (!selectedFeature) return null;

    return (
      <div className="flex h-full w-full overflow-hidden">
        {/* Chat File List Sidebar */}
        <div className={`w-64 border-r flex flex-col flex-shrink-0`} style={{ 
          backgroundColor: isDark ? '#0f0f0f' : '#f8fafc',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}>
          <div className={`p-4 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
            <button
              onClick={() => setShowCreateChatFileModal(true)}
              className={`w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium transition-all duration-200 border ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600' 
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Plus size={16} className="mr-2" />
              <span>New Chat</span>
            </button>
          </div>

          <div className={`p-3`}>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search 
                  size={16} 
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} 
                />
                <input
                  type="text"
                  value={chatFileSearchQuery}
                  onChange={(e) => setChatFileSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  style={{ 
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    backgroundColor: isDark ? '#111111' : '#ffffff',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowChatFileFilterPopup(!showChatFileFilterPopup)}
                  className={`relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Filter size={16} />
                  {isChatFileFilterActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </button>
                
                {showChatFileFilterPopup && (
                  <>
                    <div 
                      className="fixed inset-0 z-50" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowChatFileFilterPopup(false);
                      }}
                    />
                    <div 
                      className="absolute top-full right-0 mt-1 w-48 rounded-lg shadow-xl z-[9999]"
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                      }}
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sort by</div>
                          {isChatFileFilterActive && (
                            <button
                              onClick={() => {
                                resetChatFileFilter();
                                setShowChatFileFilterPopup(false);
                              }}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {[
                            { key: 'name' as const, label: 'Name' },
                            { key: 'created' as const, label: 'Date Created' },
                            { key: 'updated' as const, label: 'Date Updated' }
                          ].map((option) => (
                            <button
                              key={option.key}
                              onClick={() => {
                                if (chatFileSortBy === option.key) {
                                  setChatFileSortOrder(chatFileSortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setChatFileSortBy(option.key);
                                  setChatFileSortOrder('desc');
                                }
                                setShowChatFileFilterPopup(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 text-sm rounded transition-colors ${
                                chatFileSortBy === option.key 
                                  ? (isDark ? 'bg-gray-700' : 'bg-gray-100') 
                                  : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                              }`}
                            >
                              <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{option.label}</span>
                              {chatFileSortBy === option.key && (
                                chatFileSortOrder === 'desc' 
                                  ? <SortDescIcon size={14} className={isDark ? 'fill-gray-200' : 'fill-gray-800'} />
                                  : <SortAscIcon size={14} className={isDark ? 'fill-gray-200' : 'fill-gray-800'} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto px-3 pb-3 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
            <div className="space-y-1">
              {filteredChatFiles.map((file) => {
                return (
                  <motion.button
                    key={file.id}
                    onClick={() => setSelectedChatFile(file)}
                    className={`w-full text-left p-3 transition-all duration-100 border-l-2 ${
                      selectedChatFile?.id === file.id
                        ? `${isDark ? 'bg-gray-800 border-l-gray-600' : 'bg-gray-100 border-l-gray-400'}`
                        : `hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-l-transparent`
                    }`}
                    whileHover={{ x: 8 }}
                    transition={{ duration: 0.08, ease: "easeOut" }}
                  >
                    <div className="flex items-center space-x-3">
                      <MessageSquare size={14} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} truncate`}>{file.name}</div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} capitalize`}>
                            Chat History
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                          <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {new Date(file.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {filteredChatFiles.length === 0 && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                <MessageSquare className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                {chatFileSearchQuery ? (
                  <>
                    <p className="text-sm font-medium mb-1">No chats found</p>
                    <p className="text-xs">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">No chat history yet</p>
                    <p className="text-xs">Import your first conversation</p>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Import Section */}
          <div className={`p-4 border-t`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
            <div className="space-y-3">
              <div className={`p-3 border-2 border-dashed rounded-lg ${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50/50'}`}>
                <div className="text-center">
                  <Upload className={`w-6 h-6 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Drop files or paste text</p>
                  <button className={`px-3 py-1.5 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'} border transition-colors`}>
                    Choose Files
                  </button>
                </div>
              </div>
              
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste conversation here..."
                rows={4}
                className={`w-full p-3 border resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs rounded-lg`}
                style={{ 
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#000000'
                }}
              />
              
              <button 
                onClick={handleImportText}
                disabled={!importText.trim()}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Chat
              </button>
            </div>
          </div>
          
          {/* Chat Counter */}
          <div className={`px-3 py-2 border-t text-center`} style={{ 
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
            backgroundColor: isDark ? '#0f0f0f' : '#f8fafc'
          }}>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {filteredChatFiles.length} {filteredChatFiles.length === 1 ? 'chat' : 'chats'}
              {chatFileSearchQuery && ` (filtered from ${currentChatFiles.length})`}
            </span>
          </div>
        </div>

        {/* Chat File Editor */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {selectedChatFile ? (
            <>
              {/* Chat File Content Editor */}
              <div className={`flex-1 min-h-0`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
                <div className="h-full p-4">
                  <div className={`h-full border rounded-lg overflow-hidden`} style={{ 
                    backgroundColor: isDark ? '#111111' : '#ffffff',
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
                  }}>
                    <EnhancedEditor
                      content={selectedChatFile.content}
                      onChange={handleChatFileContentChange}
                      language={selectedChatFile.language || 'markdown'}
                      onLanguageChange={handleChatFileLanguageChange}
                      placeholder="Import or paste your conversation history here..."
                      fileName={selectedChatFile.name}
                      onBlur={handleSaveChatFile}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={`flex-1 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
              <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                <MessageSquare className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium mb-1">Select a chat to view</p>
                <p className="text-xs">Import conversations to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper function to render status sections with features (auto-hide if empty)
  const renderStatusSection = (
    title: string,
    features: Feature[],
    isExpanded: boolean,
    setExpanded: (expanded: boolean) => void,
    statusColors: { [key: string]: string }
  ) => {
    // Auto-hide if no features in this status
    if (features.length === 0) {
      return null;
    }

    return (
      <div className="mb-2">
        <div
          className={`flex items-center justify-between py-2 px-3 cursor-pointer transition-colors ${
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          }`}
          onClick={() => setExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            ) : (
              <ChevronRight size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            )}
            <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              {title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${statusColors}`}>
              {features.length}
            </span>
          </div>
        </div>
        
        {isExpanded && (
          <div className="space-y-1">
            {features.map((feature) => (
              <div key={feature.id} className="relative group">
                <motion.button
                  onClick={() => {
                    // Clear selected file when switching to a different feature
                    if (selectedFeature?.id !== feature.id) {
                      setSelectedFeatureFile(null);
                    }
                    setSelectedFeature(feature);
                  }}
                  className={`w-full text-left p-3 pr-10 transition-all duration-100 border-l-2 ${
                    selectedFeature?.id === feature.id
                      ? `${isDark ? 'bg-gray-800 border-l-gray-600' : 'bg-gray-100 border-l-gray-400'}`
                      : `hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-l-transparent`
                  }`}
                  whileHover={{ x: 8 }}
                  transition={{ duration: 0.08, ease: "easeOut" }}
                >
                  <div className="flex items-center space-x-3">
                    <FileText size={14} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} truncate`}>{feature.title}</div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} capitalize`}>
                          {feature.type ? feature.type.replace('-', ' ') : 'Feature'}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {new Date(feature.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
                
                {/* Inline feature delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFeature(feature);
                    handleDeleteFeature();
                  }}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                    isDark 
                      ? 'hover:bg-red-900/50 text-red-400 hover:text-red-300' 
                      : 'hover:bg-red-100 text-red-500 hover:text-red-600'
                  }`}
                  title="Delete feature"
                >
                  <FiTrash size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Feature List */}
      <div className={`w-64 border-r flex flex-col flex-shrink-0`} style={{ 
        backgroundColor: isDark ? '#111111' : '#f8fafc',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className={`p-4 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium transition-all duration-200 border ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Plus size={16} className="mr-2" />
            <span>New Feature</span>
          </button>
        </div>

        <div className={`p-3`}>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search 
                size={16} 
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features..."
                className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                style={{ 
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                  backgroundColor: isDark ? '#111111' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000'
                }}
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowFilterPopup(!showFilterPopup)}
                className={`relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Filter size={16} />
                {isFilterActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                )}
              </button>
              
              {showFilterPopup && (
                <>
                  <div 
                    className="fixed inset-0 z-50" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFilterPopup(false);
                    }}
                  />
                  <div 
                    className="absolute top-full right-0 mt-1 w-48 rounded-lg shadow-xl z-[9999]"
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                    }}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sort by</div>
                        {isFilterActive && (
                          <button
                            onClick={() => {
                              resetFilter();
                              setShowFilterPopup(false);
                            }}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {[
                          { key: 'name' as const, label: 'Name' },
                          { key: 'created' as const, label: 'Date Created' },
                          { key: 'updated' as const, label: 'Date Updated' }
                        ].map((option) => (
                          <button
                            key={option.key}
                            onClick={() => {
                              if (sortBy === option.key) {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortBy(option.key);
                                setSortOrder('desc');
                              }
                              setShowFilterPopup(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 text-sm rounded transition-colors ${
                              sortBy === option.key 
                                ? (isDark ? 'bg-gray-700' : 'bg-gray-100') 
                                : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                            }`}
                          >
                            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{option.label}</span>
                            {sortBy === option.key && (
                              sortOrder === 'desc' 
                                ? <SortDescIcon size={14} className={isDark ? 'fill-gray-200' : 'fill-gray-800'} />
                                : <SortAscIcon size={14} className={isDark ? 'fill-gray-200' : 'fill-gray-800'} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto px-3 pb-3 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
          <div className="space-y-2">
            {/* Planned Features */}
            {renderStatusSection(
              'Planned',
              plannedFeatures,
              isPlannedExpanded,
              setIsPlannedExpanded,
              isDark ? statusColorsDark.planned : statusColors.planned
            )}
            
            {/* In Progress Features */}
            {renderStatusSection(
              'In Progress',
              inProgressFeatures,
              isInProgressExpanded,
              setIsInProgressExpanded,
              isDark ? statusColorsDark['in-progress'] : statusColors['in-progress']
            )}
            
            {/* Testing Features */}
            {renderStatusSection(
              'Testing',
              testingFeatures,
              isTestingExpanded,
              setIsTestingExpanded,
              isDark ? statusColorsDark.testing : statusColors.testing
            )}
            
            {/* Implemented Features */}
            {renderStatusSection(
              'Implemented',
              implementedFeatures,
              isImplementedExpanded,
              setIsImplementedExpanded,
              isDark ? statusColorsDark.implemented : statusColors.implemented
            )}
          </div>

          {filteredFeatures.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <FileText className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              {searchQuery ? (
                <>
                  <p className="text-sm font-medium mb-1">No features found</p>
                  <p className="text-xs">Try a different search term</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">No features yet</p>
                  <p className="text-xs">Create your first feature to get started</p>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Feature Counter */}
        <div className={`px-3 py-2 border-t text-center`} style={{ 
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
          backgroundColor: isDark ? '#0f0f0f' : '#f8fafc'
        }}>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {filteredFeatures.length} {filteredFeatures.length === 1 ? 'feature' : 'features'}
            {searchQuery && ` (filtered from ${projectFeatures.length})`}
          </span>
        </div>
      </div>

      {/* Feature Editor */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {selectedFeature ? (
          <>
            {/* Combined Feature Header & Navigation */}
            <div className={`px-6 py-4 flex-shrink-0`} style={{ 
              backgroundColor: isDark ? '#111111' : '#ffffff'
            }}>
              {/* Title Row with inline metadata */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {isEditingTitle ? (
                    <>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        onBlur={handleSaveTitleEdit}
                        autoFocus
                        className={`text-xl font-semibold bg-transparent border rounded px-2 py-0 h-8 ${
                          isDark 
                            ? 'text-gray-200 border-gray-600 focus:border-blue-400' 
                            : 'text-gray-900 border-gray-300 focus:border-blue-500'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        style={{ 
                          width: `${Math.max(150, editingTitle.length * 11 + 20)}px`,
                          maxWidth: '300px'
                        }}
                      />
                      <button
                        onClick={handleSaveTitleEdit}
                        className={`p-1 rounded hover:bg-gray-700 transition-colors ${
                          isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                        }`}
                        title="Save"
                      >
                        <CheckSquare size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {selectedFeature.title}
                      </h2>
                      <button
                        onClick={handleStartTitleEdit}
                        className={`p-1 rounded hover:bg-gray-700 transition-colors ${
                          isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                        }`}
                        title="Rename feature"
                      >
                        <Edit size={16} />
                      </button>
                    </>
                  )}
                  
                  {/* Inline metadata - smaller and compact */}
                  <div className="flex items-center space-x-2 ml-2">
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      {selectedFeature.type ? selectedFeature.type.replace('-', ' ').toUpperCase() : 'FEATURE'}
                    </span>
                    
                    {/* Status Tag */}
                    <div className="relative">
                      <button
                        onClick={() => setShowStatusPopup(!showStatusPopup)}
                        className={`px-2 py-1 text-xs font-medium border transition-all duration-200 cursor-pointer ${
                          isDark 
                            ? statusColorsDark[selectedFeature.status || 'planned']
                            : statusColors[selectedFeature.status || 'planned']
                        }`}
                        title={`Current status: ${statusOptions.find(s => s.id === selectedFeature.status)?.label || 'Planned'}`}
                        style={{ padding: '4px 8px' }}
                      >
                        {statusOptions.find(s => s.id === selectedFeature.status)?.label || 'Planned'}
                      </button>
                      
                      {showStatusPopup && (
                        <>
                          <div 
                            className="fixed inset-0 z-[9998]" 
                            onClick={() => setShowStatusPopup(false)}
                          />
                          <div 
                            className="absolute top-full right-0 mt-1 w-48 rounded-lg shadow-xl z-[9999]"
                            style={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff',
                              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                            }}
                          >
                            <div className="p-2">
                              {statusOptions.map((status) => (
                                <button
                                  key={status.id}
                                  onClick={() => handleStatusChange(status.id)}
                                  className={`w-full text-left p-2 text-sm rounded transition-colors ${
                                    selectedFeature.status === status.id
                                      ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') 
                                      : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700')
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className={`font-medium ${
                                        isDark ? statusColorsDark[status.id].split(' ')[1] : statusColors[status.id].split(' ')[1]
                                      }`}>
                                        {status.label}
                                      </div>
                                      <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {status.description}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Updated {new Date(selectedFeature.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub Navigation Row */}
              <nav className="flex space-x-1">
                {subTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveSubTab(tab.id);
                      }}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeSubTab === tab.id
                          ? `${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow-sm`
                          : `${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`
                      }`}
                    >
                      <Icon size={16} className="mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sub Tab Content */}
            {renderSubTabContent()}
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
            <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <FileText className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className="text-lg font-medium mb-2">Select a feature to view</p>
              <p className="text-sm">Choose from the list or create a new feature</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Feature Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl p-6 w-full max-w-md mx-4 border`}
            style={{ 
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}
          >
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Create New Feature</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Feature Title
                </label>
                <input
                  type="text"
                  value={newFeatureTitle}
                  onChange={(e) => setNewFeatureTitle(e.target.value)}
                  placeholder="Enter feature title"
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  style={{ 
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Feature Type
                </label>
                <div className="space-y-3">
                  {featureTypes.map((type) => (
                    <label key={type.id} className="flex items-start space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="featureType"
                        value={type.id}
                        checked={newFeatureType === type.id}
                        onChange={(e) => setNewFeatureType(e.target.value as Feature['type'])}
                        className="mt-1 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-blue-500 transition-colors`}>{type.label}</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-4 py-2 rounded-xl transition-colors font-medium`}
                style={{ 
                  color: isDark ? '#d1d5db' : '#374151',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFeature}
                disabled={!newFeatureTitle.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Feature File Modal */}
      {showCreateFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl p-6 w-full max-w-md mx-4 border`}
            style={{ 
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}
          >
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Create New File</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  File Name
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter file name"
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  style={{ 
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  File Type
                </label>
                <div className="space-y-3">
                  {featureFileTypes.map((type) => (
                    <label key={type.id} className="flex items-start space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="fileType"
                        value={type.id}
                        checked={newFileType === type.id}
                        onChange={(e) => setNewFileType(e.target.value as FeatureFile['type'])}
                        className="mt-1 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <type.icon size={14} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-blue-500 transition-colors`}>
                            {type.label}
                          </div>
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1 ml-5`}>
                          {type.description}
                        </div>
                        {newFileType === type.id && !newFileName && (
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1 ml-5`}>
                            Default: {type.defaultName}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowCreateFileModal(false);
                  setNewFileName('');
                  setNewFileType('requirement');
                }}
                className={`px-4 py-2 rounded-xl transition-colors font-medium`}
                style={{ 
                  color: isDark ? '#d1d5db' : '#374151',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const finalFileName = newFileName.trim() || featureFileTypes.find(ft => ft.id === newFileType)?.defaultName || 'untitled.md';
                  setNewFileName(finalFileName);
                  handleCreateFeatureFile();
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Chat File Modal */}
      {showCreateChatFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl p-6 w-full max-w-md mx-4 border`}
            style={{ 
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}
          >
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Create New Chat File</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Chat File Name
                </label>
                <input
                  type="text"
                  value={newChatFileName}
                  onChange={(e) => setNewChatFileName(e.target.value)}
                  placeholder="Enter chat file name"
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  style={{ 
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowCreateChatFileModal(false);
                  setNewChatFileName('');
                }}
                className={`px-4 py-2 rounded-xl transition-colors font-medium`}
                style={{ 
                  color: isDark ? '#d1d5db' : '#374151',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const finalFileName = newChatFileName.trim() || `conversation-${new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')}.md`;
                  setNewChatFileName(finalFileName);
                  handleCreateChatFile();
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={selectedFeatureFile ? confirmDeleteFeatureFile : confirmDeleteFeature}
        title={selectedFeatureFile ? "Delete File" : "Delete Feature"}
        message={selectedFeatureFile 
          ? "Are you sure you want to delete this file? This action cannot be undone."
          : "Are you sure you want to delete this feature? All associated files and data will be permanently removed."
        }
        itemName={selectedFeatureFile ? selectedFeatureFile.name : selectedFeature?.title}
      />
    </div>
  );
};

