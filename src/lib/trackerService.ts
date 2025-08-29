import { supabase } from './supabase';
import { ProjectTracker } from '../types';
import { classifyError, validateTrackerData, ErrorHandlerFactory } from './errorHandling';

export interface TrackerService {
  getTrackers(projectId: string): Promise<ProjectTracker[]>;
  getTrackersInDateRange(projectId: string, startDate: Date, endDate: Date): Promise<ProjectTracker[]>;
  createTracker(tracker: Omit<ProjectTracker, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectTracker>;
  updateTracker(trackerId: string, updates: Partial<ProjectTracker>): Promise<ProjectTracker>;
  deleteTracker(trackerId: string): Promise<void>;
}

class SupabaseTrackerService implements TrackerService {
  private errorHandler = ErrorHandlerFactory.createHandler('service');

  async getTrackers(projectId: string): Promise<ProjectTracker[]> {
    try {
      const { data, error } = await supabase
        .from('project_trackers')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) {
        const classifiedError = this.errorHandler.handle(error);
        throw new Error(`Failed to fetch trackers: ${classifiedError.message}`);
      }

      return this.transformDatabaseTrackers(data || []);
    } catch (error) {
      this.errorHandler.handle(error);
      throw error;
    }
  }

  async getTrackersInDateRange(projectId: string, startDate: Date, endDate: Date): Promise<ProjectTracker[]> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('project_trackers')
        .select('*')
        .eq('project_id', projectId)
        .or(`start_date.lte.${endDateStr},end_date.gte.${startDateStr}`)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching trackers in date range:', error);
        throw new Error(`Failed to fetch trackers: ${error.message}`);
      }

      return this.transformDatabaseTrackers(data || []);
    } catch (error) {
      console.error('Error in getTrackersInDateRange:', error);
      throw error;
    }
  }

  async createTracker(tracker: Omit<ProjectTracker, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectTracker> {
    try {
      // Validate tracker data before processing
      const validationErrors = validateTrackerData(tracker);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const trackerData = {
        project_id: tracker.projectId,
        user_id: user.id,
        title: tracker.title,
        description: tracker.description || null,
        tracker_type: tracker.type,
        start_date: tracker.startDate.toISOString().split('T')[0],
        end_date: tracker.endDate.toISOString().split('T')[0],
        status: tracker.status,
        priority: tracker.priority,
        linked_items: tracker.linkedItems || {}
      };

      const { data, error } = await supabase
        .from('project_trackers')
        .insert([trackerData])
        .select()
        .single();

      if (error) {
        const classifiedError = this.errorHandler.handle(error);
        throw new Error(`Failed to create tracker: ${classifiedError.message}`);
      }

      return this.transformDatabaseTracker(data);
    } catch (error) {
      this.errorHandler.handle(error);
      throw error;
    }
  }

  async updateTracker(trackerId: string, updates: Partial<ProjectTracker>): Promise<ProjectTracker> {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.type !== undefined) updateData.tracker_type = updates.type;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString().split('T')[0];
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate.toISOString().split('T')[0];
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.linkedItems !== undefined) updateData.linked_items = updates.linkedItems;

      const { data, error } = await supabase
        .from('project_trackers')
        .update(updateData)
        .eq('id', trackerId)
        .select()
        .single();

      if (error) {
        console.error('Error updating tracker:', error);
        throw new Error(`Failed to update tracker: ${error.message}`);
      }

      return this.transformDatabaseTracker(data);
    } catch (error) {
      console.error('Error in updateTracker:', error);
      throw error;
    }
  }

  async deleteTracker(trackerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_trackers')
        .delete()
        .eq('id', trackerId);

      if (error) {
        console.error('Error deleting tracker:', error);
        throw new Error(`Failed to delete tracker: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteTracker:', error);
      throw error;
    }
  }

  private transformDatabaseTracker(dbTracker: any): ProjectTracker {
    return {
      id: dbTracker.id,
      projectId: dbTracker.project_id,
      userId: dbTracker.user_id,
      title: dbTracker.title,
      description: dbTracker.description,
      type: dbTracker.tracker_type,
      startDate: new Date(dbTracker.start_date),
      endDate: new Date(dbTracker.end_date),
      status: dbTracker.status,
      priority: dbTracker.priority,
      linkedItems: dbTracker.linked_items || {},
      createdAt: new Date(dbTracker.created_at),
      updatedAt: new Date(dbTracker.updated_at)
    };
  }

  private transformDatabaseTrackers(dbTrackers: any[]): ProjectTracker[] {
    return dbTrackers.map(tracker => this.transformDatabaseTracker(tracker));
  }
}

// Legacy validation function - use validateTrackerData from errorHandling.ts instead
export const validateTracker = validateTrackerData;

// Export singleton instance
export const trackerService = new SupabaseTrackerService();