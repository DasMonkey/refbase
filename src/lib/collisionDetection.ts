import { ProjectTracker } from '../types';
import { 
  differenceInDays, 
  isBefore, 
  isAfter, 
  startOfDay, 
  addDays,
  isEqual 
} from 'date-fns';

export interface CollisionResult {
  hasCollision: boolean;
  collisions: Array<{
    tracker: ProjectTracker;
    laneIndex: number;
    overlapDays: number;
    overlapStart: Date;
    overlapEnd: Date;
    severity: 'minor' | 'moderate' | 'major';
  }>;
  suggestedLane?: number;
  alternativeDates?: {
    startDate: Date;
    endDate: Date;
    reason: string;
  };
}

export interface CollisionCheckOptions {
  checkSameLaneOnly: boolean;
  includeAdjacent: boolean;
  maxLanesToCheck: number;
  allowPartialOverlaps: boolean;
  bufferDays: number;
}

export const DEFAULT_COLLISION_OPTIONS: CollisionCheckOptions = {
  checkSameLaneOnly: true,
  includeAdjacent: false,
  maxLanesToCheck: 10,
  allowPartialOverlaps: false,
  bufferDays: 0
};

/**
 * Check for collisions when placing or moving a tracker
 */
export const checkTrackerCollisions = (
  targetTracker: { startDate: Date; endDate: Date; id?: string },
  targetLane: number,
  allTrackers: ProjectTracker[],
  laneAssignments: Map<string, number>,
  options: CollisionCheckOptions = DEFAULT_COLLISION_OPTIONS
): CollisionResult => {
  const collisions = [];
  const excludeId = targetTracker.id;
  
  // Normalize dates to start of day
  const targetStart = startOfDay(targetTracker.startDate);
  const targetEnd = startOfDay(targetTracker.endDate);
  
  // Add buffer if specified
  const bufferedStart = options.bufferDays > 0 
    ? addDays(targetStart, -options.bufferDays)
    : targetStart;
  const bufferedEnd = options.bufferDays > 0
    ? addDays(targetEnd, options.bufferDays)
    : targetEnd;

  // Determine lanes to check
  const lanesToCheck = options.checkSameLaneOnly 
    ? [targetLane]
    : options.includeAdjacent
      ? [targetLane - 1, targetLane, targetLane + 1].filter(l => l >= 0)
      : Array.from({ length: Math.min(options.maxLanesToCheck, 20) }, (_, i) => i);

  for (const laneIndex of lanesToCheck) {
    // Get trackers in this lane
    const trackersInLane = allTrackers.filter(tracker => 
      tracker.id !== excludeId && laneAssignments.get(tracker.id) === laneIndex
    );

    for (const tracker of trackersInLane) {
      const trackerStart = startOfDay(tracker.startDate);
      const trackerEnd = startOfDay(tracker.endDate);
      
      // Check for overlap
      if (hasDateRangeOverlap(bufferedStart, bufferedEnd, trackerStart, trackerEnd)) {
        const overlapStart = new Date(Math.max(bufferedStart.getTime(), trackerStart.getTime()));
        const overlapEnd = new Date(Math.min(bufferedEnd.getTime(), trackerEnd.getTime()));
        const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
        
        // Skip if partial overlaps are allowed and this is a minor overlap
        if (options.allowPartialOverlaps && overlapDays <= 1) {
          continue;
        }
        
        // Determine collision severity
        const targetDuration = differenceInDays(targetEnd, targetStart) + 1;
        const overlapPercentage = overlapDays / targetDuration;
        
        let severity: 'minor' | 'moderate' | 'major';
        if (overlapPercentage < 0.2) severity = 'minor';
        else if (overlapPercentage < 0.5) severity = 'moderate';
        else severity = 'major';
        
        collisions.push({
          tracker,
          laneIndex,
          overlapDays,
          overlapStart,
          overlapEnd,
          severity
        });
      }
    }
  }

  // Find suggested lane if there are collisions
  let suggestedLane: number | undefined;
  if (collisions.length > 0) {
    suggestedLane = findAvailableLaneForTracker(
      { startDate: targetStart, endDate: targetEnd },
      allTrackers,
      laneAssignments,
      options.maxLanesToCheck
    );
  }

  // Calculate alternative dates if no lane is available
  let alternativeDates: CollisionResult['alternativeDates'];
  if (collisions.length > 0 && suggestedLane === undefined) {
    alternativeDates = findAlternativeDates(
      targetStart,
      targetEnd,
      targetLane,
      allTrackers,
      laneAssignments
    );
  }

  return {
    hasCollision: collisions.length > 0,
    collisions,
    suggestedLane,
    alternativeDates
  };
};

