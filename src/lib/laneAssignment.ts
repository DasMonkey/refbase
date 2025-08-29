import { ProjectTracker } from '../types';
import { isSameDay, isAfter, isBefore } from 'date-fns';

export interface LaneAssignment {
  trackerId: string;
  laneIndex: number;
  startDate: Date;
  endDate: Date;
}

export interface TrackerLane {
  laneIndex: number;
  trackers: ProjectTracker[];
  isEmpty: boolean;
}

/**
 * Check if two date ranges overlap
 */
export const dateRangesOverlap = (
  start1: Date, 
  end1: Date, 
  start2: Date, 
  end2: Date
): boolean => {
  const overlap = !(isAfter(start1, end2) || isBefore(end1, start2));
  // console.log(`Date overlap check: (${start1.toDateString()} - ${end1.toDateString()}) vs (${start2.toDateString()} - ${end2.toDateString()}) = ${overlap}`);
  return overlap;
};

/**
 * Check if a tracker can fit in a specific lane without overlapping
 */
export const canTrackerFitInLane = (
  tracker: ProjectTracker,
  lane: ProjectTracker[]
): boolean => {
  return !lane.some(existingTracker => 
    dateRangesOverlap(
      tracker.startDate,
      tracker.endDate,
      existingTracker.startDate,
      existingTracker.endDate
    )
  );
};

/**
 * Find the first available lane for a tracker
 */
export const findAvailableLane = (
  tracker: ProjectTracker,
  lanes: ProjectTracker[][]
): number => {
  // Try to fit in existing lanes first
  for (let i = 0; i < lanes.length; i++) {
    if (canTrackerFitInLane(tracker, lanes[i])) {
      return i;
    }
  }
  
  // If no existing lane works, create a new one
  return lanes.length;
};

/**
 * Assign lanes to all trackers using a greedy algorithm
 */
export const assignLanesToTrackers = (trackers: ProjectTracker[]): LaneAssignment[] => {
  if (trackers.length === 0) return [];

  // Sort trackers by start date, then by duration (shorter first for better packing)
  const sortedTrackers = [...trackers].sort((a, b) => {
    const startDiff = a.startDate.getTime() - b.startDate.getTime();
    if (startDiff !== 0) return startDiff;
    
    // If same start date, prioritize shorter duration
    const aDuration = a.endDate.getTime() - a.startDate.getTime();
    const bDuration = b.endDate.getTime() - b.startDate.getTime();
    return aDuration - bDuration;
  });

  const lanes: ProjectTracker[][] = [];
  const assignments: LaneAssignment[] = [];

  for (const tracker of sortedTrackers) {
    const laneIndex = findAvailableLane(tracker, lanes);
    
    // console.log(`Assigning tracker "${tracker.title}" (${tracker.startDate.toDateString()} - ${tracker.endDate.toDateString()}) to lane ${laneIndex}`);
    
    // Ensure lane exists
    if (!lanes[laneIndex]) {
      lanes[laneIndex] = [];
    }
    
    // Add tracker to lane
    lanes[laneIndex].push(tracker);
    
    // Record assignment
    assignments.push({
      trackerId: tracker.id,
      laneIndex,
      startDate: tracker.startDate,
      endDate: tracker.endDate
    });
  }

  return assignments;
};

/**
 * Get tracker lanes organized by lane index
 */
export const getTrackerLanes = (
  trackers: ProjectTracker[],
  assignments: LaneAssignment[]
): TrackerLane[] => {
  const assignmentMap = new Map(
    assignments.map(a => [a.trackerId, a.laneIndex])
  );

  // Group trackers by lane
  const laneGroups = new Map<number, ProjectTracker[]>();
  
  for (const tracker of trackers) {
    const laneIndex = assignmentMap.get(tracker.id) ?? 0;
    if (!laneGroups.has(laneIndex)) {
      laneGroups.set(laneIndex, []);
    }
    laneGroups.get(laneIndex)!.push(tracker);
  }

  // Convert to TrackerLane array
  const maxLane = Math.max(...Array.from(laneGroups.keys()), -1);
  const lanes: TrackerLane[] = [];

  for (let i = 0; i <= maxLane; i++) {
    const trackersInLane = laneGroups.get(i) || [];
    lanes.push({
      laneIndex: i,
      trackers: trackersInLane.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
      isEmpty: trackersInLane.length === 0
    });
  }

  return lanes;
};

/**
 * Compact lanes by removing empty lanes and reassigning indices
 */
