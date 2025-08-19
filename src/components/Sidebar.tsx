import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { Project } from '../types';
import { useAuth } from '../hooks/useAuth';
import { SettingsModal } from './SettingsModal';

interface SidebarProps {
  projects: Project[];
  activeProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onCreateProject: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProject,
  onProjectSelect,
  onCreateProject,
  collapsed,
  onToggleCollapse,
}) => {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <motion.div
        className={`text-white h-full flex flex-col border-r border-gray-700 ${
          collapsed ? 'w-18' : 'w-64'
        }`}
        style={{ backgroundColor: '#111111' }}
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ 
          duration: 0.3, 
          ease: "linear" 
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center"
              >
                <img 
                  src="/Dash-logo.png" 
                  alt="Dash" 
                  className="h-6 w-auto"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => onProjectSelect(project)}
                  className={`w-full flex items-center p-3 rounded-lg transition-all ${
                    activeProject?.id === project.id
                      ? 'bg-gray-600 shadow-lg'
                      : 'hover:bg-gray-700'
                  }`}
                  title={collapsed ? project.name : undefined}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0`}
                    style={{ backgroundColor: project.color }}
                  >
                    {project.icon}
                  </div>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="ml-3 text-left overflow-hidden"
                      >
                        <div className="font-medium text-sm truncate">
                          {project.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {project.description}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>

          {/* Add Project Button */}
          <motion.button
            onClick={onCreateProject}
            className={`w-full flex items-center p-3 mt-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-500 hover:bg-gray-700 transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={20} className="text-gray-400" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-3 text-gray-400"
                >
                  New Project
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* User Info & Settings */}
        <div className="p-4 border-t border-gray-700">
          {/* User Info */}
          <AnimatePresence mode="wait">
            {!collapsed && user && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "linear" }}
                className="mb-3 overflow-hidden"
              >
                <div className="p-2 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="text-sm font-medium text-white truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user.email}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings & Sign Out */}
          <div className="space-y-2">
            <button
              onClick={() => setShowSettings(true)}
              className={`w-full flex items-center hover:bg-gray-700 rounded-lg transition-colors ${
                collapsed ? 'justify-center p-2' : 'p-3'
              }`}
              title={collapsed ? 'Settings' : undefined}
            >
              <Settings size={20} className="text-gray-400" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: "linear" }}
                    className="ml-3 text-gray-400 overflow-hidden whitespace-nowrap"
                  >
                    Settings
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={handleSignOut}
              className={`w-full flex items-center hover:bg-gray-700 rounded-lg transition-colors ${
                collapsed ? 'justify-center p-2' : 'p-3'
              }`}
              title={collapsed ? 'Sign Out' : undefined}
            >
              <LogOut size={20} className="text-gray-400" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: "linear" }}
                    className="ml-3 text-gray-400 overflow-hidden whitespace-nowrap"
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};