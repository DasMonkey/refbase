# Design Document

## Overview

This design document outlines the implementation of comprehensive Mermaid diagram support in RefBase's EnhancedEditor component. The solution integrates seamlessly with the existing markdown rendering pipeline while maintaining performance, security, and accessibility standards.

The implementation leverages the existing code block handling infrastructure in the EnhancedEditor, extending the `PreBlock` component to detect and render Mermaid diagrams instead of syntax-highlighted code when the language is set to "mermaid".

## Architecture

### High-Level Architecture

```
EnhancedEditor
├── Existing Components
│   ├── Markdown Parser (markdown-to-jsx)
│   ├── SyntaxHighlighter (react-syntax-highlighter)
│   └── PreBlock Component (handles code blocks)
└── New Components
    ├── MermaidDiagram Component (renders diagrams)
    ├── MermaidProvider Context (manages initialization)
    └── Enhanced PreBlock (detects mermaid language)
```

### Integration Points

1. **Language Detection**: Extend `supportedLanguages` array to include Mermaid
2. **Code Block Processing**: Modify `PreBlock` component to route Mermaid content to new renderer
3. **Theme Integration**: Connect Mermaid theme system to existing dark/light mode
4. **Copy Functionality**: Extend existing `CopyButton` to work with Mermaid diagrams

## Components and Interfaces

### MermaidDiagram Component

```typescript
interface MermaidDiagramProps {
  code: string;
  isDark: boolean;
  id?: string;
  onError?: (error: Error) => void;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  code,
  isDark,
  id,
  onError
}) => {
  // Component implementation
};
```

**Responsibilities:**
- Render Mermaid diagrams from code strings
- Handle theme switching dynamically
- Manage diagram lifecycle (mount/unmount/update)
- Provide error boundaries for invalid syntax
- Generate unique IDs to prevent conflicts

### MermaidProvider Context

```typescript
interface MermaidContextType {
  isInitialized: boolean;
  initializeMermaid: (theme: 'dark' | 'light') => Promise<void>;
  updateTheme: (theme: 'dark' | 'light') => void;
}

const MermaidProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Context implementation
};
```

**Responsibilities:**
- Lazy load Mermaid library
- Manage global Mermaid configuration
- Handle theme updates across all diagrams
- Provide initialization status to components

### Enhanced PreBlock Component

The existing `PreBlock` component will be modified to detect Mermaid language and route to the appropriate renderer:

```typescript
const PreBlock = ({ children, className, ...props }: any) => {
  // Extract language and content (existing logic)
  const codeLanguage = extractLanguage(children);
  const codeContent = extractTextContent(children);
  
  // New: Route to Mermaid renderer
  if (codeLanguage === 'mermaid') {
    return (
      <div className="my-4 relative">
        <CopyButton code={codeContent.trim()} isDark={isDark} />
        <MermaidDiagram 
          code={codeContent.trim()} 
          isDark={isDark}
          onError={(error) => {
            // Fallback to syntax highlighting on error
            console.warn('Mermaid rendering failed:', error);
          }}
        />
      </div>
    );
  }
  
  // Existing syntax highlighting logic
  return (
    <div className="my-4 relative">
      <CopyButton code={codeContent.trim()} isDark={isDark} />
      <SyntaxHighlighter>
        {codeContent.trim()}
      </SyntaxHighlighter>
    </div>
  );
};
```

## Data Models

### Mermaid Configuration

```typescript
interface MermaidConfig {
  startOnLoad: boolean;
  theme: 'dark' | 'default' | 'neutral';
  securityLevel: 'strict' | 'loose' | 'antiscript';
  fontFamily: string;
  fontSize: number;
  flowchart: {
    useMaxWidth: boolean;
    htmlLabels: boolean;
  };
  sequence: {
    useMaxWidth: boolean;
    wrap: boolean;
  };
  gantt: {
    useMaxWidth: boolean;
  };
}
```

