import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Users,
  Plus,
  ArrowUpRight,
  Target,
  Zap,
  Trophy,
  Star
} from 'lucide-react';
import { Project } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';

interface DashboardProps {
  project: Project;
}

export const Dashboard: React.FC<DashboardProps> = ({ project }) => {
  const { tasks, bugs, documents } = useSupabaseProjects();
  const { isDark } = useTheme();

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projectBugs = bugs.filter(b => b.projectId === project.id);
  const projectDocs = documents.filter(d => d.projectId === project.id);

  const completedTasks = projectTasks.filter(t => t.status === 'done').length;
  const openBugs = projectBugs.filter(b => b.status === 'open').length;
  const highPriorityTasks = projectTasks.filter(t => t.priority === 'high').length;

  const stats = [
    {
      label: 'Tasks',
      value: projectTasks.length,
      icon: Target,
      color: '#3b82f6',
      bgGradient: 'from-blue-500 to-blue-600',
      progress: projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0,
      subtitle: `${completedTasks} completed`,
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: Trophy,
      color: '#10b981',
      bgGradient: 'from-green-500 to-green-600',
      progress: projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0,
      subtitle: `${Math.round(projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0)}% done`,
    },
    {
      label: 'Open Bugs',
      value: openBugs,
      icon: Zap,
      color: '#ef4444',
      bgGradient: 'from-red-500 to-red-600',
      progress: projectBugs.length > 0 ? (openBugs / projectBugs.length) * 100 : 0,
      subtitle: `${projectBugs.length} total`,
    },
    {
      label: 'Documents',
      value: projectDocs.length,
      icon: Star,
      color: '#8b5cf6',
      bgGradient: 'from-purple-500 to-purple-600',
      progress: 75, // Static progress for demo
      subtitle: 'Knowledge base',
    },
  ];

  const recentActivity = [
    ...projectTasks.slice(0, 3).map(task => ({
      id: task.id,
      type: 'task',
      title: task.title,
      timestamp: task.updatedAt,
      status: task.status,
    })),
    ...projectBugs.slice(0, 2).map(bug => ({
      id: bug.id,
      type: 'bug',
      title: bug.title,
      timestamp: bug.updatedAt,
      status: bug.status,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  return (
    <div className={`p-6 space-y-6 overflow-y-auto h-full`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-2xl p-4 group cursor-pointer transition-all duration-300 hover:scale-105`}
              style={{ 
                background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}25 100%)`,
                border: `1px solid ${stat.color}30`
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full" style={{ backgroundColor: stat.color }}></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full" style={{ backgroundColor: stat.color }}></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.bgGradient} shadow-lg`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full`} style={{ 
                    backgroundColor: `${stat.color}20`,
                    color: stat.color 
                  }}>
                    +{Math.floor(Math.random() * 5) + 1}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </span>
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stat.label}
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {stat.subtitle}
                  </p>
                </div>

                {/* Mini Progress Bar */}
                <div className="mt-3">
                  <div className={`w-full h-1.5 rounded-full overflow-hidden`} style={{ backgroundColor: `${stat.color}20` }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: stat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Section - More Compact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`rounded-2xl p-6 border`}
        style={{ 
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Project Progress</h3>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium`} style={{
            backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
            color: isDark ? '#64748b' : '#475569'
          }}>
            <Trophy size={14} className="text-yellow-500" />
            <span>{Math.round((completedTasks / Math.max(projectTasks.length, 1)) * 100)}%</span>
          </div>
        </div>
        
        {/* Main Progress Bar */}
        <div className="mb-4">
          <div className={`w-full rounded-full h-3 overflow-hidden`} style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
            <motion.div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500 relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ 
                width: `${(completedTasks / Math.max(projectTasks.length, 1)) * 100}%` 
              }}
              transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </motion.div>
          </div>
          <div className={`flex justify-between text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <span>{completedTasks} completed</span>
            <span>{projectTasks.length} total tasks</span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`text-center p-3 rounded-xl`} style={{ 
            backgroundColor: isDark ? '#0f172a' : '#f8fafc'
          }}>
            <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{projectTasks.length - completedTasks}</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Remaining</div>
          </div>
          <div className={`text-center p-3 rounded-xl`} style={{ 
            backgroundColor: isDark ? '#0f172a' : '#f8fafc'
          }}>
            <div className="text-lg font-bold text-orange-500">{highPriorityTasks}</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>High Priority</div>
          </div>
          <div className={`text-center p-3 rounded-xl`} style={{ 
            backgroundColor: isDark ? '#0f172a' : '#f8fafc'
          }}>
            <div className="text-lg font-bold text-red-500">{openBugs}</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Open Bugs</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`rounded-2xl p-6 border`}
          style={{ 
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
            <button className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors`} style={{
              color: isDark ? '#64748b' : '#475569',
              backgroundColor: 'transparent'
            }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f1f5f9'}
               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              View All
            </button>
          </div>
          
          <div className="space-y-2">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <motion.div 
                  key={activity.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]`} 
                  style={{ 
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'task' ? 'bg-blue-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{activity.title}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {activity.type === 'task' ? 'Task' : 'Bug'} • {activity.status.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} font-medium`}>
                    {format(new Date(activity.timestamp), 'MMM d')}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium text-sm">No recent activity</p>
                <p className="text-xs">Start working to see activity</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`rounded-2xl p-6 border`}
          style={{ 
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}
        >
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Quick Actions</h3>
          <div className="space-y-3">
            <button className={`w-full p-4 border rounded-xl transition-all duration-200 text-left group hover:scale-[1.02]`} style={{ 
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
              backgroundColor: 'transparent'
            }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc'}
               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Plus size={16} className="text-blue-500" />
                </div>
                <div>
                  <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-blue-500 transition-colors`}>Add Task</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Create a new task</div>
                </div>
              </div>
            </button>
            
            <button className={`w-full p-4 border rounded-xl transition-all duration-200 text-left group hover:scale-[1.02]`} style={{ 
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
              backgroundColor: 'transparent'
            }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc'}
               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertCircle size={16} className="text-red-500" />
                </div>
                <div>
                  <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-red-500 transition-colors`}>Report Bug</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Submit a bug report</div>
                </div>
              </div>
            </button>

            <button className={`w-full p-4 border rounded-xl transition-all duration-200 text-left group hover:scale-[1.02]`} style={{ 
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
              backgroundColor: 'transparent'
            }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc'}
               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <FileText size={16} className="text-purple-500" />
                </div>
                <div>
                  <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-purple-500 transition-colors`}>New Document</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Create documentation</div>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};