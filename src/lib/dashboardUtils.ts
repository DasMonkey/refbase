/**
 * Dashboard Utility Functions
 * Helper functions for processing and calculating dashboard data
 */

import { format, isAfter } from 'date-fns';
import { Task, Bug, Document, Feature } from '../types';
import { 
  DashboardStats, 
  ProjectProgress, 
  ActivityItem, 
  MetricCard,
  BugSeverityData,
  FeaturePipelineData,
  PriorityTask,
  AILearningInsight
} from '../types/dashboard';
import { 
  Target, 
  Trophy, 
  Zap, 
  Star
} from 'lucide-react';
import React from 'react';

/**
 * Calculate dashboard statistics from project data
 */
export const calculateDashboardStats = (
  tasks: Task[],
  bugs: Bug[],
  documents: Document[],
  features: Feature[] = []
): DashboardStats => {
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const incompleteTasks = tasks.filter(t => t.status !== 'done').length; // Tasks that are NOT completed
  const openBugs = bugs.filter(b => b.status === 'open').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;

  return {
    totalTasks: incompleteTasks, // Show only incomplete tasks, not all tasks
    completedTasks,
    totalBugs: bugs.length,
    openBugs,
    totalFeatures: features.length,
    totalDocuments: documents.length,
    highPriorityTasks,
  };
};

/**
 * Calculate project progress metrics
 */
export const calculateProjectProgress = (
  tasks: Task[],
  bugs: Bug[]
): ProjectProgress => {
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
  const openBugs = bugs.filter(b => b.status === 'open').length;
  
  const completionPercentage = tasks.length > 0 
    ? Math.round((completedTasks / tasks.length) * 100) 
    : 0;

  return {
    completionPercentage,
    remainingTasks: tasks.length - completedTasks,
    highPriorityTasks,
    openBugs,
  };
};

/**
 * Generate recent activity from project data
 */
export const generateRecentActivity = (
  tasks: Task[],
  bugs: Bug[],
  documents: Document[],
  features: Feature[] = [],
  limit: number = 5
): ActivityItem[] => {
  const activities: ActivityItem[] = [
    ...tasks.map(task => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      timestamp: task.updatedAt.toISOString(),
      status: task.status,
    })),
    ...bugs.map(bug => ({
      id: bug.id,
      type: 'bug' as const,
      title: bug.title,
      timestamp: bug.updatedAt.toISOString(),
      status: bug.status,
    })),
    ...documents.map(doc => ({
      id: doc.id,
      type: 'document' as const,
      title: doc.title,
      timestamp: doc.updatedAt.toISOString(),
      status: 'active',
    })),
    ...features.map(feature => ({
      id: feature.id,
      type: 'feature' as const,
      title: feature.title,
      timestamp: feature.updatedAt.toISOString(),
      status: feature.status,
    })),
  ];

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

/**
 * Generate metric cards configuration
 */
export const generateMetricCards = (stats: DashboardStats, allTasks: Task[]): MetricCard[] => {
  // Calculate actual completion rate based on all tasks (completed + incomplete)
  const totalAllTasks = allTasks.length;
  const completionRate = totalAllTasks > 0 
    ? (stats.completedTasks / totalAllTasks) * 100 
    : 0;

  return [
    {
      label: 'Tasks',
      value: stats.totalTasks, // This now shows incomplete tasks only
      icon: Target as React.ComponentType<{ size?: number; className?: string }>,
      colorType: 'tasks',
      progress: completionRate, // Progress based on all tasks
      subtitle: `${stats.completedTasks} completed`,
      trend: {
        value: Math.floor(Math.random() * 5) + 1,
        isPositive: true,
      },
    },
    {
      label: 'Completed',
      value: stats.completedTasks,
      icon: Trophy as React.ComponentType<{ size?: number; className?: string }>,
      colorType: 'completed',
      progress: completionRate,
      subtitle: `${Math.round(completionRate)}% done`,
      trend: {
        value: Math.floor(Math.random() * 3) + 1,
        isPositive: true,
      },
    },
    {
      label: 'Open Bugs',
      value: stats.openBugs,
      icon: Zap as React.ComponentType<{ size?: number; className?: string }>,
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
      icon: Star as React.ComponentType<{ size?: number; className?: string }>,
      colorType: 'documents',
      progress: 75, // Static progress for demo
      subtitle: 'Knowledge base',
      trend: {
        value: Math.floor(Math.random() * 4) + 1,
        isPositive: true,
      },
    },
  ];
};

/**
 * Calculate bug severity breakdown
 */
export const calculateBugSeverityData = (bugs: Bug[]): BugSeverityData => {
  const severityCounts = bugs.reduce((acc, bug) => {
    const severity = bug.severity || 'medium';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    critical: severityCounts.critical || 0,
    high: severityCounts.high || 0,
    medium: severityCounts.medium || 0,
    low: severityCounts.low || 0,
    total: bugs.length,
  };
};

/**
 * Generate feature pipeline data
 */
export const generateFeaturePipelineData = (features: Feature[]): FeaturePipelineData => {
  const stageCounts = features.reduce((acc, feature) => {
    const stage = feature.status || 'planning';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    stages: [
      {
        stage: 'planning',
        count: stageCounts.planning || 0,
        label: 'Planning',
      },
      {
        stage: 'development',
        count: stageCounts.development || 0,
        label: 'Development',
      },
      {
        stage: 'testing',
        count: stageCounts.testing || 0,
        label: 'Testing',
      },
      {
        stage: 'complete',
        count: stageCounts.complete || 0,
        label: 'Complete',
      },
    ],
    totalFeatures: features.length,
  };
};

/**
 * Get priority tasks that need attention
 */
export const getPriorityTasks = (tasks: Task[], limit: number = 3): PriorityTask[] => {
  const highPriorityTasks = tasks
    .filter(task => task.priority === 'high' && task.status !== 'done')
    .sort((a, b) => {
      // Sort by due date if available, then by creation date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, limit);

  return highPriorityTasks.map(task => ({
    id: task.id,
    title: task.title,
    priority: task.priority as 'high' | 'critical',
    dueDate: task.dueDate?.toISOString(),
    status: task.status,
    isOverdue: task.dueDate ? isAfter(new Date(), task.dueDate) : false,
  }));
};

/**
 * Generate mock AI learning insights (placeholder for RefBase integration)
 */
export const generateAILearningInsights = (): AILearningInsight => {
  const conversationCount = Math.floor(Math.random() * 50) + 10;
  const successfulPatterns = Math.floor(conversationCount * 0.7);
  const learningScore = Math.floor(Math.random() * 40) + 60; // 60-100 range
  
  let effectiveness: 'low' | 'medium' | 'high' = 'medium';
  if (learningScore >= 85) effectiveness = 'high';
  else if (learningScore < 70) effectiveness = 'low';

  return {
    conversationCount,
    successfulPatterns,
    learningScore,
    effectiveness,
  };
};

/**
 * Format relative time for activity timestamps
 */
export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  
  return format(date, 'MMM d');
};

/**
 * Calculate trend percentage for metrics
 */
export const calculateTrend = (current: number, previous: number): { value: number; isPositive: boolean } => {
  if (previous === 0) return { value: 0, isPositive: true };
  
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    isPositive: change >= 0,
  };
};

/**
 * Get color intensity for heatmap visualization
 */
export const getHeatmapIntensity = (value: number, maxValue: number): number => {
  if (maxValue === 0) return 0;
  return Math.min(Math.max(value / maxValue, 0.1), 1);
};