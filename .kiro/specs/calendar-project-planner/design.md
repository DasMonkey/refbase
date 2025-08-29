# Design Document

## Overview

The Calendar Project Planner extends the existing CalendarTab component with a modern horizontal timeline system inspired by Notion Calendar. This feature provides an intuitive drag-and-drop project planning interface that allows users to visualize and manage project trackers on a horizontal timeline with unlimited tracker capacity per day.

The design maintains consistency with the existing UI patterns while introducing a completely new timeline-based planning paradigm that eliminates the stacking limitations of traditional calendar views.

## Architecture

### Component Structure

```
CalendarTab (Enhanced)
├── Sub-tab Navigation
│   ├── Calendar Mode (existing functionality)
│   └── Project Planner Mode (new horizontal timeline)
├── Calendar Mode Components (existing)
│   ├── Compact Calendar
│   ├── Event Modal
│   └── Upcoming Events
└── Project Planner Mode Components (new)
    ├── TimelineHeader (navigation & view controls)
    ├── HorizontalTimeline (main timeline container)
    │   ├── TimelineGrid (date columns & grid lines)
    │   ├── TrackerLanes (horizontal tracker rows)
    │   ├── DragDropProvider (drag & drop context)
    │   └── TimelineScrollContainer (horizontal scroll management)
    ├── TimelineNavigation (draggable timeline controls)
    ├── ViewControls (weekly/monthly/daily zoom)
    ├── TrackerDetailsSidebar (updated for timeline)
    └── ProjectTrackerModal (existing)
```

### Timeline View System

**Default View**: Weekly (7 days visible)
**Navigation**: 
- Mouse drag to pan timeline horizontally
- Scroll wheel for quick navigation
- Keyboard shortcuts (arrow keys, home/end)
- Mini-map for long-term overview

**View Modes**:
- **Daily**: Single day, hourly granularity (future enhancement)
- **Weekly**: 7 days visible (default)
- **Monthly**: 30 days visible, compressed view
- **Quarterly**: 90 days visible, high-level overview

## Components and Interfaces

### 1. Enhanced CalendarTab Component

**New State**:
```typescript
interface CalendarTabState {
  // Existing state preserved
  currentDate: Date;
  selectedDate: Date;
  showEventModal: boolean;
  selectedEvent: CalendarEvent | null;
  
  // New timeline state
  currentMode: 'calendar' | 'planner';
  timelineView: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  timelineStartDate: Date; // Current timeline viewport start
  showTrackerModal: boolean;
  selectedTracker: ProjectTracker | null;
  draggedTracker: ProjectTracker | null;
  isDragging: boolean;
  trackers: ProjectTracker[];
  trackersLoading: boolean;
}
```

### 2. HorizontalTimeline Component

```typescript
interface HorizontalTimelineProps {
  startDate: Date;
  viewMode: 'weekly' | 'monthly' | 'quarterly';
  trackers: ProjectTracker[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onTrackerClick: (tracker: ProjectTracker) => void;
  onTrackerDrag: (tracker: ProjectTracker, newStartDate: Date, newEndDate: Date) => void;
  onTrackerResize: (tracker: ProjectTracker, newStartDate: Date, newEndDate: Date) => void;
  onTimelineScroll: (newStartDate: Date) => void;
  isDark: boolean;
  loading?: boolean;
}
```

**Key Features**:
- Horizontal scrolling timeline with smooth animations
- Drag-and-drop tracker movement with snap-to-grid
- Resize handles for adjusting tracker duration
- Unlimited tracker lanes (vertical scrolling for overflow)
- Real-time visual feedback during drag operations

### 3. TimelineGrid Component

```typescript
interface TimelineGridProps {
  startDate: Date;
  viewMode: 'weekly' | 'monthly' | 'quarterly';
  selectedDate: Date;
  onDateClick: (date: Date) => void;
  isDark: boolean;
}
```

**Grid Structure**:
- Date headers with day names and numbers
- Vertical grid lines for date boundaries
- Horizontal grid lines for tracker lanes
- Today indicator with distinct styling
- Weekend highlighting

### 4. TrackerLanes Component

```typescript
interface TrackerLanesProps {
  trackers: ProjectTracker[];
  startDate: Date;
  viewMode: 'weekly' | 'monthly' | 'quarterly';
  onTrackerClick: (tracker: ProjectTracker) => void;
  onTrackerDrag: (tracker: ProjectTracker, newDates: { start: Date; end: Date }) => void;
  onTrackerResize: (tracker: ProjectTracker, newDates: { start: Date; end: Date }) => void;
  selectedTracker?: ProjectTracker;
  isDark: boolean;
}
```

