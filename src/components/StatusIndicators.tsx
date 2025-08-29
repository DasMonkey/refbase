import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ProjectTracker } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { 
  CheckCircle, 
  PlayCircle, 
  PauseCircle, 
  AlertTriangle,
  Flag,
  Clock,
  Zap,
  Star,
  TrendingUp,
  Target,
  Calendar,
  Users
} from 'lucide-react';

// Status indicator variants
const statusVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: { scale: 0, opacity: 0 },
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Priority indicator variants
const priorityVariants: Variants = {
  critical: {
    scale: [1, 1.1, 1],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  high: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  medium: {
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  low: {
    opacity: 0.7
  }
};

// Status icon component
interface StatusIconProps {
  status: ProjectTracker['status'];
  size?: number;
  animated?: boolean;
  showPulse?: boolean;
}

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  size = 16,
  animated = true,
  showPulse = false
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: '#10B981', // Green
          bgColor: '#D1FAE5',
          label: 'Completed'
        };
      case 'in_progress':
        return {
          icon: PlayCircle,
          color: '#3B82F6', // Blue
          bgColor: '#DBEAFE',
          label: 'In Progress'
        };
      case 'not_started':
        return {
          icon: PauseCircle,
          color: '#6B7280', // Gray
          bgColor: '#F3F4F6',
          label: 'Not Started'
        };
      default:
        return {
          icon: AlertTriangle,
          color: '#F59E0B', // Yellow
          bgColor: '#FEF3C7',
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      variants={statusVariants}
      initial="initial"
      animate={showPulse && status === 'in_progress' ? 'pulse' : 'animate'}
      className="relative inline-flex items-center justify-center"
      title={config.label}
    >
      <Icon 
        size={size} 
        color={config.color}
        style={{
          filter: animated ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' : 'none'
        }}
      />
      
      {/* Background glow for in-progress items */}
      {status === 'in_progress' && showPulse && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: config.color }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />
      )}
    </motion.div>
  );
};

// Priority flag component
interface PriorityFlagProps {
  priority: ProjectTracker['priority'];
  size?: 'small' | 'medium' | 'large';
  style?: 'icon' | 'badge' | 'stripe';
  animated?: boolean;
}

export const PriorityFlag: React.FC<PriorityFlagProps> = ({
  priority,
  size = 'medium',
  style = 'icon',
  animated = true
}) => {
  const { isDark } = useTheme();

  const getPriorityConfig = () => {
    switch (priority) {
      case 'critical':
        return {
          color: '#EF4444', // Red
          bgColor: isDark ? '#7F1D1D' : '#FEE2E2',
          textColor: isDark ? '#FCA5A5' : '#DC2626',
          label: 'Critical',
          icon: Zap
        };
      case 'high':
        return {
          color: '#F97316', // Orange
          bgColor: isDark ? '#7C2D12' : '#FED7AA',
          textColor: isDark ? '#FB923C' : '#EA580C',
          label: 'High',
          icon: Flag
        };
      case 'medium':
        return {
          color: '#EAB308', // Yellow
          bgColor: isDark ? '#713F12' : '#FEF3C7',
          textColor: isDark ? '#FCD34D' : '#CA8A04',
          label: 'Medium',
          icon: Star
        };
      case 'low':
        return {
          color: '#22C55E', // Green
          bgColor: isDark ? '#14532D' : '#D1FAE5',
          textColor: isDark ? '#86EFAC' : '#16A34A',
          label: 'Low',
          icon: Target
        };
    }
  };

  const config = getPriorityConfig();
  const Icon = config.icon;

  const sizeClasses = {
    small: { icon: 12, text: 'text-xs', padding: 'px-1.5 py-0.5' },
    medium: { icon: 16, text: 'text-sm', padding: 'px-2 py-1' },
    large: { icon: 20, text: 'text-base', padding: 'px-3 py-1.5' }
  };

  const sizeConfig = sizeClasses[size];

  if (style === 'icon') {
    return (
      <motion.div
        variants={priorityVariants}
        animate={animated ? priority : 'low'}
        className="inline-flex items-center justify-center"
        title={`${config.label} Priority`}
      >
        <Icon 
          size={sizeConfig.icon} 
          color={config.color}
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
        />
      </motion.div>
    );
  }

  if (style === 'badge') {
    return (
      <motion.span
        variants={priorityVariants}
        animate={animated ? priority : 'low'}
        className={`
          inline-flex items-center space-x-1 rounded-full font-medium
          ${sizeConfig.text} ${sizeConfig.padding}
        `}
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor
        }}
        title={`${config.label} Priority`}
      >
        <Icon size={sizeConfig.icon - 2} />
        <span>{config.label}</span>
      </motion.span>
    );
  }

  if (style === 'stripe') {
    return (
      <motion.div
        variants={priorityVariants}
        animate={animated ? priority : 'low'}
        className="w-1 h-full rounded-full"
        style={{ backgroundColor: config.color }}
        title={`${config.label} Priority`}
      />
    );
  }

  return null;
};

