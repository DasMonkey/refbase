import { ProjectTracker } from '../types';
import { addDays, differenceInDays, isBefore, isAfter } from 'date-fns';
import { snapDateToGrid, TimelineViewMode } from './timelineViewport';

export interface ResizeConstraints {
  minDuration: number; // minimum days
  maxDuration: number; // maximum days
  snapToGrid: boolean;
  allowPastDates: boolean;
  allowFutureDates: boolean;
  maxFutureYears: number;
}

export const DEFAULT_RESIZE_CONSTRAINTS: ResizeConstraints = {
  minDuration: 1,
  maxDuration: 365,
  snapToGrid: true,
  allowPastDates: true,
  allowFutureDates: true,
  maxFutureYears: 2
};

export interface ResizeResult {
  isValid: boolean;
  newStartDate: Date;
  newEndDate: Date;
  duration: number;
  errors: string[];
}

/**
 * Calculate new dates when resizing from start
 */
export const calculateResizeFromStart = (
  tracker: ProjectTracker,
  newStartDate: Date,
  constraints: ResizeConstraints = DEFAULT_RESIZE_CONSTRAINTS,
  viewMode: TimelineViewMode = 'weekly'
): ResizeResult => {
  const errors: string[] = [];
  let finalStartDate = newStartDate;
  const finalEndDate = tracker.endDate;

  // Apply snap to grid
  if (constraints.snapToGrid) {
    finalStartDate = snapDateToGrid(finalStartDate, viewMode, true);
  }

  // Validate date constraints
  const now = new Date();
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + constraints.maxFutureYears);

  // Check past dates
  if (!constraints.allowPastDates && isBefore(finalStartDate, now)) {
    errors.push('Start date cannot be in the past');
    finalStartDate = now;
  }

  // Check future dates
  if (!constraints.allowFutureDates && isAfter(finalStartDate, maxFutureDate)) {
    errors.push(`Start date cannot be more than ${constraints.maxFutureYears} years in the future`);
    finalStartDate = maxFutureDate;
  }

  // Check if start is after end
  if (isAfter(finalStartDate, finalEndDate)) {
    errors.push('Start date cannot be after end date');
    finalStartDate = addDays(finalEndDate, -constraints.minDuration);
  }

  // Calculate duration
  const duration = differenceInDays(finalEndDate, finalStartDate) + 1;

  // Check duration constraints
  if (duration < constraints.minDuration) {
    errors.push(`Duration must be at least ${constraints.minDuration} day(s)`);
    finalStartDate = addDays(finalEndDate, -constraints.minDuration + 1);
  }

  if (duration > constraints.maxDuration) {
    errors.push(`Duration cannot exceed ${constraints.maxDuration} days`);
    finalStartDate = addDays(finalEndDate, -constraints.maxDuration + 1);
  }

  return {
    isValid: errors.length === 0,
    newStartDate: finalStartDate,
    newEndDate: finalEndDate,
    duration: differenceInDays(finalEndDate, finalStartDate) + 1,
    errors
  };
};

/**
 * Calculate new dates when resizing from end
 */
export const calculateResizeFromEnd = (
  tracker: ProjectTracker,
  newEndDate: Date,
  constraints: ResizeConstraints = DEFAULT_RESIZE_CONSTRAINTS,
  viewMode: TimelineViewMode = 'weekly'
): ResizeResult => {
  const errors: string[] = [];
  const finalStartDate = tracker.startDate;
  let finalEndDate = newEndDate;

  // Apply snap to grid
  if (constraints.snapToGrid) {
    finalEndDate = snapDateToGrid(finalEndDate, viewMode, true);
  }

  // Validate date constraints
  const now = new Date();
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + constraints.maxFutureYears);

  // Check past dates
  if (!constraints.allowPastDates && isBefore(finalEndDate, now)) {
    errors.push('End date cannot be in the past');
    finalEndDate = now;
  }

  // Check future dates
  if (!constraints.allowFutureDates && isAfter(finalEndDate, maxFutureDate)) {
    errors.push(`End date cannot be more than ${constraints.maxFutureYears} years in the future`);
    finalEndDate = maxFutureDate;
  }

  // Check if end is before start
  if (isBefore(finalEndDate, finalStartDate)) {
    errors.push('End date cannot be before start date');
    finalEndDate = addDays(finalStartDate, constraints.minDuration - 1);
  }

  // Calculate duration
  const duration = differenceInDays(finalEndDate, finalStartDate) + 1;

  // Check duration constraints
  if (duration < constraints.minDuration) {
    errors.push(`Duration must be at least ${constraints.minDuration} day(s)`);
    finalEndDate = addDays(finalStartDate, constraints.minDuration - 1);
  }

  if (duration > constraints.maxDuration) {
    errors.push(`Duration cannot exceed ${constraints.maxDuration} days`);
    finalEndDate = addDays(finalStartDate, constraints.maxDuration - 1);
  }

  return {
    isValid: errors.length === 0,
    newStartDate: finalStartDate,
    newEndDate: finalEndDate,
    duration: differenceInDays(finalEndDate, finalStartDate) + 1,
    errors
  };
};

