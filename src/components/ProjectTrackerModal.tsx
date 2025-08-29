import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, Calendar, Flag, Target } from 'lucide-react';
import { Project, ProjectTracker } from '../types';
import { format } from 'date-fns';

interface ProjectTrackerModalProps {
  selectedTracker: ProjectTracker | null;
  selectedDate: Date;
  isDark: boolean;
  project: Project;
  onClose: () => void;
  createTracker: (tracker: Omit<ProjectTracker, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectTracker>;
  updateTracker: (trackerId: string, updates: Partial<ProjectTracker>) => Promise<ProjectTracker>;
  operationLoading: boolean;
  onSuccess: () => Promise<void>;
}

export const ProjectTrackerModal: React.FC<ProjectTrackerModalProps> = ({
  selectedTracker,
  selectedDate,
  isDark,
  project,
  onClose,
  createTracker,
  updateTracker,
  operationLoading,
  onSuccess
}) => {
  const [formData, setFormData] = useState(() => ({
    title: selectedTracker?.title || '',
    type: selectedTracker?.type || 'feature',
    startDate: selectedTracker ? format(selectedTracker.startDate, 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd'),
    endDate: selectedTracker ? format(selectedTracker.endDate, 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd'),
    description: selectedTracker?.description || '',
    status: selectedTracker?.status || 'not_started',
    priority: selectedTracker?.priority || 'medium'
  }));
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmit = async () => {
    try {
      setValidationErrors([]);
      
      const trimmedTitle = formData.title?.trim() || '';
      const trimmedDescription = formData.description?.trim() || '';
      
      const clientErrors: string[] = [];
      if (!trimmedTitle) {
        clientErrors.push('Tracker title is required');
      }
      if (!formData.startDate) {
        clientErrors.push('Start date is required');
      }
      if (!formData.endDate) {
        clientErrors.push('End date is required');
      }
      
      // Validate date range
      if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        if (endDate < startDate) {
          clientErrors.push('End date must be on or after start date');
        }
      }
      
      if (clientErrors.length > 0) {
        setValidationErrors(clientErrors);
        return;
      }

      const trackerData = {
        projectId: project.id,
        userId: '', // Will be set by the service
        title: trimmedTitle,
        description: trimmedDescription || undefined,
        type: formData.type as ProjectTracker['type'],
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        status: formData.status as ProjectTracker['status'],
        priority: formData.priority as ProjectTracker['priority']
      };

      if (selectedTracker) {
        await updateTracker(selectedTracker.id, trackerData);
      } else {
        await createTracker(trackerData);
      }

      // Explicitly call refresh after successful operation
      await onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        const errors = error.message.split(', ');
        setValidationErrors(errors);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project':
        return Target;
      case 'feature':
        return Calendar;
      case 'bug':
        return AlertCircle;
      default:
        return Calendar;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project':
        return 'text-blue-500';
      case 'feature':
        return 'text-green-500';
      case 'bug':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`rounded-2xl p-6 w-full max-w-lg mx-4 border max-h-[90vh] overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}
        style={{
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}
      >
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center space-x-2`}>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {React.createElement(getTypeIcon(formData.type), { 
              size: 20, 
              className: getTypeColor(formData.type) 
            })}
          </div>
          <span>{selectedTracker ? 'Edit Tracker' : 'Create New Tracker'}</span>
        </h3>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4">
            <div className={`p-3 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <div className="flex items-start space-x-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">Please fix the following errors:</p>
                  <ul className="text-sm space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Tracker Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter tracker title"
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              style={{
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>

          {/* Type and Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                style={{
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#000000'
                }}
              >
                <option value="project">Project</option>
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 flex items-center space-x-1`}>
                <Flag size={14} className={getPriorityColor(formData.priority)} />
                <span>Priority</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
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

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                style={{
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#000000'
                }}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                min={formData.startDate}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                style={{
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#000000'
                }}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              style={{
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#000000'
              }}
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tracker description (optional)"
              rows={3}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none`}
              style={{
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            disabled={operationLoading}
            className={`px-4 py-2 rounded-xl transition-colors font-medium ${
              operationLoading ? 'opacity-50 cursor-not-allowed' : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={operationLoading}
            className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center space-x-2 ${
              operationLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {operationLoading && <Loader2 size={16} className="animate-spin" />}
            <span>{selectedTracker ? 'Update Tracker' : 'Create Tracker'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};