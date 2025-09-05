import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, MessageSquare, Target, Zap, CheckCircle } from 'lucide-react';
import { useDashboardTheme, dashboardAnimations, getMotionPreferences } from '../../lib/dashboardTheme';

interface AIInsight {
  id: string;
  type: 'pattern' | 'success' | 'improvement' | 'trend';
  title: string;
  description: string;
  value: number;
  change: number;
  icon: React.ComponentType<any>;
}

interface AILearningInsightsProps {
  insights?: AIInsight[];
  className?: string;
}

const AILearningInsights: React.FC<AILearningInsightsProps> = ({ 
  insights,
  className = '' 
}) => {
  const theme = useDashboardTheme();
  const motionPrefs = getMotionPreferences();

  // Mock data for AI learning insights
  const defaultInsights: AIInsight[] = [
    {
      id: '1',
      type: 'pattern',
      title: 'Code Patterns Learned',
      description: 'Successful implementation patterns captured',
      value: 47,
      change: 12,
      icon: Brain,
    },
    {
      id: '2',
      type: 'success',
      title: 'AI Success Rate',
      description: 'Conversations leading to working solutions',
      value: 89,
      change: 5,
      icon: Target,
    },
    {
      id: '3',
      type: 'improvement',
      title: 'Learning Velocity',
      description: 'Rate of pattern recognition improvement',
      value: 73,
      change: 8,
      icon: TrendingUp,
    },
    {
      id: '4',
      type: 'trend',
      title: 'Active Conversations',
      description: 'AI conversations captured this week',
      value: 156,
      change: 23,
      icon: MessageSquare,
    },
  ];

  const insightData = insights || defaultInsights;

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'pattern':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'success':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'improvement':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'trend':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
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
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg sm:text-xl font-semibold ${theme.text}`}>
              AI Learning Insights
            </h3>
            <p className={`text-sm ${theme.textMuted}`}>
              RefBase AI learning loop performance
            </p>
          </div>
        </div>
        
        <motion.button
          className={`
            px-3 py-1.5 text-xs font-medium
            ${theme.secondaryBackground} ${theme.textMuted}
            hover:${theme.hoverBackground}
            transition-colors duration-200
            border ${theme.border}
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View Details
        </motion.button>
      </div>

      {/* Insights Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.staggeredList}
        initial="hidden"
        animate="visible"
      >
        {insightData.map((insight) => {
          const Icon = insight.icon;
          const colorClasses = getInsightColor(insight.type);
          const isPositive = insight.change > 0;

          return (
            <motion.div
              key={insight.id}
              className={`
                ${theme.secondaryBackground} 
                border ${theme.border}
                p-3 sm:p-4
                transition-all duration-200
                hover:scale-[1.02]
                ${theme.shadowHover}
                cursor-pointer
                group
              `}
              variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.listItem}
            >
              {/* Icon and Title */}
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 ${colorClasses} border`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className={`
                  flex items-center gap-1 text-xs font-medium
                  ${isPositive ? 'text-green-500' : 'text-red-500'}
                `}>
                  <TrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />
                  {isPositive ? '+' : ''}{insight.change}%
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <h4 className={`font-medium text-sm ${theme.text}`}>
                  {insight.title}
                </h4>
                <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                  {insight.description}
                </p>
              </div>

              {/* Value */}
              <div className="mt-3 flex items-end justify-between">
                <span className={`text-2xl font-bold ${theme.text}`}>
                  {insight.value}
                  {insight.type === 'success' || insight.type === 'improvement' ? '%' : ''}
                </span>
                
                {/* Progress indicator for percentage values */}
                {(insight.type === 'success' || insight.type === 'improvement') && (
                  <div className="flex-1 ml-3">
                    <div className={`w-full h-1.5 ${theme.secondaryBackground} overflow-hidden`}>
                      <motion.div
                        className={`h-full ${colorClasses.split(' ')[1]} opacity-70`}
                        initial={{ width: 0 }}
                        animate={{ width: `${insight.value}%` }}
                        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Learning Status */}
      <motion.div
        className={`
          mt-4 sm:mt-5 md:mt-6 
          p-3 sm:p-4 
          ${theme.secondaryBackground} 
          border ${theme.border}
        `}
        variants={motionPrefs.prefersReducedMotion ? motionPrefs.reducedMotion : dashboardAnimations.fadeInDelayed(0.8)}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className={`text-sm font-medium ${theme.text}`}>
              AI Learning Loop Active
            </p>
            <p className={`text-xs ${theme.textMuted}`}>
              Continuously improving from your coding conversations
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AILearningInsights;