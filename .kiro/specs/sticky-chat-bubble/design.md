# Design Document

## Overview

The sticky chat bubble feature will replace the current mouse-position-based AI chat trigger with a persistent, clickable button positioned in the lower right corner of the application. This design maintains all existing AI chat functionality while providing a more intuitive and accessible user interface.

The implementation will involve creating a new `ChatBubble` component that integrates with the existing AI chat modal system, removing the mouse position detection logic, and ensuring proper positioning and theming across all application contexts.

## Architecture

### Component Hierarchy
```
App.tsx
├── Sidebar
├── ProjectWorkspace (or WelcomeScreen)
│   ├── [Existing tab content]
│   └── [Existing AI Chat Modal] (modified)
└── ChatBubble (new component) - positioned at app level
```

### Integration Points
1. **App.tsx**: Mount point for the ChatBubble component
2. **ProjectWorkspace.tsx**: Remove mouse position logic, modify AI chat trigger system
3. **ChatBubble.tsx**: New component handling bubble display and click events
4. **ThemeContext**: Integration for consistent dark/light mode theming

## Components and Interfaces

### ChatBubble Component

**Location**: `src/components/ChatBubble.tsx`

**Props Interface**:
```typescript
interface ChatBubbleProps {
  onClick: () => void;
  isAiChatOpen: boolean;
  className?: string;
}
```

**Key Features**:
- Fixed positioning in lower right corner
- Responsive design with appropriate margins
- Hover animations and visual feedback
- Theme-aware styling (dark/light mode)
- Accessibility features (ARIA labels, keyboard navigation)
- Z-index management for proper layering

**Visual Design**:
- Circular button with AI/chat icon (MessageCircle from Lucide)
- Gradient background matching application theme
- Subtle shadow and hover effects
- Size: 56px diameter (large enough for easy clicking)
- Position: 24px from bottom and right edges

### Modified ProjectWorkspace Component

**Changes Required**:
1. Remove mouse position tracking logic (`mouseY`, `setMouseY`, `handleMouseMove`)
2. Remove window height tracking for AI chat positioning
3. Modify `shouldShowAiChat` logic to only depend on `forceShowAiChat` state
4. Add new prop/callback system for external chat bubble trigger
5. Maintain keyboard shortcut functionality (Ctrl/Cmd+0)

**New Props Interface**:
```typescript
interface ProjectWorkspaceProps {
  project: Project;
  onAiChatStateChange?: (isOpen: boolean) => void; // New callback
  forceShowAiChat?: boolean; // New external control
  onForceShowAiChatChange?: (show: boolean) => void; // New callback
}
```

### App Component Integration

**State Management**:
```typescript
const [aiChatOpen, setAiChatOpen] = useState(false);
const [forceShowAiChat, setForceShowAiChat] = useState(false);
```

**Event Handling**:
- ChatBubble click triggers `setForceShowAiChat(true)`
- ProjectWorkspace reports state changes via callback
- Proper cleanup when switching between projects

## Data Models

### Chat State Management
```typescript
interface ChatState {
  isOpen: boolean;
  isForced: boolean; // Triggered by bubble vs keyboard shortcut
  lastTriggerSource: 'bubble' | 'keyboard' | 'mouse'; // For analytics
}
```

### Theme Integration
```typescript
interface ChatBubbleTheme {
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
  hoverBackgroundColor: string;
  shadowColor: string;
}
```

## Error Handling

### Component Error Boundaries
- ChatBubble component wrapped in error boundary to prevent app crashes
- Graceful fallback if positioning calculations fail
- Console warnings for development debugging

### State Synchronization
- Prevent race conditions between bubble clicks and keyboard shortcuts
- Handle rapid successive clicks gracefully
- Ensure consistent state between App and ProjectWorkspace components

### Responsive Design Failures
- Fallback positioning if viewport calculations fail
- Minimum size constraints to maintain usability
- Hide bubble on very small screens if necessary (< 480px width)

## Testing Strategy

### Unit Tests
**ChatBubble Component**:
- Renders correctly with different props
- Handles click events properly
- Applies correct theme styles
- Maintains accessibility attributes

**ProjectWorkspace Integration**:
- AI chat opens when triggered externally
- Mouse position logic is completely removed
- Keyboard shortcuts still function
- State callbacks work correctly

### Integration Tests
**Full User Flow**:
- Click bubble → AI chat opens → input focuses
- Keyboard shortcut → AI chat opens → bubble state updates
- Theme switching → bubble updates appearance
- Project switching → bubble remains functional

### Visual Regression Tests
- Bubble positioning across different screen sizes
- Theme consistency in dark/light modes
- Hover states and animations
- Z-index layering with modals and overlays

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation support
- Focus management
- Color contrast compliance

## Implementation Phases

### Phase 1: Core Component Creation
1. Create ChatBubble component with basic styling
2. Implement positioning and theme integration
3. Add hover effects and animations
4. Ensure accessibility compliance

### Phase 2: Integration with Existing System
1. Modify App.tsx to include ChatBubble
2. Update ProjectWorkspace to accept external triggers
3. Remove mouse position detection logic
4. Implement state synchronization

### Phase 3: Polish and Optimization
1. Fine-tune animations and transitions
2. Optimize for different screen sizes
3. Add comprehensive error handling
4. Performance optimization for re-renders

### Phase 4: Testing and Validation
1. Comprehensive unit and integration testing
2. Cross-browser compatibility testing
3. Accessibility audit and fixes
4. User acceptance testing

## Technical Considerations

### Performance
- Minimize re-renders by using React.memo for ChatBubble
- Optimize positioning calculations
- Use CSS transforms for animations (GPU acceleration)
- Debounce rapid click events

### Browser Compatibility
- CSS `position: fixed` support (universal)
- CSS transforms and transitions (IE10+)
- Event handling compatibility
- Touch device support for mobile

### Accessibility
- ARIA labels for screen readers
- Keyboard navigation support (Tab, Enter, Space)
- High contrast mode compatibility
- Focus indicators

### Mobile Considerations
- Touch-friendly size (minimum 44px touch target)
- Appropriate positioning on mobile viewports
- Gesture conflict avoidance
- Performance on lower-end devices

## Migration Strategy

### Backward Compatibility
- Maintain all existing AI chat functionality
- Preserve keyboard shortcuts
- Keep existing API interfaces unchanged
- Gradual rollout capability

### Feature Flags
```typescript
const FEATURES = {
  STICKY_CHAT_BUBBLE: true, // Enable new bubble
  MOUSE_POSITION_TRIGGER: false, // Disable old system
};
```

### Rollback Plan
- Feature flag to quickly disable bubble
- Restore mouse position logic if needed
- Database/localStorage cleanup if required
- User communication strategy