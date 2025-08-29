import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addDays, 
  addWeeks, 
  addMonths,
  addQuarters,
  addYears,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  isWithinInterval,
  isSameMonth,
  isSameYear,
  isAfter,
  isBefore,
  min,
  max
} from 'date-fns';
import { TimelineViewMode } from '../components/TimelineGrid';
import { ProjectTracker } from '../types';

export interface DateRangeInfo {
  start: Date;
  end: Date;
  duration: number;
  unit: 'days' | 'weeks' | 'months' | 'quarters' | 'years';
  label: string;
  shortLabel: string;
}

export interface ViewModeRange {
  visible: DateRangeInfo;
  extended: DateRangeInfo; // includes buffer for smooth scrolling
  previous: DateRangeInfo;
  next: DateRangeInfo;
  boundaries: {
    canGoPrevious: boolean;
    canGoNext: boolean;
    minDate?: Date;
    maxDate?: Date;
  };
}

export interface TrackerDateMetrics {
  totalSpan: DateRangeInfo;
  coverage: {
    byMonth: Map<string, ProjectTracker[]>;
    byWeek: Map<string, ProjectTracker[]>;
    byQuarter: Map<string, ProjectTracker[]>;
  };
  gaps: Array<{
    start: Date;
    end: Date;
    duration: number;
    beforeTracker?: string;
    afterTracker?: string;
  }>;
  overlaps: Array<{
    trackers: ProjectTracker[];
    start: Date;
    end: Date;
    duration: number;
  }>;
}

/**
 * Calculate date range for a specific view mode
 */
export const calculateViewModeRange = (
  anchorDate: Date,
  viewMode: TimelineViewMode,
  bufferMultiplier: number = 0.5
): ViewModeRange => {
  const visible = getVisibleRange(anchorDate, viewMode);
  const extended = getExtendedRange(visible, bufferMultiplier);
  const previous = getPreviousRange(anchorDate, viewMode);
  const next = getNextRange(anchorDate, viewMode);
  
  // Calculate boundaries (can be customized based on business rules)
  const now = new Date();
  const twoYearsAgo = addYears(now, -2);
  const fiveYearsFromNow = addYears(now, 5);
  
  const boundaries = {
    canGoPrevious: isAfter(visible.start, twoYearsAgo),
    canGoNext: isBefore(visible.end, fiveYearsFromNow),
    minDate: twoYearsAgo,
    maxDate: fiveYearsFromNow
  };

  return {
    visible,
    extended,
    previous,
    next,
    boundaries
  };
};

/**
 * Get visible date range for view mode
 */
export const getVisibleRange = (
  anchorDate: Date,
  viewMode: TimelineViewMode
): DateRangeInfo => {
  let start: Date;
  let end: Date;
  let unit: DateRangeInfo['unit'];

  switch (viewMode) {
    case 'weekly':
      start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      end = endOfWeek(anchorDate, { weekStartsOn: 1 });
      unit = 'weeks';
      break;
    case 'monthly':
      start = startOfMonth(anchorDate);
      end = endOfMonth(anchorDate);
      unit = 'months';
      break;
    case 'quarterly':
      start = startOfQuarter(anchorDate);
      end = endOfQuarter(anchorDate);
      unit = 'quarters';
      break;
    default:
      start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      end = endOfWeek(anchorDate, { weekStartsOn: 1 });
      unit = 'weeks';
  }

  const duration = differenceInDays(end, start) + 1;
  const label = formatDateRangeLabel(start, end, viewMode);
  const shortLabel = formatDateRangeShortLabel(start, end, viewMode);

  return { start, end, duration, unit, label, shortLabel };
};

/**
 * Get extended range with buffer for smooth scrolling
 */
