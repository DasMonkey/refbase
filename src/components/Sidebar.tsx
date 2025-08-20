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
        className="text-white h-full flex flex-col border-r border-gray-700"
        style={{ backgroundColor: '#111111' }}
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ 
          duration: 0.3, 
          ease: "easeInOut" 
        }}
      >
        {/* Header */}
        <div className="border-b border-gray-700 flex items-center" style={{ padding: '16px', minHeight: '72px' }}>
          {collapsed ? (
            <div className="w-full flex justify-center">
              <button
                onClick={onToggleCollapse}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <img 
                  src="/refbase_logo.png" 
                  alt="Refbase" 
                  className="h-8 w-auto"
                />
              </div>
              <button
                onClick={onToggleCollapse}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Projects List */}
        <div 
          className="flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none'
          }}
        >
          <div className="space-y-2">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => onProjectSelect(project)}
                  className={`w-full flex items-center rounded-lg transition-all ${
                    activeProject?.id === project.id
                      ? 'bg-gray-600 shadow-lg'
                      : 'hover:bg-gray-700'
                  }`}
                  style={{ height: '56px', padding: '12px' }}
                  title={collapsed ? project.name : undefined}
                >
                  <div className="w-full flex items-center relative">
                    <motion.div
                      className="flex items-center absolute"
                      initial={false}
                      animate={{
                        x: collapsed ? '50%' : '0%',
                        translateX: collapsed ? '-50%' : '0%'
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ width: collapsed ? '32px' : 'auto' }}
                    >
                      <div
                        className="rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                        style={{ width: '32px', height: '32px', backgroundColor: project.color }}
                      >
                        {project.icon}
                      </div>
                      
                      <motion.div
                        className="min-w-0 text-left overflow-hidden"
                        style={{ 
                          height: '32px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center', 
                          marginLeft: '12px',
                          maxWidth: collapsed ? '0px' : '180px'
                        }}
                        initial={false}
                        animate={{
                          opacity: collapsed ? 0 : 1,
                          width: collapsed ? 0 : '180px'
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div 
                          className="font-medium text-sm truncate" 
                          style={{ 
                            lineHeight: '16px',
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {project.name}
                        </div>
                        <div 
                          className="text-xs text-gray-400 truncate" 
                          style={{ 
                            lineHeight: '12px',
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {project.description}
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>

          {/* Add Project Button */}
          <motion.button
            onClick={onCreateProject}
            className="w-full border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-500 hover:bg-gray-700 transition-all"
            style={{ marginTop: '16px', height: '56px', padding: '12px' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-full flex items-center relative">
              <motion.div
                className="flex items-center absolute"
                initial={false}
                animate={{
                  x: collapsed ? '50%' : '0%',
                  translateX: collapsed ? '-50%' : '0%'
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ width: collapsed ? '20px' : 'auto' }}
              >
                <Plus size={20} className="text-gray-400 flex-shrink-0" />
                
                <motion.span
                  className="text-gray-400 text-left overflow-hidden whitespace-nowrap"
                  style={{ marginLeft: '12px' }}
                  initial={false}
                  animate={{
                    opacity: collapsed ? 0 : 1,
                    width: collapsed ? 0 : 'auto'
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  New Project
                </motion.span>
              </motion.div>
            </div>
          </motion.button>
        </div>

        {/* User Info & Settings */}
        <div className="p-4 border-t border-gray-700">
          {/* User Info */}
          <div className="mb-3" style={{ minHeight: collapsed ? '0px' : 'auto' }}>
            <AnimatePresence mode="wait">
              {!collapsed && user && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
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
          </div>

          {/* Settings & Sign Out */}
          <div className="space-y-2">
            <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center hover:bg-gray-700 rounded-lg transition-colors"
              style={{ padding: '12px', minHeight: '48px' }}
              title={collapsed ? 'Settings' : undefined}
            >
              <Settings size={20} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0" style={{ marginLeft: collapsed ? '0' : '12px' }}>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="text-gray-400 overflow-hidden whitespace-nowrap block text-left"
                    >
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center hover:bg-gray-700 rounded-lg transition-colors"
              style={{ padding: '12px', minHeight: '48px' }}
              title={collapsed ? 'Sign Out' : undefined}
            >
              <LogOut size={20} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0" style={{ marginLeft: collapsed ? '0' : '12px' }}>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="text-gray-400 overflow-hidden whitespace-nowrap block text-left"
                    >
                      Sign Out
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
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