import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Code, TestTube, Rocket, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useDashboardTheme, dashboardAnimations, getMotionPreferences } from '../../lib/dashboardTheme';

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

interface FeatureType {
  type: 'core' | 'enhancement' | 'integration' | 'ai';
  count: number;
  color: string;
}

interface FeaturePipelineProps {
  stages?: PipelineStage[];
  featureTypes?: FeatureType[];
  onStageClick?: (stageId: string) => void;
  onViewAll?: () => void;
  className?: string;
}

const FeaturePipeline: React.FC<FeaturePipelineProps> = ({ 
  stages,
  featureTypes,
  onStageClick,
  onViewAll,
  className = '' 
}) => {
  const theme = useDashboardTheme();
  const motionPrefs = getMotionPreferences();

  // Mock data for pipeline stages
  const defaultStages: PipelineStage[] = [
    {
      id: 'ideation',
      name: 'Ideation',
      description: 'Feature concepts and planning',
      count: 12,
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
      count: 8,
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
      count: 5,
      icon: TestTube,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500',
      borderColor: 'border-purple-500/30',
      status: 'blocked',
    },
    {
      id: 'deployment',
      name: 'Deployment',
      description: 'Ready for production release',
      count: 3,
      icon: Rocket,
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-500/30',
      status: 'active',
    },
  ];

  // Mock data for feature types
  const defaultFeatureTypes: FeatureType[] = [
    { type: 'core', count: 15, color: 'bg-blue-500' },
    { type: 'enhancement', count: 8, color: 'bg-green-500' },
    { type: 'integration', count: 3, color: 'bg-purple-500' },
    { type: 'ai', count: 2, color: 'bg-orange-500' },
  ];

  const pipelineData = stages || defaultStages;
  const typeData = featureTypes || defaultFeatureTypes;
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

      {/* Pipeline Flow */}
      <motion.div
        className="mb-6"
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.fadeInDelayed(0.3)}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between">
          {pipelineData.map((stage, index) => {
            const Icon = stage.icon;
            const StatusIcon = getStatusIcon(stage.status);
            const statusColor = getStatusColor(stage.status);
            const isLast = index === pipelineData.length - 1;

            return (
              <React.Fragment key={stage.id}>
                {/* Stage */}
                <motion.div
                  className={`
                    flex flex-col items-center
                    cursor-pointer group
                    transition-all duration-200
                  `}
                  onClick={() => onStageClick?.(stage.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  {/* Stage Circle */}
                  <div className={`
                    relative p-3 sm:p-4
                    ${stage.bgColor}/10 
                    border-2 ${stage.borderColor}
                    transition-all duration-200
                    group-hover:${stage.bgColor}/20
                    group-hover:scale-110
                  `}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stage.color}`} />
                    
                    {/* Status Indicator */}
                    <div className={`
                      absolute -top-1 -right-1
                      p-1 ${theme.cardBackground} border ${theme.border}
                    `}>
                      <StatusIcon className={`w-3 h-3 ${statusColor}`} />
                    </div>
                  </div>

                  {/* Stage Info */}
                  <div className="mt-2 text-center">
                    <h4 className={`text-xs sm:text-sm font-medium ${theme.text}`}>
                      {stage.name}
                    </h4>
                    <p className={`text-lg sm:text-xl font-bold ${stage.color} mt-1`}>
                      {stage.count}
                    </p>
                  </div>
                </motion.div>

                {/* Arrow Connector */}
                {!isLast && (
                  <motion.div
                    className="flex-1 flex items-center justify-center"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                  >
                    <div className={`w-full h-0.5 ${theme.border} relative`}>
                      <ArrowRight className={`
                        absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2
                        w-3 h-3 ${theme.textMuted}
                      `} />
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

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

      {/* Feature Types Breakdown */}
      <motion.div
        className={`
          p-3 sm:p-4 
          ${theme.secondaryBackground} 
          border ${theme.border}
        `}
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.fadeInDelayed(1.0)}
        initial="hidden"
        animate="visible"
      >
        <h4 className={`text-sm font-medium ${theme.text} mb-3`}>
          Feature Types Distribution
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {typeData.map((type) => (
            <div key={type.type} className="text-center">
              <div className={`w-full h-2 ${theme.secondaryBackground} overflow-hidden mb-2`}>
                <motion.div
                  className={`h-full ${type.color}`}
                  initial={{ width: 0 }}
                  animate={{ 
                    width: totalFeatures > 0 ? `${(type.count / totalFeatures) * 100}%` : '0%' 
                  }}
                  transition={{ 
                    duration: 0.8, 
                    delay: 1.2,
                    ease: 'easeOut'
                  }}
                />
              </div>
              <p className={`text-xs font-medium ${theme.text} capitalize`}>
                {type.type}
              </p>
              <p className={`text-lg font-bold ${theme.text}`}>
                {type.count}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FeaturePipeline;