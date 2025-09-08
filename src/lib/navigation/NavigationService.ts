// Mediator Pattern for Navigation Coordination
import { NavigationEventBus, NAVIGATION_EVENTS } from './NavigationEventBus';

export interface NavigationDestination {
  route: string;
  title: string;
  icon?: string;
  requiresAuth?: boolean;
  external?: boolean;
}

export class NavigationService {
  private static instance: NavigationService;
  private eventBus: NavigationEventBus;
  private destinations: Map<string, NavigationDestination> = new Map();
  
  private constructor() {
    this.eventBus = NavigationEventBus.getInstance();
    this.registerDefaultDestinations();
  }
  
  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }
  
  private registerDefaultDestinations(): void {
    this.destinations.set('documentation', {
      route: '/docs',
      title: 'API Documentation',
      icon: 'book',
      requiresAuth: false
    });
    
    this.destinations.set('settings', {
      route: '/settings',
      title: 'Settings',
      icon: 'settings',
      requiresAuth: true
    });
  }
  
  registerDestination(key: string, destination: NavigationDestination): void {
    this.destinations.set(key, destination);
  }
  
  navigateTo(destinationKey: string, payload?: any): void {
    const destination = this.destinations.get(destinationKey);
    if (!destination) {
      console.warn(`Navigation destination '${destinationKey}' not found`);
      return;
    }
    
    // Emit navigation event
    this.eventBus.emit(NAVIGATION_EVENTS.VIEW_DOCUMENTATION, {
      destination,
      payload
    });
  }
  
  getDestination(key: string): NavigationDestination | undefined {
    return this.destinations.get(key);
  }
  
  getAllDestinations(): Map<string, NavigationDestination> {
    return new Map(this.destinations);
  }
}