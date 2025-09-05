/**
 * Dashboard Theme Utilities
 * Provides consistent theme-aware styling for dashboard components
 * Following the webapp's sharp, angular design with no rounded corners
 */

import { useTheme } from '../contexts/ThemeContext';

// Semantic color constants for different data types
export const DASHBOARD_COLORS = {
  tasks: {
    primary: '#3b82f6',
    light: '#dbeafe',
    dark: '#1e40af',
  },
  completed: {
    primary: '#10b981',
    light: '#d1fae5',
    dark: '#047857',
  },
  bugs: {
    primary: '#ef4444',
    light: '#fee2e2',
    dark: '#dc2626',
  },
  features: {
    primary: '#8b5cf6',
    light: '#ede9fe',
    dark: '#7c3aed',
  },
  documents: {
    primary: '#f59e0b',
    light: '#fef3c7',
    dark: '#d97706',
  },
  warning: {
    primary: '#f97316',
    light: '#fed7aa',
    dark: '#ea580c',
  },
} as const;

// Theme-aware class generators
export const getDashboardClasses = (isDark: boolean) => ({
  // Background classes
  background: isDark ? 'bg-black' : 'bg-gray-50',
  cardBackground: isDark ? 'bg-gray-900' : 'bg-white',
  secondaryBackground: isDark ? 'bg-gray-800' : 'bg-gray-100',
  primaryBackground: isDark ? 'bg-blue-600' : 'bg-blue-500',
  
  // Text classes
  text: isDark ? 'text-white' : 'text-gray-900',
  textPrimary: isDark ? 'text-white' : 'text-gray-900',
  textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
  textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
  
  // Border classes
  border: isDark ? 'border-gray-700' : 'border-gray-200',
  borderLight: isDark ? 'border-gray-600' : 'border-gray-300',
  
  // Hover states (no rounded corners)
  hoverBackground: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
  hoverBorder: isDark ? 'hover:border-gray-600' : 'hover:border-gray-300',
  
  // Interactive states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  
  // Shadows (sharp, no blur for angular design)
  shadow: 'shadow-sm',
  shadowHover: 'hover:shadow-md',
  shadowLarge: 'shadow-lg',
});

// Utility function to get theme-aware Tailwind classes
export const useDashboardTheme = () => {
  const { isDark } = useTheme();
  return getDashboardClasses(isDark);
};

// Metric card styling generator
export const getMetricCardClasses = (isDark: boolean, colorType: keyof typeof DASHBOARD_COLORS) => {
  const baseClasses = getDashboardClasses(isDark);
  const color = DASHBOARD_COLORS[colorType];
  
  return {
    container: `${baseClasses.cardBackground} ${baseClasses.border} border transition-all duration-200 hover:scale-105 ${baseClasses.shadowHover}`,
    iconContainer: `p-2 bg-gradient-to-r from-${colorType === 'tasks' ? 'blue' : colorType === 'completed' ? 'green' : colorType === 'bugs' ? 'red' : colorType === 'features' ? 'purple' : 'yellow'}-500 to-${colorType === 'tasks' ? 'blue' : colorType === 'completed' ? 'green' : colorType === 'bugs' ? 'red' : colorType === 'features' ? 'purple' : 'yellow'}-600 ${baseClasses.shadow}`,
    badge: `text-xs font-bold px-2 py-1`,
    progressBar: `w-full h-1.5 overflow-hidden`,
    progressFill: `h-full transition-all duration-500`,
    title: `text-2xl font-bold ${baseClasses.textPrimary}`,
    subtitle: `text-xs font-medium ${baseClasses.textSecondary}`,
    description: `text-xs ${baseClasses.textMuted}`,
  };
};

// Progress section styling
export const getProgressSectionClasses = (isDark: boolean) => {
  const baseClasses = getDashboardClasses(isDark);
  
  return {
    container: `${baseClasses.cardBackground} ${baseClasses.border} border p-6`,
    title: `text-lg font-bold ${baseClasses.textPrimary}`,
    progressContainer: `w-full h-3 overflow-hidden ${baseClasses.secondaryBackground}`,
    progressBar: `h-3 bg-gradient-to-r from-blue-500 to-green-500 relative overflow-hidden`,
    progressText: `text-xs mt-2 ${baseClasses.textSecondary}`,
    statCard: `text-center p-3 ${baseClasses.secondaryBackground}`,
    statValue: `text-lg font-bold ${baseClasses.textPrimary}`,
    statLabel: `text-xs ${baseClasses.textSecondary}`,
  };
};

// Activity section styling
export const getActivitySectionClasses = (isDark: boolean) => {
  const baseClasses = getDashboardClasses(isDark);
  
  return {
    container: `${baseClasses.cardBackground} ${baseClasses.border} border p-6`,
    title: `text-lg font-bold ${baseClasses.textPrimary}`,
    viewAllButton: `text-xs font-medium px-2 py-1 transition-colors ${baseClasses.textSecondary} ${baseClasses.hoverBackground}`,
    activityItem: `flex items-center justify-between p-3 ${baseClasses.secondaryBackground} transition-all duration-200 hover:scale-[1.02]`,
    activityTitle: `font-medium text-sm ${baseClasses.textPrimary}`,
    activityMeta: `text-xs ${baseClasses.textSecondary}`,
    activityTime: `text-xs ${baseClasses.textMuted} font-medium`,
    emptyState: `text-center py-8 ${baseClasses.textMuted}`,
    emptyStateTitle: `font-medium text-sm`,
    emptyStateDescription: `text-xs`,
  };
};