// Progress indicator
interface ProgressIndicatorProps {
  tracker: ProjectTracker;
  showPercentage?: boolean;
  style?: 'bar' | 'circle' | 'dots';
  size?: 'small' | 'medium' | 'large';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  tracker,
  showPercentage = true,
  style = 'bar',
  size = 'medium'
}) => {
  const { isDark } = useTheme();
  
  // Calculate progress based on dates and status
  const calculateProgress = (): number => {
    const now = new Date();
    const start = new Date(tracker.startDate);
    const end = new Date(tracker.endDate);
    
    if (tracker.status === 'completed') return 100;
    if (tracker.status === 'not_started') return 0;
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / totalDuration) * 100);
  };

  const progress = calculateProgress();

  const getProgressColor = () => {
    if (progress >= 80) return '#10B981'; // Green
    if (progress >= 60) return '#3B82F6'; // Blue
    if (progress >= 40) return '#F59E0B'; // Yellow
    if (progress >= 20) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const progressColor = getProgressColor();

  if (style === 'bar') {
    const heights = { small: 'h-1', medium: 'h-2', large: 'h-3' };
    const height = heights[size];

    return (
      <div className="flex items-center space-x-2">
        <div className={`
          flex-1 rounded-full overflow-hidden
          ${height}
          ${isDark ? 'bg-gray-700' : 'bg-gray-200'}
        `}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`${height} rounded-full`}
            style={{ backgroundColor: progressColor }}
          />
        </div>
        {showPercentage && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs font-medium min-w-[3rem] text-right"
            style={{ color: progressColor }}
          >
            {progress}%
          </motion.span>
        )}
      </div>
    );
  }

  if (style === 'circle') {
    const sizes = { small: 24, medium: 32, large: 40 };
    const circleSize = sizes[size];
    const strokeWidth = size === 'small' ? 2 : 3;
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={circleSize}
          height={circleSize}
          className="transform -rotate-90"
        >
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke={isDark ? '#374151' : '#E5E7EB'}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <motion.circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            initial={{ strokeDasharray, strokeDashoffset: circumference }}
            animate={{ strokeDasharray, strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {showPercentage && (
          <span
            className="absolute text-xs font-medium"
            style={{ color: progressColor }}
          >
            {progress}%
          </span>
        )}
      </div>
    );
  }

  if (style === 'dots') {
    const dotCount = size === 'small' ? 5 : size === 'medium' ? 8 : 12;
    const filledDots = Math.round((progress / 100) * dotCount);

    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: dotCount }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`
              w-2 h-2 rounded-full
              ${i < filledDots ? '' : (isDark ? 'bg-gray-600' : 'bg-gray-300')}
            `}
            style={{
              backgroundColor: i < filledDots ? progressColor : undefined
            }}
          />
        ))}
        {showPercentage && (
          <span
            className="ml-2 text-xs font-medium"
            style={{ color: progressColor }}
          >
            {progress}%
          </span>
        )}
      </div>
    );
  }

  return null;
};

