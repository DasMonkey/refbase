import { useState, useEffect, useCallback } from 'react';
import { ProjectTracker } from '../types';
import { trackerService, validateTracker } from '../lib/trackerService';
import { useTrackerErrorHandler } from './useErrorHandler';

export interface UseProjectTrackersReturn {
  trackers: ProjectTracker[];
  loading: boolean;
  error: string | null;
  refreshTrackers: () => Promise<void>;
}

export const useProjectTrackers = (projectId: string): UseProjectTrackersReturn => {
  const [trackers, setTrackers] = useState<ProjectTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrackers = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedTrackers = await trackerService.getTrackers(projectId);
      setTrackers(fetchedTrackers);
    } catch (err) {
      console.error('Failed to load trackers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trackers');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const refreshTrackers = useCallback(async () => {
    await loadTrackers();
  }, [loadTrackers]);

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

export interface UseTrackersInDateRangeReturn {
  trackers: ProjectTracker[];
  loading: boolean;
  error: string | null;
  refreshTrackers: () => Promise<void>;
}

export const useTrackersInDateRange = (
  projectId: string, 
  startDate: Date, 
  endDate: Date
): UseTrackersInDateRangeReturn => {
  const [trackers, setTrackers] = useState<ProjectTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrackers = useCallback(async () => {
    if (!projectId || !startDate || !endDate) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedTrackers = await trackerService.getTrackersInDateRange(projectId, startDate, endDate);
      setTrackers(fetchedTrackers);
    } catch (err) {
      console.error('Failed to load trackers in date range:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trackers');
    } finally {
      setLoading(false);
    }
  }, [projectId, startDate, endDate]);

  const refreshTrackers = useCallback(async () => {
    await loadTrackers();
  }, [loadTrackers]);

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

export interface UseTrackerOperationsReturn {
  createTracker: (tracker: Omit<ProjectTracker, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectTracker>;
  updateTracker: (trackerId: string, updates: Partial<ProjectTracker>) => Promise<ProjectTracker>;
  deleteTracker: (trackerId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useTrackerOperations = (onSuccess?: () => Promise<void>): UseTrackerOperationsReturn => {
  const { error, isLoading, executeWithErrorHandling } = useTrackerErrorHandler();

  const createTracker = useCallback(async (tracker: Omit<ProjectTracker, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectTracker> => {
    return executeWithErrorHandling(async () => {
      const newTracker = await trackerService.createTracker(tracker);
      if (onSuccess) {
        await onSuccess();
      }
      return newTracker;
    }, { retryable: false }); // Don't retry create operations
  }, [onSuccess, executeWithErrorHandling]);

  const updateTracker = useCallback(async (trackerId: string, updates: Partial<ProjectTracker>): Promise<ProjectTracker> => {
    return executeWithErrorHandling(async () => {
      const updatedTracker = await trackerService.updateTracker(trackerId, updates);
      if (onSuccess) {
        await onSuccess();
      }
      return updatedTracker;
    }, { retryable: true }); // Allow retries for update operations
  }, [onSuccess, executeWithErrorHandling]);

  const deleteTracker = useCallback(async (trackerId: string): Promise<void> => {
    return executeWithErrorHandling(async () => {
      await trackerService.deleteTracker(trackerId);
      if (onSuccess) {
        await onSuccess();
      }
    }, { retryable: false }); // Don't retry delete operations
  }, [onSuccess, executeWithErrorHandling]);

  return {
    createTracker,
    updateTracker,
    deleteTracker,
    loading: isLoading,
    error: error?.message || null
  };
};