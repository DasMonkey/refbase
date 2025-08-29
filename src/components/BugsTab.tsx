import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bug, AlertCircle, CheckCircle, Clock, Tag, Brain, MessageSquare, History, Info, Settings, CheckSquare, Edit, ChevronDown, ChevronRight, Search, Filter } from 'lucide-react';
import { FiPlus, FiTrash } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { Project, Bug as BugType, Task } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useTheme } from '../contexts/ThemeContext';
import { BlockEditor } from './ui/BlockEditor';
import { DeleteConfirmationModal } from './ui/DeleteConfirmationModal';
import { stringToBlocks, blocksToString } from '../utils/blockNoteUtils';
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

interface BugsTabProps {
  project: Project;
  filterByFeatureId?: string; // Filter bugs to show only ones linked to this feature
}

const bugTypes = [
  { id: 'ui-bug', label: 'UI Bug', description: 'Visual or user interface issues' },
  { id: 'functional-bug', label: 'Functional Bug', description: 'Feature not working as expected' },
  { id: 'performance-bug', label: 'Performance Bug', description: 'Slow or inefficient behavior' },
  { id: 'security-bug', label: 'Security Bug', description: 'Security vulnerability or concern' },
  { id: 'data-bug', label: 'Data Bug', description: 'Data corruption or inconsistency' },
  { id: 'integration-bug', label: 'Integration Bug', description: 'Third-party service integration issue' },
];

const severityColors = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

const severityOptions = [
  { id: 'low' as const, label: 'Low', description: 'Minor issues that don\'t impact functionality' },
  { id: 'medium' as const, label: 'Medium', description: 'Issues that affect functionality but have workarounds' },
  { id: 'high' as const, label: 'High', description: 'Major issues that significantly impact functionality' },
  { id: 'critical' as const, label: 'Critical', description: 'Severe issues that block core functionality' },
];

const statusOptions = [
  { id: 'open' as const, label: 'Open', description: 'Bug is reported and needs to be addressed' },
  { id: 'in-progress' as const, label: 'In Progress', description: 'Bug is being worked on' },
  { id: 'fixed' as const, label: 'Fixed', description: 'Bug has been resolved' },
  { id: 'wont-fix' as const, label: 'Won\'t Fix', description: 'Bug will not be addressed' },
];

const statusIcons = {
  open: AlertCircle,
  'in-progress': Clock,
  fixed: CheckCircle,
  'wont-fix': Tag,
};

