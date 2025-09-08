# Navigation Architecture

## Overview
This navigation system implements a decoupled architecture using the Command Pattern, Observer Pattern, and Mediator Pattern to eliminate tight coupling between UI components and navigation logic.

## Key Components

### NavigationService (Mediator)
- Centralized navigation coordination
- Manages navigation destinations
- Provides type-safe navigation methods

### NavigationEventBus (Observer)
- Decoupled event communication
- Allows components to react to navigation events
- Supports multiple subscribers per event

### NavigationContext (Dependency Injection)
- React context for navigation services
- Provides hooks for easy component integration
- Manages event subscriptions lifecycle

## Usage Examples

### Basic Navigation
```typescript
const { navigateTo } = useNavigation();

// Navigate to documentation
navigateTo('documentation');

// Navigate with payload
navigateTo('project', { projectId: '123' });
```

### Registering New Destinations
```typescript
const navigationService = NavigationService.getInstance();

navigationService.registerDestination('custom-page', {
  route: '/custom',
  title: 'Custom Page',
  requiresAuth: true
});
```

### Listening to Navigation Events
```typescript
const { registerNavigationHandler } = useNavigation();

useEffect(() => {
  const unsubscribe = registerNavigationHandler('navigation:custom_event', (event) => {
    console.log('Custom navigation event:', event);
  });
  
  return unsubscribe;
}, []);
```

## Migration Guide

### Before (Tightly Coupled)
```typescript
interface ComponentProps {
  onViewDocs?: () => void;
  onViewSettings?: () => void;
  // ... more navigation callbacks
}
```

### After (Decoupled)
```typescript
// Component just uses navigation service
const { navigateTo } = useNavigation();

// No props needed for navigation
const handleViewDocs = () => navigateTo('documentation');
```

## Benefits
- **Maintainability**: Easy to add new navigation destinations
- **Testability**: Components can be tested without navigation dependencies
- **Reusability**: Navigation logic is centralized and reusable
- **Type Safety**: TypeScript support for navigation destinations
- **Performance**: Event-driven architecture with proper cleanup

## Best Practices
1. Register all navigation destinations at application startup
2. Use meaningful event names with namespacing
3. Always unsubscribe from events in component cleanup
4. Keep navigation payloads serializable
5. Handle navigation errors gracefully