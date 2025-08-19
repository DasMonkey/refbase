import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bug, AlertCircle, CheckCircle, Clock, User, Tag } from 'lucide-react';
import { Project, Bug as BugType } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useTheme } from '../contexts/ThemeContext';

interface BugsTabProps {
  project: Project;
}

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState<BugType | null>(null);
  const [newBugTitle, setNewBugTitle] = useState('');
  const [newBugDescription, setNewBugDescription] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const projectBugs = bugs.filter(b => b.projectId === project.id);
  const filteredBugs = filterStatus === 'all' 
    ? projectBugs 
    : projectBugs.filter(b => b.status === filterStatus);

  const handleCreateBug = () => {
    if (newBugTitle.trim()) {
      createBug(project.id, newBugTitle, newBugDescription);
      setNewBugTitle('');
      setNewBugDescription('');
      setShowCreateModal(false);
    }
  };

  const handleStatusChange = (bugId: string, newStatus: BugType['status']) => {
    updateBug(bugId, { status: newStatus });
  };

  const handleSeverityChange = (bugId: string, newSeverity: BugType['severity']) => {
    updateBug(bugId, { severity: newSeverity });
  };

  const BugCard = ({ bug }: { bug: BugType }) => {
    const StatusIcon = statusIcons[bug.status];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer group`}
        style={{ 
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}
        onClick={() => setSelectedBug(bug)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-lg`} style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <StatusIcon 
                size={18} 
                className={`${
                  bug.status === 'open' ? 'text-red-500' :
                  bug.status === 'in-progress' ? 'text-blue-500' :
                  bug.status === 'fixed' ? 'text-green-500' :
                  'text-gray-500'
                }`} 
              />
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2 group-hover:text-blue-500 transition-colors`}>{bug.title}</h4>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-2 leading-relaxed`}>{bug.description}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${severityColors[bug.severity]}`}>
              {bug.severity}
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} capitalize font-medium`}>
              {bug.status.replace('-', ' ')}
            </span>
          </div>
          
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
            {new Date(bug.createdAt).toLocaleDateString()}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-6 border-b`} style={{ 
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Bug Reports</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{filteredBugs.length} of {projectBugs.length} bugs</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            <Plus size={16} className="mr-2" />
            Report Bug
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`border rounded-xl px-4 py-2 text-sm font-medium`}
            style={{ 
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: isDark ? '#ffffff' : '#000000'
            }}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="fixed">Fixed</option>
            <option value="wont-fix">Won't Fix</option>
          </select>

          <div className={`flex items-center space-x-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-medium">{projectBugs.filter(b => b.status === 'open').length} Open</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium">{projectBugs.filter(b => b.status === 'in-progress').length} In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">{projectBugs.filter(b => b.status === 'fixed').length} Fixed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bug List */}
      <div className={`flex-1 overflow-y-auto p-6`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBugs.map((bug) => (
            <BugCard key={bug.id} bug={bug} />
          ))}
        </div>
        
        {filteredBugs.length === 0 && (
          <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}>
              <Bug className="w-10 h-10 opacity-30" />
            </div>
            <p className="text-xl font-medium mb-2">No bugs found</p>
            <p className="text-sm">
              {filterStatus === 'all' 
                ? "Report your first bug to get started" 
                : `No bugs with status "${filterStatus.replace('-', ' ')}"`
              }
            </p>
          </div>
        )}
      </div>

      {/* Bug Detail Modal */}
      {selectedBug && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto border`}
            style={{ 
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>{selectedBug.title}</h3>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${severityColors[selectedBug.severity]}`}>
                    {selectedBug.severity}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                    Created {new Date(selectedBug.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBug(null)}
                className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} p-2 rounded-lg hover:bg-gray-100/10 transition-colors`}
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Description</h4>
                <div className={`p-4 rounded-xl border`} style={{ 
                  color: isDark ? '#d1d5db' : '#374151',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: isDark ? '#1e293b' : '#e2e8f0'
                }}>
                  {selectedBug.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Status</label>
                  <select
                    value={selectedBug.status}
                    onChange={(e) => handleStatusChange(selectedBug.id, e.target.value as BugType['status'])}
                    className={`w-full border rounded-xl px-3 py-2`}
                    style={{ 
                      borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="fixed">Fixed</option>
                    <option value="wont-fix">Won't Fix</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Severity</label>
                  <select
                    value={selectedBug.severity}
                    onChange={(e) => handleSeverityChange(selectedBug.id, e.target.value as BugType['severity'])}
                    className={`w-full border rounded-xl px-3 py-2`}
                    style={{ 
                      borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setSelectedBug(null)}
                className={`px-4 py-2 rounded-xl transition-colors font-medium`}
                style={{ 
                  color: isDark ? '#d1d5db' : '#374151',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Close
              </button>
              <button
                onClick={() => {
                  deleteBug(selectedBug.id);
                  setSelectedBug(null);
                }}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium"
              >
                Delete Bug
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Report Bug</h3>
            
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
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Description
                </label>
                <textarea
                  value={newBugDescription}
                  onChange={(e) => setNewBugDescription(e.target.value)}
                  placeholder="Detailed description, steps to reproduce, expected vs actual behavior..."
                  rows={4}
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`}
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