**Lane Management**:
- Automatic lane assignment to prevent overlaps
- Dynamic lane creation for new trackers
- Lane compaction when trackers are removed
- Visual lane separators and numbering

### 5. DragDropProvider Component

```typescript
interface DragDropContextProps {
  onTrackerMove: (trackerId: string, newStartDate: Date, newEndDate: Date) => void;
  onTrackerResize: (trackerId: string, newStartDate: Date, newEndDate: Date) => void;
  snapToGrid: boolean;
  gridSize: number; // in days
  children: React.ReactNode;
}
```

**Drag & Drop Features**:
- Smooth drag animations with visual feedback
- Snap-to-grid for precise date alignment
- Ghost tracker preview during drag
- Collision detection and lane switching
- Undo/redo support for drag operations

### 6. TimelineNavigation Component

```typescript
interface TimelineNavigationProps {
  currentStartDate: Date;
  viewMode: 'weekly' | 'monthly' | 'quarterly';
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onViewModeChange: (mode: 'weekly' | 'monthly' | 'quarterly') => void;
  onDateJump: (date: Date) => void;
  isDark: boolean;
}
```

**Navigation Controls**:
- Previous/Next buttons with keyboard shortcuts
- "Today" button to jump to current date
- Date picker for jumping to specific dates
- View mode toggle buttons
- Timeline minimap for long-range navigation

## Data Models

### Enhanced ProjectTracker Interface

```typescript
interface ProjectTracker {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description?: string;
  type: 'project' | 'feature' | 'bug';
  startDate: Date;
  endDate: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // New timeline-specific properties
  laneIndex?: number; // Auto-assigned lane for display
  color?: string; // Custom color override
  tags?: string[]; // Filterable tags
  
  linkedItems?: {
    taskIds?: string[];
    featureIds?: string[];
    bugIds?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Timeline Viewport State

```typescript
interface TimelineViewport {
  startDate: Date;
  endDate: Date;
  viewMode: 'weekly' | 'monthly' | 'quarterly';
  pixelsPerDay: number;
  visibleLanes: number;
  scrollPosition: { x: number; y: number };
}
```

## Visual Design Specifications

### Timeline Layout

**Weekly View (Default)**:
```
┌─────────────────────────────────────────────────────────────────┐
│ [<] Jan 15-21, 2024 [>] │ Weekly │ Monthly │ Quarterly │ [Today] │ ← Header
├─────────────────────────────────────────────────────────────────┤
│ Mon 15 │ Tue 16 │ Wed 17 │ Thu 18 │ Fri 19 │ Sat 20 │ Sun 21 │ ← Date Headers
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ Lane 1 │████████████████████████████████████████████████████│ ← Tracker Lanes
│ Lane 2 │        │████████████████████████│                  │
│ Lane 3 │                │████████████████████████████████████│
│ Lane 4 │                                                    │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

**Tracker Bar Design**:
- Height: 32px (increased from calendar view)
- Rounded corners: 6px
- Horizontal padding: 8px
- Minimum width: 40px (for single day)
- Resize handles: 4px width on left/right edges

### Drag & Drop Visual Feedback

**During Drag**:
- Original tracker: 50% opacity
- Ghost tracker: Full opacity with dashed border
- Drop zones: Highlighted background
- Invalid drop areas: Red tint

**Resize Operations**:
- Resize handles: Visible on hover
- Cursor changes: `col-resize` for horizontal resize
- Live preview: Real-time width adjustment
- Snap indicators: Vertical lines at valid drop points

### Color System

**Tracker Colors** (enhanced palette):
- **Projects**: Blue spectrum (`#3B82F6` to `#1E40AF`)
- **Features**: Green spectrum (`#10B981` to `#047857`)
- **Bugs**: Red spectrum (`#EF4444` to `#B91C1C`)
- **Custom**: User-selectable from 12-color palette

**Status Overlays**:
- Not Started: Diagonal stripes pattern
- In Progress: Solid color with pulse animation
- Completed: Checkmark overlay with reduced opacity

**Priority Indicators**:
- Critical: Red left border (4px)
- High: Orange left border (3px)
- Medium: No border
- Low: Gray left border (2px, dashed)

## Drag & Drop Implementation

### Drag Operations

1. **Tracker Movement**:
   - Click and drag tracker to new date range
   - Maintain tracker duration during move
   - Auto-assign to available lane
   - Update database on drop completion

