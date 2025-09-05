import React from 'react';
import { motion } from 'framer-motion';
import { Bug, TrendingDown, TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';
import { useDashboardTheme, dashboardAnimations, getMotionPreferences } from '../../lib/dashboardTheme';
import { Bug as BugType } from '../../types';

interface BugSeverity {
  level: 'critical' | 'high' | 'medium' | 'low';
  count: number;
  trend: number; // Percentage change from last period
  color: string;
  bgColor: string;
  borderColor: string;
}

interface BugSeverityBreakdownProps {
  projectBugs?: BugType[];
  severityData?: BugSeverity[];
  onSeverityClick?: (severity: string) => void;
  onViewAll?: () => void;
  className?: string;
}

const BugSeverityBreakdown: React.FC<BugSeverityBreakdownProps> = ({ 
  projectBugs = [],
  severityData,
  onSeverityClick,
  onViewAll,
  className = '' 
}) => {
  const theme = useDashboardTheme();
  const motionPrefs = getMotionPreferences();

  // Filter bugs to only include open and in-progress ones
  const activeBugs = projectBugs.filter(bug => 
    bug.status === 'open' || bug.status === 'in-progress'
  );

  // Count bugs by severity level
  const bugCounts = {
    critical: activeBugs.filter(bug => bug.severity === 'critical').length,
    high: activeBugs.filter(bug => bug.severity === 'high').length,
    medium: activeBugs.filter(bug => bug.severity === 'medium').length,
    low: activeBugs.filter(bug => bug.severity === 'low').length,
  };

  // Create severity data from real bug counts
  const defaultSeverityData: BugSeverity[] = [
    {
      level: 'critical',
      count: bugCounts.critical,
      trend: -25, // TODO: Calculate real trend later
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-500/30',
    },
    {
      level: 'high',
      count: bugCounts.high,
      trend: -12, // TODO: Calculate real trend later
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      borderColor: 'border-orange-500/30',
    },
    {
      level: 'medium',
      count: bugCounts.medium,
      trend: 5, // TODO: Calculate real trend later
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      borderColor: 'border-yellow-500/30',
    },
    {
      level: 'low',
      count: bugCounts.low,
      trend: 8, // TODO: Calculate real trend later
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500/30',
    },
  ];

  const bugData = severityData || defaultSeverityData;
  const totalBugs = bugData.reduce((sum, item) => sum + item.count, 0);

  const getSeverityLabel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return AlertTriangle;
      default:
        return Bug;
    }
  };

  return (
    <motion.div
      className={`${theme.cardBackground} ${theme.border} border p-4 sm:p-5 md:p-6 ${className}`}
      variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.item}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${theme.primaryBackground} text-white`}>
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg sm:text-xl font-semibold ${theme.text}`}>
              Bug Severity Breakdown
            </h3>
            <p className={`text-sm ${theme.textMuted}`}>
              {totalBugs} total bugs across all severities
            </p>
          </div>
        </div>
        
        <motion.button
          onClick={onViewAll}
          className={`
            flex items-center gap-2 px-3 py-1.5 text-xs font-medium
            ${theme.secondaryBackground} ${theme.textMuted}
            hover:${theme.hoverBackground}
            transition-colors duration-200
            border ${theme.border}
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View All Bugs
          <ArrowRight className="w-3 h-3" />
        </motion.button>
      </div>

      {/* Horizontal Bar Chart */}
      <motion.div
        className="mb-6"
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.fadeInDelayed(0.3)}
        initial="hidden"
        animate="visible"
      >
        <div className={`w-full h-8 ${theme.secondaryBackground} overflow-hidden flex`}>
          {bugData.map((severity, index) => {
            const percentage = totalBugs > 0 ? (severity.count / totalBugs) * 100 : 0;
            
            return (
              <motion.div
                key={severity.level}
                className={`
                  ${severity.bgColor} 
                  cursor-pointer 
                  transition-all duration-200 
                  hover:opacity-80
                  flex items-center justify-center
                  relative
                  group
                `}
                style={{ width: `${percentage}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.5 + index * 0.1,
                  ease: 'easeOut'
                }}
                onClick={() => onSeverityClick?.(severity.level)}
                whileHover={{ scale: 1.02 }}
              >
                {/* Tooltip */}
                <div className={`
                  absolute -top-12 left-1/2 transform -translate-x-1/2
                  ${theme.cardBackground} ${theme.border} border
                  px-2 py-1 text-xs font-medium
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  pointer-events-none
                  z-10
                `}>
                  {severity.count} {getSeverityLabel(severity.level)}
                </div>
                
                {/* Count label (only show if segment is wide enough) */}
                {percentage > 15 && (
                  <span className="text-white text-xs font-bold">
                    {severity.count}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Severity Details Grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.staggeredList}
        initial="hidden"
        animate="visible"
      >
        {bugData.map((severity) => {
          const Icon = getSeverityIcon(severity.level);
          const isImproving = severity.trend < 0;
          const TrendIcon = isImproving ? TrendingDown : TrendingUp;

          return (
            <motion.div
              key={severity.level}
              className={`
                ${theme.secondaryBackground} 
                border ${severity.borderColor}
                p-3 sm:p-4
                transition-all duration-200
                hover:scale-[1.02]
                ${theme.shadowHover}
                cursor-pointer
                group
              `}
              variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.listItem}
              onClick={() => onSeverityClick?.(severity.level)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 ${severity.bgColor}/10 border ${severity.borderColor}`}>
                  <Icon className={`w-4 h-4 ${severity.color}`} />
                </div>
                
                {/* Trend Indicator */}
                <div className={`
                  flex items-center gap-1 text-xs font-medium
                  ${isImproving ? 'text-green-500' : 'text-red-500'}
                `}>
                  <TrendIcon className="w-3 h-3" />
                  {Math.abs(severity.trend)}%
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <h4 className={`font-medium text-sm ${theme.text} capitalize`}>
                  {severity.level}
                </h4>
                <div className="flex items-end justify-between">
                  <span className={`text-2xl font-bold ${severity.color}`}>
                    {severity.count}
                  </span>
                  <span className={`text-xs ${theme.textMuted}`}>
                    bugs
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className={`w-full h-1 ${theme.secondaryBackground} overflow-hidden`}>
                  <motion.div
                    className={`h-full ${severity.bgColor}`}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: totalBugs > 0 ? `${(severity.count / totalBugs) * 100}%` : '0%' 
                    }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.8,
                      ease: 'easeOut'
                    }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        className={`
          mt-4 sm:mt-5 md:mt-6 
          p-3 sm:p-4 
          ${theme.secondaryBackground} 
          border ${theme.border}
          grid grid-cols-2 gap-4
        `}
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.fadeInDelayed(1.0)}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center">
          <p className={`text-2xl font-bold ${theme.text}`}>
            {bugData.filter(b => b.level === 'critical' || b.level === 'high').reduce((sum, b) => sum + b.count, 0)}
          </p>
          <p className={`text-xs ${theme.textMuted}`}>
            High Priority
          </p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${theme.text}`}>
            {Math.round(bugData.reduce((sum, b) => sum + b.trend, 0) / bugData.length)}%
          </p>
          <p className={`text-xs ${theme.textMuted}`}>
            Avg. Trend
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BugSeverityBreakdown;