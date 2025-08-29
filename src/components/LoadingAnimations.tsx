import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Loader2, Calendar, Clock } from 'lucide-react';

// Base skeleton animation variants
const skeletonVariants: Variants = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const skeletonShimmer: Variants = {
  animate: {
    x: ['-100%', '100%'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Timeline skeleton loader
interface TimelineSkeletonLoaderProps {
  lanes?: number;
  trackersPerLane?: number[];
  showHeader?: boolean;
}

export const TimelineSkeletonLoader: React.FC<TimelineSkeletonLoaderProps> = ({
  lanes = 4,
  trackersPerLane = [3, 2, 4, 1],
  showHeader = true
}) => {
  const { isDark } = useTheme();
  const baseColor = isDark ? 'bg-gray-700' : 'bg-gray-200';
  const shimmerColor = isDark ? 'bg-gray-600' : 'bg-gray-300';

  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      {showHeader && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between p-4"
        >
          <div className="flex items-center space-x-4">
            <motion.div
              variants={skeletonVariants}
              animate="animate"
              className={`w-8 h-8 rounded-full ${baseColor} relative overflow-hidden`}
            >
              <motion.div
                variants={skeletonShimmer}
                animate="animate"
                className={`absolute inset-0 ${shimmerColor} opacity-50`}
              />
            </motion.div>
            <motion.div
              variants={skeletonVariants}
              animate="animate"
              className={`w-48 h-6 rounded ${baseColor} relative overflow-hidden`}
            >
              <motion.div
                variants={skeletonShimmer}
                animate="animate"
                className={`absolute inset-0 ${shimmerColor} opacity-50`}
              />
            </motion.div>
          </div>
          <div className="flex items-center space-x-2">
            {Array.from({ length: 3 }, (_, i) => (
              <motion.div
                key={i}
                variants={skeletonVariants}
                animate="animate"
                style={{ animationDelay: `${i * 0.2}s` }}
                className={`w-16 h-8 rounded ${baseColor} relative overflow-hidden`}
              >
                <motion.div
                  variants={skeletonShimmer}
                  animate="animate"
                  className={`absolute inset-0 ${shimmerColor} opacity-50`}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Timeline lanes skeleton */}
      <div className="space-y-4">
        {Array.from({ length: lanes }, (_, laneIndex) => (
          <motion.div
            key={laneIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: laneIndex * 0.1 }}
            className="flex items-center space-x-4 h-12"
          >
            {Array.from({ length: trackersPerLane[laneIndex] || 2 }, (_, trackerIndex) => {
              const width = 80 + Math.random() * 120;
              const marginLeft = trackerIndex === 0 ? 0 : 20 + Math.random() * 80;
              
              return (
                <motion.div
                  key={trackerIndex}
                  variants={skeletonVariants}
                  animate="animate"
                  style={{
                    width: `${width}px`,
                    marginLeft: `${marginLeft}px`,
                    animationDelay: `${trackerIndex * 0.3}s`
                  }}
                  className={`h-8 rounded-lg ${baseColor} relative overflow-hidden`}
                >
                  <motion.div
                    variants={skeletonShimmer}
                    animate="animate"
                    className={`absolute inset-0 ${shimmerColor} opacity-50`}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Individual tracker skeleton
export const TrackerSkeleton: React.FC<{ width?: number; height?: number }> = ({
  width = 120,
  height = 32
}) => {
  const { isDark } = useTheme();
  const baseColor = isDark ? 'bg-gray-700' : 'bg-gray-200';
  const shimmerColor = isDark ? 'bg-gray-600' : 'bg-gray-300';

  return (
    <motion.div
      variants={skeletonVariants}
      animate="animate"
      style={{ width, height }}
      className={`rounded-lg ${baseColor} relative overflow-hidden`}
    >
      <motion.div
        variants={skeletonShimmer}
        animate="animate"
        className={`absolute inset-0 ${shimmerColor} opacity-50`}
      />
      
      {/* Content placeholders */}
      <div className="absolute inset-2 space-y-1">
        <div className={`h-2 w-3/4 ${baseColor} rounded`} />
        <div className={`h-1 w-1/2 ${baseColor} rounded`} />
      </div>
    </motion.div>
  );
};

// Loading spinner with text
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  showText?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text = 'Loading...',
  showText = true
}) => {
  const { isDark } = useTheme();
  
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizeClasses[size]} ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
      >
        <Loader2 className="w-full h-full" />
      </motion.div>
      {showText && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`${textSizeClasses[size]} font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Pulsing dots loader
export const PulsingDots: React.FC<{ count?: number; color?: string }> = ({
  count = 3,
  color
}) => {
  const { isDark } = useTheme();
  const dotColor = color || (isDark ? '#6B7280' : '#9CA3AF');

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2
          }}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ))}
    </div>
  );
};

// Wave loading animation
export const WaveLoader: React.FC<{ height?: number; color?: string }> = ({
  height = 20,
  color
}) => {
  const { isDark } = useTheme();
  const waveColor = color || (isDark ? '#3B82F6' : '#60A5FA');

  return (
    <div className="flex items-end space-x-1" style={{ height }}>
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            height: [`${height * 0.3}px`, `${height}px`, `${height * 0.3}px`]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut'
          }}
          className="w-1 rounded-full"
          style={{ backgroundColor: waveColor }}
        />
      ))}
    </div>
  );
};

// Calendar loading placeholder
export const CalendarLoadingPlaceholder: React.FC = () => {
  const { isDark } = useTheme();
  const baseColor = isDark ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          variants={skeletonVariants}
          animate="animate"
          className={`w-32 h-6 rounded ${baseColor}`}
        />
        <motion.div
          variants={skeletonVariants}
          animate="animate"
          className={`w-24 h-8 rounded ${baseColor}`}
        />
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }, (_, i) => (
          <motion.div
            key={i}
            variants={skeletonVariants}
            animate="animate"
            style={{ animationDelay: `${i * 0.02}s` }}
            className={`aspect-square rounded ${baseColor} flex flex-col items-center justify-center space-y-1`}
          >
            <div className={`w-4 h-3 rounded ${baseColor}`} />
            <div className={`w-6 h-1 rounded ${baseColor}`} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Sidebar loading placeholder
export const SidebarLoadingPlaceholder: React.FC = () => {
  const { isDark } = useTheme();
  const baseColor = isDark ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <motion.div
          variants={skeletonVariants}
          animate="animate"
          className={`w-full h-6 rounded ${baseColor}`}
        />
        <motion.div
          variants={skeletonVariants}
          animate="animate"
          className={`w-3/4 h-4 rounded ${baseColor}`}
        />
      </div>

      {/* Content sections */}
      {Array.from({ length: 3 }, (_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-3">
          <motion.div
            variants={skeletonVariants}
            animate="animate"
            style={{ animationDelay: `${sectionIndex * 0.2}s` }}
            className={`w-1/2 h-4 rounded ${baseColor}`}
          />
          <div className="space-y-2">
            {Array.from({ length: 2 + Math.floor(Math.random() * 3) }, (_, itemIndex) => (
              <motion.div
                key={itemIndex}
                variants={skeletonVariants}
                animate="animate"
                style={{ animationDelay: `${(sectionIndex * 3 + itemIndex) * 0.1}s` }}
                className={`w-full h-8 rounded ${baseColor}`}
              />
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

// Full screen loading overlay
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  showProgress = false,
  progress = 0
}) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-white bg-opacity-80'}
        backdrop-blur-sm
      `}
      style={{ pointerEvents: isVisible ? 'all' : 'none' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ 
          scale: isVisible ? 1 : 0.9, 
          opacity: isVisible ? 1 : 0 
        }}
        className={`
          p-8 rounded-2xl shadow-2xl
          ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
          max-w-sm w-full mx-4
        `}
      >
        <div className="flex flex-col items-center space-y-6">
          {/* Loading icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 text-blue-500"
          >
            <Loader2 className="w-full h-full" />
          </motion.div>

          {/* Message */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{message}</h3>
            <PulsingDots />
          </div>

          {/* Progress bar */}
          {showProgress && (
            <div className="w-full">
              <div className={`
                w-full h-2 rounded-full overflow-hidden
                ${isDark ? 'bg-gray-700' : 'bg-gray-200'}
              `}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
              <p className="text-sm text-center mt-2 opacity-70">
                {progress}%
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Staggered list loading animation
interface StaggeredListLoaderProps {
  items: number;
  itemHeight?: number;
  staggerDelay?: number;
}

export const StaggeredListLoader: React.FC<StaggeredListLoaderProps> = ({
  items,
  itemHeight = 48,
  staggerDelay = 0.1
}) => {
  const { isDark } = useTheme();
  const baseColor = isDark ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <div className="space-y-2">
      {Array.from({ length: items }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * staggerDelay }}
          style={{ height: itemHeight }}
          className={`rounded-lg ${baseColor} relative overflow-hidden flex items-center px-4 space-x-3`}
        >
          <motion.div
            variants={skeletonShimmer}
            animate="animate"
            className={`absolute inset-0 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} opacity-50`}
          />
          
          {/* Avatar */}
          <motion.div
            variants={skeletonVariants}
            animate="animate"
            className={`w-8 h-8 rounded-full ${baseColor}`}
          />
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            <motion.div
              variants={skeletonVariants}
              animate="animate"
              className={`h-3 w-3/4 rounded ${baseColor}`}
            />
            <motion.div
              variants={skeletonVariants}
              animate="animate"
              className={`h-2 w-1/2 rounded ${baseColor}`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Breathing animation for important elements
export const BreathingAnimation: React.FC<{ 
  children: React.ReactNode;
  isActive?: boolean;
  intensity?: number;
}> = ({
  children,
  isActive = true,
  intensity = 1.05
}) => {
  return (
    <motion.div
      animate={isActive ? {
        scale: [1, intensity, 1],
        opacity: [1, 0.8, 1]
      } : {
        scale: 1,
        opacity: 1
      }}
      transition={{
        duration: 2,
        repeat: isActive ? Infinity : 0,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
};