// Type indicator badge
interface TypeIndicatorProps {
  type: ProjectTracker['type'];
  size?: 'small' | 'medium' | 'large';
  style?: 'badge' | 'dot' | 'border';
}

export const TypeIndicator: React.FC<TypeIndicatorProps> = ({
  type,
  size = 'medium',
  style = 'badge'
}) => {
  const { isDark } = useTheme();

  const getTypeConfig = () => {
    switch (type) {
      case 'project':
        return {
          color: '#3B82F6', // Blue
          bgColor: isDark ? '#1E3A8A' : '#EBF8FF',
          textColor: isDark ? '#93C5FD' : '#1D4ED8',
          label: 'Project',
          icon: '📁'
        };
      case 'feature':
        return {
          color: '#10B981', // Green
          bgColor: isDark ? '#064E3B' : '#F0FDF4',
          textColor: isDark ? '#6EE7B7' : '#059669',
          label: 'Feature',
          icon: '✨'
        };
      case 'bug':
        return {
          color: '#EF4444', // Red
          bgColor: isDark ? '#7F1D1D' : '#FEF2F2',
          textColor: isDark ? '#FCA5A5' : '#DC2626',
          label: 'Bug',
          icon: '🐛'
        };
    }
  };

  const config = getTypeConfig();

  const sizeClasses = {
    small: { text: 'text-xs', padding: 'px-1.5 py-0.5', dot: 'w-2 h-2' },
    medium: { text: 'text-sm', padding: 'px-2 py-1', dot: 'w-3 h-3' },
    large: { text: 'text-base', padding: 'px-3 py-1.5', dot: 'w-4 h-4' }
  };

  const sizeConfig = sizeClasses[size];

  if (style === 'badge') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`
          inline-flex items-center space-x-1 rounded-full font-medium
          ${sizeConfig.text} ${sizeConfig.padding}
        `}
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor
        }}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </motion.span>
    );
  }

  if (style === 'dot') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`${sizeConfig.dot} rounded-full`}
        style={{ backgroundColor: config.color }}
        title={config.label}
      />
    );
  }

  if (style === 'border') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-1 h-full rounded-full"
        style={{ backgroundColor: config.color }}
        title={config.label}
      />
    );
  }

  return null;
};

// Combined status panel
interface StatusPanelProps {
  tracker: ProjectTracker;
  compact?: boolean;
  showProgress?: boolean;
  animated?: boolean;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  tracker,
  compact = false,
  showProgress = true,
  animated = true
}) => {
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <StatusIcon status={tracker.status} size={14} animated={animated} />
        <TypeIndicator type={tracker.type} size="small" style="dot" />
        <PriorityFlag priority={tracker.priority} size="small" style="stripe" animated={animated} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Status and type */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <StatusIcon 
            status={tracker.status} 
            animated={animated} 
            showPulse={tracker.status === 'in_progress'} 
          />
          <span className="text-sm font-medium capitalize">
            {tracker.status.replace('_', ' ')}
          </span>
        </div>
        <TypeIndicator type={tracker.type} size="small" />
      </div>

      {/* Priority */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Priority</span>
        <PriorityFlag priority={tracker.priority} style="badge" size="small" animated={animated} />
      </div>

      {/* Progress */}
      {showProgress && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">Progress</span>
          </div>
          <ProgressIndicator 
            tracker={tracker} 
            style="bar" 
            size="medium" 
            showPercentage={true}
          />
        </div>
      )}
    </motion.div>
  );
};

// Activity indicator (for recent activity)
export const ActivityIndicator: React.FC<{ 
  isActive: boolean; 
  color?: string;
  size?: number;
}> = ({ 
  isActive, 
  color = '#10B981',
  size = 8 
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="relative inline-flex"
        >
          <div 
            className="rounded-full"
            style={{ 
              width: size, 
              height: size, 
              backgroundColor: color 
            }}
          />
          <motion.div
            animate={{
              scale: [1, 2, 1],
              opacity: [1, 0, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut'
            }}
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: color }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};