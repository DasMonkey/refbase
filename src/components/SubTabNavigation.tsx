import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, BarChart3 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export type CalendarMode = 'calendar' | 'planner';

interface SubTabNavigationProps {
  currentMode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
}

export const SubTabNavigation: React.FC<SubTabNavigationProps> = ({
  currentMode,
  onModeChange
}) => {
  const { isDark } = useTheme();

  const tabs = [
    {
      id: 'calendar' as CalendarMode,
      label: 'Calendar',
      icon: Calendar,
      description: 'Events & Scheduling'
    },
    {
      id: 'planner' as CalendarMode,
      label: 'Planner',
      icon: BarChart3,
      description: 'Timeline Tracking'
    }
  ];

  return (
    <div className={`border-b px-6 py-3`} style={{
      backgroundColor: isDark ? '#111111' : '#ffffff',
      borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
    }}>
      <div className="flex space-x-1">
        {tabs.map((tab) => {
          const isActive = currentMode === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className={`
                relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2
                ${isActive 
                  ? `${isDark ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-100'}` 
                  : `${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Mode description */}
      <div className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        {tabs.find(tab => tab.id === currentMode)?.description}
      </div>
    </div>
  );
};