2. **Tracker Resizing**:
   - Drag left edge to adjust start date
   - Drag right edge to adjust end date
   - Minimum duration: 1 day
   - Maximum duration: 365 days

3. **Lane Management**:
   - Automatic lane assignment to prevent overlaps
   - Lane switching during drag operations
   - Visual lane indicators during drag
   - Compact lanes after tracker removal

### Snap-to-Grid System

```typescript
interface SnapConfig {
  enabled: boolean;
  gridSize: number; // 1 = daily, 7 = weekly
  snapThreshold: number; // pixels
  visualFeedback: boolean;
}
```

**Snap Behavior**:
- Snap to day boundaries by default
- Visual snap indicators (vertical lines)
- Configurable snap sensitivity
- Keyboard modifier to disable snapping

## Performance Optimizations

### Rendering Optimizations

1. **Virtual Scrolling**: 
   - Render only visible timeline portion
   - Lazy load trackers outside viewport
   - Efficient lane management

2. **Drag Performance**:
   - RAF-based drag updates
   - Debounced database updates
   - Optimistic UI updates

3. **Memory Management**:
   - Tracker object pooling
   - Efficient date calculations
   - Memoized component renders

### Timeline Calculations

```typescript
interface TimelineCalculations {
  pixelsPerDay: number;
  visibleDateRange: { start: Date; end: Date };
  trackerPositions: Map<string, { x: number; width: number; lane: number }>;
  laneAssignments: Map<number, string[]>;
}
```

## Accessibility Features

### Keyboard Navigation

- **Arrow Keys**: Navigate between trackers
- **Tab/Shift+Tab**: Focus management
- **Enter/Space**: Select/edit tracker
- **Delete**: Remove selected tracker
- **Ctrl+Z/Y**: Undo/redo operations

### Screen Reader Support

- ARIA labels for all interactive elements
- Live regions for drag feedback
- Semantic HTML structure
- High contrast mode support

## Error Handling

### Drag & Drop Errors

1. **Invalid Drop Zones**:
   - Visual feedback for invalid drops
   - Revert to original position
   - Error message display

2. **Concurrent Modifications**:
   - Optimistic updates with rollback
   - Conflict resolution dialogs
   - Real-time sync indicators

3. **Network Issues**:
   - Offline mode with local storage
   - Retry mechanisms for failed updates
   - Visual indicators for sync status

## Testing Strategy

### Drag & Drop Testing

1. **Unit Tests**:
   - Lane assignment algorithms
   - Date calculation utilities
   - Snap-to-grid logic
   - Collision detection

2. **Integration Tests**:
   - End-to-end drag operations
   - Database update workflows
   - Real-time synchronization
   - Undo/redo functionality

3. **Visual Tests**:
   - Timeline rendering accuracy
   - Drag feedback animations
   - Responsive behavior
   - Cross-browser compatibility

### Performance Testing

1. **Load Testing**:
   - 1000+ trackers rendering
   - Smooth drag performance
   - Memory usage monitoring
   - Timeline scroll performance

2. **Stress Testing**:
   - Rapid drag operations
   - Concurrent user modifications
   - Network interruption recovery
   - Browser resource limits

## Implementation Phases

### Phase 1: Core Timeline Infrastructure
- Horizontal timeline grid component
- Basic tracker rendering
- Timeline navigation controls
- View mode switching

### Phase 2: Drag & Drop System
- Drag and drop provider setup
- Tracker movement functionality
- Resize handle implementation
- Snap-to-grid system

### Phase 3: Lane Management
- Automatic lane assignment
- Lane switching during drag
- Visual lane indicators
- Lane compaction algorithms

### Phase 4: Enhanced Features
- Timeline minimap
- Keyboard navigation
- Undo/redo system
- Performance optimizations

### Phase 5: Integration & Polish
- Database integration
- Real-time synchronization
- Error handling
- Comprehensive testing

## Security Considerations

All security measures from the original design remain in place:
- Row Level Security (RLS) for project trackers
- User authentication and authorization
- Input validation and sanitization
- Rate limiting for drag operations

## Migration Strategy

### Backward Compatibility

- Existing calendar mode remains unchanged
- Project trackers created in old system work in new timeline
- Gradual migration of user preferences
- Fallback to calendar view for unsupported browsers

### Data Migration

- No database schema changes required
- Lane assignments calculated dynamically
- Existing tracker data fully compatible
- Optional data cleanup for orphaned records