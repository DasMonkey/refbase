import { startOfWeek, startOfMonth, startOfQuarter, addDays, addWeeks, addMonths, addQuarters } from 'date-fns';
import { TimelineViewMode } from '../components/TimelineGrid';

export interface TimelineViewport {
  startDate: Date;
  endDate: Date;
  viewMode: TimelineViewMode;
  pixelsPerDay: number;
  visibleDays: number;
  scrollPosition: { x: number; y: number };
}

export interface ViewModeConfig {
  visibleDays: number;
  pixelsPerDay: number;
  snapToUnit: 'day' | 'week' | 'month';
  navigationUnit: 'day' | 'week' | 'month' | 'quarter';
}

export const VIEW_MODE_CONFIGS: Record<TimelineViewMode, ViewModeConfig> = {
  weekly: {
    visibleDays: 7,
    pixelsPerDay: 120,
    snapToUnit: 'day',
    navigationUnit: 'week'
  },
  monthly: {
    visibleDays: 30,
    pixelsPerDay: 40,
    snapToUnit: 'day',
    navigationUnit: 'month'
  },
  quarterly: {
    visibleDays: 90,
    pixelsPerDay: 15,
    snapToUnit: 'week',
    navigationUnit: 'quarter'
  }
};

/**
 * Calculate the start date for a timeline viewport based on view mode
 */
export const getTimelineStartDate = (date: Date, viewMode: TimelineViewMode): Date => {
  switch (viewMode) {
    case 'weekly':
      return startOfWeek(date, { weekStartsOn: 1 }); // Start on Monday
    case 'monthly':
      return startOfMonth(date);
    case 'quarterly':
      return startOfQuarter(date);
    default:
      return startOfWeek(date, { weekStartsOn: 1 });
  }
};

/**
 * Calculate the end date for a timeline viewport
 */
export const getTimelineEndDate = (startDate: Date, viewMode: TimelineViewMode): Date => {
  const config = VIEW_MODE_CONFIGS[viewMode];
  return addDays(startDate, config.visibleDays - 1);
};

/**
 * Navigate timeline viewport in the specified direction
 */
export const navigateTimeline = (
  currentStartDate: Date, 
  direction: 'prev' | 'next', 
  viewMode: TimelineViewMode
): Date => {
  const config = VIEW_MODE_CONFIGS[viewMode];
  const multiplier = direction === 'next' ? 1 : -1;

  switch (config.navigationUnit) {
    case 'day':
      return addDays(currentStartDate, multiplier);
    case 'week':
      return addWeeks(currentStartDate, multiplier);
    case 'month':
      return addMonths(currentStartDate, multiplier);
    case 'quarter':
      return addQuarters(currentStartDate, multiplier);
    default:
      return addWeeks(currentStartDate, multiplier);
  }
};

/**
 * Jump to today in the timeline
 */
export const jumpToToday = (viewMode: TimelineViewMode): Date => {
  return getTimelineStartDate(new Date(), viewMode);
};

/**
 * Jump to a specific date in the timeline
 */
export const jumpToDate = (targetDate: Date, viewMode: TimelineViewMode): Date => {
  return getTimelineStartDate(targetDate, viewMode);
};

/**
 * Calculate pixel position for a date within the timeline viewport
 */
export const getDatePixelPosition = (
  date: Date, 
  viewportStartDate: Date, 
  pixelsPerDay: number
): number => {
  const daysDiff = Math.floor((date.getTime() - viewportStartDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff * pixelsPerDay;
};

/**
 * Calculate date from pixel position within the timeline viewport
 */
export const getDateFromPixelPosition = (
  pixelX: number, 
  viewportStartDate: Date, 
  pixelsPerDay: number
): Date => {
  const dayOffset = Math.floor(pixelX / pixelsPerDay);
  return addDays(viewportStartDate, dayOffset);
};

/**
 * Calculate the width in pixels for a date range
 */
export const getDateRangeWidth = (
  startDate: Date, 
  endDate: Date, 
  pixelsPerDay: number
): number => {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(daysDiff * pixelsPerDay, pixelsPerDay); // Minimum one day width
};

/**
 * Check if a date range is visible in the current viewport
 */
export const isDateRangeVisible = (
  rangeStart: Date,
  rangeEnd: Date,
  viewportStart: Date,
  viewportEnd: Date
): boolean => {
  return rangeStart <= viewportEnd && rangeEnd >= viewportStart;
};

/**
 * Snap a date to the appropriate grid unit based on view mode
 */
export const snapDateToGrid = (
  date: Date, 
  viewMode: TimelineViewMode, 
  snapEnabled: boolean = true
): Date => {
  if (!snapEnabled) return date;

  const config = VIEW_MODE_CONFIGS[viewMode];
  
  switch (config.snapToUnit) {
    case 'day':
      // Snap to start of day
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    case 'week':
      // Snap to start of week (Monday)
      return startOfWeek(date, { weekStartsOn: 1 });
    case 'month':
      // Snap to start of month
      return startOfMonth(date);
    default:
      return date;
  }
};

/**
 * Calculate the optimal timeline viewport for a set of trackers
 */
export const calculateOptimalViewport = (
  trackers: Array<{ startDate: Date; endDate: Date }>,
  viewMode: TimelineViewMode
): { startDate: Date; endDate: Date } => {
  if (trackers.length === 0) {
    return {
      startDate: getTimelineStartDate(new Date(), viewMode),
      endDate: getTimelineEndDate(getTimelineStartDate(new Date(), viewMode), viewMode)
    };
  }

  const allDates = trackers.flatMap(t => [t.startDate, t.endDate]);
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  return {
    startDate: getTimelineStartDate(minDate, viewMode),
    endDate: getTimelineEndDate(getTimelineStartDate(maxDate, viewMode), viewMode)
  };
};

/**
 * Create a timeline viewport object
 */
export const createTimelineViewport = (
  startDate: Date,
  viewMode: TimelineViewMode,
  scrollPosition: { x: number; y: number } = { x: 0, y: 0 }
): TimelineViewport => {
  const config = VIEW_MODE_CONFIGS[viewMode];
  
  return {
    startDate,
    endDate: getTimelineEndDate(startDate, viewMode),
    viewMode,
    pixelsPerDay: config.pixelsPerDay,
    visibleDays: config.visibleDays,
    scrollPosition
  };
};