export const getExtendedRange = (
  visibleRange: DateRangeInfo,
  bufferMultiplier: number
): DateRangeInfo => {
  const bufferDays = Math.ceil(visibleRange.duration * bufferMultiplier);
  const start = addDays(visibleRange.start, -bufferDays);
  const end = addDays(visibleRange.end, bufferDays);
  const duration = differenceInDays(end, start) + 1;

  return {
    start,
    end,
    duration,
    unit: visibleRange.unit,
    label: `Extended ${visibleRange.label}`,
    shortLabel: `Ext ${visibleRange.shortLabel}`
  };
};

/**
 * Get previous range for navigation
 */
export const getPreviousRange = (
  anchorDate: Date,
  viewMode: TimelineViewMode
): DateRangeInfo => {
  let previousAnchor: Date;

  switch (viewMode) {
    case 'weekly':
      previousAnchor = addWeeks(anchorDate, -1);
      break;
    case 'monthly':
      previousAnchor = addMonths(anchorDate, -1);
      break;
    case 'quarterly':
      previousAnchor = addQuarters(anchorDate, -1);
      break;
    default:
      previousAnchor = addWeeks(anchorDate, -1);
  }

  return getVisibleRange(previousAnchor, viewMode);
};

/**
 * Get next range for navigation
 */
export const getNextRange = (
  anchorDate: Date,
  viewMode: TimelineViewMode
): DateRangeInfo => {
  let nextAnchor: Date;

  switch (viewMode) {
    case 'weekly':
      nextAnchor = addWeeks(anchorDate, 1);
      break;
    case 'monthly':
      nextAnchor = addMonths(anchorDate, 1);
      break;
    case 'quarterly':
      nextAnchor = addQuarters(anchorDate, 1);
      break;
    default:
      nextAnchor = addWeeks(anchorDate, 1);
  }

  return getVisibleRange(nextAnchor, viewMode);
};

/**
 * Calculate comprehensive tracker date metrics
 */
export const calculateTrackerDateMetrics = (
  trackers: ProjectTracker[]
): TrackerDateMetrics => {
  if (trackers.length === 0) {
    return {
      totalSpan: {
        start: new Date(),
        end: new Date(),
        duration: 0,
        unit: 'days',
        label: 'No trackers',
        shortLabel: 'None'
      },
      coverage: {
        byMonth: new Map(),
        byWeek: new Map(),
        byQuarter: new Map()
      },
      gaps: [],
      overlaps: []
    };
  }

  // Calculate total span
  const allDates = trackers.flatMap(t => [t.startDate, t.endDate]);
  const spanStart = min(allDates);
  const spanEnd = max(allDates);
  const spanDuration = differenceInDays(spanEnd, spanStart) + 1;
  
  const totalSpan: DateRangeInfo = {
    start: spanStart,
    end: spanEnd,
    duration: spanDuration,
    unit: 'days',
    label: formatDateRangeLabel(spanStart, spanEnd, 'monthly'),
    shortLabel: formatDateRangeShortLabel(spanStart, spanEnd, 'monthly')
  };

  // Calculate coverage
  const coverage = calculateTrackerCoverage(trackers, spanStart, spanEnd);
  
  // Find gaps
  const gaps = findDateGaps(trackers);
  
  // Find overlaps
  const overlaps = findDateOverlaps(trackers);

  return {
    totalSpan,
    coverage,
    gaps,
    overlaps
  };
};

/**
 * Calculate tracker coverage by time periods
 */
