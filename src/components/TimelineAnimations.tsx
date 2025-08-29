import React from 'react';
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion';
import { ProjectTracker } from '../types';
import { useTheme } from '../contexts/ThemeContext';

// Animation variants for different states
export const trackerVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20
  },
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)"
  },
  tap: {
    scale: 0.98
  },
  dragging: {
    scale: 1.05,
    rotate: 2,
    zIndex: 1000,
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)"
  }
};

export const laneVariants: Variants = {
  initial: {
    opacity: 0,
    height: 0
  },
  animate: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: { duration: 0.3, ease: 'easeOut' },
      opacity: { duration: 0.2, delay: 0.1 }
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.3, ease: 'easeIn' },
      opacity: { duration: 0.2 }
    }
  }
};

export const timelineContainerVariants: Variants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

export const loadingVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

export const skeletonPulse: Variants = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Transition configurations
export const smoothTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
};

export const quickTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut'
};

export const slowTransition: Transition = {
  duration: 0.5,
  ease: 'easeInOut'
};

export const bounceTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25
};

// Animated tracker component
interface AnimatedTrackerProps {
  tracker: ProjectTracker;
  style: React.CSSProperties;
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  isResizing: boolean;
  children: React.ReactNode;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onClick?: () => void;
  layoutId?: string;
}

export const AnimatedTracker: React.FC<AnimatedTrackerProps> = ({
  tracker,
  style,
  isSelected,
  isHovered,
  isDragging,
  isResizing,
  children,
  onHoverStart,
  onHoverEnd,
  onClick,
  layoutId
}) => {
  const { isDark } = useTheme();

  // Determine animation state
  let animationState = 'animate';
  if (isDragging) animationState = 'dragging';
  else if (isHovered) animationState = 'hover';

  // Additional effects for different states
  const dynamicStyles = {
    ...style,
    filter: isSelected ? `brightness(${isDark ? '1.2' : '1.1'}) saturate(1.1)` : 'none',
    borderWidth: isSelected ? '2px' : '1px',
    borderColor: isSelected ? '#3B82F6' : 'transparent',
    cursor: isDragging ? 'grabbing' : isResizing ? 'col-resize' : 'pointer'
  };

  return (
    <motion.div
      layoutId={layoutId}
      variants={trackerVariants}
      initial="initial"
      animate={animationState}
      exit="exit"
      whileTap="tap"
      style={dynamicStyles}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onClick={onClick}
      transition={smoothTransition}
      drag={false} // Drag is handled by parent
    >
      {children}
      
      {/* Status indicator animation */}
      <AnimatePresence>
        {tracker.status === 'in_progress' && (
          <motion.div
            className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 1
            }}
          />
        )}
      </AnimatePresence>

      {/* Priority indicator */}
      <AnimatePresence>
        {tracker.priority === 'critical' && (
          <motion.div
            className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-md"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Animated lane container
interface AnimatedLaneProps {
  laneIndex: number;
  children: React.ReactNode;
  height: number;
  isEmpty: boolean;
}

export const AnimatedLane: React.FC<AnimatedLaneProps> = ({
  laneIndex,
  children,
  height,
  isEmpty
}) => {
  return (
    <motion.div
      variants={laneVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ height }}
      className="relative"
      layoutId={`lane-${laneIndex}`}
    >
      {!isEmpty && (
        <motion.div
          className="absolute inset-0"
          variants={timelineContainerVariants}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

// Drag ghost/preview component
interface DragGhostProps {
  tracker: ProjectTracker;
  position: { x: number; y: number };
  width: number;
  height: number;
  isValidDrop: boolean;
  isDark: boolean;
}

export const DragGhost: React.FC<DragGhostProps> = ({
  tracker,
  position,
  width,
  height,
  isValidDrop,
  isDark
}) => {
  const ghostColor = isValidDrop 
    ? (isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)')
    : (isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width,
        height,
        backgroundColor: ghostColor,
        border: `2px dashed ${isValidDrop ? '#10B981' : '#EF4444'}`,
        borderRadius: '6px',
        pointerEvents: 'none',
        zIndex: 9999
      }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="absolute inset-0 rounded-md"
        animate={{
          boxShadow: [
            '0 0 0 rgba(59, 130, 246, 0.5)',
            '0 0 20px rgba(59, 130, 246, 0.3)',
            '0 0 0 rgba(59, 130, 246, 0.5)'
          ]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.div>
  );
};

// Loading skeleton for trackers
interface TimelineSkeletonProps {
  lanes: number;
  trackersPerLane: number[];
  isDark: boolean;
}

export const TimelineSkeleton: React.FC<TimelineSkeletonProps> = ({
  lanes,
  trackersPerLane,
  isDark
}) => {
  return (
    <motion.div
      variants={timelineContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      {Array.from({ length: lanes }, (_, laneIndex) => (
        <motion.div
          key={laneIndex}
          variants={laneVariants}
          className="flex items-center space-x-4 h-12"
        >
          {Array.from({ length: trackersPerLane[laneIndex] || 2 }, (_, trackerIndex) => (
            <motion.div
              key={trackerIndex}
              variants={skeletonPulse}
              animate="animate"
              className={`h-8 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
              style={{
                width: `${80 + Math.random() * 120}px`,
                marginLeft: trackerIndex === 0 ? 0 : `${20 + Math.random() * 60}px`
              }}
            />
          ))}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Success/Error feedback animations
interface FeedbackAnimationProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  onComplete?: () => void;
}

export const FeedbackAnimation: React.FC<FeedbackAnimationProps> = ({
  type,
  message,
  onComplete
}) => {
  const colors = {
    success: { bg: 'bg-green-500', text: 'text-white' },
    error: { bg: 'bg-red-500', text: 'text-white' },
    warning: { bg: 'bg-yellow-500', text: 'text-black' }
  };

  const color = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${color.bg} ${color.text}`}
      onAnimationComplete={onComplete}
      transition={bounceTransition}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 500, damping: 30 }}
      >
        {message}
      </motion.div>
    </motion.div>
  );
};

// Stagger children animation wrapper
interface StaggerWrapperProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerWrapper: React.FC<StaggerWrapperProps> = ({
  children,
  staggerDelay = 0.1,
  className
}) => {
  const containerVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Timeline zoom animation
interface ZoomTransitionProps {
  children: React.ReactNode;
  zoomLevel: number;
  onZoomComplete?: () => void;
}

export const ZoomTransition: React.FC<ZoomTransitionProps> = ({
  children,
  zoomLevel,
  onZoomComplete
}) => {
  return (
    <motion.div
      animate={{ scale: zoomLevel }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        onComplete: onZoomComplete
      }}
      style={{ transformOrigin: 'center' }}
    >
      {children}
    </motion.div>
  );
};

// Page transition for view mode changes
export const ViewModeTransition: React.FC<{ children: React.ReactNode; mode: string }> = ({
  children,
  mode
}) => {
  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};