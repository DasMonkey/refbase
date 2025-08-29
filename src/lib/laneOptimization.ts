import { ProjectTracker } from '../types';
import { 
  differenceInDays, 
  isAfter, 
  isBefore,
  addDays,
  startOfDay 
} from 'date-fns';
import { 
  LaneAssignment,
  TrackerLane,
  dateRangesOverlap,
  canTrackerFitInLane,
  findAvailableLane
} from './laneAssignment';

export interface OptimizationResult {
  originalAssignments: LaneAssignment[];
  optimizedAssignments: LaneAssignment[];
  improvements: {
    lanesReduced: number;
    spacingImproved: number;
    conflictsResolved: number;
  };
  metrics: {
    packingEfficiency: number;
    averageGapSize: number;
    totalWastedSpace: number;
    balanceScore: number;
  };
}

export interface OptimizationConfig {
  prioritizeCompactness: boolean;
  minimizeGaps: boolean;
  balanceLanes: boolean;
  preserveUserAssignments: boolean;
  maxOptimizationPasses: number;
  targetPackingEfficiency: number;
}

export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  prioritizeCompactness: true,
  minimizeGaps: true,
  balanceLanes: true,
  preserveUserAssignments: false,
  maxOptimizationPasses: 3,
  targetPackingEfficiency: 0.8
};

/**
 * Optimize lane assignments for better packing and visual appeal
 */
export const optimizeLaneAssignments = (
  trackers: ProjectTracker[],
  currentAssignments: LaneAssignment[],
  config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG
): OptimizationResult => {
  const originalAssignments = [...currentAssignments];
  let workingAssignments = [...currentAssignments];
  let improvements = {
    lanesReduced: 0,
    spacingImproved: 0,
    conflictsResolved: 0
  };

  // Multiple optimization passes
  for (let pass = 0; pass < config.maxOptimizationPasses; pass++) {
    const passResult = performOptimizationPass(
      trackers,
      workingAssignments,
      config,
      pass
    );

    workingAssignments = passResult.assignments;
    improvements.lanesReduced += passResult.improvements.lanesReduced;
    improvements.spacingImproved += passResult.improvements.spacingImproved;
    improvements.conflictsResolved += passResult.improvements.conflictsResolved;

    // Check if we've reached target efficiency
    const currentMetrics = calculatePackingMetrics(trackers, workingAssignments);
    if (currentMetrics.packingEfficiency >= config.targetPackingEfficiency) {
      break;
    }
  }

  const finalMetrics = calculatePackingMetrics(trackers, workingAssignments);

  return {
    originalAssignments,
    optimizedAssignments: workingAssignments,
    improvements,
    metrics: finalMetrics
  };
};

/**
 * Perform a single optimization pass
 */
export const performOptimizationPass = (
  trackers: ProjectTracker[],
  assignments: LaneAssignment[],
  config: OptimizationConfig,
  passNumber: number
): {
  assignments: LaneAssignment[];
  improvements: { lanesReduced: number; spacingImproved: number; conflictsResolved: number };
} => {
  let workingAssignments = [...assignments];
  const improvements = { lanesReduced: 0, spacingImproved: 0, conflictsResolved: 0 };

  switch (passNumber % 3) {
    case 0:
      // First pass: Compact lanes and reduce total lanes
      if (config.prioritizeCompactness) {
        const compactResult = compactLanesOptimally(trackers, workingAssignments);
        workingAssignments = compactResult.assignments;
        improvements.lanesReduced = compactResult.lanesReduced;
      }
      break;

    case 1:
      // Second pass: Minimize gaps and improve spacing
      if (config.minimizeGaps) {
        const gapResult = minimizeGaps(trackers, workingAssignments);
        workingAssignments = gapResult.assignments;
        improvements.spacingImproved = gapResult.spacingImproved;
      }
      break;

    case 2:
      // Third pass: Balance lanes for even distribution
      if (config.balanceLanes) {
        const balanceResult = balanceLaneDistribution(trackers, workingAssignments);
        workingAssignments = balanceResult.assignments;
        improvements.spacingImproved += balanceResult.improvementCount;
      }
      break;
  }

  return { assignments: workingAssignments, improvements };
};

/**
 * Compact lanes optimally by trying different packing strategies
 */
