// Navigation Context for Dependency Injection
import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { NavigationService } from '../lib/navigation/NavigationService';
import { NavigationEventBus, NAVIGATION_EVENTS } from '../lib/navigation/NavigationEventBus';

interface NavigationContextValue {
  navigateTo: (destination: string, payload?: any) => void;
  registerNavigationHandler: (eventType: string, handler: (event: any) => void) => () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
  onNavigate?: (route: string, payload?: any) => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  onNavigate 
}) => {
  const navigationService = NavigationService.getInstance();
  const eventBus = NavigationEventBus.getInstance();
  
  // Set up navigation handler
  React.useEffect(() => {
    if (onNavigate) {
      const unsubscribe = eventBus.subscribe(NAVIGATION_EVENTS.VIEW_DOCUMENTATION, (event) => {
        const { destination, payload } = event.payload;
        onNavigate(destination.route, payload);
      });
      
      return unsubscribe;
    }
  }, [onNavigate, eventBus]);
  
  const navigateTo = useCallback((destination: string, payload?: any) => {
    navigationService.navigateTo(destination, payload);
  }, [navigationService]);
  
  const registerNavigationHandler = useCallback((eventType: string, handler: (event: any) => void) => {
    return eventBus.subscribe(eventType, handler);
  }, [eventBus]);
  
  const value: NavigationContextValue = {
    navigateTo,
    registerNavigationHandler
  };
  
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};