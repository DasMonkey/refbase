import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bug, AlertCircle, CheckCircle, Clock, User, Tag, FileText, Brain, MessageSquare, Upload, History, Info, Shield, Settings } from 'lucide-react';
import { Project, Bug as BugType } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useTheme } from '../contexts/ThemeContext';
import { EnhancedEditor } from './ui/EnhancedEditor';

interface BugsTabProps {
  project: Project;
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

const statusIcons = {
  open: AlertCircle,
  'in-progress': Clock,
  fixed: CheckCircle,
  'wont-fix': Tag,
};

export const BugsTab: React.FC<BugsTabProps> = ({ project }) => {
  const { bugs, createBug, updateBug, deleteBug } = useSupabaseProjects();
  const { isDark } = useTheme();
  const [selectedBug, setSelectedBug] = useState<BugType | null>(() => {
    const savedBugId = localStorage.getItem(`selectedBug_${project.id}`);
    if (savedBugId) {
      return null;
    }
    return null;
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBugTitle, setNewBugTitle] = useState('');
  const [newBugType, setNewBugType] = useState<BugType['type']>('functional-bug');
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'reproduction' | 'analysis' | 'comments' | 'logs'>(() => {
    const saved = localStorage.getItem(`bugSubTab_${project.id}`);
    return (saved as 'info' | 'reproduction' | 'analysis' | 'comments' | 'logs') || 'info';
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const projectBugs = bugs.filter(b => b.projectId === project.id);

  // Restore selected bug when bugs are loaded
  useEffect(() => {
    const savedBugId = localStorage.getItem(`selectedBug_${project.id}`);
    if (savedBugId && bugs.length > 0 && !selectedBug) {
      const bug = bugs.find(b => b.id === savedBugId && b.projectId === project.id);
      if (bug) {
        setSelectedBug(bug);
      }
    }
  }, [bugs, project.id, selectedBug]);

  // Save selectedBug to localStorage whenever it changes
  useEffect(() => {
    if (selectedBug) {
      localStorage.setItem(`selectedBug_${project.id}`, selectedBug.id);
    } else {
      localStorage.removeItem(`selectedBug_${project.id}`);
    }
  }, [selectedBug, project.id]);

  // Save activeSubTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`bugSubTab_${project.id}`, activeSubTab);
  }, [activeSubTab, project.id]);

  // Reset scroll position when switching bugs
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedBug?.id]);

  const handleCreateBug = async () => {
    if (newBugTitle.trim()) {
      const bug = await createBug(project.id, newBugTitle, newBugType);
      setSelectedBug(bug);
      setShowCreateModal(false);
      setNewBugTitle('');
      setNewBugType('functional-bug');
    }
  };

  const handleSaveBug = () => {
    if (selectedBug) {
      updateBug(selectedBug.id, { 
        content: selectedBug.content,
        language: selectedBug.language 
      });
    }
  };

  const handleContentChange = (content: string) => {
    if (selectedBug) {
      setSelectedBug({ ...selectedBug, content });
    }
  };

  const handleLanguageChange = (language: string) => {
    if (selectedBug) {
      setSelectedBug({ ...selectedBug, language });
    }
  };

  const subTabs = [
    { id: 'info' as const, label: 'Details', icon: Info },
    { id: 'reproduction' as const, label: 'Reproduction', icon: Settings },
    { id: 'analysis' as const, label: 'Analysis', icon: Brain },
    { id: 'comments' as const, label: 'Comments', icon: MessageSquare },
    { id: 'logs' as const, label: 'Logs', icon: History },
  ];

  const renderSubTabContent = () => {
    if (!selectedBug) return null;

    switch (activeSubTab) {
      case 'info':
        return renderInfoSection();
      case 'reproduction':
        return renderReproductionSection();
      case 'analysis':
        return renderAnalysisSection();
      case 'comments':
        return renderCommentsSection();
      case 'logs':
        return renderLogsSection();
      default:
        return renderInfoSection();
    }
  };

  const renderInfoSection = () => {
    if (!selectedBug) return null;

    return (
      <div className={`flex-1 min-h-0`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div className="h-full p-4">
          <div className={`h-full border rounded-lg overflow-hidden`} style={{ 
            backgroundColor: isDark ? '#111111' : '#ffffff',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}>
            <EnhancedEditor
              content={selectedBug.content}
              onChange={handleContentChange}
              language={selectedBug.language || 'markdown'}
              onLanguageChange={handleLanguageChange}
              placeholder="Describe the bug details, steps to reproduce, expected vs actual behavior, environment info..."
              fileName={selectedBug.title}
            />
          </div>
        </div>
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

  const renderCommentsSection = () => {
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
            <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Comments & Discussion</h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No comments yet</p>
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
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Bug Activity Log</h3>
            
            <div className="text-center py-16">
              <History className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No activity log available</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Bug List */}
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
            <span>Report Bug</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {projectBugs.map((bug) => {
              const StatusIcon = statusIcons[bug.status];
              return (
                <motion.button
                  key={bug.id}
                  onClick={() => {
                    setSelectedBug(bug);
                  }}
                  className={`w-full text-left p-3 transition-all duration-200 border-l-2 ${
                    selectedBug?.id === bug.id
                      ? `${isDark ? 'bg-gray-800 border-l-gray-600' : 'bg-gray-100 border-l-gray-400'}`
                      : `hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-l-transparent`
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center space-x-3">
                    <StatusIcon size={14} className={`${bug.status === 'open' ? 'text-red-500' :
                      bug.status === 'in-progress' ? 'text-blue-500' :
                      bug.status === 'fixed' ? 'text-green-500' :
                      'text-gray-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} truncate`}>{bug.title}</div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${severityColors[bug.severity]}`}>
                          {bug.severity}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {new Date(bug.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {projectBugs.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <Bug className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className="text-sm font-medium mb-1">No bugs yet</p>
              <p className="text-xs">Report your first bug to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Bug Editor */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {selectedBug ? (
          <>
            {/* Bug Header */}
            <div className={`px-6 py-4 border-b flex-shrink-0`} style={{ 
              backgroundColor: isDark ? '#111111' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-1`}>{selectedBug.title}</h2>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium border ${severityColors[selectedBug.severity]}`}>
                      {selectedBug.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium border ${
                      selectedBug.status === 'open' ? 'bg-red-100 text-red-800 border-red-200' :
                      selectedBug.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      selectedBug.status === 'fixed' ? 'bg-green-100 text-green-800 border-green-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {selectedBug.status.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Reported {new Date(selectedBug.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {activeSubTab === 'info' && (
                    <button
                      onClick={handleSaveBug}
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
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Report New Bug</h3>
            
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
    </div>
  );
};