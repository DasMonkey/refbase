import { 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  endOfWeek, 
  endOfMonth,
  addDays, 
  addWeeks, 
  addMonths,
  differenceInDays,
  isSameDay,
  isAfter,
  isBefore 
} from 'date-fns';
import { TimelineViewMode } from '../components/TimelineGrid';
import { VIEW_MODE_CONFIGS } from './timelineViewport';

export interface SnapConfig {
  enabled: boolean;
  snapUnit: 'day' | 'week' | 'month';
  snapThreshold: number; // pixels
  magneticSnap: boolean; // stronger snapping when close
  smartSnap: boolean; // snap to significant dates (weekends, month boundaries)
  preserveDuration: boolean; // maintain duration when snapping
  allowSubDay: boolean; // allow sub-day precision in weekly mode
}

export interface SnapResult {
  snappedDate: Date;
  originalDate: Date;
  wasSnapped: boolean;
  snapReason: string;
  snapDistance: number; // in pixels
}

export interface SnapConstraints {
  minDate?: Date;
  maxDate?: Date;
  blockedDates?: Date[];
  preferredDates?: Date[];
  snapToExistingEvents?: boolean;
}

export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  enabled: true,
  snapUnit: 'day',
  snapThreshold: 15,
  magneticSnap: true,
  smartSnap: true,
  preserveDuration: true,
  allowSubDay: false
};

/**
 * Get snap configuration for a specific view mode
 */
export const getSnapConfigForViewMode = (
  viewMode: TimelineViewMode,
  customConfig?: Partial<SnapConfig>
): SnapConfig => {
  const baseConfig = { ...DEFAULT_SNAP_CONFIG };

  switch (viewMode) {
    case 'weekly':
      baseConfig.snapUnit = 'day';
      baseConfig.snapThreshold = 10;
      baseConfig.allowSubDay = true;
      break;
    case 'monthly':
      baseConfig.snapUnit = 'day';
      baseConfig.snapThreshold = 8;
      baseConfig.allowSubDay = false;
      break;
    case 'quarterly':
      baseConfig.snapUnit = 'week';
      baseConfig.snapThreshold = 12;
      baseConfig.allowSubDay = false;
      break;
  }

  return { ...baseConfig, ...customConfig };
};

/**
 * Snap a date to the nearest grid unit
 */
export const snapDateToGrid = (
  targetDate: Date,
  viewMode: TimelineViewMode,
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
  constraints?: SnapConstraints
): SnapResult => {
  const originalDate = new Date(targetDate);
  
  if (!config.enabled) {
    return {
      snappedDate: originalDate,
      originalDate,
      wasSnapped: false,
      snapReason: 'Snapping disabled',
      snapDistance: 0
    };
  }

  let snappedDate = new Date(targetDate);
  let snapReason = '';

  // Apply constraints first
  if (constraints?.minDate && isBefore(snappedDate, constraints.minDate)) {
    snappedDate = new Date(constraints.minDate);
    snapReason = 'Constrained to minimum date';
  }

  if (constraints?.maxDate && isAfter(snappedDate, constraints.maxDate)) {
    snappedDate = new Date(constraints.maxDate);
    snapReason = 'Constrained to maximum date';
  }

  // Smart snapping to significant dates
  if (config.smartSnap) {
    const smartSnap = findSmartSnapDate(snappedDate, viewMode);
    if (smartSnap.shouldSnap) {
      snappedDate = smartSnap.snapDate;
      snapReason = smartSnap.reason;
    }
  }

  // Basic grid snapping
  if (!snapReason) {
    const gridSnap = snapToBasicGrid(snappedDate, config.snapUnit);
    snappedDate = gridSnap.date;
    snapReason = gridSnap.reason;
  }

  // Snap to preferred dates if provided
  if (constraints?.preferredDates && constraints.preferredDates.length > 0) {
    const preferredSnap = findNearestPreferredDate(snappedDate, constraints.preferredDates);
    if (preferredSnap.distance <= differenceInDays(snappedDate, originalDate) + 1) {
      snappedDate = preferredSnap.date;
      snapReason = 'Snapped to preferred date';
    }
  }

  // Avoid blocked dates
  if (constraints?.blockedDates) {
    snappedDate = avoidBlockedDates(snappedDate, constraints.blockedDates);
  }

  const wasSnapped = !isSameDay(originalDate, snappedDate);
  const snapDistance = Math.abs(differenceInDays(snappedDate, originalDate));

  return {
    snappedDate,
    originalDate,
    wasSnapped,
    snapReason,
    snapDistance
  };
};