/**
 * Get resize handle detection area
 */
export const getResizeHandleArea = (
  trackerLeft: number,
  trackerWidth: number,
  handleWidth: number = 8
): { startHandle: { left: number; right: number }; endHandle: { left: number; right: number } } => {
  return {
    startHandle: {
      left: trackerLeft,
      right: trackerLeft + handleWidth
    },
    endHandle: {
      left: trackerLeft + trackerWidth - handleWidth,
      right: trackerLeft + trackerWidth
    }
  };
};

/**
 * Check if mouse position is over a resize handle
 */
export const getResizeHandleType = (
  mouseX: number,
  trackerLeft: number,
  trackerWidth: number,
  handleWidth: number = 8
): 'start' | 'end' | null => {
  const handles = getResizeHandleArea(trackerLeft, trackerWidth, handleWidth);
  
  if (mouseX >= handles.startHandle.left && mouseX <= handles.startHandle.right) {
    return 'start';
  }
  
  if (mouseX >= handles.endHandle.left && mouseX <= handles.endHandle.right) {
    return 'end';
  }
  
  return null;
};

/**
 * Calculate resize preview during drag
 */
export const calculateResizePreview = (
  tracker: ProjectTracker,
  resizeType: 'start' | 'end',
  mouseX: number,
  viewportStartDate: Date,
  pixelsPerDay: number,
  constraints: ResizeConstraints = DEFAULT_RESIZE_CONSTRAINTS,
  viewMode: TimelineViewMode = 'weekly'
): ResizeResult => {
  // Convert mouse position to date
  const dayOffset = Math.floor(mouseX / pixelsPerDay);
  const targetDate = addDays(viewportStartDate, dayOffset);

  if (resizeType === 'start') {
    return calculateResizeFromStart(tracker, targetDate, constraints, viewMode);
  } else {
    return calculateResizeFromEnd(tracker, targetDate, constraints, viewMode);
  }
};

/**
 * Get visual feedback for resize operation
 */
export const getResizeFeedback = (
  resizeResult: ResizeResult,
  isDark: boolean = false
): {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  message: string;
} => {
  if (resizeResult.isValid) {
    return {
      borderColor: '#10B981', // Green
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
      textColor: '#10B981',
      message: `Duration: ${resizeResult.duration} day${resizeResult.duration !== 1 ? 's' : ''}`
    };
  } else {
    return {
      borderColor: '#EF4444', // Red
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
      textColor: '#EF4444',
      message: resizeResult.errors[0] || 'Invalid resize'
    };
  }
};

/**
 * Format duration for display
 */
export const formatDuration = (days: number): string => {
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  
  if (weeks === 1 && remainingDays === 0) return '1 week';
  if (remainingDays === 0) return `${weeks} weeks`;
  if (weeks === 1) return `1 week, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
  
  return `${weeks} weeks, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
};

/**
 * Get cursor style for resize handles
 */
export const getResizeCursor = (resizeType: 'start' | 'end' | null): string => {
  switch (resizeType) {
    case 'start':
    case 'end':
      return 'col-resize';
    default:
      return 'default';
  }
};