# Design Document

## Overview

The kanban board redesign transforms the current full-width card layout into a compact, post-it note inspired interface. The design maintains all existing drag-and-drop functionality while improving visual aesthetics, text editing capabilities, and space utilization.

## Architecture

### Component Structure
The redesign builds upon the existing TasksTab component architecture:
- `TasksTab` - Main container component
- `Column` - Individual kanban columns 
- `TaskCard` - Individual task cards (major redesign focus)
- `AddCard` - Add new task functionality
- `DropIndicator` - Drag and drop visual feedback

### Design Principles
1. **Post-it Note Aesthetics** - Square cards with yellow/cream backgrounds and sharp corners
2. **Compact Layout** - Fixed card widths to show more content in viewport
3. **Enhanced Editability** - Inline editing with dedicated edit buttons
4. **Maintained Functionality** - Preserve all existing drag-and-drop and CRUD operations

## Components and Interfaces

### TaskCard Component Redesign

#### Visual Design Changes
```typescript
interface TaskCardStyles {
  width: string;           // Fixed width (e.g., "200px" or "12rem")
  aspectRatio: string;     // Near-square ratio (e.g., "4/3")
  backgroundColor: string; // Post-it yellow (#fef3c7 or similar)
  borderRadius: string;    // "0px" for sharp corners
  boxShadow: string;       // Subtle shadow for depth
  color: string;           // Dark text for contrast
}
```

#### Edit Mode Interface
```typescript
interface EditableTaskCard {
  isEditing: boolean;
  onEdit: () => void;
  onSave: (newText: string) => void;
  onCancel: () => void;
  editText: string;
  setEditText: (text: string) => void;
}
```

### Column Layout Updates

#### Column Sizing
- **Fixed column width**: 240px to accommodate new card size
- **Card spacing**: 12px vertical gap between cards
- **Column spacing**: 16px horizontal gap between columns

#### Responsive Behavior
- Horizontal scroll when columns exceed viewport width
- Maintain minimum column width on smaller screens
- Stack columns vertically on mobile (future enhancement)

## Data Models

### Task Model (No Changes)
The existing Task interface remains unchanged:
```typescript
interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'fix-later' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}
```

### Edit State Model
New local state for managing card editing:
```typescript
interface CardEditState {
  editingCardId: string | null;
  editingText: string;
  originalText: string;
}
```

## Error Handling

### Edit Mode Error Handling
1. **Save Failures**: Show error message, revert to original text
2. **Network Issues**: Queue changes locally, retry on reconnection
3. **Validation Errors**: Prevent saving empty tasks, show validation feedback
4. **Concurrent Edits**: Handle conflicts with optimistic updates

### Drag and Drop Error Handling
- Maintain existing error handling for drag operations
- Ensure edit mode is properly exited during drag operations
- Handle edge cases where cards are being edited during status changes

## Testing Strategy

### Visual Regression Testing
1. **Card Appearance**: Verify post-it note styling across different browsers
2. **Layout Consistency**: Test column and card spacing at various screen sizes
3. **Edit Mode UI**: Verify edit button placement and edit mode appearance

### Functional Testing
1. **Edit Functionality**: Test edit mode entry, text modification, save/cancel operations
2. **Drag and Drop**: Ensure existing drag functionality works with new card design
3. **Multi-line Text**: Verify cards properly expand for longer text content
4. **Responsive Behavior**: Test layout at different viewport sizes

### Integration Testing
1. **Supabase Sync**: Verify task updates properly sync with backend
2. **Real-time Updates**: Test that changes appear correctly for other users
3. **Performance**: Ensure redesign doesn't impact rendering performance

### User Experience Testing
1. **Edit Discoverability**: Verify users can easily find and use edit buttons
2. **Visual Clarity**: Confirm post-it note design improves readability
3. **Space Utilization**: Validate that more cards are visible in viewport

## Implementation Considerations

### CSS Framework Integration
- Utilize existing Tailwind CSS classes where possible
- Create custom CSS variables for post-it note colors
- Ensure dark mode compatibility (if applicable)

### Animation and Transitions
- Maintain existing Framer Motion animations for drag operations
- Add smooth transitions for edit mode entry/exit
- Preserve card layout animations during text expansion

### Accessibility
- Ensure edit buttons have proper ARIA labels
- Maintain keyboard navigation for edit functionality
- Preserve screen reader compatibility for card content

### Performance Optimization
- Minimize re-renders during edit mode
- Optimize card layout calculations
- Maintain efficient drag and drop performance