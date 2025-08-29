import { ProjectTracker } from '../types';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isWithinInterval,
  differenceInDays,
  format,
  isSameMonth
} from 'date-fns';

export interface TimelineBar {
  tracker: ProjectTracker;
  startPosition: number; // 0-6 (day of week)
  width: number; // 1-7 (number of days)
  weekRow: number; // which week row this bar appears in
  stackIndex: number; // vertical stacking position (0-based)
  isPartial: boolean; // true if tracker extends beyond current month view
  displayText: string; // text to show on the bar
}

export interface CalendarWeek {
  days: Date[];
  trackerBars: TimelineBar[];
}

export interface TimelineCalendarData {
  weeks: CalendarWeek[];
  monthStart: Date;
  monthEnd: Date;
  allDays: Date[];
}

/**
 * Calculate timeline bars for trackers within a given month view
 */
export const calculateTimelineBars = (
  trackers: ProjectTracker[],
  currentDate: Date
): TimelineCalendarData => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get all days in the month view (including padding days for full weeks)
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (firstDayOfWeek - i));
    return date;
  });
  
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const allDays = [...paddingDays, ...monthDays];
  
  // Group days into weeks
  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    const weekDays = allDays.slice(i, i + 7);
    weeks.push({
      days: weekDays,
      trackerBars: []
    });
  }
  
  // Calculate timeline bars for each tracker
  trackers.forEach(tracker => {
    const bars = calculateTrackerBars(tracker, weeks, monthStart, monthEnd);
    
    // Add bars to appropriate weeks with stacking
    bars.forEach(bar => {
      const week = weeks[bar.weekRow];
      if (week) {
        // Calculate stack index (avoid overlaps)
        bar.stackIndex = calculateStackIndex(week.trackerBars, bar);
        week.trackerBars.push(bar);
      }
    });
  });
  
  return {
    weeks,
    monthStart,
    monthEnd,
    allDays
  };
};

/**
 * Calculate timeline bars for a single tracker across multiple weeks
 */
const calculateTrackerBars = (
  tracker: ProjectTracker,
  weeks: CalendarWeek[],
  monthStart: Date,
  monthEnd: Date
): TimelineBar[] => {
  const bars: TimelineBar[] = [];
  
  weeks.forEach((week, weekIndex) => {
    const weekStart = week.days[0];
    const weekEnd = week.days[6];
    
    // Check if tracker overlaps with this week
    const trackerInterval = { start: tracker.startDate, end: tracker.endDate };
    const weekInterval = { start: weekStart, end: weekEnd };
    
    if (isWithinInterval(weekStart, trackerInterval) || 
        isWithinInterval(weekEnd, trackerInterval) ||
        isWithinInterval(tracker.startDate, weekInterval) ||
        isWithinInterval(tracker.endDate, weekInterval)) {
      
      // Calculate the visible portion of the tracker in this week
      const visibleStart = tracker.startDate > weekStart ? tracker.startDate : weekStart;
      const visibleEnd = tracker.endDate < weekEnd ? tracker.endDate : weekEnd;
      
      // Find start position (day of week: 0-6)
      const startPosition = week.days.findIndex(day => isSameDay(day, visibleStart));
      const endPosition = week.days.findIndex(day => isSameDay(day, visibleEnd));
      
      if (startPosition !== -1 && endPosition !== -1) {
        const width = endPosition - startPosition + 1;
        const isPartial = tracker.startDate < weekStart || tracker.endDate > weekEnd;
        
        bars.push({
          tracker,
          startPosition,
          width,
          weekRow: weekIndex,
          stackIndex: 0, // Will be calculated later
          isPartial,
          displayText: getDisplayText(tracker, width)
        });
      }
    }
  });
  
  return bars;
};

/**
 * Calculate stack index to avoid overlapping bars
 */
const calculateStackIndex = (existingBars: TimelineBar[], newBar: TimelineBar): number => {
  const overlappingBars = existingBars.filter(bar => 
    barsOverlap(bar, newBar)
  );
  
  if (overlappingBars.length === 0) {
    return 0;
  }
  
  // Find the lowest available stack index
  const usedIndices = overlappingBars.map(bar => bar.stackIndex).sort((a, b) => a - b);
  
  for (let i = 0; i <= usedIndices.length; i++) {
    if (!usedIndices.includes(i)) {
      return i;
    }
  }
  
  return usedIndices.length;
};

