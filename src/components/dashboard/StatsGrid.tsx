import React from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, Zap, Star } from 'lucide-react';
import { useDashboardTheme, getSemanticColor, dashboardAnimations, getResponsiveGridClasses } from '../../lib/dashboardTheme';
import { StatsGridProps, MetricCard } from '../../types/dashboard';

const StatsGrid: React.FC<StatsGridProps> = ({ stats, className = '' }) => {
  const theme = useDashboardTheme();
  const responsive = getResponsiveGridClasses();

  // Generate metric cards with proper typing
  const metricCards: MetricCard[] = [
    {
      label: 'Tasks',
      value: stats.totalTasks,
      icon: Target,
      colorType: 'tasks',
      progress: stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0,
      subtitle: `${stats.completedTasks} completed`,
      trend: {
        value: Math.floor(Math.random() * 5) + 1,
        isPositive: true,
      },
    },
    {
      label: 'Completed',
      value: stats.completedTasks,
      icon: Trophy,
      colorType: 'completed',
      progress: stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0,
      subtitle: `${Math.round(stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0)}% done`,
      trend: {
        value: Math.floor(Math.random() * 3) + 1,
        isPositive: true,
      },
    },
    {
      label: 'Open Bugs',
      value: stats.openBugs,
      icon: Zap,
      colorType: 'bugs',
      progress: stats.totalBugs > 0 ? (stats.openBugs / stats.totalBugs) * 100 : 0,
      subtitle: `${stats.totalBugs} total`,
      trend: {
        value: Math.floor(Math.random() * 2) + 1,
        isPositive: false,
      },
    },
    {
      label: 'Documents',
      value: stats.totalDocuments,
      icon: Star,
      colorType: 'documents',
      progress: 75, // Static progress for demo
      subtitle: 'Knowledge base',
      trend: {
        value: Math.floor(Math.random() * 4) + 1,
        isPositive: true,
      },
    },
  ];

  const getColorClasses = (colorType: MetricCard['colorType']) => {
    switch (colorType) {
      case 'tasks':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-500',
          bgLight: 'bg-blue-500/10',
          gradient: 'from-blue-500 to-blue-600',
        };
      case 'completed':
        return {
          bg: 'bg-green-500',
          text: 'text-green-500',
          bgLight: 'bg-green-500/10',
          gradient: 'from-green-500 to-green-600',
        };
      case 'bugs':
        return {
          bg: 'bg-red-500',
          text: 'text-red-500',
          bgLight: 'bg-red-500/10',
          gradient: 'from-red-500 to-red-600',
        };
      case 'documents':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-500',
          bgLight: 'bg-yellow-500/10',
          gradient: 'from-yellow-500 to-yellow-600',
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-gray-500',
          bgLight: 'bg-gray-500/10',
          gradient: 'from-gray-500 to-gray-600',
        };
    }
  };

  return (
    <motion.div
      className={`${responsive.statsGrid} ${className}`}
      variants={dashboardAnimations.container}
      initial="hidden"
      animate="visible"
    >
      {metricCards.map((card, index) => {
        const Icon = card.icon;
        const colors = getColorClasses(card.colorType);

        return (
          <motion.div
            key={card.label}
            variants={dashboardAnimations.item}
            className={`
              ${theme.cardBackground} 
              ${theme.border} 
              border 
              p-3 sm:p-4 
              transition-all 
              duration-200 
              hover:scale-105 
              ${theme.shadowHover}
              cursor-pointer
              group
              relative
              overflow-hidden
            `}
          >
            {/* Background Pattern - Sharp geometric shapes */}
            <div className="absolute inset-0 opacity-5">
              <div className={`absolute top-0 right-0 w-20 h-20 ${colors.bg}`} />
              <div className={`absolute bottom-0 left-0 w-16 h-16 ${colors.bg}`} />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Header with icon and trend */}
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`p-1.5 sm:p-2 ${colors.bgLight} ${theme.shadow}`}>
                  <Icon size={14} className={`sm:w-4 sm:h-4 ${colors.text}`} />
                </div>
                <div 
                  className={`
                    text-xs 
                    font-bold 
                    px-1.5 sm:px-2 
                    py-0.5 sm:py-1 
                    ${colors.bgLight}
                    ${colors.text}
                  `}
                >
                  {card.trend?.isPositive ? '+' : '-'}{card.trend?.value}
                </div>
              </div>

              {/* Main content */}
              <div className="space-y-1">
                <div className="flex items-baseline space-x-1 sm:space-x-2">
                  <span className={`text-xl sm:text-2xl font-bold ${theme.textPrimary}`}>
                    {card.value}
                  </span>
                  <span className={`text-xs font-medium ${theme.textSecondary}`}>
                    {card.label}
                  </span>
                </div>
                <p className={`text-xs ${theme.textMuted}`}>
                  {card.subtitle}
                </p>
              </div>

              {/* Progress bar - Sharp edges, no rounded corners */}
              <div className="mt-3">
                <div className={`w-full h-1.5 overflow-hidden ${colors.bgLight}`}>
                  <motion.div
                    className={`h-full ${colors.bg}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${card.progress}%` }}
                    transition={{ 
                      delay: 0.5 + index * 0.1, 
                      duration: 0.8,
                      ease: 'easeOut'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Hover effect overlay */}
            <div className={`
              absolute 
              inset-0 
              ${colors.bgLight} 
              opacity-0 
              group-hover:opacity-5 
              transition-opacity 
              duration-200
            `} />
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default StatsGrid;