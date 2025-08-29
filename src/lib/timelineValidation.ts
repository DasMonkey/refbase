import { ProjectTracker } from '../types';
import { 
  differenceInDays, 
  isAfter, 
  isBefore, 
  startOfDay, 
  endOfDay,
  addYears,
  subYears,
  isValid as isValidDate
} from 'date-fns';
import { checkTrackerCollisions, CollisionCheckOptions } from './collisionDetection';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  canProceed: boolean; // Can proceed despite warnings
}

export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  field?: string;
  value?: any;
  constraint?: string;
}

export interface ValidationWarning {
  type: ValidationWarningType;
  message: string;
  suggestion?: string;
}

export type ValidationErrorType = 
  | 'invalid_date_range'
  | 'date_in_past'
  | 'date_too_far_future'
  | 'duration_too_short'
  | 'duration_too_long'
  | 'invalid_lane'
  | 'collision_detected'
  | 'permission_denied'
  | 'invalid_tracker_type'
  | 'invalid_priority'
  | 'invalid_status'
  | 'missing_required_field';

export type ValidationWarningType = 
  | 'past_date_warning'
  | 'weekend_dates'
  | 'long_duration'
  | 'high_priority_overlap'
  | 'resource_conflict'
  | 'performance_warning';

// Validation configuration
export interface ValidationConfig {
  minDuration: number; // days
  maxDuration: number; // days  
  allowPastDates: boolean;
  allowWeekends: boolean;
  maxFutureYears: number;
  maxLanesCount: number;
  strictCollisionCheck: boolean;
  performanceThresholds: {
    maxTrackersPerLane: number;
    maxOverlappingTrackers: number;
  };
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  minDuration: 1,
  maxDuration: 365,
  allowPastDates: true,
  allowWeekends: true,
  maxFutureYears: 2,
  maxLanesCount: 50,
  strictCollisionCheck: false,
  performanceThresholds: {
    maxTrackersPerLane: 20,
    maxOverlappingTrackers: 5
  }
};

// Main validation class
export class TimelineValidator {
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  // Validate tracker data
  validateTracker(tracker: Partial<ProjectTracker>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!tracker.title?.trim()) {
      errors.push({
        type: 'missing_required_field',
        message: 'Tracker title is required',
        field: 'title'
      });
    }

    if (!tracker.startDate) {
      errors.push({
        type: 'missing_required_field',
        message: 'Start date is required',
        field: 'startDate'
      });
    }

    if (!tracker.endDate) {
      errors.push({
        type: 'missing_required_field',
        message: 'End date is required',
        field: 'endDate'
      });
    }

    // Type validation
    if (tracker.type && !['project', 'feature', 'bug'].includes(tracker.type)) {
      errors.push({
        type: 'invalid_tracker_type',
        message: 'Invalid tracker type',
        field: 'type',
        value: tracker.type
      });
    }

    // Priority validation  
    if (tracker.priority && !['low', 'medium', 'high', 'critical'].includes(tracker.priority)) {
      errors.push({
        type: 'invalid_priority',
        message: 'Invalid priority level',
        field: 'priority',
        value: tracker.priority
      });
    }

    // Status validation
    if (tracker.status && !['not_started', 'in_progress', 'completed'].includes(tracker.status)) {
      errors.push({
        type: 'invalid_status',
        message: 'Invalid status',
        field: 'status',
        value: tracker.status
      });
    }

    // Date validation
    if (tracker.startDate && tracker.endDate) {
      const dateValidation = this.validateDateRange(tracker.startDate, tracker.endDate);
      errors.push(...dateValidation.errors);
      warnings.push(...dateValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    };
  }

  // Validate date range
  validateDateRange(startDate: Date, endDate: Date): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if dates are valid
    if (!isValidDate(startDate)) {
      errors.push({
        type: 'invalid_date_range',
        message: 'Invalid start date',
        field: 'startDate',
        value: startDate
      });
    }

    if (!isValidDate(endDate)) {
      errors.push({
        type: 'invalid_date_range',
        message: 'Invalid end date',
        field: 'endDate',
        value: endDate
      });
    }

