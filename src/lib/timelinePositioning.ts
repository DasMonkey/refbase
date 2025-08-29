import { ProjectTracker } from '../types';
import { differenceInDays, addDays, isSameDay, startOfDay } from 'date-fns';
import { TimelineViewMode } from '../components/TimelineGrid';
import { 
  getDatePixelPosition, 
  getDateRangeWidth,
  VIEW_MODE_CONFIGS 
} from './timelineViewport';

export interface TrackerPosition {
  trackerId: string;
  left: number;
  top: number;
  width: number;
  height: number;
  laneIndex: number;
  isVisible: boolean;
  clipLeft: number;
  clipRight: number;
}

export interface TimelineLayout {
  trackerPositions: TrackerPosition[];
  totalHeight: number;
  totalWidth: number;
  visibleTrackers: number;
}

/**
 * Calculate absolute pixel positions for trackers in the timeline
 */
export const calculateTrackerPositions = (
  trackers: ProjectTracker[],
  laneAssignments: Map<string, number>,
  viewportStartDate: Date,
  viewportEndDate: Date,
  pixelsPerDay: number,
  laneHeight: number,
  laneSpacing: number = 4
): TrackerPosition[] => {
  return trackers.map(tracker => {
    const laneIndex = laneAssignments.get(tracker.id) ?? 0;
    
    // Calculate horizontal position and width
    const left = getDatePixelPosition(tracker.startDate, viewportStartDate, pixelsPerDay);
    const width = getDateRangeWidth(tracker.startDate, tracker.endDate, pixelsPerDay);
    
    // Calculate vertical position
    const top = laneIndex * (laneHeight + laneSpacing) + laneSpacing;
    const height = laneHeight;
    
    // Check visibility
    const isVisible = !(
      tracker.endDate < viewportStartDate || 
      tracker.startDate > viewportEndDate
    );
    
    // Calculate clipping for partially visible trackers
    const viewportLeft = 0;
    const viewportRight = differenceInDays(viewportEndDate, viewportStartDate) * pixelsPerDay;
    
    const clipLeft = Math.max(0, viewportLeft - left);
    const clipRight = Math.max(0, (left + width) - viewportRight);
    
    return {
      trackerId: tracker.id,
      left,
      top,
      width,
      height,
      laneIndex,
      isVisible,
      clipLeft,
      clipRight
    };
  });
};

/**
 * Calculate timeline layout dimensions
 */
export const calculateTimelineLayout = (
  trackers: ProjectTracker[],
  laneAssignments: Map<string, number>,
  viewportStartDate: Date,
  viewportEndDate: Date,
  viewMode: TimelineViewMode
): TimelineLayout => {
  const config = VIEW_MODE_CONFIGS[viewMode];
  const laneHeight = getLaneHeightForViewMode(viewMode);
  const laneSpacing = 4;
  
  const positions = calculateTrackerPositions(
    trackers,
    laneAssignments,
    viewportStartDate,
    viewportEndDate,
    config.pixelsPerDay,
    laneHeight,
    laneSpacing
  );
  
  const maxLane = Math.max(...Array.from(laneAssignments.values()), -1);
  const totalHeight = (maxLane + 1) * (laneHeight + laneSpacing) + laneSpacing;
  const totalWidth = config.visibleDays * config.pixelsPerDay;
  const visibleTrackers = positions.filter(p => p.isVisible).length;
  
  return {
    trackerPositions: positions,
    totalHeight,
    totalWidth,
    visibleTrackers
  };
};

/**
 * Get lane height based on view mode
 */
export const getLaneHeightForViewMode = (viewMode: TimelineViewMode): number => {
  switch (viewMode) {
    case 'weekly':
      return 48; // Detailed view with more space
    case 'monthly':
      return 36; // Medium view
    case 'quarterly':
      return 24; // Compact view
    default:
      return 48;
  }
};

/**
 * Calculate optimal tracker text size based on available width
 */
export const calculateTrackerTextSize = (
  width: number,
  viewMode: TimelineViewMode
): { fontSize: number; maxLength: number; showFullText: boolean } => {
  const baseFont = viewMode === 'quarterly' ? 10 : viewMode === 'monthly' ? 12 : 14;
  
  if (width < 40) {
    return { fontSize: 0, maxLength: 0, showFullText: false };
  } else if (width < 80) {
    return { fontSize: baseFont - 2, maxLength: 1, showFullText: false };
  } else if (width < 120) {
    return { fontSize: baseFont - 1, maxLength: 3, showFullText: false };
  } else if (width < 200) {
    return { fontSize: baseFont, maxLength: Math.floor(width / 8), showFullText: false };
  } else {
    return { fontSize: baseFont, maxLength: Infinity, showFullText: true };
  }
};

/**
 * Calculate tracker visual styles based on position and state
 */
