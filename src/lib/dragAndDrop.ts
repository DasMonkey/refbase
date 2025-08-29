import { ProjectTracker } from '../types';
import { addDays, differenceInDays } from 'date-fns';
import { snapDateToGrid } from './timelineViewport';
import { TimelineViewMode } from '../components/TimelineGrid';

export interface DragState {
  isDragging: boolean;
  draggedTracker: ProjectTracker | null;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  originalDates: { start: Date; end: Date } | null;
  previewDates: { start: Date; end: Date } | null;
  targetLane: number | null;
  isValidDrop: boolean;
}

export interface DragConfig {
  snapToGrid: boolean;
  snapThreshold: number; // pixels
  minDuration: number; // days
  maxDuration: number; // days
  showPreview: boolean;
  enableLaneSwitch: boolean;
}

export const DEFAULT_DRAG_CONFIG: DragConfig = {
  snapToGrid: true,
  snapThreshold: 10,
  minDuration: 1,
  maxDuration: 365,
  showPreview: true,
  enableLaneSwitch: true
};

/**
 * Calculate new dates based on drag position
 */
export const calculateDragDates = (
  tracker: ProjectTracker,
  dragType: 'move' | 'resize-start' | 'resize-end',
  deltaX: number,
  pixelsPerDay: number,
  viewportStartDate: Date,
  viewMode: TimelineViewMode,
  config: DragConfig = DEFAULT_DRAG_CONFIG
): { start: Date; end: Date } | null => {
  const daysDelta = Math.round(deltaX / pixelsPerDay);
  
  let newStartDate: Date;
  let newEndDate: Date;

  switch (dragType) {
    case 'move':
      // Move entire tracker
      newStartDate = addDays(tracker.startDate, daysDelta);
      newEndDate = addDays(tracker.endDate, daysDelta);
      break;
      
    case 'resize-start':
      // Resize from start date
      newStartDate = addDays(tracker.startDate, daysDelta);
      newEndDate = tracker.endDate;
      
      // Ensure minimum duration
      if (differenceInDays(newEndDate, newStartDate) < config.minDuration) {
        newStartDate = addDays(newEndDate, -config.minDuration);
      }
      break;
      
    case 'resize-end':
      // Resize from end date
      newStartDate = tracker.startDate;
      newEndDate = addDays(tracker.endDate, daysDelta);
      
      // Ensure minimum duration
      if (differenceInDays(newEndDate, newStartDate) < config.minDuration) {
        newEndDate = addDays(newStartDate, config.minDuration);
      }
      break;
      
    default:
      return null;
  }

  // Apply snap to grid
  if (config.snapToGrid) {
    newStartDate = snapDateToGrid(newStartDate, viewMode, true);
    newEndDate = snapDateToGrid(newEndDate, viewMode, true);
  }

  // Validate duration constraints
  const duration = differenceInDays(newEndDate, newStartDate);
  if (duration < config.minDuration || duration > config.maxDuration) {
    return null;
  }

  return { start: newStartDate, end: newEndDate };
};

/**
 * Check if a drop position is valid
 */
export const isValidDropPosition = (
  tracker: ProjectTracker,
  newDates: { start: Date; end: Date },
  targetLane: number,
  allTrackers: ProjectTracker[],
  laneAssignments: Map<string, number>
): boolean => {
  // Get trackers in target lane (excluding the dragged tracker)
  const trackersInLane = allTrackers.filter(t => 
    t.id !== tracker.id && laneAssignments.get(t.id) === targetLane
  );

  // Check for overlaps
  return !trackersInLane.some(existingTracker => {
    return !(
      newDates.end < existingTracker.startDate || 
      newDates.start > existingTracker.endDate
    );
  });
};

/**
 * Calculate target lane based on mouse position
 */
export const calculateTargetLane = (
  mouseY: number,
  laneHeight: number,
  laneSpacing: number = 4
): number => {
  return Math.max(0, Math.floor(mouseY / (laneHeight + laneSpacing)));
};

/**
 * Get drag cursor style based on drag type
 */
export const getDragCursor = (dragType: 'move' | 'resize-start' | 'resize-end' | null): string => {
  switch (dragType) {
    case 'move':
      return 'grabbing';
    case 'resize-start':
    case 'resize-end':
      return 'col-resize';
    default:
      return 'default';
  }
};

/**
 * Determine drag type based on mouse position within tracker
 */
