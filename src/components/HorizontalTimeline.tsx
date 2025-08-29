import React, { useState, useCallback, useMemo } from 'react';
import { ProjectTracker } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { InfiniteTimelineContainer } from './InfiniteTimelineContainer';
import { TrackerLanes } from './TrackerLanes';
import { TimelineViewMode } from './TimelineGrid';
import { DragDropProvider } from './DragDropProvider';
import { useLaneManagement } from '../hooks/useLaneManagement';
import { 
  createTimelineViewport,
  jumpToToday
} from '../lib/timelineViewport';
import { format } from 'date-fns';
import { getLaneHeight } from '../lib/laneAssignment';

interface HorizontalTimelineProps {
  trackers: ProjectTracker[];
  selectedDate: Date;
  selectedTracker?: ProjectTracker;
  onDateSelect: (date: Date) => void;
  onTrackerClick: (tracker: ProjectTracker) => void;
  onTrackerDrag?: (tracker: ProjectTracker, newStartDate: Date, newEndDate: Date) => void;
  onTrackerResize?: (tracker: ProjectTracker, newStartDate: Date, newEndDate: Date) => void;
  loading?: boolean;
  error?: string;
}

export const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  trackers,
  selectedDate,
  selectedTracker,
  onDateSelect,
  onTrackerClick,
  onTrackerDrag,
  onTrackerResize,
  loading = false,
  error
}) => {
  const { isDark } = useTheme();
  
  // Lane management
  const {
    assignments,
    lanes,
    totalLanes,
    isValid: lanesValid,
    errors: laneErrors,
    reassignTracker,
    compactAllLanes,
    refreshAssignments
  } = useLaneManagement(trackers);

  // Create a simple viewport for DragDropProvider - this will be overridden by InfiniteTimelineContainer
  const simpleViewport = useMemo(() => {
    // If we have trackers, start from the earliest tracker date
    if (trackers.length > 0) {
      const earliestDate = new Date(Math.min(...trackers.map(t => t.startDate.getTime())));
      return createTimelineViewport(earliestDate, 'weekly');
    }
    // Otherwise, start from today
    return createTimelineViewport(jumpToToday('weekly'), 'weekly');
  }, [trackers]);

  // Handle tracker drag start
  const handleTrackerDragStart = useCallback((tracker: ProjectTracker) => {
    console.log('Drag started for tracker:', tracker.title);
    // TODO: Implement drag start logic
  }, []);

  // Handle tracker move (drag)
  const handleTrackerMove = useCallback((
    tracker: ProjectTracker, 
    newStartDate: Date, 
    newEndDate: Date,
    newLane: number
  ) => {
    console.log('Tracker moved:', tracker.title, { newStartDate, newEndDate, newLane });
    
    // Reassign to new lane
    reassignTracker(tracker.id, newLane);
    
    // Call the drag callback
    if (onTrackerDrag) {
      onTrackerDrag(tracker, newStartDate, newEndDate);
    }
  }, [onTrackerDrag, reassignTracker]);

  // Handle tracker resize
  const handleTrackerResize = useCallback((
    tracker: ProjectTracker, 
    newStartDate: Date, 
    newEndDate: Date
  ) => {
    console.log('Tracker resized:', tracker.title, { newStartDate, newEndDate });
    if (onTrackerResize) {
      onTrackerResize(tracker, newStartDate, newEndDate);
    }
  }, [onTrackerResize]);

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className="text-lg font-medium mb-2 text-red-500">Timeline Error</div>
          <div className="text-sm">{error}</div>
          <button
            onClick={refreshAssignments}
            className={`mt-4 px-4 py-2 text-sm rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Lane validation errors - temporarily disabled to isolate clicking issues
  // if (!lanesValid && laneErrors.length > 0) {
  //   console.warn('Lane assignment errors:', laneErrors);
  // }

  // Create lane assignments map for drag drop provider
  const laneAssignmentsMap = useMemo(() => {
    const map = new Map<string, number>();
    assignments.forEach(assignment => {
      map.set(assignment.trackerId, assignment.laneIndex);
    });
    return map;
  }, [assignments]);

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <InfiniteTimelineContainer
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          trackers={[]}
        >
          {/* Loading Skeleton */}
          <div className="relative">
            {Array.from({ length: 4 }, (_, laneIndex) => (
              <div key={laneIndex} className="flex items-center space-x-4 mb-4">
                {Array.from({ length: 3 }, (_, trackerIndex) => (
                  <div
                    key={trackerIndex}
                    className={`h-8 rounded-lg animate-pulse ${
                      isDark ? 'bg-gray-800' : 'bg-gray-200'
                    }`}
                    style={{
                      width: `${120 + trackerIndex * 40}px`,
                      marginLeft: `${trackerIndex * 80}px`
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </InfiniteTimelineContainer>
        
        {/* Loading indicator overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm z-50">
          <div className={`flex items-center space-x-3 px-6 py-3 rounded-lg ${
            isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          } shadow-lg`}>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Loading timeline...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <InfiniteTimelineContainer
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        trackers={trackers}
      >
        {/* Drag and Drop Provider */}
        <DragDropProvider
          viewportStartDate={simpleViewport.startDate}
          pixelsPerDay={simpleViewport.pixelsPerDay}
          viewMode={simpleViewport.viewMode}
          laneHeight={getLaneHeight(simpleViewport.viewMode)}
          allTrackers={trackers}
          laneAssignments={laneAssignmentsMap}
          onTrackerMove={handleTrackerMove}
          onTrackerResize={handleTrackerResize}
          config={{
            snapToGrid: true,
            snapThreshold: 10,
            minDuration: 1,
            maxDuration: 365,
            showPreview: true,
            enableLaneSwitch: true
          }}
        >
          {/* Tracker Lanes or Empty State */}
          {trackers.length === 0 && !loading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="mb-4">
                  <svg 
                    className={`w-16 h-16 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                </div>
                <div className="text-lg font-medium mb-2">No project trackers found</div>
                <div className="text-sm mb-4">Create your first tracker to start planning your timeline</div>
                <button
                  onClick={() => onDateSelect(new Date())}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Add First Tracker
                </button>
              </div>
            </div>
          ) : (
            <TrackerLanes
              trackers={trackers}
              startDate={simpleViewport.startDate}
              endDate={simpleViewport.endDate}
              viewMode={simpleViewport.viewMode}
              pixelsPerDay={simpleViewport.pixelsPerDay}
              selectedTracker={selectedTracker}
              onTrackerClick={onTrackerClick}
              onTrackerDragStart={handleTrackerDragStart}
              loading={loading}
            />
          )}
        </DragDropProvider>
      </InfiniteTimelineContainer>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`p-2 text-xs border-t ${isDark ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
          <div>Trackers: {trackers.length} | Lanes: {totalLanes}</div>
          <div>Viewport: {format(simpleViewport.startDate, 'MMM d')} - {format(simpleViewport.endDate, 'MMM d')} | {simpleViewport.viewMode}</div>
          {!lanesValid && (
            <div className="text-red-500 mt-1">
              Lane errors: {laneErrors.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};