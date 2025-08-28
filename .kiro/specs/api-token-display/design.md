# Design Document

## Overview

The API Token Display feature will be implemented as a new tab within the existing SettingsModal component. This approach leverages RefBase's established settings infrastructure while providing developers with secure access to their Supabase JWT tokens for MCP tool configuration.

The design follows RefBase's existing patterns: React components with TypeScript, Tailwind CSS for styling, Framer Motion for animations, and integration with the Supabase authentication system.

## Architecture

### Component Structure
```
SettingsModal (existing)
├── settingsTabs[] (modified to include Developer Settings)
└── renderTabContent() (modified to handle 'developer' tab)
    └── DeveloperSettingsTab (new component)
        ├── TokenDisplay (new component)
        ├── CopyButton (new component)
        ├── Instructions (new component)
        └── SecurityWarning (new component)
```

### Data Flow
1. **Token Retrieval**: Access Supabase session via `useAuth` hook
2. **Token Extraction**: Extract JWT from session.access_token
3. **Token Display**: Render token in secure, formatted display
4. **Copy Operation**: Use Clipboard API for token copying
5. **State Management**: Local state for copy feedback and error handling

## Components and Interfaces

### DeveloperSettingsTab Component
**Purpose**: Main container for developer-focused settings
**Props**: 
- `isDark: boolean` - Theme state for consistent styling

**State**:
```typescript
interface DeveloperSettingsState {
  copyStatus: 'idle' | 'copying' | 'success' | 'error';
  copyMessage: string;
  tokenError: string | null;
}
```

### TokenDisplay Component
**Purpose**: Secure display of the JWT token
**Props**:
- `token: string | null` - The JWT token to display
- `isDark: boolean` - Theme state
- `onCopy: () => void` - Copy handler

**Features**:
- Monospace font for readability
- Proper text wrapping for long tokens
- Visual indicators for token status (valid/expired/error)

### CopyButton Component
**Purpose**: Handle token copying with user feedback
**Props**:
- `token: string` - Token to copy
- `onCopyStatusChange: (status: string, message: string) => void` - Status callback
- `isDark: boolean` - Theme state

**Behavior**:
- Uses modern Clipboard API with fallback
- Provides immediate visual feedback
- Handles copy failures gracefully

### Token Utilities
```typescript
interface TokenInfo {
  token: string;
  isValid: boolean;
  expiresAt: Date | null;
  isExpired: boolean;
}

const getTokenInfo = (session: Session | null): TokenInfo | null;
const formatTokenForDisplay = (token: string): string;
const copyToClipboard = (text: string): Promise<boolean>;
```

## Data Models

### Token Information
```typescript
interface TokenDisplayData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  isValid: boolean;
  userId: string;
}
```

### Copy Operation State
```typescript
interface CopyState {
  status: 'idle' | 'copying' | 'success' | 'error';
  message: string;
  timestamp: number;
}
```

## Error Handling

### Token Retrieval Errors
- **No Session**: Display "Please log in to view your token"
- **Invalid Session**: Display "Session expired, please refresh"
- **Network Error**: Display "Unable to retrieve token, check connection"

### Copy Operation Errors
- **Clipboard API Unavailable**: Fallback to text selection
- **Permission Denied**: Display "Copy failed, please select and copy manually"
- **General Error**: Display "Copy failed, please try again"

### Error Recovery
- Provide "Refresh" button for token retrieval errors
- Auto-retry copy operations with exponential backoff
- Clear error states after successful operations

## Testing Strategy

### Unit Tests
1. **DeveloperSettingsTab Component**
   - Renders correctly with valid token
   - Handles missing token gracefully
   - Respects theme settings
   - Manages copy state properly

2. **TokenDisplay Component**
   - Formats tokens correctly
   - Shows appropriate status indicators
   - Handles long tokens with proper wrapping

3. **CopyButton Component**
   - Copies token to clipboard successfully
   - Provides appropriate feedback
   - Handles copy failures

4. **Token Utilities**
   - Extracts token info correctly
   - Validates token format
   - Handles edge cases (null, invalid tokens)

### Integration Tests
1. **Settings Modal Integration**
   - New tab appears in navigation
   - Tab switching works correctly
   - Maintains state during navigation

2. **Authentication Integration**
   - Retrieves token from Supabase session
   - Updates when authentication state changes
   - Handles logout scenarios

3. **Theme Integration**
   - Respects dark/light mode settings
   - Maintains consistency with other tabs
   - Transitions smoothly between themes

### User Acceptance Tests
1. **Token Access Flow**
   - User can navigate to Developer Settings
   - Token is displayed clearly and completely
   - Copy functionality works reliably

2. **Error Scenarios**
   - Appropriate messages for unauthenticated users
   - Graceful handling of network issues
   - Clear guidance for resolution steps

3. **Security Validation**
   - Token is not logged to console
   - No token exposure in network requests
   - Proper cleanup on component unmount

## Implementation Notes

### Security Considerations
- Token display only for authenticated users
- No token logging or unnecessary exposure
- Secure clipboard operations
- Component cleanup to prevent memory leaks

### Performance Considerations
- Lazy loading of token information
- Debounced copy operations
- Efficient re-renders with React.memo where appropriate

### Accessibility
- Proper ARIA labels for screen readers
- Keyboard navigation support
- High contrast support for token display
- Focus management for copy operations

### Browser Compatibility
- Clipboard API with fallback for older browsers
- CSS Grid/Flexbox for layout (IE11+ support)
- Modern JavaScript features with appropriate polyfills