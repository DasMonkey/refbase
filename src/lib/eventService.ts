import { supabase } from './supabase';
import { CalendarEvent } from '../types';

export interface EventService {
  getEvents(projectId: string): Promise<CalendarEvent[]>;
  createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent>;
  updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteEvent(eventId: string): Promise<void>;
  getUpcomingEvents(projectId: string, days?: number): Promise<CalendarEvent[]>;
}

class SupabaseEventService implements EventService {
  async getEvents(projectId: string): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('project_id', projectId)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw new Error(`Failed to fetch events: ${error.message}`);
      }

      return this.transformDatabaseEvents(data || []);
    } catch (error) {
      console.error('Error in getEvents:', error);
      throw error;
    }
  }

  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const eventData = {
        project_id: event.projectId,
        title: event.title,
        description: event.description || null,
        event_date: event.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
        start_time: event.startTime,
        end_time: event.endTime,
        event_type: event.type,
        attendees: event.attendees || null,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        throw new Error(`Failed to create event: ${error.message}`);
      }

      return this.transformDatabaseEvent(data);
    } catch (error) {
      console.error('Error in createEvent:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.date !== undefined) updateData.event_date = updates.date.toISOString().split('T')[0];
      if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
      if (updates.type !== undefined) updateData.event_type = updates.type;
      if (updates.attendees !== undefined) updateData.attendees = updates.attendees;

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
        throw new Error(`Failed to update event: ${error.message}`);
      }

      return this.transformDatabaseEvent(data);
    } catch (error) {
      console.error('Error in updateEvent:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting event:', error);
        throw new Error(`Failed to delete event: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      throw error;
    }
  }

  async getUpcomingEvents(projectId: string, days: number = 7): Promise<CalendarEvent[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('project_id', projectId)
        .gte('event_date', today.toISOString().split('T')[0])
        .lte('event_date', futureDate.toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming events:', error);
        throw new Error(`Failed to fetch upcoming events: ${error.message}`);
      }

      return this.transformDatabaseEvents(data || []);
    } catch (error) {
      console.error('Error in getUpcomingEvents:', error);
      throw error;
    }
  }

  private transformDatabaseEvent(dbEvent: any): CalendarEvent {
    return {
      id: dbEvent.id,
      projectId: dbEvent.project_id,
      title: dbEvent.title,
      description: dbEvent.description,
      date: new Date(dbEvent.event_date),
      startTime: dbEvent.start_time,
      endTime: dbEvent.end_time,
      type: dbEvent.event_type,
      attendees: dbEvent.attendees || []
    };
  }

  private transformDatabaseEvents(dbEvents: any[]): CalendarEvent[] {
    return dbEvents.map(event => this.transformDatabaseEvent(event));
  }
}

// Validation functions
export const validateEvent = (event: Partial<CalendarEvent>): string[] => {
  const errors: string[] = [];

  if (!event.title?.trim()) {
    errors.push('Event title is required');
  }

  if (!event.date) {
    errors.push('Event date is required');
  }

  if (!event.startTime) {
    errors.push('Start time is required');
  }

  if (!event.endTime) {
    errors.push('End time is required');
  }

  if (event.startTime && event.endTime) {
    const start = new Date(`2000-01-01T${event.startTime}`);
    const end = new Date(`2000-01-01T${event.endTime}`);
    
    if (end <= start) {
      errors.push('End time must be after start time');
    }
  }

  if (event.type && !['meeting', 'task', 'milestone', 'bug'].includes(event.type)) {
    errors.push('Invalid event type');
  }

  return errors;
};

// Export singleton instance
export const eventService = new SupabaseEventService();