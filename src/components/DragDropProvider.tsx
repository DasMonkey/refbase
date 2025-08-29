import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { ProjectTracker } from '../types';
import { TimelineViewMode } from './TimelineGrid';
import { useTheme } from '../contexts/ThemeContext';
import {
  DragState,
  DragConfig,
  DEFAULT_DRAG_CONFIG,
  createInitialDragState,
  startDrag,
  endDrag,
  handleDragMove,
  handleDragEnd,
  getDragCursor,
  getGhostTrackerStyles,
  getDragPreviewStyles
} from '../lib/dragAndDrop';
import { 
  ResizeFeedback, 
  ResizePreviewOverlay 
} from './ResizeFeedback';
import { 
  calculateResizePreview,
  DEFAULT_RESIZE_CONSTRAINTS 
} from '../lib/resizeUtils';

// Drag and Drop Context
interface DragDropContextValue {
  dragState: DragState;
  config: DragConfig;
  startTrackerDrag: (
    tracker: ProjectTracker,
    dragType: 'move' | 'resize-start' | 'resize-end',
    startPosition: { x: number; y: number },
    currentLane: number
  ) => void;
  updateDragConfig: (newConfig: Partial<DragConfig>) => void;
}

const DragDropContext = createContext<DragDropContextValue | null>(null);

// Drag state reducer
type DragAction = 
  | { type: 'START_DRAG'; payload: ReturnType<typeof startDrag> }
  | { type: 'UPDATE_DRAG'; payload: Partial<DragState> }
  | { type: 'END_DRAG' }
  | { type: 'CANCEL_DRAG' };

const dragReducer = (state: DragState, action: DragAction): DragState => {
  switch (action.type) {
    case 'START_DRAG':
      return { ...state, ...action.payload };
    case 'UPDATE_DRAG':
      return { ...state, ...action.payload };
    case 'END_DRAG':
      return { ...state, ...endDrag() };
    case 'CANCEL_DRAG':
      return createInitialDragState();
    default:
      return state;
  }
};