export const compactLanes = (assignments: LaneAssignment[]): LaneAssignment[] => {
  if (assignments.length === 0) return [];

  // Get all used lane indices
  const usedLanes = [...new Set(assignments.map(a => a.laneIndex))].sort((a, b) => a - b);
  
  // Create mapping from old lane index to new lane index
  const laneMapping = new Map<number, number>();
  usedLanes.forEach((oldIndex, newIndex) => {
    laneMapping.set(oldIndex, newIndex);
  });

  // Reassign lane indices
  return assignments.map(assignment => ({
    ...assignment,
    laneIndex: laneMapping.get(assignment.laneIndex) ?? 0
  }));
};

/**
 * Reassign a tracker to a different lane
 */
export const reassignTrackerLane = (
  trackerId: string,
  newLaneIndex: number,
  assignments: LaneAssignment[],
  allTrackers: ProjectTracker[]
): LaneAssignment[] => {
  const tracker = allTrackers.find(t => t.id === trackerId);
  if (!tracker) return assignments;

  // Remove existing assignment
  const filteredAssignments = assignments.filter(a => a.trackerId !== trackerId);
  
  // Get trackers in target lane
  const targetLaneTrackers = allTrackers.filter(t => {
    const assignment = filteredAssignments.find(a => a.trackerId === t.id);
    return assignment?.laneIndex === newLaneIndex;
  });

  // Check if tracker can fit in target lane
  if (!canTrackerFitInLane(tracker, targetLaneTrackers)) {
    // If it doesn't fit, find the next available lane
    const lanes: ProjectTracker[][] = [];
    
    // Rebuild lanes from assignments
    for (const assignment of filteredAssignments) {
      const assignmentTracker = allTrackers.find(t => t.id === assignment.trackerId);
      if (assignmentTracker) {
        if (!lanes[assignment.laneIndex]) {
          lanes[assignment.laneIndex] = [];
        }
        lanes[assignment.laneIndex].push(assignmentTracker);
      }
    }
    
    newLaneIndex = findAvailableLane(tracker, lanes);
  }

  // Add new assignment
  return [
    ...filteredAssignments,
    {
      trackerId,
      laneIndex: newLaneIndex,
      startDate: tracker.startDate,
      endDate: tracker.endDate
    }
  ];
};

/**
 * Get the optimal number of lanes needed for a set of trackers
 */
export const getOptimalLaneCount = (trackers: ProjectTracker[]): number => {
  if (trackers.length === 0) return 0;
  
  const assignments = assignLanesToTrackers(trackers);
  return Math.max(...assignments.map(a => a.laneIndex)) + 1;
};

/**
 * Calculate lane height based on view mode and content
 */
export const getLaneHeight = (viewMode: 'weekly' | 'monthly' | 'quarterly'): number => {
  switch (viewMode) {
    case 'weekly':
      return 48; // 48px for detailed view
    case 'monthly':
      return 36; // 36px for medium view
    case 'quarterly':
      return 24; // 24px for compact view
    default:
      return 48;
  }
};

/**
 * Get lane separator style
 */
export const getLaneSeparatorStyle = (isDark: boolean) => ({
  borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e2e8f0'}`,
  backgroundColor: isDark ? '#0f172a' : '#f8fafc'
});

/**
 * Validate lane assignments for consistency
 */
export const validateLaneAssignments = (
  assignments: LaneAssignment[],
  trackers: ProjectTracker[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if all trackers have assignments
  const assignedTrackerIds = new Set(assignments.map(a => a.trackerId));
  const allTrackerIds = new Set(trackers.map(t => t.id));
  
  for (const trackerId of allTrackerIds) {
    if (!assignedTrackerIds.has(trackerId)) {
      errors.push(`Tracker ${trackerId} is missing lane assignment`);
    }
  }

  // Check for overlaps within lanes
  const laneGroups = new Map<number, LaneAssignment[]>();
  for (const assignment of assignments) {
    if (!laneGroups.has(assignment.laneIndex)) {
      laneGroups.set(assignment.laneIndex, []);
    }
    laneGroups.get(assignment.laneIndex)!.push(assignment);
  }

  for (const [laneIndex, laneAssignments] of laneGroups) {
    for (let i = 0; i < laneAssignments.length; i++) {
      for (let j = i + 1; j < laneAssignments.length; j++) {
        const a1 = laneAssignments[i];
        const a2 = laneAssignments[j];
        
        if (dateRangesOverlap(a1.startDate, a1.endDate, a2.startDate, a2.endDate)) {
          console.log(`VALIDATION ERROR: Trackers ${a1.trackerId} (${a1.startDate.toDateString()}-${a1.endDate.toDateString()}) and ${a2.trackerId} (${a2.startDate.toDateString()}-${a2.endDate.toDateString()}) overlap in lane ${laneIndex}`);
          errors.push(`Trackers ${a1.trackerId} and ${a2.trackerId} overlap in lane ${laneIndex}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};