export const getDragType = (
  mouseX: number,
  trackerLeft: number,
  trackerWidth: number,
  resizeHandleWidth: number = 8
): 'move' | 'resize-start' | 'resize-end' => {
  const relativeX = mouseX - trackerLeft;
  
  if (relativeX <= resizeHandleWidth) {
    return 'resize-start';
  } else if (relativeX >= trackerWidth - resizeHandleWidth) {
    return 'resize-end';
  } else {
    return 'move';
  }
};

/**
 * Create drag preview styles
 */
export const getDragPreviewStyles = (
  isDragging: boolean,
  isValidDrop: boolean,
  isDark: boolean
) => {
  if (!isDragging) return {};

  return {
    opacity: 0.8,
    transform: 'scale(1.02)',
    boxShadow: isDark 
      ? '0 8px 25px rgba(0, 0, 0, 0.4)' 
      : '0 8px 25px rgba(0, 0, 0, 0.2)',
    borderColor: isValidDrop 
      ? '#10B981' // Green for valid drop
      : '#EF4444', // Red for invalid drop
    borderWidth: '2px',
    zIndex: 1000
  };
};

/**
 * Create ghost tracker styles for drag preview
 */
export const getGhostTrackerStyles = (
  previewDates: { start: Date; end: Date },
  viewportStartDate: Date,
  pixelsPerDay: number,
  laneIndex: number,
  laneHeight: number,
  isValidDrop: boolean,
  isDark: boolean
) => {
  const left = Math.floor((previewDates.start.getTime() - viewportStartDate.getTime()) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
  const width = Math.ceil((previewDates.end.getTime() - previewDates.start.getTime()) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
  const top = laneIndex * (laneHeight + 4) + 4;

  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${laneHeight - 8}px`,
    backgroundColor: isValidDrop 
      ? (isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)')
      : (isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'),
    border: `2px dashed ${isValidDrop ? '#10B981' : '#EF4444'}`,
    borderRadius: '6px',
    pointerEvents: 'none' as const,
    zIndex: 999
  };
};

/**
 * Handle mouse move during drag
 */
export const handleDragMove = (
  event: MouseEvent,
  dragState: DragState,
  config: DragConfig,
  viewportStartDate: Date,
  pixelsPerDay: number,
  viewMode: TimelineViewMode,
  laneHeight: number
): Partial<DragState> => {
  if (!dragState.isDragging || !dragState.draggedTracker || !dragState.dragType) {
    return {};
  }

  const deltaX = event.clientX - dragState.startPosition.x;

  // Calculate new dates
  const newDates = calculateDragDates(
    dragState.draggedTracker,
    dragState.dragType,
    deltaX,
    pixelsPerDay,
    viewportStartDate,
    viewMode,
    config
  );

  // Calculate target lane
  const targetLane = config.enableLaneSwitch 
    ? calculateTargetLane(event.clientY, laneHeight)
    : dragState.targetLane;

  return {
    currentPosition: { x: event.clientX, y: event.clientY },
    previewDates: newDates,
    targetLane,
    isValidDrop: newDates !== null
  };
};

/**
 * Handle drag end
 */
export const handleDragEnd = (
  dragState: DragState
): { 
  tracker: ProjectTracker; 
  newDates: { start: Date; end: Date }; 
  newLane: number 
} | null => {
  if (!dragState.isDragging || 
      !dragState.draggedTracker || 
      !dragState.previewDates || 
      !dragState.isValidDrop ||
      dragState.targetLane === null) {
    return null;
  }

  return {
    tracker: dragState.draggedTracker,
    newDates: dragState.previewDates,
    newLane: dragState.targetLane
  };
};

/**
 * Create initial drag state
 */
export const createInitialDragState = (): DragState => ({
  isDragging: false,
  draggedTracker: null,
  dragType: null,
  startPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 },
  originalDates: null,
  previewDates: null,
  targetLane: null,
  isValidDrop: false
});

/**
 * Start drag operation
 */
export const startDrag = (
  tracker: ProjectTracker,
  dragType: 'move' | 'resize-start' | 'resize-end',
  startPosition: { x: number; y: number },
  currentLane: number
): Partial<DragState> => ({
  isDragging: true,
  draggedTracker: tracker,
  dragType,
  startPosition,
  currentPosition: startPosition,
  originalDates: { start: tracker.startDate, end: tracker.endDate },
  previewDates: { start: tracker.startDate, end: tracker.endDate },
  targetLane: currentLane,
  isValidDrop: true
});

/**
 * End drag operation
 */
export const endDrag = (): Partial<DragState> => ({
  isDragging: false,
  draggedTracker: null,
  dragType: null,
  startPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 },
  originalDates: null,
  previewDates: null,
  targetLane: null,
  isValidDrop: false
});