### Error Handling Types

```typescript
interface MermaidError {
  type: 'syntax' | 'render' | 'security';
  message: string;
  code: string;
  line?: number;
}

interface MermaidRenderResult {
  success: boolean;
  svg?: string;
  error?: MermaidError;
}
```

## Error Handling

### Error Boundary Strategy

1. **Syntax Errors**: Display error message with fallback to syntax-highlighted code
2. **Render Errors**: Show generic error message with fallback option
3. **Security Errors**: Display security warning and prevent rendering
4. **Network Errors**: Handle lazy loading failures gracefully

### Error UI Components

```typescript
const MermaidErrorFallback: React.FC<{
  error: MermaidError;
  code: string;
  isDark: boolean;
  onRetry?: () => void;
}> = ({ error, code, isDark, onRetry }) => {
  return (
    <div className={`border rounded-lg p-4 ${isDark ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center space-x-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>
          Diagram Error
        </span>
      </div>
      <p className={`text-xs mb-3 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
        {error.message}
      </p>
      <div className="flex space-x-2">
        {onRetry && (
          <button 
            onClick={onRetry}
            className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-700'}`}
          >
            Retry
          </button>
        )}
        <button className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
          Show Code
        </button>
      </div>
    </div>
  );
};
```

## Testing Strategy

### Unit Tests

1. **MermaidDiagram Component**
   - Renders valid diagrams correctly
   - Handles theme switching
   - Manages error states appropriately
   - Cleans up resources on unmount

2. **MermaidProvider Context**
   - Initializes Mermaid library correctly
   - Handles theme updates
   - Manages loading states

3. **PreBlock Integration**
   - Detects Mermaid language correctly
   - Routes to appropriate renderer
   - Maintains existing functionality for other languages

### Integration Tests

1. **End-to-End Rendering**
   - Test all supported diagram types
   - Verify theme consistency
   - Test error handling flows

2. **Performance Tests**
   - Measure lazy loading impact
   - Test with multiple diagrams
   - Verify memory cleanup

3. **Accessibility Tests**
   - Screen reader compatibility
   - Keyboard navigation
   - High contrast mode support

### Test Data

```typescript
const testDiagrams = {
  flowchart: `
    graph TD
      A[Start] --> B{Decision}
      B -->|Yes| C[Action 1]
      B -->|No| D[Action 2]
  `,
  sequence: `
    sequenceDiagram
      participant A as Alice
      participant B as Bob
      A->>B: Hello Bob!
      B-->>A: Hello Alice!
  `,
  classDiagram: `
    classDiagram
      class Animal {
        +String name
        +makeSound()
      }
      class Dog {
        +bark()
      }
      Animal <|-- Dog
  `,
  invalidSyntax: `
    graph TD
      A[Start] --> B{Decision
      // Missing closing bracket
  `
};
```

## Implementation Plan

### Phase 1: Core Infrastructure (2-3 hours)

1. **Install Dependencies**
   ```bash
   npm install mermaid @types/mermaid
   ```

2. **Create MermaidProvider Context**
   - Implement lazy loading logic
   - Set up theme management
   - Handle initialization states

3. **Create MermaidDiagram Component**
   - Basic rendering functionality
   - Error boundary implementation
   - Theme integration

### Phase 2: Editor Integration (2-3 hours)

1. **Update supportedLanguages Array**
   ```typescript
   { 
     id: 'mermaid', 
     label: 'Mermaid', 
     extension: '.mmd', 
     extensions: ['.mmd', '.mermaid'] 
   }
   ```

2. **Modify PreBlock Component**
   - Add Mermaid detection logic
   - Implement routing to MermaidDiagram
   - Maintain backward compatibility

3. **Update EnhancedEditor**
   - Wrap with MermaidProvider
   - Handle language detection for .mmd files

### Phase 3: Enhanced Features (2-3 hours)

1. **Advanced Error Handling**
   - Implement comprehensive error UI
   - Add retry mechanisms
   - Create fallback strategies

2. **Performance Optimization**
   - Implement diagram caching
   - Add debounced re-rendering
   - Optimize memory usage

3. **Copy Functionality Enhancement**
   - Extend existing CopyButton
   - Add SVG export option (future)
   - Maintain consistent UX

### Phase 4: Testing & Polish (1-2 hours)

1. **Comprehensive Testing**
   - Unit tests for all components
   - Integration tests with editor
   - Cross-browser compatibility

2. **Documentation Updates**
   - Update component documentation
   - Add usage examples
   - Create troubleshooting guide

## Security Considerations

### Mermaid Security Configuration

```typescript
const secureConfig: MermaidConfig = {
  securityLevel: 'strict',
  startOnLoad: false,
  maxTextSize: 50000,
  maxEdges: 500,
  // Disable potentially dangerous features
  flowchart: {
    htmlLabels: false, // Prevent HTML injection
  },
  // Additional security restrictions
};
```

### Input Sanitization

1. **Content Validation**: Validate diagram syntax before rendering
2. **Size Limits**: Prevent extremely large diagrams that could cause performance issues
3. **XSS Prevention**: Sanitize any user-provided content
4. **CSP Compliance**: Ensure generated SVGs comply with Content Security Policy

## Performance Considerations

### Lazy Loading Strategy

```typescript
const loadMermaid = async (): Promise<typeof import('mermaid')> => {
  const mermaid = await import('mermaid');
  return mermaid.default || mermaid;
};
```

### Caching Implementation

```typescript
const diagramCache = new Map<string, string>();

