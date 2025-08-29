import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectTracker } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Monitor, 
  Tablet, 
  Smartphone,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MoreVertical
} from 'lucide-react';

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1440
} as const;

export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'wide';

// Hook for screen size detection
export const useScreenSize = (): ScreenSize => {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.mobile) {
        setScreenSize('mobile');
      } else if (width < BREAKPOINTS.tablet) {
        setScreenSize('mobile');
      } else if (width < BREAKPOINTS.desktop) {
        setScreenSize('tablet');
      } else if (width < BREAKPOINTS.wide) {
        setScreenSize('desktop');
      } else {
        setScreenSize('wide');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
};

// Responsive timeline configuration
interface ResponsiveTimelineConfig {
  screenSize: ScreenSize;
  showSidebar: boolean;
  compactMode: boolean;
  itemsPerView: number;
  pixelsPerDay: number;
  laneHeight: number;
  showLabels: boolean;
  showPriority: boolean;
  showProgress: boolean;
}

export const getResponsiveConfig = (screenSize: ScreenSize): ResponsiveTimelineConfig => {
  switch (screenSize) {
    case 'mobile':
      return {
        screenSize,
        showSidebar: false,
        compactMode: true,
        itemsPerView: 1,
        pixelsPerDay: 60,
        laneHeight: 32,
        showLabels: false,
        showPriority: false,
        showProgress: false
      };
    case 'tablet':
      return {
        screenSize,
        showSidebar: false,
        compactMode: true,
        itemsPerView: 2,
        pixelsPerDay: 80,
        laneHeight: 36,
        showLabels: true,
        showPriority: true,
        showProgress: false
      };
    case 'desktop':
      return {
        screenSize,
        showSidebar: true,
        compactMode: false,
        itemsPerView: 3,
        pixelsPerDay: 120,
        laneHeight: 48,
        showLabels: true,
        showPriority: true,
        showProgress: true
      };
    case 'wide':
      return {
        screenSize,
        showSidebar: true,
        compactMode: false,
        itemsPerView: 4,
        pixelsPerDay: 140,
        laneHeight: 52,
        showLabels: true,
        showPriority: true,
        showProgress: true
      };
  }
};

