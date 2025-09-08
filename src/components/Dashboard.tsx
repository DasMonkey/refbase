import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useDashboardTheme, dashboardAnimations, getMotionPreferences } from '../lib/dashboardTheme';
import { calculateDashboardStats, calculateProjectProgress } from '../lib/dashboardUtils';
import { useTheme } from '../contexts/ThemeContext';
import StatsGrid from './dashboard/StatsGrid';
import ProjectProgress from './dashboard/ProjectProgress';
import BugSeverityBreakdown from './dashboard/BugSeverityBreakdown';
import FeaturePipeline from './dashboard/FeaturePipeline';

interface DashboardProps {
  project: Project;
  onNavigateToBugs?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ project, onNavigateToBugs }) => {
  const { tasks, bugs, documents, features, events } = useSupabaseProjects();
  const { isDark } = useTheme();
  const theme = useDashboardTheme();
  const motionPrefs = getMotionPreferences();

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projectBugs = bugs.filter(b => b.projectId === project.id);
  const projectDocs = documents.filter(d => d.projectId === project.id);
  const projectFeatures = features.filter(f => f.projectId === project.id);
  const projectEvents = events.filter(e => e.projectId === project.id);

  // Calculate dashboard stats using utility function
  const dashboardStats = calculateDashboardStats(projectTasks, projectBugs, projectDocs, projectFeatures);
  
  // Calculate project progress
  const projectProgress = calculateProjectProgress(projectTasks, projectBugs);



  return (
    <motion.div 
      className={`
        p-3 sm:p-4 md:p-6 
        space-y-4 sm:space-y-5 md:space-y-6 
        overflow-y-auto h-full 
        ${theme.background}
        ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}
        transition-all duration-200
      `}
      variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.container}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Grid - Enhanced Entrance Animation */}
      <motion.div 
        className="w-full"
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.item}
      >
        <StatsGrid stats={dashboardStats} allTasksCount={projectTasks.length} features={projectFeatures} events={projectEvents} />
      </motion.div>

      {/* Two-Column Layout - Project Progress & Bug Breakdown */}
      <motion.div 
        className="
          grid grid-cols-1 xl:grid-cols-2 
          gap-4 sm:gap-5 md:gap-6
          w-full
        "
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.staggeredList}
      >
        {/* Project Progress - Slide in from left */}
        <motion.div 
          className="w-full min-w-0 h-full"
          variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.slideInLeft}
        >
          <ProjectProgress 
            progress={projectProgress} 
            totalTasks={projectTasks.length}
            className="h-full"
          />
        </motion.div>

        {/* Bug Severity Breakdown - Slide in from right */}
        <motion.div 
          className="w-full min-w-0 h-full"
          variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.slideInRight}
        >
          <BugSeverityBreakdown 
            projectBugs={projectBugs}
            onSeverityClick={(severity) => console.log('Navigate to bugs:', severity)}
            onViewAll={onNavigateToBugs}
            className="h-full"
          />
        </motion.div>
      </motion.div>

      {/* Feature Pipeline - Full Width */}
      <motion.div 
        className="w-full"
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.slideInLeft}
      >
        <FeaturePipeline 
          features={projectFeatures}
          onStageClick={(stageId) => console.log('Navigate to stage:', stageId)}
          onViewAll={() => console.log('Navigate to features view')}
        />
      </motion.div>
    </motion.div>
  );
};