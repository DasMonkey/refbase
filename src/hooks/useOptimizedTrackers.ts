import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ProjectTracker } from '../types';
import { trackerService } from '../lib/trackerService';
import { useTrackerErrorHandler } from './useErrorHandler';

interface CachedTrackersData {
  trackers: ProjectTracker[];
  startDate: Date;
  endDate: Date;
  lastFetched: number;
}

interface UseOptimizedTrackersReturn {
  trackers: ProjectTracker[];
  loading: boolean;
  error: string | null;
  refreshTrackers: () => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PREFETCH_BUFFER_DAYS = 14; // Prefetch 2 weeks ahead/behind
const INITIAL_LOAD_MONTHS = 6; // Load 6 months of data initially (3 months before/after)

export const useOptimizedTrackers = (
  projectId: string,
  viewStartDate: Date,
  viewEndDate: Date
): UseOptimizedTrackersReturn => {
  const [trackers, setTrackers] = useState<ProjectTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache to store fetched data ranges
  const cacheRef = useRef<Map<string, CachedTrackersData>>(new Map());
  const { executeWithErrorHandling } = useTrackerErrorHandler();
  
  // Generate cache key for date range
  const generateCacheKey = useCallback((start: Date, end: Date) => {
    return `${projectId}-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}`;
  }, [projectId]);

  // Check if date range is covered by cached data
  const findCachedData = useCallback((start: Date, end: Date): ProjectTracker[] | null => {
    const now = Date.now();
    
    for (const [key, cached] of cacheRef.current.entries()) {
      // Check if cache is still valid
      if (now - cached.lastFetched > CACHE_DURATION) {
        cacheRef.current.delete(key);
        continue;
      }
      
      // Check if requested range is fully covered by cached range
      if (cached.startDate <= start && cached.endDate >= end) {
        // Filter to exact requested range
        return cached.trackers.filter(tracker => 
          tracker.endDate >= start && tracker.startDate <= end
        );
      }
    }
    
    return null;
  }, []);

  // Fetch trackers for a specific date range
  const fetchTrackersForRange = useCallback(async (start: Date, end: Date): Promise<ProjectTracker[]> => {
    return executeWithErrorHandling(async () => {
      const fetchedTrackers = await trackerService.getTrackersInDateRange(projectId, start, end);
      
      // Cache the fetched data
      const cacheKey = generateCacheKey(start, end);
      cacheRef.current.set(cacheKey, {
        trackers: fetchedTrackers,
        startDate: new Date(start),
        endDate: new Date(end),
        lastFetched: Date.now()
      });
      
      return fetchedTrackers;
    }, { retryable: true });
  }, [projectId, generateCacheKey, executeWithErrorHandling]);

  // Prefetch adjacent data ranges
  const prefetchAdjacentRanges = useCallback(async (centerStart: Date, centerEnd: Date) => {
    // Don't prefetch if already loading
    if (loading) return;
    
    // Calculate prefetch ranges
    const prefetchBefore = new Date(centerStart);
    prefetchBefore.setDate(prefetchBefore.getDate() - PREFETCH_BUFFER_DAYS);
    
    const prefetchAfter = new Date(centerEnd);
    prefetchAfter.setDate(prefetchAfter.getDate() + PREFETCH_BUFFER_DAYS);
    
    // Prefetch previous range (async, don't wait)
    const prevCached = findCachedData(prefetchBefore, centerStart);
    if (!prevCached) {
      fetchTrackersForRange(prefetchBefore, centerStart).catch(err => 
        console.warn('Failed to prefetch previous range:', err)
      );
    }
    
    // Prefetch next range (async, don't wait)
    const nextCached = findCachedData(centerEnd, prefetchAfter);
    if (!nextCached) {
      fetchTrackersForRange(centerEnd, prefetchAfter).catch(err => 
        console.warn('Failed to prefetch next range:', err)
      );
    }
  }, [loading, findCachedData, fetchTrackersForRange]);

  // Load trackers for current view
  const loadTrackers = useCallback(async () => {
    if (!projectId || !viewStartDate || !viewEndDate) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Calculate initial wide range (6 months around current view)
      const initialStart = new Date(viewStartDate);
      initialStart.setMonth(initialStart.getMonth() - 3); // 3 months before
      
      const initialEnd = new Date(viewEndDate);
      initialEnd.setMonth(initialEnd.getMonth() + 3); // 3 months after
      
      // Check if we have cached data that covers the initial range
      const cachedTrackers = findCachedData(initialStart, initialEnd);
      if (cachedTrackers) {
        setTrackers(cachedTrackers);
        setLoading(false);
        
        // Start prefetching in background
        prefetchAdjacentRanges(viewStartDate, viewEndDate);
        return;
      }
      
      // Check if we have ANY cached data that overlaps with current view
      const partialCachedTrackers = findCachedData(viewStartDate, viewEndDate);
      if (partialCachedTrackers) {
        setTrackers(partialCachedTrackers);
        setLoading(false);
        
        // Load the wider range in background to get all trackers
        fetchTrackersForRange(initialStart, initialEnd).then(fullTrackers => {
          setTrackers(fullTrackers);
        }).catch(err => {
          console.warn('Background loading failed:', err);
        });
        
        return;
      }
      
      // No cache hit - load the initial wide range
      const fetchedTrackers = await fetchTrackersForRange(initialStart, initialEnd);
      setTrackers(fetchedTrackers);
      
      // Start prefetching adjacent ranges beyond the initial load
      prefetchAdjacentRanges(initialStart, initialEnd);
      
    } catch (err) {
      console.error('Failed to load trackers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trackers');
    } finally {
      setLoading(false);
    }
  }, [projectId, viewStartDate, viewEndDate, findCachedData, fetchTrackersForRange, prefetchAdjacentRanges]);

  const refreshTrackers = useCallback(async () => {
    // Clear cache for current project
    const keysToDelete = Array.from(cacheRef.current.keys()).filter(key => key.startsWith(projectId));
    keysToDelete.forEach(key => cacheRef.current.delete(key));
    
    await loadTrackers();
  }, [projectId, loadTrackers]);

  // Clean up old cache entries periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [key, cached] of cacheRef.current.entries()) {
        if (now - cached.lastFetched > CACHE_DURATION) {
          cacheRef.current.delete(key);
        }
      }
    };
    
    const interval = setInterval(cleanup, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

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