/**
 * Check if two date ranges overlap
 */
export const hasDateRangeOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return !(isBefore(end1, start2) || isAfter(start1, end2));
};

/**
 * Find the first available lane for a tracker
 */
export const findAvailableLaneForTracker = (
  tracker: { startDate: Date; endDate: Date },
  allTrackers: ProjectTracker[],
  laneAssignments: Map<string, number>,
  maxLanes: number = 20
): number | undefined => {
  for (let lane = 0; lane < maxLanes; lane++) {
    const collision = checkTrackerCollisions(
      tracker,
      lane,
      allTrackers,
      laneAssignments,
      { ...DEFAULT_COLLISION_OPTIONS, checkSameLaneOnly: true }
    );
    
    if (!collision.hasCollision) {
      return lane;
    }
  }
  
  return undefined;
};

/**
 * Find alternative dates that avoid collisions
 */
export const findAlternativeDates = (
  originalStart: Date,
  originalEnd: Date,
  targetLane: number,
  allTrackers: ProjectTracker[],
  laneAssignments: Map<string, number>
): { startDate: Date; endDate: Date; reason: string } | undefined => {
  const duration = differenceInDays(originalEnd, originalStart);
  const trackersInLane = allTrackers
    .filter(t => laneAssignments.get(t.id) === targetLane)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (trackersInLane.length === 0) {
    return undefined;
  }

  // Try to fit before the first tracker
  const firstTracker = trackersInLane[0];
  if (differenceInDays(firstTracker.startDate, originalStart) > duration + 1) {
    const newEnd = addDays(firstTracker.startDate, -1);
    const newStart = addDays(newEnd, -duration);
    return {
      startDate: newStart,
      endDate: newEnd,
      reason: `Moved to fit before ${firstTracker.title}`
    };
  }

  // Try to fit between trackers
  for (let i = 0; i < trackersInLane.length - 1; i++) {
    const currentTracker = trackersInLane[i];
    const nextTracker = trackersInLane[i + 1];
    
    const gapStart = addDays(currentTracker.endDate, 1);
    const gapEnd = addDays(nextTracker.startDate, -1);
    const gapDays = differenceInDays(gapEnd, gapStart) + 1;
    
    if (gapDays >= duration) {
      return {
        startDate: gapStart,
        endDate: addDays(gapStart, duration),
        reason: `Moved to gap between ${currentTracker.title} and ${nextTracker.title}`
      };
    }
  }

  // Try to fit after the last tracker
  const lastTracker = trackersInLane[trackersInLane.length - 1];
  const newStart = addDays(lastTracker.endDate, 1);
  const newEnd = addDays(newStart, duration);
  
  return {
    startDate: newStart,
    endDate: newEnd,
    reason: `Moved to fit after ${lastTracker.title}`
  };
};

/**
 * Get collision summary for display
 */