// Quick actions styling
export const getQuickActionClasses = (isDark: boolean) => {
  const baseClasses = getDashboardClasses(isDark);
  
  return {
    container: `${baseClasses.cardBackground} ${baseClasses.border} border p-6`,
    title: `text-lg font-bold ${baseClasses.textPrimary} mb-4`,
    button: `w-full p-4 border ${baseClasses.border} transition-all duration-200 text-left group hover:scale-[1.02] ${baseClasses.hoverBackground}`,
    buttonTitle: `font-semibold text-sm ${baseClasses.textPrimary} group-hover:text-blue-500 transition-colors`,
    buttonDescription: `text-xs ${baseClasses.textSecondary}`,
  };
};

// Enhanced Animation variants for Framer Motion
export const dashboardAnimations = {
  // Main container animations
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
        duration: 0.3,
      },
    },
  },
  
  // Individual item animations
  item: {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
      },
    },
  },
  
  // Slide in from left
  slideInLeft: {
    hidden: {
      opacity: 0,
      x: -50,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  },
  
  // Slide in from right
  slideInRight: {
    hidden: {
      opacity: 0,
      x: 50,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  },
  
  // Scale up animation
  scaleUp: {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  },
  
  // Progress bar animations
  progressBar: {
    initial: { width: 0 },
    animate: (progress: number) => ({
      width: `${progress}%`,
      transition: {
        duration: 1.2,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.8,
      },
    }),
  },
  
  // Staggered list animations
  staggeredList: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },
  
  // List item animations
  listItem: {
    hidden: {
      opacity: 0,
      x: -20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  },
  
  // Fade in with delay
  fadeInDelayed: (delay: number = 0) => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        delay,
        ease: 'easeOut',
      },
    },
  }),
  
  // Bounce in animation
  bounceIn: {
    hidden: {
      opacity: 0,
      scale: 0.3,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.68, -0.55, 0.265, 1.55], // Bounce easing
      },
    },
  },
};

// Motion preferences utility
export const getMotionPreferences = () => {
  // Check if user prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
    
  return {
    prefersReducedMotion,
    // Reduced motion variants
    reducedMotion: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration: 0.2 }
      },
    },
  };
};

// Helper function to get activity type indicator color
export const getActivityTypeColor = (type: string) => {
  switch (type) {
    case 'task':
      return 'bg-blue-500';
    case 'bug':
      return 'bg-red-500';
    case 'feature':
      return 'bg-purple-500';
    case 'document':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

// Helper function to get semantic color for different metrics
export const getSemanticColor = (type: keyof typeof DASHBOARD_COLORS, variant: 'primary' | 'light' | 'dark' = 'primary') => {
  return DASHBOARD_COLORS[type][variant];
};

// Responsive grid classes
export const getResponsiveGridClasses = () => ({
  statsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-4',
  contentGrid: 'grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 md:gap-6',
  threeColumnGrid: 'grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-4',
  twoColumnGrid: 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-4',
  dashboardContainer: 'p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto h-full',
  cardPadding: 'p-3 sm:p-4 lg:p-6',
  cardSpacing: 'space-y-3 sm:space-y-4',
  buttonPadding: 'p-2 sm:p-3 lg:p-4',
  textSizes: {
    title: 'text-base sm:text-lg font-bold',
    subtitle: 'text-sm sm:text-base font-medium',
    body: 'text-xs sm:text-sm',
    caption: 'text-xs',
  },
});

// Responsive spacing classes
export const getResponsiveSpacing = () => ({
  padding: 'p-3 sm:p-4 md:p-6',
  paddingSmall: 'p-2 sm:p-3 md:p-4',
  paddingLarge: 'p-4 sm:p-6 md:p-8',
  margin: 'm-3 sm:m-4 md:m-6',
  marginSmall: 'm-2 sm:m-3 md:m-4',
  gap: 'gap-3 sm:gap-4 md:gap-5 lg:gap-4',
  gapSmall: 'gap-2 sm:gap-3 md:gap-4',
  spaceY: 'space-y-4 sm:space-y-5 md:space-y-6',
  spaceYSmall: 'space-y-2 sm:space-y-3 md:space-y-4',
});

// Responsive text classes
export const getResponsiveText = () => ({
  title: 'text-lg sm:text-xl md:text-2xl lg:text-xl',
  subtitle: 'text-base sm:text-lg md:text-xl lg:text-lg',
  body: 'text-sm sm:text-base md:text-lg lg:text-base',
  caption: 'text-xs sm:text-sm md:text-base lg:text-sm',
  small: 'text-xs sm:text-xs md:text-sm lg:text-xs',
});