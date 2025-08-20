import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Edit3, Trash2, Brain, MessageSquare, Upload, History, Info, CheckSquare, Edit } from 'lucide-react';
import { FiPlus, FiTrash } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { Project, Feature, FeatureFile, Task } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useTheme } from '../contexts/ThemeContext';
import { EnhancedEditor } from './ui/EnhancedEditor';
import { DeleteConfirmationModal } from './ui/DeleteConfirmationModal';

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

const featureFileTypes = [
  { id: 'requirement' as const, label: 'Requirements', description: 'Feature requirements and specifications', icon: FileText, defaultName: 'requirements.md' },
  { id: 'structure' as const, label: 'Structure', description: 'Architecture and data structures', icon: Edit3, defaultName: 'structure.md' },
  { id: 'implementation' as const, label: 'Implementation', description: 'Implementation details and code', icon: Edit, defaultName: 'implementation.md' },
  { id: 'testing' as const, label: 'Testing', description: 'Test cases and testing strategy', icon: CheckSquare, defaultName: 'testing.md' },
  { id: 'documentation' as const, label: 'Documentation', description: 'User documentation and guides', icon: FileText, defaultName: 'documentation.md' },
  { id: 'notes' as const, label: 'Notes', description: 'Additional notes and thoughts', icon: Edit3, defaultName: 'notes.md' },
  { id: 'custom' as const, label: 'Custom', description: 'Custom file type', icon: FileText, defaultName: 'custom.md' },
];

