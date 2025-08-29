import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectTracker } from '../types';
import { trackerService } from '../lib/trackerService';
import { useTrackerErrorHandler } from './useErrorHandler';

interface UseTimelineTrackersReturn {
  trackers: ProjectTracker[];
  loading: boolean;
  error: string | null;
  refreshTrackers: () => Promise<void>;
}

export const useTimelineTrackers = (
  projectId: string,
  currentDate: Date
): UseTimelineTrackersReturn => {
  const [trackers, setTrackers] = useState<ProjectTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedRange, setLoadedRange] = useState<{ start: Date; end: Date } | null>(null);
  
  const { executeWithErrorHandling } = useTrackerErrorHandler();
  
  // Calculate reasonable date range around current date (6 months total)
  const targetRange = useMemo(() => {
    const start = new Date(currentDate);
    start.setMonth(start.getMonth() - 3); // 3 months before
    
    const end = new Date(currentDate);
    end.setMonth(end.getMonth() + 3); // 3 months after
    
    return { start, end };
  }, [currentDate]);

  // Check if we need to expand the loaded range
  const needsExpansion = useMemo(() => {
    if (!loadedRange) return true;
    
    // Need expansion if target range extends beyond loaded range
    return targetRange.start < loadedRange.start || targetRange.end > loadedRange.end;
  }, [targetRange, loadedRange]);

  const loadTrackers = useCallback(async (forceRefresh = false) => {
    if (!projectId) return;
    
    // If we don't need expansion and it's not a forced refresh, skip loading
    if (!needsExpansion && !forceRefresh) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Calculate expanded range (wider than target to avoid frequent reloads)
      const expandedStart = new Date(targetRange.start);
      expandedStart.setMonth(expandedStart.getMonth() - 2); // Extra 2 months before
      
      const expandedEnd = new Date(targetRange.end);
      expandedEnd.setMonth(expandedEnd.getMonth() + 2); // Extra 2 months after
      
      const fetchedTrackers = await executeWithErrorHandling(async () => {
        return await trackerService.getTrackersInDateRange(projectId, expandedStart, expandedEnd);
      }, { retryable: true });
      
      setTrackers(fetchedTrackers);
      setLoadedRange({ start: expandedStart, end: expandedEnd });
      
    } catch (err) {
      console.error('Failed to load timeline trackers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trackers');
    } finally {
      setLoading(false);
    }
  }, [projectId, targetRange, needsExpansion, executeWithErrorHandling]);

  const refreshTrackers = useCallback(async () => {
    setLoadedRange(null); // Reset range to force reload
    await loadTrackers(true);
  }, [loadTrackers]);

  // Load trackers when needed
  useEffect(() => {
    loadTrackers();
  }, [loadTrackers]);

  return {
    trackers,
    loading,
    error,
    refreshTrackers
  };
};