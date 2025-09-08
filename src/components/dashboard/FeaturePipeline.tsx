import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Code, TestTube, Rocket, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useDashboardTheme, dashboardAnimations, getMotionPreferences } from '../../lib/dashboardTheme';
import { Feature } from '../../types';

interface PipelineStage {
  id: string;
  name: string;
  description: string;
  count: number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  status: 'active' | 'blocked' | 'completed';
}

interface FeaturePipelineProps {
  features: Feature[];
  stages?: PipelineStage[];
  featureTypes?: FeatureType[];
  onStageClick?: (stageId: string) => void;
  onViewAll?: () => void;
  className?: string;
}

const FeaturePipeline: React.FC<FeaturePipelineProps> = ({ 
  features,
  stages,
  featureTypes,
  onStageClick,
  onViewAll,
  className = '' 
}) => {
  const theme = useDashboardTheme();
  const motionPrefs = getMotionPreferences();

  // Calculate real feature counts by status
  const plannedCount = features.filter(f => f.status === 'planned').length;
  const inProgressCount = features.filter(f => f.status === 'in-progress').length;
  const testingCount = features.filter(f => f.status === 'testing').length;
  const implementedCount = features.filter(f => f.status === 'implemented').length;

  // Real data for pipeline stages based on database statuses
  const defaultStages: PipelineStage[] = [
    {
      id: 'ideation',
      name: 'Ideation',
      description: 'Feature concepts and planning',
      count: plannedCount,
      icon: Lightbulb,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      borderColor: 'border-yellow-500/30',
      status: 'active',
    },
    {
      id: 'development',
      name: 'Development',
      description: 'Active coding and implementation',
      count: inProgressCount,
      icon: Code,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500/30',
      status: 'active',
    },
    {
      id: 'testing',
      name: 'Testing',
      description: 'QA and validation phase',
      count: testingCount,
      icon: TestTube,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500',
      borderColor: 'border-purple-500/30',
      status: testingCount > 0 ? 'active' : 'blocked',
    },
    {
      id: 'deployment',
      name: 'Deployment',
      description: 'Ready for production release',
      count: implementedCount,
      icon: Rocket,
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-500/30',
      status: 'active',
    },
  ];

  const pipelineData = stages || defaultStages;
  const totalFeatures = pipelineData.reduce((sum, stage) => sum + stage.count, 0);

  const getStatusIcon = (status: PipelineStage['status']) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'blocked':
        return AlertCircle;
      case 'active':
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: PipelineStage['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'blocked':
        return 'text-red-500';
      case 'active':
      default:
        return 'text-blue-500';
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
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg sm:text-xl font-semibold ${theme.text}`}>
              Feature Pipeline
            </h3>
            <p className={`text-sm ${theme.textMuted}`}>
              {totalFeatures} features across development stages
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
          View Pipeline
          <ArrowRight className="w-3 h-3" />
        </motion.button>
      </div>



      {/* Stage Details Grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.staggeredList}
        initial="hidden"
        animate="visible"
      >
        {pipelineData.map((stage) => {
          const Icon = stage.icon;
          const percentage = totalFeatures > 0 ? (stage.count / totalFeatures) * 100 : 0;

          return (
            <motion.div
              key={stage.id}
              className={`
                ${theme.secondaryBackground} 
                border ${stage.borderColor}
                p-3 sm:p-4
                transition-all duration-200
                hover:scale-[1.02]
                ${theme.shadowHover}
                cursor-pointer
                group
              `}
              variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.listItem}
              onClick={() => onStageClick?.(stage.id)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 ${stage.bgColor}/10 border ${stage.borderColor}`}>
                  <Icon className={`w-4 h-4 ${stage.color}`} />
                </div>
                <span className={`text-xs font-medium ${theme.textMuted}`}>
                  {Math.round(percentage)}%
                </span>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <h4 className={`font-medium text-sm ${theme.text}`}>
                  {stage.name}
                </h4>
                <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                  {stage.description}
                </p>
                <div className="flex items-end justify-between mt-2">
                  <span className={`text-xl font-bold ${stage.color}`}>
                    {stage.count}
                  </span>
                  <span className={`text-xs ${theme.textMuted}`}>
                    features
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className={`w-full h-1 ${theme.secondaryBackground} overflow-hidden`}>
                  <motion.div
                    className={`h-full ${stage.bgColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
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

    </motion.div>
  );
};

export default FeaturePipeline;