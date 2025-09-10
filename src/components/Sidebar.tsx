import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, ChevronLeft, ChevronRight, LogOut, MoreVertical, Trash2, Edit, Check, X, Copy } from 'lucide-react';
import { Project } from '../types';
import { useAuth } from '../hooks/useAuth';
import { SettingsModal } from './SettingsModal';

interface SidebarProps {
  projects: Project[];
  activeProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onViewDocs?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProject,
  onProjectSelect,
  onCreateProject,
  onDeleteProject,
  onUpdateProject,
  collapsed,
  onToggleCollapse,
  onViewDocs,
}) => {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openMenuId) return;
      
      const target = event.target as Node;
      const dropdown = dropdownRefs.current[openMenuId];
      const button = buttonRefs.current[openMenuId];
      
      // Don't close if clicking on the dropdown or the button
      if (dropdown?.contains(target) || button?.contains(target)) {
        return;
      }
      
      setOpenMenuId(null);
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

  const handleMenuToggle = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent project selection
    
    if (openMenuId === projectId) {
      setOpenMenuId(null);
    } else {
      const buttonElement = buttonRefs.current[projectId];
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        setMenuPosition({
          top: rect.top,
          left: rect.right + 8 // 8px margin from the button
        });
      }
      setOpenMenuId(projectId);
    }
  };

  const handleDeleteClick = (project: Project, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteConfirmProject(project);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmProject) {
      await onDeleteProject(deleteConfirmProject.id);
      setDeleteConfirmProject(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmProject(null);
  };

  const handleRenameClick = (project: Project, event: React.MouseEvent) => {
    event.stopPropagation();
    setRenamingProjectId(project.id);
    setRenameValue(project.name);
    setOpenMenuId(null);
    // Focus the input after state update
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 0);
  };

  const handleRenameSave = async (project: Project) => {
    const trimmedName = renameValue.trim();
    
    // Validation checks
    if (!onUpdateProject || trimmedName === '' || trimmedName === project.name) {
      handleRenameCancel();
      return;
    }
    
    // Check if name is too long
    if (trimmedName.length > 50) {
      console.error('Project name too long (max 50 characters)');
      return;
    }
    
    // Check for duplicate names
    if (projects.some(p => p.id !== project.id && p.name.toLowerCase() === trimmedName.toLowerCase())) {
      console.error('A project with this name already exists');
      return;
    }

    try {
      await onUpdateProject(project.id, { name: trimmedName });
      setRenamingProjectId(null);
      setRenameValue('');
    } catch (error) {
      console.error('Error renaming project:', error);
      // Reset to original name on error
      setRenameValue(project.name);
    }
  };

  const handleRenameCancel = () => {
    setRenamingProjectId(null);
    setRenameValue('');
  };

  const handleRenameKeyPress = (event: React.KeyboardEvent, project: Project) => {
    if (event.key === 'Enter') {
      handleRenameSave(project);
    } else if (event.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleCopyProjectId = async (project: Project, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(project.id);
      setOpenMenuId(null);
      // You could add a toast notification here if desired
      console.log('Project ID copied to clipboard:', project.id);
    } catch (error) {
      console.error('Failed to copy project ID:', error);
    }
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
                className="relative"
              >
                {renamingProjectId === project.id ? (
                  // Rename mode - no nested buttons
                  <div
                    className={`w-full flex items-center rounded-lg transition-all ${
                      activeProject?.id === project.id
                        ? 'bg-gray-600 shadow-lg'
                        : 'bg-gray-700'
                    }`}
                    style={{ height: '56px', padding: '12px' }}
                  >
                    <div
                      className="rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                      style={{ width: '32px', height: '32px', backgroundColor: project.color }}
                    >
                      {project.icon}
                    </div>
                    
                    <div className="min-w-0 flex-1 ml-3 relative">
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => handleRenameKeyPress(e, project)}
                        className="w-full bg-gray-800 text-white text-sm px-2 py-1 pr-14 rounded border border-gray-600 focus:border-gray-400 focus:outline-none"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        <button
                          onClick={() => handleRenameSave(project)}
                          className="p-0.5 hover:bg-gray-600 rounded text-green-400 hover:text-green-300 w-5 h-5 flex items-center justify-center"
                          title="Save"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={handleRenameCancel}
                          className="p-0.5 hover:bg-gray-600 rounded text-red-400 hover:text-red-300 w-5 h-5 flex items-center justify-center"
                          title="Cancel"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Normal mode - with project selection button
                  <div
                    className={`w-full flex items-center rounded-lg transition-all ${
                      activeProject?.id === project.id
                        ? 'bg-gray-600 shadow-lg'
                        : 'hover:bg-gray-700'
                    }`}
                    style={{ height: '56px', padding: '12px' }}
                  >
                    {/* Project selection button - takes up most of the space */}
                    <button
                      onClick={() => onProjectSelect(project)}
                      className="flex items-center min-w-0 flex-1 text-left"
                      title={collapsed ? project.name : undefined}
                    >
                      {/* Project icon - always centered when collapsed */}
                      {collapsed ? (
                        <div className="w-full flex justify-center">
                          <div
                            className="rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                            style={{ width: '32px', height: '32px', backgroundColor: project.color }}
                          >
                            {project.icon}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center min-w-0 flex-1">
                          <div
                            className="rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                            style={{ width: '32px', height: '32px', backgroundColor: project.color }}
                          >
                            {project.icon}
                          </div>
                          
                          <div className="min-w-0 flex-1 ml-3">
                            <div className="font-medium text-sm truncate text-white">
                              {project.name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {project.description}
                            </div>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* 3-dots menu button - separate button, not nested */}
                    {!collapsed && (
                      <button
                        ref={(el) => (buttonRefs.current[project.id] = el)}
                        onClick={(e) => handleMenuToggle(project.id, e)}
                        className="flex-shrink-0 ml-2 p-1 hover:bg-gray-600 rounded transition-colors opacity-70 hover:opacity-100"
                        title="Project options"
                      >
                        <MoreVertical size={16} className="text-gray-300" />
                      </button>
                    )}
                  </div>
                )}

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

      {/* Dropdown menu - positioned globally outside sidebar */}
      <AnimatePresence>
        {!collapsed && openMenuId && (
          <motion.div
            ref={(el) => (dropdownRefs.current[openMenuId] = el)}
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl min-w-[160px]"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`
            }}
          >
            <div className="p-1">
              <button
                onClick={(e) => {
                  const project = projects.find(p => p.id === openMenuId);
                  if (project) handleRenameClick(project, e);
                }}
                className="w-full flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 hover:text-white transition-colors rounded-lg text-sm font-medium mb-1"
              >
                <Edit size={16} className="mr-2" />
                Rename
              </button>
              <button
                onClick={(e) => {
                  const project = projects.find(p => p.id === openMenuId);
                  if (project) handleCopyProjectId(project, e);
                }}
                className="w-full flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 hover:text-white transition-colors rounded-lg text-sm font-medium mb-1"
              >
                <Copy size={16} className="mr-2" />
                Copy project ID
              </button>
              <button
                onClick={(e) => {
                  const project = projects.find(p => p.id === openMenuId);
                  if (project) handleDeleteClick(project, e);
                }}
                className="w-full flex items-center px-3 py-2 text-white bg-red-600 hover:bg-red-700 transition-colors rounded-lg text-sm font-medium"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Project
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onViewDocs={onViewDocs}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center">
                    <Trash2 size={20} className="text-red-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Delete Project
                  </h3>
                  <p className="text-gray-300 text-sm mb-1">
                    Are you sure you want to delete "{deleteConfirmProject.name}"?
                  </p>
                  <p className="text-red-400 text-xs mb-6">
                    This action cannot be undone. All documents, tasks, features, and bugs associated with this project will be permanently deleted.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelDelete}
                      className="flex-1 px-4 py-2 text-sm border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Project
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};