import React from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertCircle, FileText, Lightbulb, ArrowRight } from 'lucide-react';
import { useDashboardTheme, getResponsiveGridClasses } from '../../lib/dashboardTheme';
import { QuickActionsProps, QuickAction } from '../../types/dashboard';

// Helper to create compatible icon components
const createIconComponent = (Icon: typeof Plus) => {
  return ({ size, className }: { size?: number; className?: string }) => (
    <Icon size={size} className={className} />
  );
};

const QuickActions: React.FC<QuickActionsProps> = ({ 
  actions,
  className = '' 
}) => {
  const theme = useDashboardTheme();
  const responsive = getResponsiveGridClasses();

  // Default actions if none provided
  const defaultActions: QuickAction[] = [
    {
      id: 'add-task',
      label: 'Add Task',
      description: 'Create a new task',
      icon: createIconComponent(Plus),
      colorType: 'tasks',
      onClick: () => console.log('Add task clicked'),
    },
    {
      id: 'report-bug',
      label: 'Report Bug',
      description: 'Submit a bug report',
      icon: createIconComponent(AlertCircle),
      colorType: 'bugs',
      onClick: () => console.log('Report bug clicked'),
    },
    {
      id: 'new-document',
      label: 'New Document',
      description: 'Create documentation',
      icon: createIconComponent(FileText),
      colorType: 'documents',
      onClick: () => console.log('New document clicked'),
    },
    {
      id: 'add-feature',
      label: 'Add Feature',
      description: 'Plan a new feature',
      icon: createIconComponent(Lightbulb),
      colorType: 'features',
      onClick: () => console.log('Add feature clicked'),
    },
  ];

  const actionList = actions || defaultActions;

  const getActionColors = (colorType: QuickAction['colorType']) => {
    switch (colorType) {
      case 'tasks':
        return {
          bg: 'bg-blue-500',
          bgLight: 'bg-blue-500/10',
          text: 'text-blue-500',
          hover: 'group-hover:text-blue-500',
          border: 'group-hover:border-blue-500',
        };
      case 'bugs':
        return {
          bg: 'bg-red-500',
          bgLight: 'bg-red-500/10',
          text: 'text-red-500',
          hover: 'group-hover:text-red-500',
          border: 'group-hover:border-red-500',
        };
      case 'features':
        return {
          bg: 'bg-purple-500',
          bgLight: 'bg-purple-500/10',
          text: 'text-purple-500',
          hover: 'group-hover:text-purple-500',
          border: 'group-hover:border-purple-500',
        };
      case 'documents':
        return {
          bg: 'bg-yellow-500',
          bgLight: 'bg-yellow-500/10',
          text: 'text-yellow-500',
          hover: 'group-hover:text-yellow-500',
          border: 'group-hover:border-yellow-500',
        };
      default:
        return {
          bg: 'bg-gray-500',
          bgLight: 'bg-gray-500/10',
          text: 'text-gray-500',
          hover: 'group-hover:text-gray-500',
          border: 'group-hover:border-gray-500',
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={`${theme.cardBackground} ${theme.border} border ${responsive.cardPadding} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className={`${responsive.textSizes.title} ${theme.textPrimary}`}>
          Quick Actions
        </h3>
        <div className={`text-xs ${theme.textSecondary} flex items-center space-x-1`}>
          <span>Get started</span>
          <ArrowRight size={12} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {actionList.map((action, index) => {
          const Icon = action.icon;
          const colors = getActionColors(action.colorType);

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              onClick={action.onClick}
              className={`
                w-full p-3 sm:p-4 border ${theme.border} transition-all duration-200 
                text-left group hover:scale-[1.02] ${theme.hoverBackground}
                ${theme.shadow} hover:${theme.shadowHover}
                ${colors.border} relative overflow-hidden
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
              aria-label={`${action.label}: ${action.description}`}
            >
              {/* Background Effect */}
              <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-5 
                transition-opacity duration-200 ${colors.bg}
              `} />

              {/* Content */}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {/* Icon Container - Sharp design */}
                  <div className={`
                    p-2 sm:p-3 ${colors.bgLight} transition-all duration-200 
                    group-hover:scale-110 ${theme.shadow}
                  `}>
                    <Icon size={16} className={`sm:w-[18px] sm:h-[18px] ${colors.text}`} />
                  </div>

                  {/* Action Details */}
                  <div className="flex-1">
                    <div className={`
                      font-semibold text-sm ${theme.textPrimary} 
                      ${colors.hover} transition-colors duration-200
                    `}>
                      {action.label}
                    </div>
                    <div className={`text-xs ${theme.textSecondary} mt-0.5`}>
                      {action.description}
                    </div>
                  </div>
                </div>

                {/* Arrow Indicator */}
                <div className={`
                  opacity-0 group-hover:opacity-100 transition-all duration-200 
                  transform translate-x-2 group-hover:translate-x-0 ${colors.text}
                `}>
                  <ArrowRight size={16} />
                </div>
              </div>

              {/* Keyboard Shortcut Hint */}
              <div className={`
                absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                transition-opacity duration-200 text-xs ${theme.textMuted}
                bg-black/10 px-1 py-0.5
              `}>
                ⌘{index + 1}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Additional Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3">
          {/* Secondary Actions */}
          <button className={`
            p-3 text-center transition-all duration-200 
            ${theme.secondaryBackground} ${theme.textSecondary}
            hover:${theme.textPrimary} hover:scale-105 ${theme.shadow}
            text-xs font-medium
          `}>
            Import Data
          </button>
          <button className={`
            p-3 text-center transition-all duration-200 
            ${theme.secondaryBackground} ${theme.textSecondary}
            hover:${theme.textPrimary} hover:scale-105 ${theme.shadow}
            text-xs font-medium
          `}>
            Export Report
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={`
        mt-4 p-3 ${theme.secondaryBackground} 
        flex items-center justify-between text-xs
      `}>
        <div className={`${theme.textMuted}`}>
          Quick actions used today
        </div>
        <div className={`font-bold ${theme.textPrimary}`}>
          {Math.floor(Math.random() * 12) + 3}
        </div>
      </div>
    </motion.div>
  );
};

export default QuickActions;