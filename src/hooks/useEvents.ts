import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../types';
import { eventService, validateEvent } from '../lib/eventService';

export interface UseEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
}

export const useEvents = (projectId: string): UseEventsReturn => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedEvents = await eventService.getEvents(projectId);
      setEvents(fetchedEvents);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const refreshEvents = useCallback(async () => {
    await loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    refreshEvents
  };
};

export interface UseEventOperationsReturn {
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (eventId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useEventOperations = (onSuccess?: () => void): UseEventOperationsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    try {
      setLoading(true);
      setError(null);

      // Validate event data
      const validationErrors = validateEvent(event);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const newEvent = await eventService.createEvent(event);
      onSuccess?.();
      return newEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    try {
      setLoading(true);
      setError(null);

      // Validate updated data
      const validationErrors = validateEvent(updates);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const updatedEvent = await eventService.updateEvent(eventId, updates);
      onSuccess?.();
      return updatedEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await eventService.deleteEvent(eventId);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    loading,
    error
  };
};

export interface UseUpcomingEventsReturn {
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refreshUpcomingEvents: () => Promise<void>;
}

export const useUpcomingEvents = (projectId: string, days: number = 7): UseUpcomingEventsReturn => {
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUpcomingEvents = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const events = await eventService.getUpcomingEvents(projectId, days);
      setUpcomingEvents(events);
    } catch (err) {
      console.error('Failed to load upcoming events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load upcoming events');
    } finally {
      setLoading(false);
    }
  }, [projectId, days]);

  const refreshUpcomingEvents = useCallback(async () => {
    await loadUpcomingEvents();
  }, [loadUpcomingEvents]);

  useEffect(() => {
    loadUpcomingEvents();
  }, [loadUpcomingEvents]);

  return {
    upcomingEvents,
    loading,
    error,
    refreshUpcomingEvents
  };
};