import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ExternalLink } from 'lucide-react';
import { useDashboardTheme, getActivityTypeColor, getResponsiveGridClasses } from '../../lib/dashboardTheme';
import { formatRelativeTime } from '../../lib/dashboardUtils';
import { RecentActivityProps } from '../../types/dashboard';

const RecentActivity: React.FC<RecentActivityProps> = ({ 
  activities, 
  onViewAll,
  className = '' 
}) => {
  const theme = useDashboardTheme();
  const responsive = getResponsiveGridClasses();

  const getActivityIcon = (type: string) => {
    // Return a square indicator instead of rounded
    return (
      <div className={`w-3 h-3 ${getActivityTypeColor(type)} flex-shrink-0`} />
    );
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'task':
        return 'Task';
      case 'bug':
        return 'Bug';
      case 'feature':
        return 'Feature';
      case 'document':
        return 'Document';
      default:
        return 'Activity';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
      case 'resolved':
        return 'text-green-500';
      case 'in-progress':
      case 'active':
        return 'text-blue-500';
      case 'blocked':
      case 'critical':
        return 'text-red-500';
      case 'pending':
      case 'review':
        return 'text-yellow-500';
      default:
        return theme.textSecondary;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`${theme.cardBackground} ${theme.border} border ${responsive.cardPadding} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className={`${responsive.textSizes.title} ${theme.textPrimary}`}>
          Recent Activity
        </h3>
        <button 
          onClick={onViewAll}
          className={`
            text-xs font-medium px-3 py-1 transition-all duration-200 
            ${theme.textSecondary} ${theme.hoverBackground} 
            hover:scale-105 ${theme.shadow}
            flex items-center space-x-1
          `}
        >
          <span>View All</span>
          <ExternalLink size={10} />
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className={`
                group relative p-3 sm:p-4 transition-all duration-200 
                ${theme.secondaryBackground} hover:scale-[1.02] 
                ${theme.shadowHover} cursor-pointer
                border-l-2 sm:border-l-4 border-transparent hover:border-blue-500
              `}
            >
              {/* Activity Content */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {/* Type Indicator - Square design */}
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <p className={`
                      font-medium text-sm ${theme.textPrimary} 
                      truncate group-hover:text-blue-500 transition-colors
                    `}>
                      {activity.title}
                    </p>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs ${theme.textSecondary}`}>
                        {getActivityTypeLabel(activity.type)}
                      </span>
                      <div className={`w-1 h-1 ${theme.textMuted} opacity-50`} />
                      <span className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status.replace('-', ' ').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex-shrink-0 ml-3">
                  <p className={`text-xs ${theme.textMuted} font-medium`}>
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-5 
                transition-opacity duration-200 bg-blue-500
              `} />
            </motion.div>
          ))
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className={`text-center py-12 ${theme.textMuted}`}
          >
            <div className={`
              w-16 h-16 mx-auto mb-4 ${theme.secondaryBackground} 
              flex items-center justify-center
            `}>
              <Clock className="w-8 h-8 opacity-30" />
            </div>
            <p className="font-medium text-sm mb-1">No recent activity</p>
            <p className="text-xs opacity-75">
              Start working on tasks and bugs to see activity here
            </p>
            
            {/* Call to Action */}
            <div className="mt-6 space-y-2">
              <button className={`
                text-xs px-4 py-2 ${theme.border} border 
                ${theme.textSecondary} hover:${theme.textPrimary} 
                transition-all duration-200 hover:scale-105
              `}>
                Create First Task
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Activity Summary */}
      {activities.length > 0 && (
        <div className={`
          mt-6 pt-4 border-t ${theme.border} 
          flex items-center justify-between text-xs
        `}>
          <div className={`${theme.textSecondary}`}>
            Showing {activities.length} recent activities
          </div>
          <div className="flex items-center space-x-4">
            {/* Activity Type Counts */}
            {['task', 'bug', 'feature', 'document'].map(type => {
              const count = activities.filter(a => a.type === type).length;
              if (count === 0) return null;
              
              return (
                <div key={type} className="flex items-center space-x-1">
                  <div className={`w-2 h-2 ${getActivityTypeColor(type)}`} />
                  <span className={`${theme.textMuted} capitalize`}>
                    {count} {type}{count !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RecentActivity;