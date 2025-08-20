# Mermaid Diagram Support Implementation Plan

## Overview
This document outlines the comprehensive plan to implement full Mermaid diagram support in our RefBase webapp's markdown editor and preview system.

## Current State Analysis
- **Markdown Parser**: Using `markdown-to-jsx` for performance
- **Syntax Highlighting**: `react-syntax-highlighter` with `oneDark`/`oneLight` themes
- **Code Block Handling**: Custom `PreBlock` and `CodeBlock` components
- **Theme Support**: Dark/Light mode switching
- **Copy Functionality**: Working copy buttons for all code blocks

## Implementation Plan

### Phase 1: Dependencies & Setup
- [ ] **1.1** Install Mermaid packages
  - `npm install mermaid @types/mermaid`
  - Research latest stable version and React integration best practices
  
- [ ] **1.2** Research Mermaid React integration options
  - Evaluate `@mermaid-js/mermaid` vs direct `mermaid` usage
  - Check for React-specific Mermaid components
  - Investigate performance implications

### Phase 2: Core Mermaid Component
- [ ] **2.1** Create `MermaidDiagram.tsx` component in `src/components/ui/`
  - Props: `code: string`, `isDark: boolean`, `id?: string`
  - Handle diagram rendering with unique IDs to prevent conflicts
  - Implement error boundaries for invalid diagram syntax
  
- [ ] **2.2** Configure Mermaid initialization
  - Setup theme switching (dark/light mode support)
  - Configure security settings (disable script execution)
  - Set default styling to match our app's design
  
- [ ] **2.3** Handle diagram lifecycle
  - Initialize Mermaid on component mount
  - Clean up diagrams on unmount
  - Re-render on theme changes
  - Handle resize events for responsive diagrams

### Phase 3: Integration with EnhancedEditor
- [ ] **3.1** Detect Mermaid code blocks
  - Modify `PreBlock` component to detect `language-mermaid`
  - Add special handling path for Mermaid vs regular code blocks
  
- [ ] **3.2** Implement Mermaid rendering logic
  - Replace syntax highlighting with Mermaid diagram for `mermaid` language
  - Maintain copy functionality for Mermaid code
  - Handle loading states and error states
  
- [ ] **3.3** Theme integration
  - Ensure Mermaid diagrams respect dark/light theme
  - Match colors with our existing color scheme
  - Handle theme switching without breaking diagrams

### Phase 4: Enhanced Features
- [ ] **4.1** Copy functionality enhancement
  - Copy raw Mermaid code (current behavior)
  - Option to copy diagram as SVG/PNG (advanced feature)
  
- [ ] **4.2** Error handling & validation
  - Show helpful error messages for invalid Mermaid syntax
  - Fallback to code block display on rendering failures
  - Add syntax validation hints
  
- [ ] **4.3** Performance optimization
  - Lazy load Mermaid library
  - Debounce diagram re-rendering
  - Memory leak prevention for frequent updates

### Phase 5: Language Selector Updates
- [ ] **5.1** Add Mermaid to supported languages
  - Update `supportedLanguages` array in `EnhancedEditor.tsx`
  - Add appropriate file extensions (`.mmd`, `.mermaid`)
  
- [ ] **5.2** Auto-detection enhancement
  - Detect Mermaid files by extension
  - Detect Mermaid content by syntax patterns

### Phase 6: Testing & Validation
- [ ] **6.1** Create test Mermaid diagrams
  - Flowcharts, sequence diagrams, class diagrams
  - Gantt charts, pie charts, state diagrams
  - Test complex diagrams with various themes
  
- [ ] **6.2** Cross-browser testing
  - Chrome, Firefox, Safari, Edge
  - Mobile responsiveness
  - Performance testing with large diagrams
  
- [ ] **6.3** Integration testing
  - Split view synchronization with Mermaid diagrams
  - Copy functionality
  - Theme switching
  - File format detection

## Technical Specifications

### Component Structure
```
src/components/ui/
├── EnhancedEditor.tsx (modified)
└── MermaidDiagram.tsx (new)
```

### Required Modifications

#### EnhancedEditor.tsx Changes
1. **Import MermaidDiagram component**
2. **Modify PreBlock component**:
   ```typescript
   if (codeLanguage === 'mermaid') {
     return <MermaidDiagram code={codeContent} isDark={isDark} />;
   }
   ```
3. **Update supportedLanguages array**:
   ```typescript
   { id: 'mermaid', label: 'Mermaid', extension: '.mmd', extensions: ['.mmd', '.mermaid'] }
   ```

#### MermaidDiagram.tsx Structure
```typescript
interface MermaidDiagramProps {
  code: string;
  isDark: boolean;
  id?: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, isDark, id }) => {
  // Implementation details
};
```

### Mermaid Configuration
```typescript
mermaid.initialize({
  startOnLoad: false,
  theme: isDark ? 'dark' : 'default',
  securityLevel: 'strict',
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas',
  // Additional theme customizations
});
```

## Supported Diagram Types
- [x] Flowchart
- [x] Sequence Diagram  
- [x] Class Diagram
- [x] State Diagram
- [x] Entity Relationship Diagram
- [x] User Journey
- [x] Gantt Chart
- [x] Pie Chart
- [x] Git Graph

## Security Considerations
- **Disable script execution** in Mermaid diagrams
- **Sanitize input** to prevent XSS attacks
- **Limit diagram complexity** to prevent performance issues
- **Validate syntax** before rendering

## Performance Considerations
- **Lazy loading** of Mermaid library (reduces initial bundle size)
- **Diagram caching** for unchanged content
- **Debounced re-rendering** during live editing
- **Memory management** for diagram cleanup

## Accessibility
- **Alt text** for generated SVG diagrams
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** mode support

## Rollback Plan
- Keep original code block rendering as fallback
- Feature flag for enabling/disabling Mermaid support
- Error boundaries to prevent app crashes
- Graceful degradation to syntax-highlighted code blocks

## Dependencies Impact
- **Bundle size increase**: ~200KB (estimated)
- **Performance impact**: Minimal (lazy loaded)
- **Security impact**: Low (strict security settings)
- **Maintenance impact**: Medium (additional component to maintain)

## Success Criteria
1. ✅ All Mermaid diagram types render correctly
2. ✅ Dark/Light theme switching works seamlessly  
3. ✅ Copy functionality works for Mermaid code
4. ✅ Performance remains acceptable (< 100ms render time)
5. ✅ No memory leaks or crashes
6. ✅ Mobile responsive design
7. ✅ Accessibility compliance
8. ✅ Error handling for invalid syntax

## Timeline Estimate
- **Phase 1-2**: 2-3 hours (Setup & Core Component)
- **Phase 3**: 2-3 hours (Integration)  
- **Phase 4-5**: 2-3 hours (Enhanced Features)
- **Phase 6**: 1-2 hours (Testing)
- **Total**: 7-11 hours

## Review Section
*To be completed after implementation*

### Changes Made
*Document all code changes, new files, and modifications*

### Issues Encountered  
*Document any problems and their solutions*

### Performance Impact
*Measure and document performance changes*

### Testing Results
*Document test results and validation*