/**
 * Snap a date range while preserving or adjusting duration
 */
export const snapDateRange = (
  startDate: Date,
  endDate: Date,
  viewMode: TimelineViewMode,
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
  constraints?: SnapConstraints
): {
  startDate: Date;
  endDate: Date;
  startSnap: SnapResult;
  endSnap: SnapResult;
  durationChanged: boolean;
} => {
  const originalDuration = differenceInDays(endDate, startDate);

  // Snap start date first
  const startSnap = snapDateToGrid(startDate, viewMode, config, constraints);
  let finalStartDate = startSnap.snappedDate;

  let finalEndDate: Date;
  let endSnap: SnapResult;
  let durationChanged = false;

  if (config.preserveDuration) {
    // Preserve duration by calculating end date from snapped start
    finalEndDate = addDays(finalStartDate, originalDuration);
    endSnap = {
      snappedDate: finalEndDate,
      originalDate: endDate,
      wasSnapped: !isSameDay(endDate, finalEndDate),
      snapReason: 'Calculated from snapped start date to preserve duration',
      snapDistance: Math.abs(differenceInDays(finalEndDate, endDate))
    };
  } else {
    // Snap end date independently
    endSnap = snapDateToGrid(endDate, viewMode, config, constraints);
    finalEndDate = endSnap.snappedDate;
    
    // Ensure end is after start
    if (!isAfter(finalEndDate, finalStartDate)) {
      finalEndDate = addDays(finalStartDate, Math.max(1, originalDuration));
      endSnap = {
        ...endSnap,
        snappedDate: finalEndDate,
        snapReason: 'Adjusted to ensure end date is after start date'
      };
    }

    durationChanged = differenceInDays(finalEndDate, finalStartDate) !== originalDuration;
  }

  return {
    startDate: finalStartDate,
    endDate: finalEndDate,
    startSnap,
    endSnap,
    durationChanged
  };
};

/**
 * Convert pixel position to date with snapping
 */
export const snapPixelPositionToDate = (
  pixelX: number,
  viewportStartDate: Date,
  pixelsPerDay: number,
  viewMode: TimelineViewMode,
  config: SnapConfig = DEFAULT_SNAP_CONFIG
): SnapResult => {
  // Convert pixels to raw date
  const dayOffset = pixelX / pixelsPerDay;
  const rawDate = addDays(viewportStartDate, Math.floor(dayOffset));

  // Handle sub-day precision
  if (config.allowSubDay && viewMode === 'weekly') {
    const fractionalDay = dayOffset % 1;
    const hoursOffset = Math.round(fractionalDay * 24);
    const preciseDate = new Date(rawDate);
    preciseDate.setHours(hoursOffset);
    
    return snapDateToGrid(preciseDate, viewMode, config);
  }

  return snapDateToGrid(rawDate, viewMode, config);
};

/**
 * Find smart snap dates (weekends, month boundaries, etc.)
 */
export const findSmartSnapDate = (
  date: Date,
  viewMode: TimelineViewMode
): { shouldSnap: boolean; snapDate: Date; reason: string } => {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isMonthStart = date.getDate() === 1;
  const isMonthEnd = isSameDay(date, endOfMonth(date));

  // In quarterly view, prefer month boundaries
  if (viewMode === 'quarterly') {
    if (isMonthStart) {
      return {
        shouldSnap: true,
        snapDate: startOfMonth(date),
        reason: 'Snapped to start of month'
      };
    }
    if (isMonthEnd) {
      return {
        shouldSnap: true,
        snapDate: endOfMonth(date),
        reason: 'Snapped to end of month'
      };
    }
  }

  // In weekly view, consider weekend snapping
  if (viewMode === 'weekly' && isWeekend) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    
    // Snap to closer weekend boundary
    const distToStart = Math.abs(differenceInDays(date, weekStart));
    const distToEnd = Math.abs(differenceInDays(date, weekEnd));
    
    if (distToStart <= distToEnd) {
      return {
        shouldSnap: true,
        snapDate: weekStart,
        reason: 'Snapped to start of week'
      };
    } else {
      return {
        shouldSnap: true,
        snapDate: weekEnd,
        reason: 'Snapped to end of week'
      };
    }
  }

  return { shouldSnap: false, snapDate: date, reason: '' };
};