export const FeaturesTab: React.FC<FeaturesTabProps> = ({ project }) => {
  const { features, featureFiles, createFeature, updateFeature, deleteFeature, createFeatureFile, updateFeatureFile, deleteFeatureFile } = useSupabaseProjects();
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
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'tasks' | 'ai-summary' | 'chat-history' | 'import' | 'logs'>(() => {
    const saved = localStorage.getItem(`featureSubTab_${project.id}`);
    return (saved as 'info' | 'tasks' | 'ai-summary' | 'chat-history' | 'import' | 'logs') || 'info';
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [selectedFeatureFile, setSelectedFeatureFile] = useState<FeatureFile | null>(null);
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<FeatureFile['type']>('requirement');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const projectFeatures = features.filter(f => f.projectId === project.id);

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

  // Reset scroll position and sub-tab when switching features
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    // Don't reset to 'info' - keep the user's preferred sub-tab
  }, [selectedFeature?.id]);

  const handleCreateFeature = async () => {
    if (newFeatureTitle.trim()) {
      const feature = await createFeature(project.id, newFeatureTitle, newFeatureType);
      
      // Create default files for the new feature
      const defaultFiles = [
        { name: 'requirements.md', type: 'requirement' as const },
        { name: 'structure.md', type: 'structure' as const },
        { name: 'implementation.md', type: 'implementation' as const },
      ];
      
      for (const file of defaultFiles) {
        await createFeatureFile(feature.id, file.name, file.type, feature);
      }
      
      setSelectedFeature(feature);
      setShowCreateModal(false);
      setNewFeatureTitle('');
      setNewFeatureType('custom');
      
      // Auto-select the first file (requirements)
      const firstFile = featureFiles.find(ff => ff.featureId === feature.id && ff.name === 'requirements.md');
      if (firstFile) {
        setSelectedFeatureFile(firstFile);
      }
    }
  };

  const handleSaveFeature = () => {
    if (selectedFeature) {
      updateFeature(selectedFeature.id, { 
        content: selectedFeature.content,
        language: selectedFeature.language 
      });
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
    }
  };

  const handleContentChange = (content: string) => {
    if (selectedFeature) {
      setSelectedFeature({ ...selectedFeature, content });
    }
  };

  const handleLanguageChange = (language: string) => {
    if (selectedFeature) {
      setSelectedFeature({ ...selectedFeature, language });
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

  const subTabs = [
    { id: 'info' as const, label: 'Info', icon: Info },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
    { id: 'ai-summary' as const, label: 'AI Summary', icon: Brain },
    { id: 'chat-history' as const, label: 'Chat History', icon: MessageSquare },
    { id: 'import' as const, label: 'Import', icon: Upload },
    { id: 'logs' as const, label: 'Logs', icon: History },
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
      case 'import':
        return renderImportSection();
      case 'logs':
        return renderLogsSection();
      default:
        return renderInfoSection();
    }
  };

  const renderInfoSection = () => {
    if (!selectedFeature) return null;

    // Get files for this feature
    const currentFeatureFiles = featureFiles
      .filter(ff => ff.featureId === selectedFeature.id)
      .sort((a, b) => a.order - b.order);

    return (
      <div className="flex h-full w-full overflow-hidden">
        {/* File List Sidebar */}
        <div className={`w-64 border-r flex flex-col flex-shrink-0`} style={{ 
          backgroundColor: isDark ? '#0f0f0f' : '#f8fafc',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}>
          <div className={`p-3 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
            <button
              onClick={() => setShowCreateFileModal(true)}
              className={`w-full flex items-center justify-center py-2 px-3 text-xs font-medium transition-all duration-200 border rounded ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 hover:border-gray-600' 
                  : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Plus size={14} className="mr-1.5" />
              <span>New File</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {currentFeatureFiles.map((file) => {
              const fileTypeInfo = featureFileTypes.find(ft => ft.id === file.type);
              const Icon = fileTypeInfo?.icon || FileText;
              
              return (
                <motion.button
                  key={file.id}
                  onClick={() => setSelectedFeatureFile(file)}
                  className={`w-full text-left p-2 transition-all duration-200 border-l-2 rounded-r ${
                    selectedFeatureFile?.id === file.id
                      ? `${isDark ? 'bg-gray-800 border-l-blue-400' : 'bg-gray-100 border-l-blue-500'}`
                      : `hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-l-transparent`
                  }`}
                  whileHover={{ x: 1 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={12} className={`${isDark ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} truncate`}>
                        {file.name}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} capitalize truncate`}>
                        {fileTypeInfo?.label || file.type}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}

            {currentFeatureFiles.length === 0 && (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                <FileText className={`w-6 h-6 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className="text-xs font-medium mb-1">No files yet</p>
                <p className="text-xs">Create your first file</p>
              </div>
            )}
          </div>
        </div>

        {/* File Editor */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {selectedFeatureFile ? (
            <>
              {/* File Header */}
              <div className={`px-4 py-3 border-b flex-shrink-0`} style={{ 
                backgroundColor: isDark ? '#111111' : '#ffffff',
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const fileTypeInfo = featureFileTypes.find(ft => ft.id === selectedFeatureFile.type);
                        const Icon = fileTypeInfo?.icon || FileText;
                        return <Icon size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />;
                      })()}
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {selectedFeatureFile.name}
                      </h3>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {featureFileTypes.find(ft => ft.id === selectedFeatureFile.type)?.label || selectedFeatureFile.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveFeatureFile}
                      className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 border rounded ${
                        isDark 
                          ? 'bg-green-900 hover:bg-green-800 text-green-200 border-green-800' 
                          : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                      }`}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

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
        <FeatureKanbanBoard 
          feature={selectedFeature} 
          project={project}
        />
      </div>
    );
  };

  const renderAISummarySection = () => {
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
            <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>AI Summary</h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-4`}>Generate AI-powered implementation guidance based on imported conversations</p>
            <button 
              className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'} transition-colors`}
            >
              Generate Summary
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderChatHistorySection = () => {
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
            <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Chat History</h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No conversations linked to this feature yet</p>
          </div>
        </div>
      </div>
    );
  };

  const renderImportSection = () => {
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
              <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Import Conversations</h3>
              
              {/* File Upload */}
              <div className={`p-6 border-2 border-dashed rounded-lg ${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50/50'} mb-6`}>
                <div className="text-center">
                  <Upload className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Drop files here or click to upload</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Supports .txt, .md, .json files</p>
                  <button className={`mt-3 px-4 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'} border transition-colors`}>
                    Choose Files
                  </button>
                </div>
              </div>

              {/* Text Input */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Paste Conversation
                </label>
                <textarea
                  placeholder="Paste your conversation text here..."
                  rows={8}
                  className={`w-full p-4 border resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm`}
                  style={{ 
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Auto-detect format</span>
                    </label>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Import Conversation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLogsSection = () => {
    return (
      <div className={`flex-1 min-h-0 p-4`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div 
          className={`w-full h-full border rounded-lg p-6 overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`} 
          style={{ 
            backgroundColor: isDark ? '#111111' : '#ffffff',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}
        >
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Import History</h3>
            
            <div className="text-center py-16">
              <History className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No import history available</p>
            </div>
          </div>
        </div>
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

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {projectFeatures.map((feature) => (
              <motion.button
                key={feature.id}
                onClick={() => {
                  setSelectedFeature(feature);
                }}
                className={`w-full text-left p-3 transition-all duration-200 border-l-2 ${
                  selectedFeature?.id === feature.id
                    ? `${isDark ? 'bg-gray-800 border-l-gray-600' : 'bg-gray-100 border-l-gray-400'}`
                    : `hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-l-transparent`
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
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
            ))}
          </div>

          {projectFeatures.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <FileText className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className="text-sm font-medium mb-1">No features yet</p>
              <p className="text-xs">Create your first feature to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Feature Editor */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {selectedFeature ? (
          <>
            {/* Feature Header */}
            <div className={`px-6 py-4 border-b flex-shrink-0`} style={{ 
              backgroundColor: isDark ? '#111111' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {isEditingTitle ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={handleTitleKeyDown}
                          onBlur={handleSaveTitleEdit}
                          autoFocus
                          className={`text-xl font-semibold bg-transparent border rounded px-1 py-0 flex-1 min-w-0 h-8 ${
                            isDark 
                              ? 'text-gray-200 border-gray-600 focus:border-blue-400' 
                              : 'text-gray-900 border-gray-300 focus:border-blue-500'
                          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
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
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'} truncate`}>
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
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium border ${isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {selectedFeature.type ? selectedFeature.type.replace('-', ' ').toUpperCase() : 'FEATURE'}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Updated {new Date(selectedFeature.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {activeSubTab === 'info' && (
                    <>
                      <button
                        onClick={handleSaveFeature}
                        className={`px-4 py-2 text-sm font-medium transition-all duration-200 border ${
                          isDark 
                            ? 'bg-green-900 hover:bg-green-800 text-green-200 border-green-800' 
                            : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                        }`}
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleDeleteFeature}
                        className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border ${
                          isDark 
                            ? 'bg-red-900 hover:bg-red-800 text-red-200 border-red-800' 
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                        }`}
                        title="Delete Feature"
                      >
                        <FiTrash className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sub Navigation */}
            <div className={`px-6 py-3 border-b flex-shrink-0`} style={{ 
              backgroundColor: isDark ? '#0f0f0f' : '#f8fafc',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteFeature}
        title="Delete Feature"
        message="Are you sure you want to delete this feature? All associated files and data will be permanently removed."
        itemName={selectedFeature?.title}
      />
    </div>
  );
};

// Feature-specific Kanban Board Component
interface FeatureKanbanBoardProps {
  feature: Feature;
  project: Project;
}

const FeatureKanbanBoard: React.FC<FeatureKanbanBoardProps> = ({ feature, project }) => {
  const { tasks, createTask, updateTask, deleteTask } = useSupabaseProjects();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  
  // Filter tasks for this specific feature
  const featureTasks = React.useMemo(() => 
    tasks.filter(t => t.projectId === project.id && t.featureId === feature.id), 
    [tasks, project.id, feature.id]
  );

  // Sync with Supabase when local tasks change
  React.useEffect(() => {
    setLocalTasks(featureTasks);
  }, [featureTasks]);

  const handleTasksChange = (newTasks: Task[]) => {
    setLocalTasks(newTasks);
    
    // Find what changed and sync with Supabase
    newTasks.forEach(task => {
      const originalTask = featureTasks.find(t => t.id === task.id);
      if (originalTask && originalTask.status !== task.status) {
        updateTask(task.id, { status: task.status });
      }
      if (!originalTask && task.projectId === '') {
        // New task - create with correct status and link to feature
        createTask(project.id, task.title, task.description, task.priority, task.status, feature.id);
      }
    });

    // Check for deleted tasks
    featureTasks.forEach(originalTask => {
      if (!newTasks.find(t => t.id === originalTask.id)) {
        deleteTask(originalTask.id);
      }
    });
  };

  const statusColumns = [
    { 
      id: 'todo' as const, 
      label: 'TODO', 
      headingColor: 'text-yellow-200'
    },
    { 
      id: 'in-progress' as const, 
      label: 'In progress', 
      headingColor: 'text-blue-200'
    },
    { 
      id: 'fix-later' as const, 
      label: 'Fix Later', 
      headingColor: 'text-orange-200'
    },
    { 
      id: 'done' as const, 
      label: 'Complete', 
      headingColor: 'text-emerald-200'
    },
  ];

  return (
    <div className="h-full w-full flex flex-col text-neutral-50" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="p-4 border-b border-neutral-700 flex-shrink-0">
        <h3 className="text-lg font-semibold text-neutral-200 mb-2">
          Tasks for: {feature.title}
        </h3>
        <p className="text-sm text-neutral-400">
          Manage tasks specific to this feature
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden p-4">
        <div 
          className="flex h-full w-full [&::-webkit-scrollbar]:hidden" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none'
          }}
        >
          {statusColumns.map((column) => (
            <FeatureColumn
              key={column.id}
              title={column.label}
              headingColor={column.headingColor}
              tasks={localTasks}
              column={column.id}
              setTasks={handleTasksChange}
              featureId={feature.id}
              projectId={project.id}
            />
          ))}
          <FeatureBurnBarrel setTasks={handleTasksChange} allTasks={localTasks} />
        </div>
      </div>
    </div>
  );
};

// Feature-specific Column Component (adapted from TasksTab)
interface FeatureColumnProps {
  title: string;
  headingColor: string;
  tasks: Task[];
  column: Task['status'];
  setTasks: (tasks: Task[]) => void;
  featureId: string;
  projectId: string;
}

const FeatureColumn: React.FC<FeatureColumnProps> = ({
  title,
  headingColor,
  tasks,
  column,
  setTasks,
  featureId,
  projectId,
}) => {
  const [active, setActive] = useState(false);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData("taskId");

    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element.dataset.before || "-1";

    if (before !== taskId) {
      let copy = [...tasks];

      let taskToTransfer = copy.find((c) => c.id === taskId);
      if (!taskToTransfer) return;
      taskToTransfer = { ...taskToTransfer, status: column };

      copy = copy.filter((c) => c.id !== taskId);

      const moveToBack = before === "-1";

      if (moveToBack) {
        copy.push(taskToTransfer);
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before);
        if (insertAtIndex === undefined) return;

        copy.splice(insertAtIndex, 0, taskToTransfer);
      }

      setTasks(copy);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e: React.DragEvent) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e: React.DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );

    return el;
  };

  const getIndicators = () => {
    return Array.from(
      document.querySelectorAll(
        `[data-column="${column}"]`
      ) as unknown as HTMLElement[]
    );
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredTasks = tasks.filter((c) => c.status === column);

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col mx-2">
      <div className="mb-3 flex items-center justify-between flex-shrink-0">
        <h3 className={`font-medium ${headingColor} truncate`}>{title}</h3>
        <span className="rounded text-sm text-neutral-400 ml-2">
          {filteredTasks.length}
        </span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex-1 min-h-0 overflow-y-auto transition-colors ${
          active ? "bg-neutral-800/50" : "bg-neutral-800/0"
        }`}
      >
        {filteredTasks.map((c) => {
          return <FeatureTaskCard key={c.id} {...c} handleDragStart={handleDragStart} />;
        })}
        <FeatureDropIndicator beforeId={null} column={column} />
        <FeatureAddCard 
          column={column} 
          setTasks={setTasks} 
          allTasks={tasks}
          featureId={featureId}
          projectId={projectId}
        />
      </div>
    </div>
  );
};

// Feature-specific Task Card Component
interface FeatureTaskCardProps extends Task {
  handleDragStart: (e: React.DragEvent, task: Task) => void;
}

const FeatureTaskCard: React.FC<FeatureTaskCardProps> = ({ id, title, status, handleDragStart, ...task }) => {
  return (
    <>
      <FeatureDropIndicator beforeId={id} column={status} />
      <motion.div
        layout
        layoutId={id}
        draggable="true"
        onDragStart={(e) => handleDragStart(e as any, { id, title, status, ...task })}
        className="cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 active:cursor-grabbing"
      >
        <p className="text-sm text-neutral-100">{title}</p>
      </motion.div>
    </>
  );
};

// Feature-specific Drop Indicator Component
interface FeatureDropIndicatorProps {
  beforeId: string | null;
  column: string;
}

const FeatureDropIndicator: React.FC<FeatureDropIndicatorProps> = ({ beforeId, column }) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
    />
  );
};

// Feature-specific Burn Barrel Component
interface FeatureBurnBarrelProps {
  setTasks: (tasks: Task[]) => void;
  allTasks: Task[];
}

const FeatureBurnBarrel: React.FC<FeatureBurnBarrelProps> = ({
  setTasks,
  allTasks,
}) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData("taskId");

    setTasks(allTasks.filter((c: Task) => c.id !== taskId));

    setActive(false);
  };
        
  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mt-10 grid h-32 w-32 shrink-0 place-content-center rounded border text-2xl ${
        active
          ? "border-red-800 bg-red-800/20 text-red-500"
          : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
      }`}
    >
      {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

// Feature-specific Add Card Component
interface FeatureAddCardProps {
  column: Task['status'];
  setTasks: (tasks: Task[]) => void;
  allTasks: Task[];
  featureId: string;
  projectId: string;
}

const FeatureAddCard: React.FC<FeatureAddCardProps> = ({ column, setTasks, allTasks, featureId, projectId }) => {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text.trim().length) return;

    const newTask: Task = {
      id: Math.random().toString(),
      projectId: projectId,
      title: text.trim(),
      description: '',
      status: column,
      priority: 'medium',
      featureId: featureId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks([...allTasks, newTask]);

    setAdding(false);
    setText("");
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit}>
          <textarea
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm text-neutral-50 placeholder-violet-300 focus:outline-0"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
            >
              Close
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300"
            >
              <span>Add</span>
              <FiPlus />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
        >
          <span>Add card</span>
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};