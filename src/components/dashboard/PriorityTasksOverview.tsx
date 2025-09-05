import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ArrowRight, Flag, Calendar, User } from 'lucide-react';
import { useDashboardTheme, dashboardAnimations, getMotionPreferences } from '../../lib/dashboardTheme';
import { format, isAfter, differenceInDays } from 'date-fns';

interface PriorityTask {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium';
  dueDate: Date;
  assignee?: string;
  status: 'todo' | 'in_progress' | 'review';
  project: string;
}

interface PriorityTasksOverviewProps {
  tasks?: PriorityTask[];
  onTaskClick?: (taskId: string) => void;
  onViewAll?: () => void;
  className?: string;
}

const PriorityTasksOverview: React.FC<PriorityTasksOverviewProps> = ({ 
  tasks,
  onTaskClick,
  onViewAll,
  className = '' 
}) => {
  const theme = useDashboardTheme();
  const motionPrefs = getMotionPreferences();

  // Mock data for priority tasks
  const defaultTasks: PriorityTask[] = [
    {
      id: '1',
      title: 'Fix authentication bug in production',
      description: 'Users unable to login with OAuth providers',
      priority: 'critical',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      assignee: 'John Doe',
      status: 'in_progress',
      project: 'RefBase Core',
    },
    {
      id: '2',
      title: 'Implement AI conversation search',
      description: 'Add semantic search for captured conversations',
      priority: 'high',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      assignee: 'Jane Smith',
      status: 'todo',
      project: 'AI Features',
    },
    {
      id: '3',
      title: 'Update dashboard responsive design',
      description: 'Improve mobile experience for dashboard',
      priority: 'high',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      assignee: 'Mike Johnson',
      status: 'review',
      project: 'UI/UX',
    },
  ];

  const taskData = tasks || defaultTasks;
  const topTasks = taskData.slice(0, 3);

  const getPriorityColor = (priority: PriorityTask['priority']) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-500',
          badge: 'bg-red-500 text-white',
        };
      case 'high':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-500',
          badge: 'bg-orange-500 text-white',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-500',
          badge: 'bg-yellow-500 text-white',
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-500',
          badge: 'bg-gray-500 text-white',
        };
    }
  };

  const getStatusColor = (status: PriorityTask['status']) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'review':
        return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getDueDateStatus = (dueDate: Date) => {
    const daysUntilDue = differenceInDays(dueDate, new Date());
    const isOverdue = isAfter(new Date(), dueDate);
    
    if (isOverdue) {
      return { text: 'Overdue', color: 'text-red-500', urgent: true };
    } else if (daysUntilDue <= 1) {
      return { text: 'Due today', color: 'text-red-500', urgent: true };
    } else if (daysUntilDue <= 3) {
      return { text: `${daysUntilDue} days left`, color: 'text-orange-500', urgent: true };
    } else {
      return { text: `${daysUntilDue} days left`, color: theme.textMuted, urgent: false };
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
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg sm:text-xl font-semibold ${theme.text}`}>
              Priority Tasks
            </h3>
            <p className={`text-sm ${theme.textMuted}`}>
              Top {topTasks.length} high-priority items
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
          View All
          <ArrowRight className="w-3 h-3" />
        </motion.button>
      </div>

      {/* Tasks List */}
      <motion.div
        className="space-y-3 sm:space-y-4"
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.staggeredList}
        initial="hidden"
        animate="visible"
      >
        {topTasks.length > 0 ? (
          topTasks.map((task, index) => {
            const priorityColors = getPriorityColor(task.priority);
            const statusColors = getStatusColor(task.status);
            const dueDateStatus = getDueDateStatus(task.dueDate);

            return (
              <motion.div
                key={task.id}
                className={`
                  ${theme.secondaryBackground} 
                  border ${theme.border}
                  p-3 sm:p-4
                  transition-all duration-200
                  hover:scale-[1.01]
                  ${theme.shadowHover}
                  cursor-pointer
                  group
                  ${priorityColors.bg} ${priorityColors.border}
                `}
                variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.listItem}
                onClick={() => onTaskClick?.(task.id)}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Priority Badge */}
                    <span className={`
                      px-2 py-0.5 text-xs font-medium uppercase tracking-wide
                      ${priorityColors.badge}
                    `}>
                      {task.priority}
                    </span>
                    
                    {/* Status Badge */}
                    <span className={`
                      px-2 py-0.5 text-xs font-medium capitalize
                      border ${statusColors}
                    `}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Due Date Warning */}
                  {dueDateStatus.urgent && (
                    <div className={`flex items-center gap-1 ${dueDateStatus.color}`}>
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-xs font-medium">
                        {dueDateStatus.text}
                      </span>
                    </div>
                  )}
                </div>

                {/* Task Content */}
                <div className="space-y-2">
                  <h4 className={`font-medium text-sm ${theme.text} group-hover:${priorityColors.text} transition-colors`}>
                    {task.title}
                  </h4>
                  <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                    {task.description}
                  </p>
                </div>

                {/* Footer Row */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-opacity-20">
                  <div className="flex items-center gap-4 text-xs">
                    {/* Project */}
                    <span className={theme.textMuted}>
                      {task.project}
                    </span>
                    
                    {/* Assignee */}
                    {task.assignee && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className={theme.textMuted}>
                          {task.assignee}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className={`flex items-center gap-1 text-xs ${dueDateStatus.color}`}>
                    <Calendar className="w-3 h-3" />
                    <span>
                      {format(task.dueDate, 'MMM d')}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            className={`
              text-center 
              py-8 sm:py-10 md:py-12 
              px-4 sm:px-6 md:px-8
              ${theme.textMuted}
            `}
            variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.scaleUp}
          >
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">No Priority Tasks</p>
            <p className="text-xs">All caught up! Great work.</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PriorityTasksOverview;