/**
 * Check if two timeline bars overlap horizontally
 */
const barsOverlap = (bar1: TimelineBar, bar2: TimelineBar): boolean => {
  const bar1End = bar1.startPosition + bar1.width - 1;
  const bar2End = bar2.startPosition + bar2.width - 1;
  
  return !(bar1End < bar2.startPosition || bar2End < bar1.startPosition);
};

/**
 * Get display text for a timeline bar based on available width
 */
const getDisplayText = (tracker: ProjectTracker, width: number): string => {
  if (width >= 4) {
    return tracker.title;
  } else if (width >= 2) {
    // Abbreviate title
    const words = tracker.title.split(' ');
    if (words.length > 1) {
      return words.map(word => word.charAt(0).toUpperCase()).join('');
    }
    return tracker.title.substring(0, Math.max(3, width * 2));
  } else {
    // Very narrow - just show first letter or type indicator
    return tracker.title.charAt(0).toUpperCase();
  }
};

/**
 * Get trackers that are active on a specific date
 */
export const getTrackersForDate = (trackers: ProjectTracker[], date: Date): ProjectTracker[] => {
  return trackers.filter(tracker => 
    isWithinInterval(date, { start: tracker.startDate, end: tracker.endDate })
  );
};

/**
 * Get color class for tracker type
 */
export const getTrackerTypeColor = (type: ProjectTracker['type'], opacity: number = 100): string => {
  const opacityClass = opacity === 100 ? '' : `-${opacity}`;
  
  switch (type) {
    case 'project':
      return `bg-blue-500${opacityClass}`;
    case 'feature':
      return `bg-green-500${opacityClass}`;
    case 'bug':
      return `bg-red-500${opacityClass}`;
    default:
      return `bg-gray-500${opacityClass}`;
  }
};

/**
 * Get color class for tracker status (affects opacity and animations)
 */
export const getTrackerStatusStyle = (status: ProjectTracker['status']): { opacity: string; animation?: string } => {
  switch (status) {
    case 'not_started':
      return { opacity: 'opacity-50' };
    case 'in_progress':
      return { opacity: 'opacity-100', animation: 'animate-pulse' };
    case 'completed':
      return { opacity: 'opacity-70' };
    default:
      return { opacity: 'opacity-100' };
  }
};

/**
 * Get border class for tracker priority
 */
export const getTrackerPriorityBorder = (priority: ProjectTracker['priority']): string => {
  switch (priority) {
    case 'critical':
      return 'border-2 border-red-500';
    case 'high':
      return 'border border-orange-500';
    case 'medium':
      return '';
    case 'low':
      return 'border border-dashed border-gray-400';
    default:
      return '';
  }
};

/**
 * Calculate the total duration of a tracker in days
 */
export const getTrackerDuration = (tracker: ProjectTracker): number => {
  return differenceInDays(tracker.endDate, tracker.startDate) + 1;
};

/**
 * Format date range for display
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  if (isSameDay(startDate, endDate)) {
    return format(startDate, 'MMM d, yyyy');
  }
  
  if (isSameMonth(startDate, endDate)) {
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
  }
  
  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
};

/**
 * Check if a tracker spans multiple days
 */
export const isMultiDayTracker = (tracker: ProjectTracker): boolean => {
  return !isSameDay(tracker.startDate, tracker.endDate);
};

/**
 * Get progress percentage for a tracker based on current date
 */
export const getTrackerProgress = (tracker: ProjectTracker, currentDate: Date = new Date()): number => {
  if (currentDate < tracker.startDate) {
    return 0;
  }
  
  if (currentDate > tracker.endDate) {
    return 100;
  }
  
  const totalDays = getTrackerDuration(tracker);
  const elapsedDays = differenceInDays(currentDate, tracker.startDate) + 1;
  
  return Math.round((elapsedDays / totalDays) * 100);
};