// Props for DragDropProvider
interface DragDropProviderProps {
  children: React.ReactNode;
  viewportStartDate: Date;
  pixelsPerDay: number;
  viewMode: TimelineViewMode;
  laneHeight: number;
  allTrackers: ProjectTracker[];
  laneAssignments: Map<string, number>;
  onTrackerMove?: (tracker: ProjectTracker, newStartDate: Date, newEndDate: Date, newLane: number) => void;
  onTrackerResize?: (tracker: ProjectTracker, newStartDate: Date, newEndDate: Date) => void;
  config?: Partial<DragConfig>;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  viewportStartDate,
  pixelsPerDay,
  viewMode,
  laneHeight,
  allTrackers,
  laneAssignments,
  onTrackerMove,
  onTrackerResize,
  config: configOverrides = {}
}) => {
  const { isDark } = useTheme();
  const [dragState, dispatch] = useReducer(dragReducer, createInitialDragState());
  const [config, setConfig] = React.useState<DragConfig>({ ...DEFAULT_DRAG_CONFIG, ...configOverrides });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update config when overrides change
  useEffect(() => {
    setConfig(current => ({ ...current, ...configOverrides }));
  }, [configOverrides]);

  // Start drag operation
  const startTrackerDrag = useCallback((
    tracker: ProjectTracker,
    dragType: 'move' | 'resize-start' | 'resize-end',
    startPosition: { x: number; y: number },
    currentLane: number
  ) => {
    const dragPayload = startDrag(tracker, dragType, startPosition, currentLane);
    dispatch({ type: 'START_DRAG', payload: dragPayload });
    
    // Set cursor style
    document.body.style.cursor = getDragCursor(dragType);
  }, []);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event: MouseEvent) => {
    // Always update mouse position for resize feedback
    setMousePosition({ x: event.clientX, y: event.clientY });
    
    if (!dragState.isDragging) return;

    const updatePayload = handleDragMove(
      event,
      dragState,
      config,
      viewportStartDate,
      pixelsPerDay,
      viewMode,
      laneHeight
    );

    dispatch({ type: 'UPDATE_DRAG', payload: updatePayload });
  }, [dragState, config, viewportStartDate, pixelsPerDay, viewMode, laneHeight]);

  // Handle mouse up (end drag)
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging) return;

    const result = handleDragEnd(dragState);
    
    if (result) {
      const { tracker, newDates, newLane } = result;
      
      // Determine if this is a move or resize operation
      if (dragState.dragType === 'move') {
        onTrackerMove?.(tracker, newDates.start, newDates.end, newLane);
      } else {
        onTrackerResize?.(tracker, newDates.start, newDates.end);
      }
    }

    // Reset cursor and end drag
    document.body.style.cursor = '';
    dispatch({ type: 'END_DRAG' });
  }, [dragState, onTrackerMove, onTrackerResize]);

  // Handle escape key to cancel drag
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && dragState.isDragging) {
      document.body.style.cursor = '';
      dispatch({ type: 'CANCEL_DRAG' });
    }
  }, [dragState.isDragging]);

  // Set up global event listeners during drag
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, handleKeyDown]);

  // Update config function
  const updateDragConfig = useCallback((newConfig: Partial<DragConfig>) => {
    setConfig(current => ({ ...current, ...newConfig }));
  }, []);

  // Context value
  const contextValue: DragDropContextValue = {
    dragState,
    config,
    startTrackerDrag,
    updateDragConfig
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      <div ref={containerRef} className="relative">
        {children}
        
        {/* Ghost tracker preview during drag */}
        {dragState.isDragging && 
         dragState.previewDates && 
         dragState.targetLane !== null && 
         config.showPreview && (
          <div
            className="pointer-events-none"
            style={getGhostTrackerStyles(
              dragState.previewDates,
              viewportStartDate,
              pixelsPerDay,
              dragState.targetLane,
              laneHeight,
              dragState.isValidDrop,
              isDark
            )}
          >
            <div className="flex items-center justify-center h-full text-xs font-medium">
              {dragState.isValidDrop ? '✓' : '✗'}
            </div>
          </div>
        )}

        {/* Resize Preview Overlay */}
        {dragState.isDragging && 
         dragState.dragType && 
         (dragState.dragType === 'resize-start' || dragState.dragType === 'resize-end') &&
         dragState.originalDates && 
         dragState.previewDates && 
         dragState.targetLane !== null && (
          <ResizePreviewOverlay
            isVisible={true}
            previewDates={dragState.previewDates}
            originalDates={dragState.originalDates}
            viewportStartDate={viewportStartDate}
            pixelsPerDay={pixelsPerDay}
            laneIndex={dragState.targetLane}
            laneHeight={laneHeight}
            isValid={dragState.isValidDrop}
          />
        )}

        {/* Resize Feedback Tooltip */}
        {dragState.isDragging && 
         dragState.draggedTracker &&
         dragState.dragType && 
         (dragState.dragType === 'resize-start' || dragState.dragType === 'resize-end') && (
          <ResizeFeedback
            isVisible={true}
            resizeResult={dragState.previewDates ? calculateResizePreview(
              dragState.draggedTracker,
              dragState.dragType === 'resize-start' ? 'start' : 'end',
              mousePosition.x - viewportStartDate.getTime() / (1000 * 60 * 60 * 24) * pixelsPerDay,
              viewportStartDate,
              pixelsPerDay,
              DEFAULT_RESIZE_CONSTRAINTS,
              viewMode
            ) : null}
            position={mousePosition}
            resizeType={dragState.dragType === 'resize-start' ? 'start' : 'end'}
          />
        )}
        
        {/* Drag overlay for visual feedback */}
        {dragState.isDragging && (
          <div 
            className="fixed inset-0 pointer-events-none z-50"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(1px)'
            }}
          />
        )}
      </div>
    </DragDropContext.Provider>
  );
};

// Hook to use drag and drop context
export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

// Hook for making elements draggable
export const useDraggableTracker = (
  tracker: ProjectTracker,
  currentLane: number,
  onDragStart?: (tracker: ProjectTracker) => void
) => {
  const { startTrackerDrag, dragState } = useDragDrop();
  
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Determine drag type based on mouse position
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const resizeHandleWidth = 8;
    
    let dragType: 'move' | 'resize-start' | 'resize-end' = 'move';
    
    if (relativeX <= resizeHandleWidth) {
      dragType = 'resize-start';
    } else if (relativeX >= rect.width - resizeHandleWidth) {
      dragType = 'resize-end';
    }
    
    // Start drag operation
    startTrackerDrag(
      tracker,
      dragType,
      { x: event.clientX, y: event.clientY },
      currentLane
    );
    
    onDragStart?.(tracker);
  }, [tracker, currentLane, startTrackerDrag, onDragStart]);

  const isDragging = dragState.isDragging && dragState.draggedTracker?.id === tracker.id;
  
  const { isDark: useDarkTheme } = useTheme();
  
  return {
    handleMouseDown,
    isDragging,
    dragType: dragState.dragType,
    isValidDrop: dragState.isValidDrop,
    previewStyles: getDragPreviewStyles(isDragging, dragState.isValidDrop, useDarkTheme)
  };
};