export const getCollisionSummary = (collisionResult: CollisionResult): string => {
  if (!collisionResult.hasCollision) {
    return 'No conflicts detected';
  }

  const { collisions } = collisionResult;
  const severityCounts = collisions.reduce((acc, collision) => {
    acc[collision.severity] = (acc[collision.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const parts = [];
  if (severityCounts.major) parts.push(`${severityCounts.major} major conflict${severityCounts.major > 1 ? 's' : ''}`);
  if (severityCounts.moderate) parts.push(`${severityCounts.moderate} moderate conflict${severityCounts.moderate > 1 ? 's' : ''}`);
  if (severityCounts.minor) parts.push(`${severityCounts.minor} minor conflict${severityCounts.minor > 1 ? 's' : ''}`);

  return parts.join(', ');
};

/**
 * Check if a tracker can be moved to a specific position without collisions
 */
export const canMoveTrackerTo = (
  tracker: ProjectTracker,
  newStartDate: Date,
  newEndDate: Date,
  newLane: number,
  allTrackers: ProjectTracker[],
  laneAssignments: Map<string, number>,
  strictMode: boolean = false
): boolean => {
  const options: CollisionCheckOptions = {
    ...DEFAULT_COLLISION_OPTIONS,
    checkSameLaneOnly: true,
    allowPartialOverlaps: !strictMode,
    bufferDays: strictMode ? 1 : 0
  };

  const collision = checkTrackerCollisions(
    { startDate: newStartDate, endDate: newEndDate, id: tracker.id },
    newLane,
    allTrackers,
    laneAssignments,
    options
  );

  return !collision.hasCollision;
};

/**
 * Get optimal placement for a tracker considering all constraints
 */
export const getOptimalTrackerPlacement = (
  tracker: { startDate: Date; endDate: Date; title?: string },
  allTrackers: ProjectTracker[],
  laneAssignments: Map<string, number>,
  preferredLane?: number
): {
  lane: number;
  startDate: Date;
  endDate: Date;
  adjustmentReason?: string;
} => {
  // First try the preferred lane with original dates
  if (preferredLane !== undefined) {
    const collision = checkTrackerCollisions(
      tracker,
      preferredLane,
      allTrackers,
      laneAssignments
    );
    
    if (!collision.hasCollision) {
      return {
        lane: preferredLane,
        startDate: tracker.startDate,
        endDate: tracker.endDate
      };
    }

    // Try alternative dates in preferred lane
    if (collision.alternativeDates) {
      return {
        lane: preferredLane,
        startDate: collision.alternativeDates.startDate,
        endDate: collision.alternativeDates.endDate,
        adjustmentReason: collision.alternativeDates.reason
      };
    }
  }

  // Find any available lane with original dates
  const availableLane = findAvailableLaneForTracker(
    tracker,
    allTrackers,
    laneAssignments
  );

  if (availableLane !== undefined) {
    return {
      lane: availableLane,
      startDate: tracker.startDate,
      endDate: tracker.endDate,
      adjustmentReason: preferredLane !== undefined ? `Moved to lane ${availableLane} due to conflicts` : undefined
    };
  }

  // Fallback: use the first lane and adjust dates
  const fallbackCollision = checkTrackerCollisions(
    tracker,
    0,
    allTrackers,
    laneAssignments
  );

  if (fallbackCollision.alternativeDates) {
    return {
      lane: 0,
      startDate: fallbackCollision.alternativeDates.startDate,
      endDate: fallbackCollision.alternativeDates.endDate,
      adjustmentReason: fallbackCollision.alternativeDates.reason
    };
  }

  // Last resort: place in a new lane
  const maxLane = Math.max(...Array.from(laneAssignments.values()), -1);
  return {
    lane: maxLane + 1,
    startDate: tracker.startDate,
    endDate: tracker.endDate,
    adjustmentReason: 'Added new lane to avoid all conflicts'
  };
};

/**
 * Validate lane assignments for the entire timeline
 */
export const validateTimelineCollisions = (
  trackers: ProjectTracker[],
  laneAssignments: Map<string, number>
): {
  isValid: boolean;
  errors: Array<{
    type: 'overlap' | 'invalid_lane' | 'missing_assignment';
    trackerId: string;
    message: string;
    severity: 'warning' | 'error';
  }>;
  suggestions: Array<{
    trackerId: string;
    currentLane: number;
    suggestedLane: number;
    reason: string;
  }>;
} => {
  const errors = [];
  const suggestions = [];

  // Check for missing assignments
  for (const tracker of trackers) {
    if (!laneAssignments.has(tracker.id)) {
      errors.push({
        type: 'missing_assignment' as const,
        trackerId: tracker.id,
        message: `Tracker "${tracker.title}" has no lane assignment`,
        severity: 'error' as const
      });
    }
  }

  // Check for overlaps
  for (const tracker of trackers) {
    const laneIndex = laneAssignments.get(tracker.id);
    if (laneIndex === undefined) continue;

    const collision = checkTrackerCollisions(
      tracker,
      laneIndex,
      trackers,
      laneAssignments,
      { ...DEFAULT_COLLISION_OPTIONS, checkSameLaneOnly: true }
    );

    if (collision.hasCollision) {
      const majorCollisions = collision.collisions.filter(c => c.severity === 'major');
      
      if (majorCollisions.length > 0) {
        errors.push({
          type: 'overlap' as const,
          trackerId: tracker.id,
          message: `Tracker "${tracker.title}" has major overlaps with ${majorCollisions.length} other tracker(s)`,
          severity: 'error' as const
        });
      } else {
        errors.push({
          type: 'overlap' as const,
          trackerId: tracker.id,
          message: `Tracker "${tracker.title}" has minor overlaps`,
          severity: 'warning' as const
        });
      }

      if (collision.suggestedLane !== undefined) {
        suggestions.push({
          trackerId: tracker.id,
          currentLane: laneIndex,
          suggestedLane: collision.suggestedLane,
          reason: `Move to lane ${collision.suggestedLane} to resolve conflicts`
        });
      }
    }
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    suggestions
  };
};