export const calculateTrackerCoverage = (
  trackers: ProjectTracker[],
  rangeStart: Date,
  rangeEnd: Date
): TrackerDateMetrics['coverage'] => {
  const byMonth = new Map<string, ProjectTracker[]>();
  const byWeek = new Map<string, ProjectTracker[]>();
  const byQuarter = new Map<string, ProjectTracker[]>();

  // Generate all months, weeks, and quarters in range
  const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
  const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 });

  // Initialize coverage maps
  months.forEach(month => {
    byMonth.set(format(month, 'yyyy-MM'), []);
  });

  weeks.forEach(week => {
    byWeek.set(format(week, 'yyyy-ww'), []);
  });

  months.forEach(month => {
    const quarterKey = `${format(month, 'yyyy')}-Q${Math.ceil((month.getMonth() + 1) / 3)}`;
    if (!byQuarter.has(quarterKey)) {
      byQuarter.set(quarterKey, []);
    }
  });

  // Assign trackers to time periods
  for (const tracker of trackers) {
    // Monthly coverage
    const trackerMonths = eachMonthOfInterval({
      start: max([tracker.startDate, rangeStart]),
      end: min([tracker.endDate, rangeEnd])
    });

    trackerMonths.forEach(month => {
      const monthKey = format(month, 'yyyy-MM');
      const existing = byMonth.get(monthKey) || [];
      byMonth.set(monthKey, [...existing, tracker]);
    });

    // Weekly coverage
    const trackerWeeks = eachWeekOfInterval({
      start: max([tracker.startDate, rangeStart]),
      end: min([tracker.endDate, rangeEnd])
    }, { weekStartsOn: 1 });

    trackerWeeks.forEach(week => {
      const weekKey = format(week, 'yyyy-ww');
      const existing = byWeek.get(weekKey) || [];
      byWeek.set(weekKey, [...existing, tracker]);
    });

    // Quarterly coverage
    trackerMonths.forEach(month => {
      const quarterKey = `${format(month, 'yyyy')}-Q${Math.ceil((month.getMonth() + 1) / 3)}`;
      const existing = byQuarter.get(quarterKey) || [];
      if (!existing.some(t => t.id === tracker.id)) {
        byQuarter.set(quarterKey, [...existing, tracker]);
      }
    });
  }

  return { byMonth, byWeek, byQuarter };
};

/**
 * Find gaps between trackers
 */
export const findDateGaps = (trackers: ProjectTracker[]): TrackerDateMetrics['gaps'] => {
  if (trackers.length <= 1) return [];

  const sortedTrackers = [...trackers].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const gaps = [];

  for (let i = 0; i < sortedTrackers.length - 1; i++) {
    const currentTracker = sortedTrackers[i];
    const nextTracker = sortedTrackers[i + 1];
    
    const gapStart = addDays(currentTracker.endDate, 1);
    const gapEnd = addDays(nextTracker.startDate, -1);
    
    if (isAfter(gapEnd, gapStart) || gapStart.getTime() === gapEnd.getTime()) {
      gaps.push({
        start: gapStart,
        end: gapEnd,
        duration: differenceInDays(gapEnd, gapStart) + 1,
        beforeTracker: currentTracker.id,
        afterTracker: nextTracker.id
      });
    }
  }

  return gaps;
};

/**
 * Find overlapping date ranges between trackers
 */
export const findDateOverlaps = (trackers: ProjectTracker[]): TrackerDateMetrics['overlaps'] => {
  const overlaps = [];

  for (let i = 0; i < trackers.length; i++) {
    for (let j = i + 1; j < trackers.length; j++) {
      const tracker1 = trackers[i];
      const tracker2 = trackers[j];
      
      const overlapStart = max([tracker1.startDate, tracker2.startDate]);
      const overlapEnd = min([tracker1.endDate, tracker2.endDate]);
      
      if (!isAfter(overlapStart, overlapEnd)) {
        overlaps.push({
          trackers: [tracker1, tracker2],
          start: overlapStart,
          end: overlapEnd,
          duration: differenceInDays(overlapEnd, overlapStart) + 1
        });
      }
    }
  }

  return overlaps;
};

/**
 * Format date range label for display
 */
