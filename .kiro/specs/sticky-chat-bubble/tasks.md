# Implementation Plan

- [x] 1. Create ChatBubble component with basic structure and styling



  - Create `src/components/ChatBubble.tsx` with TypeScript interface and basic JSX structure
  - Implement fixed positioning in lower right corner with proper CSS styling
  - Add MessageCircle icon from Lucide React with appropriate sizing
  - Implement basic click handler that accepts onClick prop
  - _Requirements: 1.1, 1.4, 4.1, 4.2_

- [x] 2. Implement theme-aware styling and hover effects


  - Integrate useTheme hook for dark/light mode support
  - Create dynamic styling that adapts to current theme state
  - Add hover animations using Framer Motion for smooth transitions
  - Implement proper color schemes for both dark and light themes
  - _Requirements: 4.1, 4.2_



- [ ] 3. Add responsive positioning and accessibility features
  - Implement responsive positioning logic for different screen sizes
  - Add ARIA labels and accessibility attributes for screen readers
  - Ensure proper keyboard navigation support (Tab, Enter, Space keys)


  - Add focus indicators and high contrast mode compatibility
  - _Requirements: 4.3, 5.3_

- [ ] 4. Integrate ChatBubble component into App.tsx
  - Add ChatBubble component to App.tsx at the root level for global visibility


  - Create state management for AI chat open/closed status
  - Implement click handler that will trigger AI chat modal
  - Ensure proper z-index layering so bubble appears above all content
  - _Requirements: 1.1, 1.2, 5.1, 5.2_



- [ ] 5. Modify ProjectWorkspace to accept external AI chat triggers
  - Add new props interface to ProjectWorkspace for external chat control
  - Create callback system to communicate AI chat state changes back to App
  - Implement forceShowAiChat prop handling alongside existing keyboard shortcut logic
  - Maintain existing keyboard shortcut functionality (Ctrl/Cmd+0)

  - _Requirements: 2.1, 2.2, 3.3_

- [ ] 6. Remove mouse position detection logic from ProjectWorkspace
  - Remove mouseY state, setMouseY, and handleMouseMove event listeners
  - Remove window height tracking logic used for mouse position calculations
  - Simplify shouldShowAiChat logic to only depend on forceShowAiChat and keyboard shortcuts


  - Clean up useEffect dependencies and event listener cleanup
  - _Requirements: 3.1, 3.2_

- [ ] 7. Implement state synchronization between App and ProjectWorkspace
  - Create proper state flow from ChatBubble click to AI chat modal opening


  - Ensure AI chat modal focus behavior works when triggered by bubble
  - Handle state updates when AI chat is closed (Escape key, click outside)
  - Implement proper cleanup when switching between projects
  - _Requirements: 2.1, 2.2, 2.3, 5.2_



- [ ] 8. Add visual feedback for active chat state
  - Modify ChatBubble appearance when AI chat modal is open
  - Implement subtle animation or color change to indicate active state
  - Ensure bubble remains visible and functional when chat modal is open
  - Add smooth transitions between active and inactive states
  - _Requirements: 2.3, 4.2_

- [ ] 9. Implement error handling and edge cases
  - Add error boundary around ChatBubble component to prevent app crashes
  - Handle rapid successive clicks with debouncing logic
  - Implement fallback positioning if viewport calculations fail
  - Add console warnings for development debugging
  - _Requirements: 4.3, 5.4_

- [ ] 10. Create comprehensive unit tests for ChatBubble component
  - Write tests for component rendering with different props
  - Test click event handling and callback execution
  - Verify theme integration and style application
  - Test accessibility attributes and keyboard navigation
  - _Requirements: 1.1, 1.4, 4.1, 4.2_

- [x] 11. Create integration tests for full user flow


  - Test complete flow from bubble click to AI chat modal opening
  - Verify keyboard shortcut functionality still works alongside bubble
  - Test theme switching updates bubble appearance correctly
  - Verify project switching maintains bubble functionality
  - _Requirements: 2.1, 2.2, 3.3, 5.1, 5.2_

- [x] 12. Optimize performance and finalize implementation



  - Implement React.memo for ChatBubble to minimize re-renders
  - Optimize positioning calculations and animation performance
  - Add proper TypeScript types for all new interfaces
  - Ensure proper cleanup of event listeners and state
  - _Requirements: 4.3, 5.4_