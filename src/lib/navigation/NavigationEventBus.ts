// Event Bus for Decoupled Navigation
export interface NavigationEvent {
  type: string;
  payload?: any;
  timestamp: number;
}

export type NavigationEventHandler = (event: NavigationEvent) => void;

export class NavigationEventBus {
  private static instance: NavigationEventBus;
  private handlers: Map<string, NavigationEventHandler[]> = new Map();
  
  static getInstance(): NavigationEventBus {
    if (!NavigationEventBus.instance) {
      NavigationEventBus.instance = new NavigationEventBus();
    }
    return NavigationEventBus.instance;
  }
  
  subscribe(eventType: string, handler: NavigationEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  emit(eventType: string, payload?: any): void {
    const event: NavigationEvent = {
      type: eventType,
      payload,
      timestamp: Date.now()
    };
    
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in navigation event handler for ${eventType}:`, error);
        }
      });
    }
  }
}

// Navigation Event Types
export const NAVIGATION_EVENTS = {
  VIEW_DOCUMENTATION: 'navigation:view_documentation',
  VIEW_SETTINGS: 'navigation:view_settings',
  CREATE_PROJECT: 'navigation:create_project',
  SELECT_PROJECT: 'navigation:select_project'
} as const;