export const compactLanesOptimally = (
  trackers: ProjectTracker[],
  assignments: LaneAssignment[]
): { assignments: LaneAssignment[]; lanesReduced: number } => {
  const originalMaxLane = Math.max(...assignments.map(a => a.laneIndex), -1);
  
  // Sort trackers by different strategies and find the best result
  const strategies = [
    { name: 'byStartDate', sort: (a: ProjectTracker, b: ProjectTracker) => 
        a.startDate.getTime() - b.startDate.getTime() },
    { name: 'byDuration', sort: (a: ProjectTracker, b: ProjectTracker) => {
        const aDuration = differenceInDays(a.endDate, a.startDate);
        const bDuration = differenceInDays(b.endDate, b.startDate);
        return aDuration - bDuration;
      }},
    { name: 'byEndDate', sort: (a: ProjectTracker, b: ProjectTracker) => 
        a.endDate.getTime() - b.endDate.getTime() },
    { name: 'byPriority', sort: (a: ProjectTracker, b: ProjectTracker) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }}
  ];

  let bestAssignments = assignments;
  let bestMaxLane = originalMaxLane;

  for (const strategy of strategies) {
    const sortedTrackers = [...trackers].sort(strategy.sort);
    const testAssignments = repackWithStrategy(sortedTrackers, strategy.name);
    const testMaxLane = Math.max(...testAssignments.map(a => a.laneIndex), -1);

    if (testMaxLane < bestMaxLane) {
      bestAssignments = testAssignments;
      bestMaxLane = testMaxLane;
    }
  }

  return {
    assignments: bestAssignments,
    lanesReduced: originalMaxLane - bestMaxLane
  };
};

/**
 * Repack trackers using a specific strategy
 */
export const repackWithStrategy = (
  sortedTrackers: ProjectTracker[],
  strategyName: string
): LaneAssignment[] => {
  const lanes: ProjectTracker[][] = [];
  const assignments: LaneAssignment[] = [];

  for (const tracker of sortedTrackers) {
    let bestLane = findAvailableLane(tracker, lanes);
    
    // For certain strategies, try to optimize placement further
    if (strategyName === 'byPriority' && tracker.priority === 'critical') {
      // Try to place critical trackers in the first few lanes
      for (let i = 0; i < Math.min(3, lanes.length + 1); i++) {
        if (!lanes[i]) lanes[i] = [];
        if (canTrackerFitInLane(tracker, lanes[i])) {
          bestLane = i;
          break;
        }
      }
    }

    // Ensure lane exists
    while (lanes.length <= bestLane) {
      lanes.push([]);
    }

    lanes[bestLane].push(tracker);
    assignments.push({
      trackerId: tracker.id,
      laneIndex: bestLane,
      startDate: tracker.startDate,
      endDate: tracker.endDate
    });
  }

  return assignments;
};

/**
 * Minimize gaps between trackers in the same lane
 */
export const minimizeGaps = (
  trackers: ProjectTracker[],
  assignments: LaneAssignment[]
): { assignments: LaneAssignment[]; spacingImproved: number } => {
  const assignmentMap = new Map(assignments.map(a => [a.trackerId, a]));
  let improvementCount = 0;
  
  // Group assignments by lane
  const laneGroups = new Map<number, LaneAssignment[]>();
  for (const assignment of assignments) {
    if (!laneGroups.has(assignment.laneIndex)) {
      laneGroups.set(assignment.laneIndex, []);
    }
    laneGroups.get(assignment.laneIndex)!.push(assignment);
  }

  // For each lane, try to move trackers to fill gaps
  for (const [laneIndex, laneAssignments] of laneGroups) {
    const sortedAssignments = laneAssignments.sort((a, b) => 
      a.startDate.getTime() - b.startDate.getTime()
    );

    // Look for gaps and try to move subsequent trackers forward
    for (let i = 0; i < sortedAssignments.length - 1; i++) {
      const current = sortedAssignments[i];
      const next = sortedAssignments[i + 1];
      
      const gapStart = addDays(current.endDate, 1);
      const gapEnd = addDays(next.startDate, -1);
      const gapDays = differenceInDays(gapEnd, gapStart);
      
      if (gapDays > 0) {
        // Try to find a tracker from a higher lane that can fit in this gap
        const candidateTrackers = trackers.filter(tracker => {
          const assignment = assignmentMap.get(tracker.id);
          return assignment && 
                 assignment.laneIndex > laneIndex &&
                 differenceInDays(tracker.endDate, tracker.startDate) <= gapDays &&
                 isAfter(tracker.startDate, gapStart) &&
                 isBefore(tracker.endDate, gapEnd);
        });

        if (candidateTrackers.length > 0) {
          // Move the best candidate to this lane
          const candidate = candidateTrackers[0];
          const candidateAssignment = assignmentMap.get(candidate.id)!;
          candidateAssignment.laneIndex = laneIndex;
          improvementCount++;
        }
      }
    }
  }

  return {
    assignments: Array.from(assignmentMap.values()),
    spacingImproved: improvementCount
  };
};

/**
 * Balance the distribution of trackers across lanes
 */