/**
 * Basic grid snapping to day/week/month boundaries
 */
export const snapToBasicGrid = (
  date: Date,
  snapUnit: 'day' | 'week' | 'month'
): { date: Date; reason: string } => {
  switch (snapUnit) {
    case 'day':
      return {
        date: startOfDay(date),
        reason: 'Snapped to start of day'
      };
    case 'week':
      return {
        date: startOfWeek(date, { weekStartsOn: 1 }),
        reason: 'Snapped to start of week'
      };
    case 'month':
      return {
        date: startOfMonth(date),
        reason: 'Snapped to start of month'
      };
    default:
      return { date, reason: 'No snap applied' };
  }
};

/**
 * Find the nearest preferred date
 */
export const findNearestPreferredDate = (
  targetDate: Date,
  preferredDates: Date[]
): { date: Date; distance: number } => {
  let nearestDate = preferredDates[0];
  let minDistance = Math.abs(differenceInDays(targetDate, preferredDates[0]));

  for (const preferredDate of preferredDates.slice(1)) {
    const distance = Math.abs(differenceInDays(targetDate, preferredDate));
    if (distance < minDistance) {
      minDistance = distance;
      nearestDate = preferredDate;
    }
  }

  return { date: nearestDate, distance: minDistance };
};

/**
 * Avoid blocked dates by finding the nearest unblocked date
 */
export const avoidBlockedDates = (
  targetDate: Date,
  blockedDates: Date[]
): Date => {
  const isBlocked = blockedDates.some(blocked => isSameDay(blocked, targetDate));
  
  if (!isBlocked) return targetDate;

  // Try nearby dates
  for (let offset = 1; offset <= 7; offset++) {
    const beforeDate = addDays(targetDate, -offset);
    const afterDate = addDays(targetDate, offset);

    const isBeforeBlocked = blockedDates.some(blocked => isSameDay(blocked, beforeDate));
    const isAfterBlocked = blockedDates.some(blocked => isSameDay(blocked, afterDate));

    if (!isAfterBlocked) return afterDate;
    if (!isBeforeBlocked) return beforeDate;
  }

  // Fallback: return original date if no nearby dates are available
  return targetDate;
};

/**
 * Calculate magnetic snap strength based on distance
 */
export const calculateMagneticSnapStrength = (
  distance: number,
  threshold: number,
  config: SnapConfig
): number => {
  if (!config.magneticSnap) return distance <= threshold ? 1 : 0;

  if (distance <= threshold * 0.5) return 1; // Very strong
  if (distance <= threshold * 0.75) return 0.8; // Strong
  if (distance <= threshold) return 0.5; // Medium
  return 0; // No snap
};

/**
 * Get visual feedback for snap operations
 */
export const getSnapFeedback = (
  snapResult: SnapResult,
  viewMode: TimelineViewMode,
  isDark: boolean = false
): {
  showIndicator: boolean;
  indicatorColor: string;
  message: string;
  intensity: number;
} => {
  if (!snapResult.wasSnapped) {
    return {
      showIndicator: false,
      indicatorColor: '',
      message: '',
      intensity: 0
    };
  }

  const intensity = Math.min(1, snapResult.snapDistance / 7); // 0-1 based on week
  const baseColor = isDark ? '#60A5FA' : '#3B82F6'; // Blue

  return {
    showIndicator: true,
    indicatorColor: baseColor,
    message: snapResult.snapReason,
    intensity: 1 - intensity // Stronger visual for closer snaps
  };
};

/**
 * Batch snap multiple dates efficiently
 */
export const batchSnapDates = (
  dates: Date[],
  viewMode: TimelineViewMode,
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
  constraints?: SnapConstraints
): SnapResult[] => {
  return dates.map(date => snapDateToGrid(date, viewMode, config, constraints));
};

/**
 * Get next/previous snap positions
 */
export const getAdjacentSnapPositions = (
  currentDate: Date,
  snapUnit: 'day' | 'week' | 'month'
): { previous: Date; next: Date } => {
  switch (snapUnit) {
    case 'day':
      return {
        previous: addDays(currentDate, -1),
        next: addDays(currentDate, 1)
      };
    case 'week':
      return {
        previous: addWeeks(currentDate, -1),
        next: addWeeks(currentDate, 1)
      };
    case 'month':
      return {
        previous: addMonths(currentDate, -1),
        next: addMonths(currentDate, 1)
      };
  }
};