export const calculateTrackerStyles = (
  tracker: ProjectTracker,
  position: TrackerPosition,
  viewMode: TimelineViewMode,
  isDark: boolean,
  isSelected: boolean = false,
  isHovered: boolean = false,
  isDragging: boolean = false
) => {
  const textInfo = calculateTrackerTextSize(position.width, viewMode);
  const opacity = isDragging ? 0.7 : 1;
  const scale = isHovered && !isDragging ? 1.02 : 1;
  
  // Base colors by type
  const typeColors = {
    project: '#3B82F6', // Blue
    feature: '#10B981', // Green
    bug: '#EF4444'      // Red
  };
  
  const baseColor = typeColors[tracker.type] || '#6B7280';
  
  // Status modifications
  let finalOpacity = opacity;
  let animation = '';
  
  switch (tracker.status) {
    case 'not_started':
      finalOpacity *= 0.6;
      break;
    case 'in_progress':
      animation = 'animate-pulse';
      break;
    case 'completed':
      finalOpacity *= 0.8;
      break;
  }
  
  // Selection styling
  const borderWidth = isSelected ? 2 : 1;
  const borderColor = isSelected ? '#3B82F6' : 'transparent';
  
  // Shadow and elevation
  const boxShadow = isDragging 
    ? '0 8px 25px rgba(0, 0, 0, 0.3)' 
    : isHovered 
      ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
      : '0 1px 3px rgba(0, 0, 0, 0.1)';
  
  return {
    position: 'absolute' as const,
    left: `${position.left}px`,
    top: `${position.top}px`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    backgroundColor: baseColor,
    opacity: finalOpacity,
    transform: `scale(${scale})`,
    borderWidth: `${borderWidth}px`,
    borderColor,
    borderStyle: 'solid',
    borderRadius: '6px',
    boxShadow,
    fontSize: `${textInfo.fontSize}px`,
    color: '#ffffff',
    zIndex: isDragging ? 1000 : isSelected ? 100 : isHovered ? 50 : 1,
    transition: isDragging ? 'none' : 'all 0.2s ease',
    cursor: 'pointer',
    animation
  };
};

/**
 * Check if a point is within a tracker bounds
 */
export const isPointInTracker = (
  x: number,
  y: number,
  position: TrackerPosition
): boolean => {
  return x >= position.left &&
         x <= position.left + position.width &&
         y >= position.top &&
         y <= position.top + position.height;
};

/**
 * Find tracker at specific coordinates
 */
export const findTrackerAtPosition = (
  x: number,
  y: number,
  positions: TrackerPosition[]
): TrackerPosition | null => {
  // Find the topmost tracker (highest z-index) at the position
  const matchingTrackers = positions.filter(pos => 
    pos.isVisible && isPointInTracker(x, y, pos)
  );
  
  if (matchingTrackers.length === 0) return null;
  
  // Return the tracker in the highest lane (rendered on top)
  return matchingTrackers.reduce((top, current) => 
    current.laneIndex > top.laneIndex ? current : top
  );
};

/**
 * Calculate scroll position to center a tracker
 */
export const calculateScrollToTracker = (
  tracker: ProjectTracker,
  viewportStartDate: Date,
  pixelsPerDay: number,
  containerWidth: number
): { scrollX: number; isRequired: boolean } => {
  const trackerLeft = getDatePixelPosition(tracker.startDate, viewportStartDate, pixelsPerDay);
  const trackerWidth = getDateRangeWidth(tracker.startDate, tracker.endDate, pixelsPerDay);
  const trackerCenter = trackerLeft + (trackerWidth / 2);
  
  const desiredScrollX = trackerCenter - (containerWidth / 2);
  const currentScrollX = 0; // Would come from container state
  
  const isRequired = Math.abs(desiredScrollX - currentScrollX) > containerWidth * 0.1;
  
  return {
    scrollX: Math.max(0, desiredScrollX),
    isRequired
  };
};

/**
 * Calculate visible date range based on scroll position
 */
export const calculateVisibleDateRange = (
  scrollX: number,
  containerWidth: number,
  viewportStartDate: Date,
  pixelsPerDay: number
): { startDate: Date; endDate: Date } => {
  const leftDayOffset = Math.floor(scrollX / pixelsPerDay);
  const rightDayOffset = Math.ceil((scrollX + containerWidth) / pixelsPerDay);
  
  return {
    startDate: addDays(viewportStartDate, leftDayOffset),
    endDate: addDays(viewportStartDate, rightDayOffset)
  };
};

/**
 * Get tracker overlap information for collision detection
 */
export const getTrackerOverlaps = (
  targetTracker: ProjectTracker,
  allTrackers: ProjectTracker[],
  laneAssignments: Map<string, number>,
  excludeTrackerId?: string
): Array<{ tracker: ProjectTracker; laneIndex: number; overlapDays: number }> => {
  const targetLane = laneAssignments.get(targetTracker.id) ?? 0;
  
  return allTrackers
    .filter(t => 
      t.id !== (excludeTrackerId ?? targetTracker.id) &&
      laneAssignments.get(t.id) === targetLane
    )
    .map(tracker => {
      const overlapStart = new Date(Math.max(
        targetTracker.startDate.getTime(),
        tracker.startDate.getTime()
      ));
      const overlapEnd = new Date(Math.min(
        targetTracker.endDate.getTime(),
        tracker.endDate.getTime()
      ));
      
      const overlapDays = overlapStart <= overlapEnd 
        ? differenceInDays(overlapEnd, overlapStart) + 1 
        : 0;
      
      return {
        tracker,
        laneIndex: laneAssignments.get(tracker.id) ?? 0,
        overlapDays
      };
    })
    .filter(overlap => overlap.overlapDays > 0);
};

/**
 * Calculate performance metrics for timeline rendering
 */
export const calculateRenderMetrics = (
  totalTrackers: number,
  visibleTrackers: number,
  totalLanes: number
): {
  complexity: 'low' | 'medium' | 'high' | 'extreme';
  shouldVirtualize: boolean;
  estimatedRenderTime: number;
} => {
  const renderComplexity = totalTrackers * totalLanes;
  
  let complexity: 'low' | 'medium' | 'high' | 'extreme';
  if (renderComplexity < 100) complexity = 'low';
  else if (renderComplexity < 500) complexity = 'medium';
  else if (renderComplexity < 1000) complexity = 'high';
  else complexity = 'extreme';
  
  const shouldVirtualize = totalTrackers > 100 || totalLanes > 20;
  const estimatedRenderTime = Math.ceil(renderComplexity / 50); // ms
  
  return {
    complexity,
    shouldVirtualize,
    estimatedRenderTime
  };
};