export const balanceLaneDistribution = (
  trackers: ProjectTracker[],
  assignments: LaneAssignment[]
): { assignments: LaneAssignment[]; improvementCount: number } => {
  const laneGroups = new Map<number, LaneAssignment[]>();
  let improvementCount = 0;

  // Group by lanes
  for (const assignment of assignments) {
    if (!laneGroups.has(assignment.laneIndex)) {
      laneGroups.set(assignment.laneIndex, []);
    }
    laneGroups.get(assignment.laneIndex)!.push(assignment);
  }

  const laneEntries = Array.from(laneGroups.entries()).sort(([a], [b]) => a - b);
  const averageTrackersPerLane = assignments.length / laneEntries.length;

  // Find overloaded and underloaded lanes
  const overloadedLanes = laneEntries.filter(([, assignments]) => 
    assignments.length > averageTrackersPerLane * 1.5
  );
  const underloadedLanes = laneEntries.filter(([, assignments]) => 
    assignments.length < averageTrackersPerLane * 0.5
  );

  // Move trackers from overloaded to underloaded lanes
  for (const [overloadedLaneIndex, overloadedAssignments] of overloadedLanes) {
    for (const [underloadedLaneIndex] of underloadedLanes) {
      // Find trackers that can be moved
      const movableTrackers = overloadedAssignments.filter(assignment => {
        const tracker = trackers.find(t => t.id === assignment.trackerId);
        if (!tracker) return false;

        // Check if tracker can fit in underloaded lane
        const underloadedTrackers = trackers.filter(t => {
          const a = assignments.find(a => a.trackerId === t.id);
          return a && a.laneIndex === underloadedLaneIndex && t.id !== tracker.id;
        });

        return canTrackerFitInLane(tracker, underloadedTrackers);
      });

      if (movableTrackers.length > 0) {
        // Move one tracker
        const toMove = movableTrackers[0];
        toMove.laneIndex = underloadedLaneIndex;
        improvementCount++;
        
        // Update groups
        overloadedAssignments.splice(overloadedAssignments.indexOf(toMove), 1);
        laneGroups.get(underloadedLaneIndex)!.push(toMove);
        
        if (overloadedAssignments.length <= averageTrackersPerLane * 1.2) {
          break; // This lane is now balanced
        }
      }
    }
  }

  return {
    assignments,
    improvementCount
  };
};

/**
 * Calculate packing efficiency metrics
 */
export const calculatePackingMetrics = (
  trackers: ProjectTracker[],
  assignments: LaneAssignment[]
): OptimizationResult['metrics'] => {
  if (trackers.length === 0 || assignments.length === 0) {
    return {
      packingEfficiency: 0,
      averageGapSize: 0,
      totalWastedSpace: 0,
      balanceScore: 0
    };
  }

  const maxLane = Math.max(...assignments.map(a => a.laneIndex));
  const totalLanes = maxLane + 1;
  
  // Calculate total occupied time across all lanes
  const allDates = trackers.flatMap(t => [t.startDate, t.endDate]);
  const spanStart = new Date(Math.min(...allDates.map(d => d.getTime())));
  const spanEnd = new Date(Math.max(...allDates.map(d => d.getTime())));
  const totalSpanDays = differenceInDays(spanEnd, spanStart) + 1;
  
  const totalAvailableSpace = totalSpanDays * totalLanes;
  const totalOccupiedSpace = trackers.reduce((sum, tracker) => 
    sum + differenceInDays(tracker.endDate, tracker.startDate) + 1, 0
  );
  
  const packingEfficiency = totalOccupiedSpace / totalAvailableSpace;

  // Calculate gaps
  const gaps = [];
  const laneGroups = new Map<number, LaneAssignment[]>();
  
  for (const assignment of assignments) {
    if (!laneGroups.has(assignment.laneIndex)) {
      laneGroups.set(assignment.laneIndex, []);
    }
    laneGroups.get(assignment.laneIndex)!.push(assignment);
  }

  let totalGapSize = 0;
  let gapCount = 0;

  for (const laneAssignments of laneGroups.values()) {
    const sorted = laneAssignments.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const gapDays = differenceInDays(next.startDate, current.endDate) - 1;
      
      if (gapDays > 0) {
        totalGapSize += gapDays;
        gapCount++;
      }
    }
  }

  const averageGapSize = gapCount > 0 ? totalGapSize / gapCount : 0;
  const totalWastedSpace = totalAvailableSpace - totalOccupiedSpace;

  // Calculate balance score
  const trackersPerLane = Array.from(laneGroups.values()).map(assignments => assignments.length);
  const averageTrackersPerLane = trackersPerLane.reduce((sum, count) => sum + count, 0) / totalLanes;
  const variance = trackersPerLane.reduce((sum, count) => 
    sum + Math.pow(count - averageTrackersPerLane, 2), 0) / totalLanes;
  const balanceScore = Math.max(0, 1 - (Math.sqrt(variance) / averageTrackersPerLane));

  return {
    packingEfficiency,
    averageGapSize,
    totalWastedSpace,
    balanceScore
  };
};