export const BugsTab: React.FC<BugsTabProps> = ({ project, filterByFeatureId }) => {
  const { bugs, createBug, updateBug, deleteBug, features, tasks, createTask, updateTask, deleteTask, loading } = useSupabaseProjects();
  const { isDark } = useTheme();
  
  // Use different localStorage keys for sub-tab vs main tab to avoid conflicts
  const storagePrefix = filterByFeatureId ? `featureBug_${filterByFeatureId}` : `selectedBug_${project.id}`;
  const subTabStorageKey = filterByFeatureId ? `featureBugSubTab_${filterByFeatureId}` : `bugSubTab_${project.id}`;
  
  const [selectedBug, setSelectedBug] = useState<BugType | null>(null);
  const [isProjectSwitching, setIsProjectSwitching] = useState(false);
  const currentProjectRef = useRef(project.id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBugTitle, setNewBugTitle] = useState('');
  const [newBugType, setNewBugType] = useState<BugType['type']>('functional-bug');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'tasks' | 'reproduction' | 'analysis'>(() => {
    const saved = localStorage.getItem(subTabStorageKey);
    return (saved as 'info' | 'tasks' | 'reproduction' | 'analysis') || 'info';
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [showSeverityPopup, setShowSeverityPopup] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeatureFilter, setSelectedFeatureFilter] = useState<string | null>(null);
  const [showFeatureFilterPopup, setShowFeatureFilterPopup] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'severity'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isOpenExpanded, setIsOpenExpanded] = useState(() => {
    const saved = localStorage.getItem(`openBugsExpanded_${project.id}`);
    return saved ? JSON.parse(saved) : true; // Default open
  });
  const [isInProgressExpanded, setIsInProgressExpanded] = useState(() => {
    const saved = localStorage.getItem(`inProgressBugsExpanded_${project.id}`);
    return saved ? JSON.parse(saved) : true; // Default open
  });
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(() => {
    const saved = localStorage.getItem(`completedBugsExpanded_${project.id}`);
    return saved ? JSON.parse(saved) : false; // Default collapsed
  });
  const [isOthersExpanded, setIsOthersExpanded] = useState(() => {
    const saved = localStorage.getItem(`othersBugsExpanded_${project.id}`);
    return saved ? JSON.parse(saved) : false; // Default collapsed
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const forceSaveRef = useRef<(() => void) | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // Check if filter is active (not default)
  const isFilterActive = sortBy !== 'created' || sortOrder !== 'desc';

  // Reset filter to default
  const resetFilter = () => {
    setSortBy('created');
    setSortOrder('desc');
  };

  const projectBugs = bugs.filter(b => 
    b.projectId === project.id && 
    (filterByFeatureId ? b.featureId === filterByFeatureId : true)
  );
  
  // Get project features for feature filter dropdown
  const projectFeatures = features.filter(f => f.projectId === project.id);
  
  // Filter and sort bugs based on search query, feature filter, and sort options
  const filteredBugs = projectBugs
    .filter(bug => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        bug.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bug.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bug.content?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Feature filter
      const matchesFeature = !selectedFeatureFilter || bug.featureId === selectedFeatureFilter;
      
      return matchesSearch && matchesFeature;
    })
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
        case 'severity':
          const severityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
  // Split filtered bugs by status
  const openBugs = filteredBugs.filter(bug => bug.status === 'open');
  const inProgressBugs = filteredBugs.filter(bug => bug.status === 'in-progress');
  const completedBugs = filteredBugs.filter(bug => bug.status === 'fixed');
  const othersBugs = filteredBugs.filter(bug => bug.status === 'wont-fix');

  // Tasks for selected bug
  const bugTasks = React.useMemo(() => 
    selectedBug ? tasks.filter(t => t.projectId === project.id && t.bugId === selectedBug.id) : [], 
    [tasks, project.id, selectedBug?.id]
  );

  // Sync localTasks with bugTasks
  useEffect(() => {
    setLocalTasks(bugTasks);
  }, [bugTasks]);

  // Save section expanded states
  useEffect(() => {
    localStorage.setItem(`openBugsExpanded_${project.id}`, JSON.stringify(isOpenExpanded));
    localStorage.setItem(`inProgressBugsExpanded_${project.id}`, JSON.stringify(isInProgressExpanded));
    localStorage.setItem(`completedBugsExpanded_${project.id}`, JSON.stringify(isCompletedExpanded));
    localStorage.setItem(`othersBugsExpanded_${project.id}`, JSON.stringify(isOthersExpanded));
  }, [isOpenExpanded, isInProgressExpanded, isCompletedExpanded, isOthersExpanded, project.id]);

  // Handle project switching
  useEffect(() => {
    if (!filterByFeatureId && currentProjectRef.current !== project.id) {
      setIsProjectSwitching(true);
      setSelectedBug(null);
      currentProjectRef.current = project.id;
      
      const timer = setTimeout(() => {
        setIsProjectSwitching(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [project.id, filterByFeatureId]);

  // Restore selected bug when bugs are loaded and project is stable
  useEffect(() => {
    if (!loading && !isProjectSwitching && bugs.length > 0) {
      const savedBugId = localStorage.getItem(storagePrefix);
      if (savedBugId && !selectedBug) {
        const bug = bugs.find(b => 
          b.id === savedBugId && 
          b.projectId === project.id && 
          (!filterByFeatureId || b.featureId === filterByFeatureId)
        );
        if (bug) {
          setSelectedBug(bug);
        }
      }
    }
  }, [bugs, project.id, selectedBug, storagePrefix, filterByFeatureId, loading, isProjectSwitching]);

  // Save selectedBug to localStorage whenever it changes
  useEffect(() => {
    if (selectedBug) {
      localStorage.setItem(storagePrefix, selectedBug.id);
    } else {
      localStorage.removeItem(storagePrefix);
    }
  }, [selectedBug, storagePrefix]);

  // Save activeSubTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(subTabStorageKey, activeSubTab);
  }, [activeSubTab, subTabStorageKey]);

  // Reset scroll position when switching bugs
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedBug?.id]);


  const handleTasksChange = async (newTasks: Task[]) => {
    setLocalTasks(newTasks);
    
    for (const task of newTasks) {
      const originalTask = bugTasks.find(t => t.id === task.id);
      
      if (originalTask && originalTask.status !== task.status) {
        await updateTask(task.id, { status: task.status });
      } else if (!originalTask && task.id.startsWith('temp-')) {
        try {
          const createdTask = await createTask(project.id, task.title, task.description, task.priority, task.status, undefined, selectedBug?.id);
          setLocalTasks(prevTasks => 
            prevTasks.map(t => t.id === task.id ? { ...t, id: createdTask.id, projectId: project.id } : t)
          );
        } catch (error) {
          console.error('Failed to create task:', error);
        }
      }
    }

    const permanentTasks = newTasks.filter(t => !t.id.startsWith('temp-'));
    bugTasks.forEach(originalTask => {
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

  const handleCreateBug = async () => {
    if (newBugTitle.trim()) {
      // Use filterByFeatureId if provided, otherwise use selectedFeatureId
      const featureIdToUse = filterByFeatureId || selectedFeatureId;
      const bug = await createBug(project.id, newBugTitle, newBugType, featureIdToUse);
      setSelectedBug(bug);
      setShowCreateModal(false);
      setNewBugTitle('');
      setNewBugType('functional-bug');
      setSelectedFeatureId(null);
    }
  };

  const handleSaveBug = (contentOverride?: string) => {
    if (selectedBug) {
      updateBug(selectedBug.id, { 
        content: contentOverride || selectedBug.content,
        language: selectedBug.language 
      });
    }
  };

  const handleDeleteBug = () => {
    if (selectedBug) {
      setShowDeleteConfirmation(true);
    }
  };

  const handleDeleteBugFromList = (bug: BugType) => {
    setSelectedBug(bug);
    setShowDeleteConfirmation(true);
  };


  const confirmDeleteBug = () => {
    if (selectedBug) {
      deleteBug(selectedBug.id);
      setSelectedBug(null);
      setShowDeleteConfirmation(false);
    }
  };

  const handleContentChange = (content: string) => {
    if (selectedBug) {
      setSelectedBug({ ...selectedBug, content });
    }
  };

  const handleSaveWithContent = (content: string) => {
    if (selectedBug) {
      updateBug(selectedBug.id, { 
        content,
        language: selectedBug.language 
      });
    }
  };

  const forceSaveCurrentBug = () => {
    if (forceSaveRef.current) {
      forceSaveRef.current();
    }
  };

  const handleBugSelect = (bug: BugType) => {
    // Force save current bug before switching
    forceSaveCurrentBug();
    setSelectedBug(bug);
  };



  const handleStartTitleEdit = () => {
    if (selectedBug) {
      setEditingTitle(selectedBug.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitleEdit = async () => {
    if (selectedBug && editingTitle.trim() && editingTitle.trim() !== selectedBug.title) {
      await updateBug(selectedBug.id, { title: editingTitle.trim() });
      setSelectedBug({ ...selectedBug, title: editingTitle.trim() });
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

  const handleSeverityChange = async (newSeverity: BugType['severity']) => {
    if (selectedBug && newSeverity !== selectedBug.severity) {
      await updateBug(selectedBug.id, { severity: newSeverity });
      setSelectedBug({ ...selectedBug, severity: newSeverity });
    }
    setShowSeverityPopup(false);
  };

  const handleStatusChange = async (newStatus: BugType['status']) => {
    if (selectedBug && newStatus !== selectedBug.status) {
      await updateBug(selectedBug.id, { status: newStatus });
      setSelectedBug({ ...selectedBug, status: newStatus });
    }
    setShowStatusPopup(false);
  };

  const subTabs = [
    { id: 'info' as const, label: 'Details', icon: Info },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
    { id: 'reproduction' as const, label: 'Reproduction', icon: Settings },
    { id: 'analysis' as const, label: 'Analysis', icon: Brain },
  ];

  const renderSubTabContent = () => {
    if (!selectedBug) return null;

    switch (activeSubTab) {
      case 'info':
        return renderInfoSection();
      case 'tasks':
        return renderTasksSection();
      case 'reproduction':
        return renderReproductionSection();
      case 'analysis':
        return renderAnalysisSection();
      default:
        return renderInfoSection();
    }
  };

  const renderInfoSection = () => {
    if (!selectedBug) return null;

    return (
      <div className={`flex-1 min-h-0`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div className="h-full p-4">
          <div className={`h-full border rounded-lg`} style={{ 
            backgroundColor: isDark ? '#111111' : '#ffffff',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}>
            <BlockEditor
              key={`${selectedBug.id}-${selectedBug.updatedAt?.getTime()}`}
              content={stringToBlocks(selectedBug.content)}
              onChange={(blocks) => handleContentChange(blocksToString(blocks))}
              placeholder="Describe the bug details, steps to reproduce, expected vs actual behavior, environment info..."
              onSave={(blocks) => handleSaveWithContent(blocksToString(blocks))}
              forceSaveRef={forceSaveRef}
              enableImageUpload={true}
              projectId={project.id}
              bugId={selectedBug.id}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTasksSection = () => {
    if (!selectedBug) return null;

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

  const renderReproductionSection = () => {
    return (
      <div className={`flex-1 min-h-0 p-4`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div 
          className={`w-full h-full border rounded-lg p-6 overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`} 
          style={{ 
            backgroundColor: isDark ? '#111111' : '#ffffff',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}
        >
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Steps to Reproduce</h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border-l-4 border-l-blue-500`} style={{ 
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: isDark ? '#1e293b' : '#e2e8f0'
                }}>
                  <h4 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Environment</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>OS:</span>
                      <span className={`ml-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Not specified</span>
                    </div>
                    <div>
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Browser:</span>
                      <span className={`ml-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Not specified</span>
                    </div>
                    <div>
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Version:</span>
                      <span className={`ml-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Not specified</span>
                    </div>
                    <div>
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Device:</span>
                      <span className={`ml-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Not specified</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Reproduction Steps
                  </label>
                  <textarea
                    placeholder="1. Navigate to...\n2. Click on...\n3. Enter data...\n4. Observe the issue..."
                    rows={8}
                    className={`w-full p-4 border resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-sm`}
                    style={{ 
                      borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysisSection = () => {
    return (
      <div className={`flex-1 min-h-0 p-4`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div 
          className={`w-full h-full border rounded-lg p-6 overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`} 
          style={{ 
            backgroundColor: isDark ? '#111111' : '#ffffff',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}
        >
          <div className="text-center py-16">
            <Brain className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Bug Analysis</h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-4`}>Generate AI-powered root cause analysis and fix suggestions</p>
            <button 
              className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'} transition-colors`}
            >
              Analyze Bug
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Bug List */}
      <div className={`w-64 border-r flex flex-col flex-shrink-0`} style={{ 
        backgroundColor: isDark ? '#111111' : '#f8fafc',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className={`p-4 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
          <button
            onClick={() => {
              forceSaveCurrentBug();
              setShowCreateModal(true);
            }}
            className={`w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium transition-all duration-200 border ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Plus size={16} className="mr-2" />
            <span>Report Bug</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className={`p-3`}>
          <div className="relative">
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
              placeholder="Search bugs..."
              className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`}
              style={{ 
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#111111' : '#ffffff',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className={`px-3 pb-3`}>
          <div className="flex items-center space-x-2">
            {/* Feature Filter Dropdown */}
            <div className="relative flex-1 min-w-0">
              <button
                onClick={() => setShowFeatureFilterPopup(!showFeatureFilterPopup)}
                className={`relative w-full px-3 py-2 text-sm rounded-lg border transition-colors flex items-center justify-between ${
                  selectedFeatureFilter
                    ? (isDark ? 'bg-blue-900/50 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700')
                    : (isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50')
                }`}
              >
                <span className="truncate mr-2">{selectedFeatureFilter ? projectFeatures.find(f => f.id === selectedFeatureFilter)?.title || 'Feature' : 'All Features'}</span>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {selectedFeatureFilter && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  <ChevronDown size={12} />
                </div>
              </button>
              
              {showFeatureFilterPopup && (
                <>
                  <div 
                    className="fixed inset-0 z-[9998]" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFeatureFilterPopup(false);
                    }}
                  />
                  <div 
                    className={`absolute top-full left-0 mt-1 w-64 rounded-lg shadow-xl z-[9999] max-h-60 overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                    }}
                  >
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setSelectedFeatureFilter(null);
                          setShowFeatureFilterPopup(false);
                        }}
                        className={`w-full text-left p-2 text-sm rounded transition-colors ${
                          !selectedFeatureFilter 
                            ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') 
                            : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700')
                        }`}
                      >
                        All Features
                      </button>
                      {projectFeatures.map((feature) => {
                        const featureBugCount = projectBugs.filter(b => b.featureId === feature.id).length;
                        return (
                          <button
                            key={feature.id}
                            onClick={() => {
                              setSelectedFeatureFilter(feature.id);
                              setShowFeatureFilterPopup(false);
                            }}
                            className={`w-full text-left p-2 text-sm rounded transition-colors ${
                              selectedFeatureFilter === feature.id 
                                ? (isDark ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-900') 
                                : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700')
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate mr-2">{feature.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {featureBugCount}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
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
                    className="fixed inset-0 z-10" 
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
                          { key: 'severity' as const, label: 'Severity' },
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

        <div className={`flex-1 overflow-y-auto px-3 pb-3 space-y-4 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
          {/* Open Bugs Section */}
          <BugSection
            title="Open"
            icon={AlertCircle}
            iconColor="text-red-500"
            bugs={openBugs}
            isExpanded={isOpenExpanded}
            onToggle={() => setIsOpenExpanded(!isOpenExpanded)}
            selectedBug={selectedBug}
            onBugSelect={handleBugSelect}
            isDark={isDark}
            defaultOpacity={1}
            onDeleteBug={handleDeleteBugFromList}
          />

          {/* In Progress Bugs Section */}
          <BugSection
            title="In Progress"
            icon={Clock}
            iconColor="text-blue-500"
            bugs={inProgressBugs}
            isExpanded={isInProgressExpanded}
            onToggle={() => setIsInProgressExpanded(!isInProgressExpanded)}
            selectedBug={selectedBug}
            onBugSelect={handleBugSelect}
            isDark={isDark}
            defaultOpacity={1}
            onDeleteBug={handleDeleteBugFromList}
          />

          {/* Completed Bugs Section */}
          <BugSection
            title="Completed"
            icon={CheckCircle}
            iconColor="text-green-500"
            bugs={completedBugs}
            isExpanded={isCompletedExpanded}
            onToggle={() => setIsCompletedExpanded(!isCompletedExpanded)}
            selectedBug={selectedBug}
            onBugSelect={handleBugSelect}
            isDark={isDark}
            defaultOpacity={0.75}
            onDeleteBug={handleDeleteBugFromList}
          />

          {/* Others (Won't Fix) Bugs Section */}
          <BugSection
            title="Others"
            icon={Tag}
            iconColor="text-gray-500"
            bugs={othersBugs}
            isExpanded={isOthersExpanded}
            onToggle={() => setIsOthersExpanded(!isOthersExpanded)}
            selectedBug={selectedBug}
            onBugSelect={handleBugSelect}
            isDark={isDark}
            defaultOpacity={0.75}
            onDeleteBug={handleDeleteBugFromList}
          />

          {/* Empty State */}
          {filteredBugs.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <Bug className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              {searchQuery ? (
                <>
                  <p className="text-sm font-medium mb-1">No bugs found</p>
                  <p className="text-xs">Try a different search term</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">No bugs yet</p>
                  <p className="text-xs">Report your first bug to get started</p>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Bug Counter */}
        <div className={`px-3 py-2 border-t text-center`} style={{ 
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
          backgroundColor: isDark ? '#0f0f0f' : '#f8fafc'
        }}>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {filteredBugs.length} {filteredBugs.length === 1 ? 'bug' : 'bugs'}
            {searchQuery && ` (filtered from ${projectBugs.length})`}
          </span>
        </div>
      </div>

      {/* Bug Editor */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {selectedBug ? (
          <>
            {/* Combined Bug Header & Navigation */}
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
                            ? 'text-gray-200 border-gray-600 focus:border-red-400' 
                            : 'text-gray-900 border-gray-300 focus:border-red-500'
                        } focus:outline-none focus:ring-1 focus:ring-red-500`}
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
                        {selectedBug.title}
                      </h2>
                      <button
                        onClick={handleStartTitleEdit}
                        className={`p-1 rounded hover:bg-gray-700 transition-colors ${
                          isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                        }`}
                        title="Rename bug"
                      >
                        <Edit size={16} />
                      </button>
                    </>
                  )}
                  
                  {/* Inline metadata - compact */}
                  <div className="flex items-center space-x-2 ml-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowSeverityPopup(!showSeverityPopup)}
                        className={`px-2 py-1 text-xs font-medium border hover:shadow-md transition-all cursor-pointer ${severityColors[selectedBug.severity]}`}
                        title="Click to change severity"
                      >
                        {selectedBug.severity.toUpperCase()}
                      </button>
                      
                      {showSeverityPopup && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowSeverityPopup(false)}
                          />
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                            <div className="p-2">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Change Severity</div>
                              {severityOptions.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => handleSeverityChange(option.id)}
                                  className={`w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                    selectedBug.severity === option.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 text-xs font-medium border rounded ${severityColors[option.id]}`}>
                                      {option.label.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-2">
                                    {option.description}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setShowStatusPopup(!showStatusPopup)}
                        className={`px-2 py-1 text-xs font-medium border hover:shadow-md transition-all cursor-pointer ${
                          selectedBug.status === 'open' ? 'bg-red-100 text-red-800 border-red-200' :
                          selectedBug.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          selectedBug.status === 'fixed' ? 'bg-green-100 text-green-800 border-green-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                        title="Click to change status"
                      >
                        {selectedBug.status.replace('-', ' ').toUpperCase()}
                      </button>
                      
                      {showStatusPopup && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowStatusPopup(false)}
                          />
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                            <div className="p-2">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Change Status</div>
                              {statusOptions.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => handleStatusChange(option.id)}
                                  className={`w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                    selectedBug.status === option.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 text-xs font-medium border rounded ${
                                      option.id === 'open' ? 'bg-red-100 text-red-800 border-red-200' :
                                      option.id === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                      option.id === 'fixed' ? 'bg-green-100 text-green-800 border-green-200' :
                                      'bg-gray-100 text-gray-800 border-gray-200'
                                    }`}>
                                      {option.label.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-2">
                                    {option.description}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Feature tag */}
                    {selectedBug.featureId && (() => {
                      const linkedFeature = features.find(f => f.id === selectedBug.featureId);
                      return linkedFeature ? (
                        <span
                          className={`px-2 py-1 text-xs font-medium border ${
                            isDark 
                              ? 'bg-blue-900/50 text-blue-200 border-blue-700' 
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}
                          title={`Linked feature: ${linkedFeature.title}`}
                          style={{ padding: '4px 8px' }}
                        >
                          📋 {linkedFeature.title}
                        </span>
                      ) : null;
                    })()}
                    
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Reported {new Date(selectedBug.createdAt).toLocaleDateString()}
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
              <Bug className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className="text-lg font-medium mb-2">Select a bug to view</p>
              <p className="text-sm">Choose from the list or report a new bug</p>
            </div>
          </div>
        )}
      </div>


      {/* Create Bug Modal */}
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
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
              {filterByFeatureId ? 
                `Report Bug for "${features.find(f => f.id === filterByFeatureId)?.title || 'Feature'}"` : 
                'Report New Bug'
              }
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Bug Title
                </label>
                <input
                  type="text"
                  value={newBugTitle}
                  onChange={(e) => setNewBugTitle(e.target.value)}
                  placeholder="Brief description of the bug"
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`}
                  style={{ 
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </div>

              {/* Only show feature selection if not filtering by feature */}
              {!filterByFeatureId && (
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Related Feature (optional)
                  </label>
                  <select
                    value={selectedFeatureId || ''}
                    onChange={(e) => setSelectedFeatureId(e.target.value || null)}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`}
                    style={{ 
                      borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                  >
                    <option value="">No feature selected</option>
                    {features
                      .filter(feature => feature.projectId === project.id)
                      .map((feature) => (
                        <option key={feature.id} value={feature.id}>
                          {feature.title}
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}
              
              {/* Show feature info when filtering by feature */}
              {filterByFeatureId && (
                <div className={`p-3 rounded-xl border ${isDark ? 'border-gray-700 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      Linked to Feature:
                    </span>
                    <span className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'} font-medium`}>
                      {features.find(f => f.id === filterByFeatureId)?.title || 'Unknown Feature'}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    This bug will automatically be linked to the current feature.
                  </p>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Bug Type
                </label>
                <div className="space-y-3">
                  {bugTypes.map((type) => (
                    <label key={type.id} className="flex items-start space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="bugType"
                        value={type.id}
                        checked={newBugType === type.id}
                        onChange={(e) => setNewBugType(e.target.value as BugType['type'])}
                        className="mt-1 text-red-600"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-red-500 transition-colors`}>{type.label}</div>
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
                onClick={handleCreateBug}
                disabled={!newBugTitle.trim()}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Report Bug
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteBug}
        title="Delete Bug"
        message="Are you sure you want to delete this bug? All related information will be permanently removed."
        itemName={selectedBug?.title}
      />
    </div>
  );
};

// Bug Section Component
interface BugSectionProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  bugs: BugType[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedBug: BugType | null;
  onBugSelect: (bug: BugType) => void;
  isDark: boolean;
  defaultOpacity: number;
  onDeleteBug: (bug: BugType) => void;
}

const BugSection: React.FC<BugSectionProps> = ({
  title,
  icon: Icon,
  iconColor,
  bugs,
  isExpanded,
  onToggle,
  selectedBug,
  onBugSelect,
  isDark,
  defaultOpacity,
  onDeleteBug
}) => {
  if (bugs.length === 0) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between py-2 px-3 text-sm font-medium transition-all duration-200 hover:${
          isDark ? 'bg-gray-800' : 'bg-gray-50'
        } rounded`}
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronDown size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <ChevronRight size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
          <Icon size={16} className={iconColor} />
          <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{title}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
        }`}>
          {bugs.length}
        </span>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-1 mt-2 pl-2"
        >
          {bugs.map((bug) => {
            const StatusIcon = statusIcons[bug.status];
            return (
              <div
                key={bug.id}
                className={`relative group transition-all duration-100 border-l-2 hover:opacity-100 ${
                  selectedBug?.id === bug.id
                    ? `${isDark ? 'bg-gray-800 border-l-gray-600' : 'bg-gray-100 border-l-gray-400'}`
                    : `hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-l-transparent`
                }`}
                style={{ opacity: defaultOpacity }}
              >
                <motion.button
                  onClick={() => onBugSelect(bug)}
                  className="w-full text-left p-3 pr-10"
                  whileHover={{ x: 8 }}
                  transition={{ duration: 0.08, ease: "easeOut" }}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <StatusIcon size={16} className={`flex-shrink-0 mt-0.5 ${
                      bug.status === 'open' ? 'text-red-500' :
                      bug.status === 'in-progress' ? 'text-blue-500' :
                      bug.status === 'fixed' ? 'text-green-500' :
                      'text-gray-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      {/* Bug name */}
                      <div className={`text-sm font-medium leading-tight ${
                        defaultOpacity === 1 
                          ? (isDark ? 'text-gray-200' : 'text-gray-800')
                          : (isDark ? 'text-gray-300' : 'text-gray-700')
                      } truncate`}>
                        {bug.title}
                      </div>
                    </div>
                  </div>
                </motion.button>
                
                {/* Inline bug delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBug(bug);
                  }}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                    isDark 
                      ? 'hover:bg-red-900/50 text-red-400 hover:text-red-300' 
                      : 'hover:bg-red-100 text-red-500 hover:text-red-600'
                  }`}
                  title="Delete Bug"
                >
                  <FiTrash size={12} />
                </button>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

