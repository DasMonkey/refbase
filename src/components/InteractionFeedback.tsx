import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectTracker } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Calendar, 
  Clock, 
  Flag, 
  User, 
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

// Hover tooltip component
interface TrackerTooltipProps {
  tracker: ProjectTracker;
  position: { x: number; y: number };
  isVisible: boolean;
}

export const TrackerTooltip: React.FC<TrackerTooltipProps> = ({
  tracker,
  position,
  isVisible
}) => {
  const { isDark } = useTheme();
  const duration = differenceInDays(tracker.endDate, tracker.startDate) + 1;

  const getStatusIcon = () => {
    switch (tracker.status) {
      case 'completed':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'in_progress':
        return <PlayCircle size={14} className="text-blue-500" />;
      case 'not_started':
        return <PauseCircle size={14} className="text-gray-500" />;
      default:
        return <AlertCircle size={14} className="text-yellow-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (tracker.priority) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y - 10,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
          className={`
            px-3 py-2 rounded-lg shadow-lg border max-w-xs
            ${isDark 
              ? 'bg-gray-900 border-gray-700 text-gray-100' 
              : 'bg-white border-gray-200 text-gray-900'
            }
          `}
          transition={{ duration: 0.15 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm truncate mr-2">{tracker.title}</h4>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              tracker.type === 'project' ? 'bg-blue-100 text-blue-800' :
              tracker.type === 'feature' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {tracker.type}
            </span>
          </div>

          {/* Status and Priority */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <span className="text-xs capitalize">{tracker.status.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Flag size={12} className={getPriorityColor()} />
              <span className={`text-xs capitalize ${getPriorityColor()}`}>
                {tracker.priority}
              </span>
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center space-x-1 mb-2">
            <Calendar size={12} className="text-gray-500" />
            <span className="text-xs">
              {format(tracker.startDate, 'MMM d')} - {format(tracker.endDate, 'MMM d')}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center space-x-1 mb-2">
            <Clock size={12} className="text-gray-500" />
            <span className="text-xs">
              {duration} day{duration !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Description */}
          {tracker.description && (
            <p className="text-xs opacity-80 mt-1 line-clamp-2">
              {tracker.description}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Interactive feedback for drag operations
interface DragFeedbackProps {
  isDragging: boolean;
  isValidDrop: boolean;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
  position: { x: number; y: number };
}

export const DragFeedback: React.FC<DragFeedbackProps> = ({
  isDragging,
  isValidDrop,
  dragType,
  position
}) => {
  const { isDark } = useTheme();

  const getMessage = () => {
    if (!dragType) return '';
    
    if (dragType === 'move') {
      return isValidDrop ? 'Drop to move tracker' : 'Cannot drop here';
    } else {
      return isValidDrop ? `Resize ${dragType}` : 'Invalid resize position';
    }
  };

  const getIcon = () => {
    switch (dragType) {
      case 'move':
        return '✋';
      case 'resize-start':
        return '↔️';
      case 'resize-end':
        return '↔️';
      default:
        return '👆';
    }
  };

  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            position: 'fixed',
            left: position.x + 20,
            top: position.y - 40,
            zIndex: 10000,
            pointerEvents: 'none'
          }}
          className={`
            px-3 py-2 rounded-lg shadow-lg text-sm font-medium
            ${isValidDrop 
              ? (isDark ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800')
              : (isDark ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800')
            }
          `}
        >
          <div className="flex items-center space-x-2">
            <span>{getIcon()}</span>
            <span>{getMessage()}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Click ripple effect
interface RippleEffectProps {
  x: number;
  y: number;
  color?: string;
  onComplete?: () => void;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  x,
  y,
  color = '#3B82F6',
  onComplete
}) => {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 0,
        height: 0,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: 0.3,
        pointerEvents: 'none'
      }}
      animate={{
        width: 100,
        height: 100,
        x: -50,
        y: -50,
        opacity: 0
      }}
      transition={{
        duration: 0.6,
        ease: 'easeOut'
      }}
      onAnimationComplete={onComplete}
    />
  );
};

// Hover interaction wrapper
interface HoverInteractionProps {
  children: React.ReactNode;
  tracker?: ProjectTracker;
  onHover?: (isHovered: boolean) => void;
  onClick?: (event: React.MouseEvent) => void;
  showTooltip?: boolean;
  showRipple?: boolean;
  className?: string;
}

export const HoverInteraction: React.FC<HoverInteractionProps> = ({
  children,
  tracker,
  onHover,
  onClick,
  showTooltip = true,
  showRipple = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [rippleId, setRippleId] = useState(0);

  const handleMouseEnter = (event: React.MouseEvent) => {
    setIsHovered(true);
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY - 60
    });
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(false);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isHovered && showTooltip) {
      setTooltipPosition({
        x: event.clientX,
        y: event.clientY - 60
      });
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    if (showRipple) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = { id: rippleId, x, y };
      setRipples(prev => [...prev, newRipple]);
      setRippleId(prev => prev + 1);
    }
    
    onClick?.(event);
  };

  const handleRippleComplete = (id: number) => {
    setRipples(prev => prev.filter(ripple => ripple.id !== id));
  };

  return (
    <>
      <motion.div
        className={`relative overflow-hidden ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
        whileTap={{
          scale: 0.98,
          transition: { duration: 0.1 }
        }}
      >
        {children}
        
        {/* Ripple effects */}
        <AnimatePresence>
          {ripples.map(ripple => (
            <RippleEffect
              key={ripple.id}
              x={ripple.x}
              y={ripple.y}
              onComplete={() => handleRippleComplete(ripple.id)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Tooltip */}
      {showTooltip && tracker && (
        <TrackerTooltip
          tracker={tracker}
          position={tooltipPosition}
          isVisible={isHovered}
        />
      )}
    </>
  );
};

// Selection feedback
interface SelectionFeedbackProps {
  isSelected: boolean;
  selectionCount: number;
  position: { x: number; y: number };
}

export const SelectionFeedback: React.FC<SelectionFeedbackProps> = ({
  isSelected,
  selectionCount,
  position
}) => {
  const { isDark } = useTheme();

  return (
    <AnimatePresence>
      {isSelected && selectionCount > 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          style={{
            position: 'absolute',
            right: -8,
            top: -8,
            zIndex: 100
          }}
          className={`
            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}
          `}
        >
          {selectionCount}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Focus indicator for keyboard navigation
interface FocusIndicatorProps {
  isFocused: boolean;
  className?: string;
}

export const FocusIndicator: React.FC<FocusIndicatorProps> = ({
  isFocused,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {isFocused && (
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className={`
            absolute inset-0 border-2 border-blue-500 rounded-md pointer-events-none
            ${className}
          `}
          style={{
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)'
          }}
          transition={{ duration: 0.15 }}
        />
      )}
    </AnimatePresence>
  );
};

// Loading pulse effect
interface LoadingPulseProps {
  isLoading: boolean;
  className?: string;
  children: React.ReactNode;
}

export const LoadingPulse: React.FC<LoadingPulseProps> = ({
  isLoading,
  className = '',
  children
}) => {
  return (
    <motion.div
      animate={isLoading ? {
        opacity: [1, 0.5, 1],
        scale: [1, 1.02, 1]
      } : {
        opacity: 1,
        scale: 1
      }}
      transition={{
        duration: 1.5,
        repeat: isLoading ? Infinity : 0,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Success checkmark animation
export const SuccessCheckmark: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#10B981'
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: 0.1
      }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
    </motion.svg>
  );
};