const getCachedDiagram = (code: string, theme: string): string | null => {
  const key = `${theme}:${btoa(code)}`;
  return diagramCache.get(key) || null;
};

const setCachedDiagram = (code: string, theme: string, svg: string): void => {
  const key = `${theme}:${btoa(code)}`;
  diagramCache.set(key, svg);
  
  // Implement LRU eviction if cache grows too large
  if (diagramCache.size > 100) {
    const firstKey = diagramCache.keys().next().value;
    diagramCache.delete(firstKey);
  }
};
```

### Memory Management

1. **Cleanup on Unmount**: Remove diagram instances and event listeners
2. **Debounced Updates**: Prevent excessive re-rendering during editing
3. **Cache Limits**: Implement LRU cache with size limits
4. **Resource Monitoring**: Track memory usage in development

## Accessibility Implementation

### ARIA Support

```typescript
const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, isDark }) => {
  return (
    <div 
      role="img"
      aria-label={`Mermaid diagram: ${extractDiagramTitle(code)}`}
      className="mermaid-container"
    >
      <div 
        id={diagramId}
        className="mermaid-diagram"
        aria-describedby={`${diagramId}-description`}
      />
      <div 
        id={`${diagramId}-description`}
        className="sr-only"
      >
        {generateTextDescription(code)}
      </div>
    </div>
  );
};
```

### Keyboard Navigation

1. **Focus Management**: Ensure diagrams can receive focus
2. **Tab Navigation**: Support tabbing through interactive elements
3. **Keyboard Shortcuts**: Implement zoom and pan controls
4. **Screen Reader Support**: Provide meaningful descriptions

## Future Enhancements

### MCP Integration Opportunities

1. **Auto-Generation**: Generate diagrams from codebase analysis
2. **Live Updates**: Update diagrams based on code changes
3. **Pattern Recognition**: Suggest diagram improvements based on AI analysis
4. **Cross-IDE Sync**: Synchronize diagrams across different development environments

### Advanced Features

1. **Interactive Diagrams**: Support for clickable elements and navigation
2. **Export Options**: SVG, PNG, PDF export functionality
3. **Collaborative Editing**: Real-time collaborative diagram editing
4. **Version History**: Track diagram changes over time
5. **Template Library**: Pre-built diagram templates for common patterns