export const formatDateRangeLabel = (
  start: Date,
  end: Date,
  viewMode: TimelineViewMode
): string => {
  switch (viewMode) {
    case 'weekly':
      if (isSameMonth(start, end)) {
        return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
      }
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      
    case 'monthly':
      return format(start, 'MMMM yyyy');
      
    case 'quarterly':
      return `Q${Math.ceil((start.getMonth() + 1) / 3)} ${format(start, 'yyyy')}`;
      
    default:
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
};

/**
 * Format short date range label
 */
export const formatDateRangeShortLabel = (
  start: Date,
  end: Date,
  viewMode: TimelineViewMode
): string => {
  switch (viewMode) {
    case 'weekly':
      return `${format(start, 'MMM d')}`;
      
    case 'monthly':
      return format(start, 'MMM yy');
      
    case 'quarterly':
      return `Q${Math.ceil((start.getMonth() + 1) / 3)} '${format(start, 'yy')}`;
      
    default:
      return format(start, 'MMM d');
  }
};

/**
 * Get working days in a date range (excludes weekends)
 */
export const getWorkingDaysInRange = (start: Date, end: Date): number => {
  const allDays = eachDayOfInterval({ start, end });
  return allDays.filter(day => {
    const dayOfWeek = day.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday or Saturday
  }).length;
};

/**
 * Calculate date range statistics
 */
export const calculateDateRangeStats = (
  ranges: DateRangeInfo[]
): {
  totalDays: number;
  averageDuration: number;
  shortestDuration: number;
  longestDuration: number;
  workingDaysTotal: number;
} => {
  if (ranges.length === 0) {
    return {
      totalDays: 0,
      averageDuration: 0,
      shortestDuration: 0,
      longestDuration: 0,
      workingDaysTotal: 0
    };
  }

  const durations = ranges.map(r => r.duration);
  const totalDays = durations.reduce((sum, d) => sum + d, 0);
  const averageDuration = totalDays / ranges.length;
  const shortestDuration = Math.min(...durations);
  const longestDuration = Math.max(...durations);
  
  const workingDaysTotal = ranges.reduce((sum, range) => {
    return sum + getWorkingDaysInRange(range.start, range.end);
  }, 0);

  return {
    totalDays,
    averageDuration,
    shortestDuration,
    longestDuration,
    workingDaysTotal
  };
};

/**
 * Find optimal view mode for a set of trackers
 */
export const findOptimalViewMode = (
  trackers: ProjectTracker[]
): {
  recommended: TimelineViewMode;
  reasons: string[];
  alternatives: Array<{ mode: TimelineViewMode; score: number; reason: string }>;
} => {
  if (trackers.length === 0) {
    return {
      recommended: 'monthly',
      reasons: ['No trackers to analyze'],
      alternatives: []
    };
  }

  const metrics = calculateTrackerDateMetrics(trackers);
  const totalSpanDays = metrics.totalSpan.duration;
  const trackerCount = trackers.length;
  const averageDuration = trackers.reduce((sum, t) => 
    sum + differenceInDays(t.endDate, t.startDate), 0) / trackerCount;

  const scores = {
    weekly: 0,
    monthly: 0,
    quarterly: 0
  };

  const reasons: string[] = [];

  // Score based on total span
  if (totalSpanDays <= 30) {
    scores.weekly += 3;
    reasons.push('Short total span favors weekly view');
  } else if (totalSpanDays <= 180) {
    scores.monthly += 3;
    reasons.push('Medium total span favors monthly view');
  } else {
    scores.quarterly += 3;
    reasons.push('Long total span favors quarterly view');
  }

  // Score based on tracker count
  if (trackerCount <= 5) {
    scores.weekly += 2;
  } else if (trackerCount <= 20) {
    scores.monthly += 2;
  } else {
    scores.quarterly += 2;
  }

  // Score based on average tracker duration
  if (averageDuration <= 7) {
    scores.weekly += 2;
  } else if (averageDuration <= 60) {
    scores.monthly += 2;
  } else {
    scores.quarterly += 2;
  }

  // Find the mode with highest score
  const modeEntries = Object.entries(scores) as [TimelineViewMode, number][];
  const sortedModes = modeEntries.sort(([, a], [, b]) => b - a);
  const recommended = sortedModes[0][0];

  const alternatives = sortedModes.slice(1).map(([mode, score]) => ({
    mode,
    score,
    reason: `Score: ${score}/7 based on span and tracker characteristics`
  }));

  return {
    recommended,
    reasons,
    alternatives
  };
};