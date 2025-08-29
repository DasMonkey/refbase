import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Trash2, 
  Calendar, 
  Target, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Layers,
  Move,
  ArrowLeftRight,
  CheckSquare,
  Square,
  MoreHorizontal
} from 'lucide-react';
import { ProjectTracker } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getTrackersForDate, 
  getTrackerTypeColor, 
  getTrackerStatusStyle,
  getTrackerPriorityBorder,
  formatDateRange,
  getTrackerDuration,
  getTrackerProgress
} from '../lib/timelineUtils';
import { format, differenceInDays } from 'date-fns';

interface TrackerDetailsSidebarProps {
  selectedDate?: Date;
  selectedTracker?: ProjectTracker | null;
  trackers: ProjectTracker[];
  mode?: 'calendar' | 'timeline';
  // Timeline-specific props
  laneAssignments?: Map<string, number>;
  selectedTrackers?: Set<string>;
  // Handlers
  onTrackerSelect: (tracker: ProjectTracker) => void;
  onEditTracker?: (tracker: ProjectTracker) => void;
  onDeleteTracker?: (trackerId: string) => void;
  onBatchEdit?: (trackerIds: string[]) => void;
  onBatchDelete?: (trackerIds: string[]) => void;
  onBatchStatusUpdate?: (trackerIds: string[], status: ProjectTracker['status']) => void;
  onToggleTrackerSelection?: (trackerId: string) => void;
  // Common props
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const TrackerDetailsSidebar: React.FC<TrackerDetailsSidebarProps> = ({
  selectedDate,
  selectedTracker,
  trackers,
  mode = 'calendar',
  laneAssignments = new Map(),
  selectedTrackers = new Set(),
  onTrackerSelect,
  onEditTracker,
  onDeleteTracker,
  onBatchEdit,
  onBatchDelete,
  onBatchStatusUpdate,
  onToggleTrackerSelection,
  loading = false,
  error = null,
  onRetry
}) => {
  const { isDark } = useTheme();
  const [showBatchActions, setShowBatchActions] = useState(false);

  // Determine which trackers to show based on mode
  const displayTrackers = mode === 'timeline' ? trackers : (selectedDate ? getTrackersForDate(trackers, selectedDate) : []);
  
  // Get focused tracker for timeline mode
  const focusedTracker = mode === 'timeline' ? selectedTracker : null;

  const getTypeIcon = (type: ProjectTracker['type']) => {
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

  const getStatusIcon = (status: ProjectTracker['status']) => {
    switch (status) {
      case 'not_started':
        return Clock;
      case 'in_progress':
        return Calendar;
      case 'completed':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getPriorityLabel = (priority: ProjectTracker['priority']) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getStatusLabel = (status: ProjectTracker['status']) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className={`w-80 border-l flex flex-col flex-shrink-0`} style={{
        backgroundColor: isDark ? '#111111' : '#f8fafc',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        {/* Header Skeleton */}
        <div className={`p-4 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
          <div className={`h-6 rounded-lg mb-2 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '60%' }}></div>
          <div className={`h-4 rounded-lg animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '40%' }}></div>
        </div>

        {/* Skeleton Trackers */}
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border animate-pulse`}
              style={{
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                  <div className="flex-1">
                    <div className={`h-5 rounded-lg mb-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '70%' }}></div>
                    <div className="flex space-x-2">
                      <div className={`h-4 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '50px' }}></div>
                      <div className={`h-4 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '60px' }}></div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <div className={`w-7 h-7 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                  <div className={`w-7 h-7 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between mb-2">
                  <div className={`h-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '40%' }}></div>
                  <div className={`h-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '20%' }}></div>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <div className={`h-full rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} style={{ width: '60%' }}></div>
                </div>
              </div>
              
              <div className={`h-4 rounded-lg mb-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '80%' }}></div>
              <div className={`h-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '60%' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-80 border-l flex flex-col flex-shrink-0`} style={{
        backgroundColor: isDark ? '#111111' : '#f8fafc',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className="p-4 flex flex-col items-center justify-center h-48">
          <AlertCircle className={`w-8 h-8 mb-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          <p className={`text-sm text-center mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Failed to load trackers
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 border-l flex flex-col flex-shrink-0`} style={{
      backgroundColor: isDark ? '#111111' : '#f8fafc',
      borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
    }}>
      {/* Header */}
      <div className={`p-4 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
        {mode === 'calendar' && selectedDate ? (
          <>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
              {format(selectedDate, 'EEEE, MMM d')}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {displayTrackers.length} {displayTrackers.length === 1 ? 'tracker' : 'trackers'} active
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Timeline View
              </h3>
              {selectedTrackers.size > 0 && (
                <button
                  onClick={() => setShowBatchActions(!showBatchActions)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Batch actions"
                >
                  <MoreHorizontal size={16} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {displayTrackers.length} {displayTrackers.length === 1 ? 'tracker' : 'trackers'} total
              </p>
              {selectedTrackers.size > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedTrackers.size} selected
                </span>
              )}
            </div>
          </>
        )}
        
        {/* Batch Actions Panel */}
        <AnimatePresence>
          {showBatchActions && selectedTrackers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-3 p-3 rounded-lg border ${
                isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2 text-xs">
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Batch actions:</span>
                <button
                  onClick={() => onBatchStatusUpdate?.(Array.from(selectedTrackers), 'in_progress')}
                  className={`px-2 py-1 rounded ${
                    isDark ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  Start
                </button>
                <button
                  onClick={() => onBatchStatusUpdate?.(Array.from(selectedTrackers), 'completed')}
                  className={`px-2 py-1 rounded ${
                    isDark ? 'bg-green-900 text-green-200 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Complete
                </button>
                <button
                  onClick={() => onBatchEdit?.(Array.from(selectedTrackers))}
                  className={`px-2 py-1 rounded ${
                    isDark ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${selectedTrackers.size} selected trackers?`)) {
                      onBatchDelete?.(Array.from(selectedTrackers));
                    }
                  }}
                  className={`px-2 py-1 rounded ${
                    isDark ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Focused Tracker Details (Timeline Mode) */}
      {mode === 'timeline' && focusedTracker && (
        <div className={`p-4 border-b ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-2 rounded-lg ${getTrackerTypeColor(focusedTracker.type)}`}>
              <Target size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {focusedTracker.title}
              </h4>
              <div className="flex items-center space-x-2 text-xs mt-1">
                <Layers size={12} />
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  Lane {(laneAssignments.get(focusedTracker.id) ?? 0) + 1}
                </span>
                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>•</span>
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  {differenceInDays(focusedTracker.endDate, focusedTracker.startDate) + 1} days
                </span>
              </div>
            </div>
          </div>
          
          {/* Timeline Position Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className={`p-2 rounded ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Start</div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {format(focusedTracker.startDate, 'MMM d, yyyy')}
              </div>
            </div>
            <div className={`p-2 rounded ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>End</div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {format(focusedTracker.endDate, 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trackers List */}
      <div className={`flex-1 overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
        {displayTrackers.length > 0 ? (
          <div className="p-4 space-y-3">
            {displayTrackers.map((tracker) => {
              const TypeIcon = getTypeIcon(tracker.type);
              const StatusIcon = getStatusIcon(tracker.status);
              const statusStyle = getTrackerStatusStyle(tracker.status);
              const priorityBorder = getTrackerPriorityBorder(tracker.priority);
              const progress = getTrackerProgress(tracker, selectedDate || new Date());
              const duration = getTrackerDuration(tracker);
              const isSelected = selectedTrackers.has(tracker.id);
              const isFocused = focusedTracker?.id === tracker.id;
              const laneNumber = laneAssignments.get(tracker.id);

              return (
                <motion.div
                  key={tracker.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-sm
                    ${priorityBorder}
                    ${isSelected ? (isDark ? 'bg-blue-950 border-blue-700' : 'bg-blue-50 border-blue-300') : ''}
                    ${isFocused ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                  `}
                  style={{
                    backgroundColor: isSelected ? undefined : (isDark ? '#1a1a1a' : '#ffffff'),
                    borderColor: isSelected ? undefined : (priorityBorder ? undefined : (isDark ? '#2a2a2a' : '#e2e8f0'))
                  }}
                  onClick={() => onTrackerSelect(tracker)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      {/* Selection checkbox for timeline mode */}
                      {mode === 'timeline' && onToggleTrackerSelection && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTrackerSelection(tracker.id);
                          }}
                          className={`flex-shrink-0 p-1 rounded transition-colors ${
                            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-blue-500" />
                          ) : (
                            <Square size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                          )}
                        </button>
                      )}
                      
                      <div className={`p-2 rounded-lg flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <TypeIcon size={16} className={getTrackerTypeColor(tracker.type).replace('bg-', 'text-')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-1 truncate`}>
                          {tracker.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className={`px-2 py-1 rounded-full font-medium ${
                            tracker.type === 'project' ? 'bg-blue-100 text-blue-800' :
                            tracker.type === 'feature' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tracker.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full font-medium ${
                            tracker.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            tracker.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            tracker.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getPriorityLabel(tracker.priority)}
                          </span>
                          {/* Lane information for timeline mode */}
                          {mode === 'timeline' && laneNumber !== undefined && (
                            <span className={`px-2 py-1 rounded-full font-medium flex items-center space-x-1 ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              <Layers size={10} />
                              <span>L{laneNumber + 1}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {/* Timeline-specific actions */}
                      {mode === 'timeline' && (
                        <div className="flex items-center space-x-1 mr-2">
                          <Move size={12} className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`} title="Draggable" />
                          <ArrowLeftRight size={12} className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`} title="Resizable" />
                        </div>
                      )}
                      
                      {onEditTracker && (
                        <button
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTracker(tracker);
                          }}
                          title="Edit tracker"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      
                      {onDeleteTracker && (
                        <button
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-red-900 text-gray-400 hover:text-red-200' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this tracker?')) {
                              onDeleteTracker(tracker.id);
                            }
                          }}
                          title="Delete tracker"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status and Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <StatusIcon size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {getStatusLabel(tracker.status)}
                        </span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {progress}%
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      <motion.div
                        className={`h-full rounded-full ${getTrackerTypeColor(tracker.type)} ${statusStyle.opacity}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center space-x-2 text-sm mb-3">
                    <Calendar size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                      {formatDateRange(tracker.startDate, tracker.endDate)}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      ({duration} {duration === 1 ? 'day' : 'days'})
                    </span>
                  </div>

                  {/* Description */}
                  {tracker.description && (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                      {tracker.description}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className={`flex-1 flex items-center justify-center p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <div>
              <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}>
                {mode === 'timeline' ? (
                  <Layers className="w-6 h-6 opacity-30" />
                ) : (
                  <Calendar className="w-6 h-6 opacity-30" />
                )}
              </div>
              <p className="font-medium mb-1">
                {mode === 'timeline' ? 'No trackers found' : 'No trackers active'}
              </p>
              <p className="text-sm">
                {mode === 'timeline' 
                  ? 'Create a new tracker to start planning your timeline'
                  : 'No project trackers are scheduled for this date'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {trackers.length > 0 && (
        <div className={`p-4 border-t`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {trackers.filter(t => t.status === 'not_started').length}
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Not Started
              </div>
            </div>
            <div>
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {trackers.filter(t => t.status === 'in_progress').length}
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                In Progress
              </div>
            </div>
            <div>
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {trackers.filter(t => t.status === 'completed').length}
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Completed
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};