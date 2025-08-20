import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Edit3, Trash2, Brain, MessageSquare, Upload, History, Info } from 'lucide-react';
import { Project, Feature } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useTheme } from '../contexts/ThemeContext';
import { EnhancedEditor } from './ui/EnhancedEditor';

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

export const FeaturesTab: React.FC<FeaturesTabProps> = ({ project }) => {
  const { features, createFeature, updateFeature, deleteFeature } = useSupabaseProjects();
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
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'ai-summary' | 'chat-history' | 'import' | 'logs'>(() => {
    const saved = localStorage.getItem(`featureSubTab_${project.id}`);
    return (saved as 'info' | 'ai-summary' | 'chat-history' | 'import' | 'logs') || 'info';
  });
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
      setSelectedFeature(feature);
      setShowCreateModal(false);
      setNewFeatureTitle('');
      setNewFeatureType('custom');
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

  const subTabs = [
    { id: 'info' as const, label: 'Info', icon: Info },
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

    return (
      <div className={`flex-1 min-h-0`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div className="h-full p-4">
          <div className={`h-full border rounded-lg overflow-hidden`} style={{ 
            backgroundColor: isDark ? '#111111' : '#ffffff',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}>
            <EnhancedEditor
              content={selectedFeature.content}
              onChange={handleContentChange}
              language={selectedFeature.language || 'markdown'}
              onLanguageChange={handleLanguageChange}
              placeholder="Describe your feature requirements, user stories, acceptance criteria..."
              fileName={selectedFeature.title}
            />
          </div>
        </div>
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
      <div className={`w-80 border-r flex flex-col flex-shrink-0`} style={{ 
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
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-1`}>{selectedFeature.title}</h2>
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
    </div>
  );
};