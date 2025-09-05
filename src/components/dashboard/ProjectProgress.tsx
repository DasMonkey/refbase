import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useDashboardTheme, dashboardAnimations, getResponsiveGridClasses } from '../../lib/dashboardTheme';
import { ProjectProgressProps } from '../../types/dashboard';

const ProjectProgress: React.FC<ProjectProgressProps> = ({ 
  progress, 
  totalTasks, 
  className = '' 
}) => {
  const theme = useDashboardTheme();
  const responsive = getResponsiveGridClasses();

  const completionPercentage = progress.completionPercentage;
  const completedTasks = totalTasks - progress.remainingTasks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`${theme.cardBackground} ${theme.border} border ${responsive.cardPadding} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className={`${responsive.textSizes.title} ${theme.textPrimary}`}>
          Project Progress
        </h3>
        <div className={`
          flex items-center space-x-2 px-3 py-1 text-sm font-medium 
          ${theme.secondaryBackground} ${theme.textSecondary}
        `}>
          <Trophy size={14} className="text-yellow-500" />
          <span>{completionPercentage}%</span>
        </div>
      </div>

      {/* Main Progress Section */}
      <div className="mb-6">
        {/* Progress Bar - Sharp edges, no rounded corners */}
        <div className="mb-3">
          <div className={`w-full h-4 overflow-hidden ${theme.secondaryBackground} relative`}>
            <motion.div
              className="h-4 bg-gradient-to-r from-blue-500 to-green-500 relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ 
                delay: 0.6, 
                duration: 1.2, 
                ease: "easeOut" 
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 1.5,
                }}
                style={{ width: '50%' }}
              />
            </motion.div>
            
          </div>
        </div>

        {/* Progress Text */}
        <div className={`flex justify-between text-sm ${theme.textSecondary} mb-1`}>
          <span>{completedTasks} completed</span>
          <span>{totalTasks} total tasks</span>
        </div>

        {/* Progress Description */}
        <div className={`text-xs ${theme.textMuted}`}>
          {completionPercentage === 100 
            ? '🎉 All tasks completed!' 
            : completionPercentage >= 75 
            ? 'Almost there! Great progress.' 
            : completionPercentage >= 50 
            ? 'Good momentum, keep it up!' 
            : completionPercentage > 0 
            ? 'Getting started, nice work!' 
            : 'Ready to begin? Create your first task!'}
        </div>
      </div>

      {/* Stats Grid - Sharp design */}
      <div className={responsive.threeColumnGrid}>
        {/* Remaining Tasks */}
        <motion.div 
          className={`text-center p-2 sm:p-3 lg:p-4 ${theme.secondaryBackground} transition-all duration-200 hover:scale-105 ${theme.shadow}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          <div className={`text-lg sm:text-xl font-bold ${theme.textPrimary} mb-1`}>
            {progress.remainingTasks}
          </div>
          <div className={`text-xs font-medium ${theme.textSecondary} uppercase tracking-wide`}>
            Remaining
          </div>
          <div className="mt-2">
            <div className={`w-full h-1 ${theme.border} bg-gray-300`}>
              <div 
                className="h-1 bg-blue-500 transition-all duration-500"
                style={{ 
                  width: `${totalTasks > 0 ? (progress.remainingTasks / totalTasks) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* High Priority Tasks */}
        <motion.div 
          className={`text-center p-2 sm:p-3 lg:p-4 ${theme.secondaryBackground} transition-all duration-200 hover:scale-105 ${theme.shadow}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        >
          <div className="text-lg sm:text-xl font-bold text-orange-500 mb-1">
            {progress.highPriorityTasks}
          </div>
          <div className={`text-xs font-medium ${theme.textSecondary} uppercase tracking-wide`}>
            High Priority
          </div>
          <div className="mt-2">
            <div className={`w-full h-1 ${theme.border} bg-gray-300`}>
              <div 
                className="h-1 bg-orange-500 transition-all duration-500"
                style={{ 
                  width: `${totalTasks > 0 ? (progress.highPriorityTasks / totalTasks) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Open Bugs */}
        <motion.div 
          className={`text-center p-2 sm:p-3 lg:p-4 ${theme.secondaryBackground} transition-all duration-200 hover:scale-105 ${theme.shadow}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.3 }}
        >
          <div className="text-lg sm:text-xl font-bold text-red-500 mb-1">
            {progress.openBugs}
          </div>
          <div className={`text-xs font-medium ${theme.textSecondary} uppercase tracking-wide`}>
            Open Bugs
          </div>
          <div className="mt-2">
            <div className={`w-full h-1 ${theme.border} bg-gray-300`}>
              <div 
                className="h-1 bg-red-500 transition-all duration-500"
                style={{ 
                  width: `${progress.openBugs > 0 ? Math.min((progress.openBugs / 10) * 100, 100) : 0}%` 
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Progress Insights */}
      {totalTasks > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center space-x-2 ${theme.textSecondary}`}>
              <div className="w-2 h-2 bg-green-500"></div>
              <span>Completion Rate</span>
            </div>
            <div className={`font-medium ${theme.textPrimary}`}>
              {completionPercentage}%
            </div>
          </div>
          
          {progress.highPriorityTasks > 0 && (
            <div className="flex items-center justify-between text-sm mt-2">
              <div className={`flex items-center space-x-2 ${theme.textSecondary}`}>
                <div className="w-2 h-2 bg-orange-500"></div>
                <span>Priority Focus</span>
              </div>
              <div className={`font-medium ${theme.textPrimary}`}>
                {Math.round((progress.highPriorityTasks / totalTasks) * 100)}% high priority
              </div>
            </div>
          )}
          
          {progress.openBugs > 0 && (
            <div className="flex items-center justify-between text-sm mt-2">
              <div className={`flex items-center space-x-2 ${theme.textSecondary}`}>
                <div className="w-2 h-2 bg-red-500"></div>
                <span>Bug Impact</span>
              </div>
              <div className={`font-medium text-red-500`}>
                {progress.openBugs} bug{progress.openBugs !== 1 ? 's' : ''} need attention
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ProjectProgress;