// Mobile navigation drawer
interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  children
}) => {
  const { isDark } = useTheme();

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`
              fixed right-0 top-0 h-full w-80 max-w-[90vw] z-50
              ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
              shadow-2xl overflow-y-auto
            `}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Timeline Details</h2>
                <button
                  onClick={onClose}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
                  `}
                >
                  <X size={20} />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Mobile timeline cards view
interface MobileTimelineCardProps {
  tracker: ProjectTracker;
  isSelected: boolean;
  onClick: () => void;
  showDetails?: boolean;
}

export const MobileTimelineCard: React.FC<MobileTimelineCardProps> = ({
  tracker,
  isSelected,
  onClick,
  showDetails = false
}) => {
  const { isDark } = useTheme();

  const getTypeColor = () => {
    switch (tracker.type) {
      case 'project':
        return '#3B82F6';
      case 'feature':
        return '#10B981';
      case 'bug':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = () => {
    switch (tracker.status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#3B82F6';
      case 'not_started':
        return '#6B7280';
      default:
        return '#F59E0B';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 shadow-lg' 
          : (isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
        }
        ${isDark ? 'bg-gray-800' : 'bg-white'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate mb-1">{tracker.title}</h3>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getTypeColor() }}
            />
            <span className="text-xs capitalize text-gray-500">
              {tracker.type}
            </span>
          </div>
        </div>
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: getStatusColor() }}
        />
      </div>

      {/* Date range */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
        <Calendar size={12} />
        <span>
          {new Date(tracker.startDate).toLocaleDateString()} - {new Date(tracker.endDate).toLocaleDateString()}
        </span>
      </div>

      {/* Priority */}
      <div className="flex items-center justify-between">
        <div className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${tracker.priority === 'critical' ? 'bg-red-100 text-red-800' :
            tracker.priority === 'high' ? 'bg-orange-100 text-orange-800' :
            tracker.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }
        `}>
          {tracker.priority}
        </div>
        <span className="text-xs capitalize text-gray-500">
          {tracker.status.replace('_', ' ')}
        </span>
      </div>

      {/* Extended details for selected card */}
      <AnimatePresence>
        {isSelected && showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600"
          >
            {tracker.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {tracker.description}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Tablet timeline view (hybrid)
interface TabletTimelineProps {
  trackers: ProjectTracker[];
  selectedTracker?: ProjectTracker;
  onTrackerSelect: (tracker: ProjectTracker) => void;
  config: ResponsiveTimelineConfig;
}

export const TabletTimeline: React.FC<TabletTimelineProps> = ({
  trackers,
  selectedTracker,
  onTrackerSelect,
  config
}) => {
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = config.itemsPerView;
  const totalPages = Math.ceil(trackers.length / itemsPerPage);

  const currentTrackers = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return trackers.slice(start, start + itemsPerPage);
  }, [trackers, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Pagination header */}
      <div className="flex items-center justify-between px-4">
        <span className="text-sm text-gray-500">
          {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, trackers.length)} of {trackers.length}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className={`
              p-2 rounded-lg transition-colors
              ${currentPage === 0 
                ? 'opacity-50 cursor-not-allowed' 
                : (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100')
              }
            `}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className={`
              p-2 rounded-lg transition-colors
              ${currentPage === totalPages - 1 
                ? 'opacity-50 cursor-not-allowed' 
                : (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100')
              }
            `}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Tracker grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
        <AnimatePresence mode="wait">
          {currentTrackers.map((tracker, index) => (
            <motion.div
              key={tracker.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ delay: index * 0.1 }}
            >
              <MobileTimelineCard
                tracker={tracker}
                isSelected={selectedTracker?.id === tracker.id}
                onClick={() => onTrackerSelect(tracker)}
                showDetails={true}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Responsive timeline wrapper
interface ResponsiveTimelineWrapperProps {
  trackers: ProjectTracker[];
  selectedTracker?: ProjectTracker;
  onTrackerSelect: (tracker: ProjectTracker) => void;
  sidebarContent?: React.ReactNode;
  children?: React.ReactNode;
}

export const ResponsiveTimelineWrapper: React.FC<ResponsiveTimelineWrapperProps> = ({
  trackers,
  selectedTracker,
  onTrackerSelect,
  sidebarContent,
  children
}) => {
  const screenSize = useScreenSize();
  const config = getResponsiveConfig(screenSize);
  const { isDark } = useTheme();
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  // Mobile view
  if (screenSize === 'mobile') {
    return (
      <div className="flex flex-col h-full">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Timeline</h2>
          <button
            onClick={() => setShowMobileDrawer(true)}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
            `}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Mobile content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {trackers.map((tracker) => (
            <MobileTimelineCard
              key={tracker.id}
              tracker={tracker}
              isSelected={selectedTracker?.id === tracker.id}
              onClick={() => onTrackerSelect(tracker)}
            />
          ))}
        </div>

        {/* Mobile drawer */}
        <MobileDrawer
          isOpen={showMobileDrawer}
          onClose={() => setShowMobileDrawer(false)}
        >
          {sidebarContent}
        </MobileDrawer>
      </div>
    );
  }

  // Tablet view
  if (screenSize === 'tablet') {
    return (
      <div className="flex flex-col h-full">
        <TabletTimeline
          trackers={trackers}
          selectedTracker={selectedTracker}
          onTrackerSelect={onTrackerSelect}
          config={config}
        />
      </div>
    );
  }

  // Desktop/Wide view (default)
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      {config.showSidebar && sidebarContent && (
        <div className="w-96 border-l overflow-hidden">
          {sidebarContent}
        </div>
      )}
    </div>
  );
};

// Screen size indicator (for development)
export const ScreenSizeIndicator: React.FC = () => {
  const screenSize = useScreenSize();
  const { isDark } = useTheme();

  if (process.env.NODE_ENV !== 'development') return null;

  const getIcon = () => {
    switch (screenSize) {
      case 'mobile':
        return <Smartphone size={16} />;
      case 'tablet':
        return <Tablet size={16} />;
      default:
        return <Monitor size={16} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        fixed bottom-4 left-4 z-50 px-3 py-2 rounded-lg shadow-lg
        ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
        border flex items-center space-x-2
      `}
    >
      {getIcon()}
      <span className="text-sm font-medium capitalize">{screenSize}</span>
      <span className="text-xs opacity-70">
        {window.innerWidth}px
      </span>
    </motion.div>
  );
};

// Responsive grid helper
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`
      grid gap-4
      grid-cols-1 
      sm:grid-cols-1 
      md:grid-cols-2 
      lg:grid-cols-3 
      xl:grid-cols-4
      ${className}
    `}>
      {children}
    </div>
  );
};

// Hook for responsive values
export const useResponsiveValue = <T,>(values: {
  mobile: T;
  tablet: T;
  desktop: T;
  wide: T;
}): T => {
  const screenSize = useScreenSize();
  return values[screenSize];
};