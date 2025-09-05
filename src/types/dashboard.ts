/**
 * Dashboard Data Types
 * Type definitions for dashboard components and data structures
 */

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalBugs: number;
  openBugs: number;
  totalFeatures: number;
  totalDocuments: number;
  highPriorityTasks: number;
}

export interface ProjectProgress {
  completionPercentage: number;
  remainingTasks: number;
  highPriorityTasks: number;
  openBugs: number;
}

export interface ActivityItem {
  id: string;
  type: 'task' | 'bug' | 'document' | 'feature';
  title: string;
  status: string;
  timestamp: string;
}

export interface DashboardData {
  stats: DashboardStats;
  progress: ProjectProgress;
  recentActivity: ActivityItem[];
}

export interface MetricCard {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorType: 'tasks' | 'completed' | 'bugs' | 'features' | 'documents';
  progress: number;
  subtitle: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorType: 'tasks' | 'bugs' | 'features' | 'documents';
  onClick: () => void;
}

// New component interfaces for additional dashboard elements

export interface AILearningInsight {
  conversationCount: number;
  successfulPatterns: number;
  learningScore: number;
  effectiveness: 'low' | 'medium' | 'high';
}

export interface PriorityTask {
  id: string;
  title: string;
  priority: 'high' | 'critical';
  dueDate?: string;
  status: string;
  isOverdue: boolean;
}

export interface BugSeverityData {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface FeaturePipelineStage {
  stage: 'planning' | 'development' | 'testing' | 'complete';
  count: number;
  label: string;
}

export interface FeaturePipelineData {
  stages: FeaturePipelineStage[];
  totalFeatures: number;
}

// Component props interfaces

export interface StatsGridProps {
  stats: DashboardStats;
  className?: string;
}

export interface ProjectProgressProps {
  progress: ProjectProgress;
  totalTasks: number;
  className?: string;
}

export interface RecentActivityProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
  className?: string;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export interface AILearningInsightsProps {
  insights: AILearningInsight;
  className?: string;
}

export interface PriorityTasksProps {
  tasks: PriorityTask[];
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

export interface BugSeverityBreakdownProps {
  severityData: BugSeverityData;
  onSeverityClick?: (severity: string) => void;
  className?: string;
}

export interface FeaturePipelineProps {
  pipelineData: FeaturePipelineData;
  onStageClick?: (stage: string) => void;
  className?: string;
}