/**
 * Find the optimal lane count for a set of trackers
 */
export const findOptimalLaneCount = (
  trackers: ProjectTracker[],
  maxAcceptableLanes: number = 20
): {
  optimalCount: number;
  efficiency: number;
  reasoning: string;
} => {
  let bestCount = 1;
  let bestEfficiency = 0;
  let bestReasoning = '';

  for (let laneCount = 1; laneCount <= Math.min(maxAcceptableLanes, trackers.length); laneCount++) {
    const assignments = simulateAssignmentWithLaneLimit(trackers, laneCount);
    const metrics = calculatePackingMetrics(trackers, assignments);
    
    // Calculate overall score considering efficiency and compactness
    const compactnessBonus = 1 / laneCount; // Favor fewer lanes
    const score = metrics.packingEfficiency + compactnessBonus * 0.1;
    
    if (score > bestEfficiency) {
      bestEfficiency = score;
      bestCount = laneCount;
      bestReasoning = `Best balance of packing efficiency (${(metrics.packingEfficiency * 100).toFixed(1)}%) and compactness`;
    }
  }

  return {
    optimalCount: bestCount,
    efficiency: bestEfficiency,
    reasoning: bestReasoning
  };
};

/**
 * Simulate assignment with a specific lane limit
 */
export const simulateAssignmentWithLaneLimit = (
  trackers: ProjectTracker[],
  maxLanes: number
): LaneAssignment[] => {
  const sortedTrackers = [...trackers].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const lanes: ProjectTracker[][] = Array.from({ length: maxLanes }, () => []);
  const assignments: LaneAssignment[] = [];

  for (const tracker of sortedTrackers) {
    let assignedLane = -1;
    
    // Try to fit in existing lanes
    for (let i = 0; i < maxLanes; i++) {
      if (canTrackerFitInLane(tracker, lanes[i])) {
        assignedLane = i;
        break;
      }
    }
    
    // If no lane available, use the lane with the earliest ending tracker
    if (assignedLane === -1) {
      let earliestEnd = new Date(8640000000000000); // Max date
      let bestLane = 0;
      
      for (let i = 0; i < maxLanes; i++) {
        if (lanes[i].length === 0) {
          bestLane = i;
          break;
        }
        
        const laneEnd = lanes[i].reduce((latest, t) => 
          isAfter(t.endDate, latest) ? t.endDate : latest, 
          new Date(0)
        );
        
        if (isBefore(laneEnd, earliestEnd)) {
          earliestEnd = laneEnd;
          bestLane = i;
        }
      }
      
      assignedLane = bestLane;
    }
    
    lanes[assignedLane].push(tracker);
    assignments.push({
      trackerId: tracker.id,
      laneIndex: assignedLane,
      startDate: tracker.startDate,
      endDate: tracker.endDate
    });
  }

  return assignments;
};

/**
 * Generate optimization recommendations
 */
export const generateOptimizationRecommendations = (
  result: OptimizationResult
): Array<{
  type: 'lanes' | 'gaps' | 'balance' | 'efficiency';
  severity: 'low' | 'medium' | 'high';
  message: string;
  impact: string;
}> => {
  const recommendations = [];
  const { metrics, improvements } = result;

  // Lane recommendations
  if (improvements.lanesReduced > 0) {
    recommendations.push({
      type: 'lanes' as const,
      severity: 'medium' as const,
      message: `Reduced ${improvements.lanesReduced} lanes through optimization`,
      impact: 'Improved visual compactness and reduced scrolling'
    });
  }

  // Gap recommendations
  if (metrics.averageGapSize > 5) {
    recommendations.push({
      type: 'gaps' as const,
      severity: 'medium' as const,
      message: `Large gaps detected (average ${metrics.averageGapSize.toFixed(1)} days)`,
      impact: 'Consider redistributing trackers to minimize empty space'
    });
  }

  // Balance recommendations
  if (metrics.balanceScore < 0.6) {
    recommendations.push({
      type: 'balance' as const,
      severity: 'low' as const,
      message: 'Lane distribution is uneven',
      impact: 'Rebalancing lanes could improve visual organization'
    });
  }

  // Efficiency recommendations
  if (metrics.packingEfficiency < 0.5) {
    recommendations.push({
      type: 'efficiency' as const,
      severity: 'high' as const,
      message: `Low packing efficiency (${(metrics.packingEfficiency * 100).toFixed(1)}%)`,
      impact: 'Consider consolidating or rescheduling trackers'
    });
  }

  return recommendations;
};