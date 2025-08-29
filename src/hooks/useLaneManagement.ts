import { useState, useMemo, useCallback } from 'react';
import { ProjectTracker } from '../types';
import { 
  assignLanesToTrackers,
  getTrackerLanes,
  compactLanes,
  reassignTrackerLane,
  validateLaneAssignments,
  LaneAssignment,
  TrackerLane
} from '../lib/laneAssignment';

export interface LaneManagementState {
  assignments: LaneAssignment[];
  lanes: TrackerLane[];
  totalLanes: number;
  isValid: boolean;
  errors: string[];
}

export interface LaneManagementActions {
  reassignTracker: (trackerId: string, newLaneIndex: number) => void;
  compactAllLanes: () => void;
  refreshAssignments: () => void;
  validateAssignments: () => { isValid: boolean; errors: string[] };
}

export const useLaneManagement = (
  trackers: ProjectTracker[]
): LaneManagementState & LaneManagementActions => {
  // Internal state for manual lane assignments
  const [manualAssignments, setManualAssignments] = useState<LaneAssignment[]>([]);

  // Calculate automatic assignments when trackers change
  const autoAssignments = useMemo(() => {
    return assignLanesToTrackers(trackers);
  }, [trackers]);

  // Merge manual and automatic assignments (manual takes precedence)
  const finalAssignments = useMemo(() => {
    const manualTrackerIds = new Set(manualAssignments.map(a => a.trackerId));
    const autoForUnassigned = autoAssignments.filter(a => !manualTrackerIds.has(a.trackerId));
    
    return [...manualAssignments, ...autoForUnassigned];
  }, [manualAssignments, autoAssignments]);

  // Calculate lanes from assignments
  const lanes = useMemo(() => {
    return getTrackerLanes(trackers, finalAssignments);
  }, [trackers, finalAssignments]);

  // Validate assignments
  const validation = useMemo(() => {
    return validateLaneAssignments(finalAssignments, trackers);
  }, [finalAssignments, trackers]);

  // Actions
  const reassignTracker = useCallback((trackerId: string, newLaneIndex: number) => {
    setManualAssignments(current => {
      const newAssignments = reassignTrackerLane(trackerId, newLaneIndex, current, trackers);
      return compactLanes(newAssignments);
    });
  }, [trackers]);

  const compactAllLanes = useCallback(() => {
    setManualAssignments(current => compactLanes(current));
  }, []);

  const refreshAssignments = useCallback(() => {
    // Clear manual assignments and recalculate from scratch
    setManualAssignments([]);
  }, []);

  const validateAssignments = useCallback(() => {
    return validateLaneAssignments(finalAssignments, trackers);
  }, [finalAssignments, trackers]);

  return {
    // State
    assignments: finalAssignments,
    lanes,
    totalLanes: Math.max(lanes.length, 1),
    isValid: validation.isValid,
    errors: validation.errors,
    
    // Actions
    reassignTracker,
    compactAllLanes,
    refreshAssignments,
    validateAssignments
  };
};