    if (!errors.length) {
      // Normalize dates to start/end of day
      const normalizedStart = startOfDay(startDate);
      const normalizedEnd = endOfDay(endDate);

      // Check if end is after start
      if (!isAfter(normalizedEnd, normalizedStart) && !startDate.getTime() === endDate.getTime()) {
        errors.push({
          type: 'invalid_date_range',
          message: 'End date must be after start date',
          field: 'endDate'
        });
      }

      // Check duration constraints
      const duration = differenceInDays(normalizedEnd, normalizedStart) + 1;
      
      if (duration < this.config.minDuration) {
        errors.push({
          type: 'duration_too_short',
          message: `Duration must be at least ${this.config.minDuration} day(s)`,
          constraint: `min: ${this.config.minDuration} days`
        });
      }

      if (duration > this.config.maxDuration) {
        errors.push({
          type: 'duration_too_long',
          message: `Duration cannot exceed ${this.config.maxDuration} days`,
          constraint: `max: ${this.config.maxDuration} days`
        });
      }

      // Check past dates
      const now = new Date();
      if (!this.config.allowPastDates && isBefore(normalizedStart, startOfDay(now))) {
        errors.push({
          type: 'date_in_past',
          message: 'Start date cannot be in the past',
          field: 'startDate'
        });
      } else if (isBefore(normalizedStart, startOfDay(now))) {
        warnings.push({
          type: 'past_date_warning',
          message: 'Tracker starts in the past',
          suggestion: 'Consider updating the start date'
        });
      }

      // Check future dates
      const maxFutureDate = addYears(now, this.config.maxFutureYears);
      if (isAfter(normalizedEnd, maxFutureDate)) {
        errors.push({
          type: 'date_too_far_future',
          message: `End date cannot be more than ${this.config.maxFutureYears} years in the future`,
          field: 'endDate'
        });
      }

      // Check weekend dates
      if (!this.config.allowWeekends) {
        const startDay = normalizedStart.getDay();
        const endDay = normalizedEnd.getDay();
        
        if (startDay === 0 || startDay === 6) {
          warnings.push({
            type: 'weekend_dates',
            message: 'Tracker starts on a weekend',
            suggestion: 'Consider starting on a weekday'
          });
        }

        if (endDay === 0 || endDay === 6) {
          warnings.push({
            type: 'weekend_dates',
            message: 'Tracker ends on a weekend',
            suggestion: 'Consider ending on a weekday'
          });
        }
      }

      // Long duration warning
      if (duration > 90) {
        warnings.push({
          type: 'long_duration',
          message: `Long duration tracker (${duration} days)`,
          suggestion: 'Consider breaking into smaller trackers'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    };
  }

  // Validate drag operation
  validateDragOperation(
    tracker: ProjectTracker,
    newStartDate: Date,
    newEndDate: Date,
    newLane: number,
    allTrackers: ProjectTracker[],
    laneAssignments: Map<string, number>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic date validation
    const dateValidation = this.validateDateRange(newStartDate, newEndDate);
    errors.push(...dateValidation.errors);
    warnings.push(...dateValidation.warnings);

    // Lane validation
    if (newLane < 0) {
      errors.push({
        type: 'invalid_lane',
        message: 'Lane index cannot be negative',
        field: 'lane',
        value: newLane
      });
    }

    if (newLane > this.config.maxLanesCount) {
      errors.push({
        type: 'invalid_lane',
        message: `Lane index cannot exceed ${this.config.maxLanesCount}`,
        field: 'lane',
        value: newLane
      });
    }

    // Collision detection
    const collisionCheck = checkTrackerCollisions(
      { startDate: newStartDate, endDate: newEndDate, id: tracker.id },
      newLane,
      allTrackers,
      laneAssignments,
      { 
        checkSameLaneOnly: true, 
        allowPartialOverlaps: !this.config.strictCollisionCheck 
      } as CollisionCheckOptions
    );

    if (collisionCheck.hasCollision) {
      const majorCollisions = collisionCheck.collisions.filter(c => c.severity === 'major');
      
      if (majorCollisions.length > 0 || this.config.strictCollisionCheck) {
        errors.push({
          type: 'collision_detected',
          message: `Tracker would overlap with ${collisionCheck.collisions.length} other tracker(s)`,
          field: 'position'
        });
      } else {
        warnings.push({
          type: 'high_priority_overlap',
          message: `Minor overlap with ${collisionCheck.collisions.length} tracker(s)`,
          suggestion: collisionCheck.suggestedLane !== undefined 
            ? `Consider moving to lane ${collisionCheck.suggestedLane}` 
            : 'Consider adjusting the date range'
        });
      }
    }

    // Performance warnings
    const trackersInLane = allTrackers.filter(t => 
      t.id !== tracker.id && laneAssignments.get(t.id) === newLane
    );

    if (trackersInLane.length >= this.config.performanceThresholds.maxTrackersPerLane) {
      warnings.push({
        type: 'performance_warning',
        message: `Lane ${newLane} has many trackers (${trackersInLane.length})`,
        suggestion: 'Consider using a different lane for better performance'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    };
  }

  // Validate resize operation
  validateResizeOperation(
    tracker: ProjectTracker,
    newStartDate: Date,
    newEndDate: Date,
    allTrackers: ProjectTracker[],
    laneAssignments: Map<string, number>
  ): ValidationResult {
    const currentLane = laneAssignments.get(tracker.id) ?? 0;
    return this.validateDragOperation(
      tracker,
      newStartDate,
      newEndDate,
      currentLane,
      allTrackers,
      laneAssignments
    );
  }

  // Validate bulk operations
  validateBulkOperation(
    trackers: ProjectTracker[],
    operation: 'delete' | 'update_status' | 'move_lane'
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (trackers.length === 0) {
      errors.push({
        type: 'missing_required_field',
        message: 'No trackers selected for bulk operation'
      });
    }

    // Check for critical trackers in delete operation
    if (operation === 'delete') {
      const criticalTrackers = trackers.filter(t => t.priority === 'critical');
      if (criticalTrackers.length > 0) {
        warnings.push({
          type: 'high_priority_overlap',
          message: `Deleting ${criticalTrackers.length} critical priority tracker(s)`,
          suggestion: 'Consider changing priority before deletion'
        });
      }

      // Check for in-progress trackers
      const inProgressTrackers = trackers.filter(t => t.status === 'in_progress');
      if (inProgressTrackers.length > 0) {
        warnings.push({
          type: 'resource_conflict',
          message: `Deleting ${inProgressTrackers.length} in-progress tracker(s)`,
          suggestion: 'Complete or pause trackers before deletion'
        });
      }
    }

    // Performance check for large bulk operations
    if (trackers.length > 20) {
      warnings.push({
        type: 'performance_warning',
        message: `Bulk operation affects ${trackers.length} trackers`,
        suggestion: 'Consider processing in smaller batches'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: true // Bulk operations can proceed with warnings
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<ValidationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  // Validate tracker permissions (placeholder for future implementation)
  validatePermissions(
    tracker: ProjectTracker, 
    operation: 'read' | 'write' | 'delete',
    userId?: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Placeholder implementation - can be extended with actual permission logic
    // For now, assume all operations are allowed
    
    return {
      isValid: true,
      errors,
      warnings,
      canProceed: true
    };
  }
}

// Validation error formatter
export class ValidationErrorFormatter {
  static formatErrors(errors: ValidationError[]): string[] {
    return errors.map(error => {
      let message = error.message;
      
      if (error.field) {
        message = `${error.field}: ${message}`;
      }
      
      if (error.constraint) {
        message += ` (${error.constraint})`;
      }
      
      return message;
    });
  }

  static formatWarnings(warnings: ValidationWarning[]): string[] {
    return warnings.map(warning => {
      let message = warning.message;
      
      if (warning.suggestion) {
        message += ` - ${warning.suggestion}`;
      }
      
      return message;
    });
  }

  static getErrorSummary(result: ValidationResult): string {
    if (result.isValid) {
      return 'All validations passed';
    }

    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;

    let summary = `${errorCount} error${errorCount !== 1 ? 's' : ''}`;
    
    if (warningCount > 0) {
      summary += `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}`;
    }

    return summary;
  }
}

// Hook for using validation in components
export const useTimelineValidation = (config?: Partial<ValidationConfig>) => {
  const validator = React.useMemo(
    () => new TimelineValidator(config),
    [config]
  );

  const validateTracker = React.useCallback(
    (tracker: Partial<ProjectTracker>) => validator.validateTracker(tracker),
    [validator]
  );

  const validateDragOperation = React.useCallback(
    (
      tracker: ProjectTracker,
      newStartDate: Date,
      newEndDate: Date,
      newLane: number,
      allTrackers: ProjectTracker[],
      laneAssignments: Map<string, number>
    ) => validator.validateDragOperation(tracker, newStartDate, newEndDate, newLane, allTrackers, laneAssignments),
    [validator]
  );

  const validateResizeOperation = React.useCallback(
    (
      tracker: ProjectTracker,
      newStartDate: Date,
      newEndDate: Date,
      allTrackers: ProjectTracker[],
      laneAssignments: Map<string, number>
    ) => validator.validateResizeOperation(tracker, newStartDate, newEndDate, allTrackers, laneAssignments),
    [validator]
  );

  return {
    validateTracker,
    validateDragOperation,
    validateResizeOperation,
    validator
  };
};