import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Sidebar } from './components/Sidebar';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useAuth } from './hooks/useAuth';
import { useSupabaseProjects } from './hooks/useSupabaseProjects';
import { useTheme } from './contexts/ThemeContext';
import { Project } from './types';

function App() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { projects, createProject, loading: projectsLoading } = useSupabaseProjects();
  const { isDark } = useTheme();
  
  // All hooks must be called before any conditional returns
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);

  // Initialize with first project or show welcome state
  useEffect(() => {
    if (projects.length > 0 && !activeProject) {
      setActiveProject(projects[0]);
    }
  }, [projects, activeProject]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className={`h-screen flex items-center justify-center`} style={{ backgroundColor: isDark ? '#09090b' : '#f3f4f6' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show landing page
  if (!isAuthenticated) {
    if (showAuthPage) {
      return (
        <AuthPage
          onBack={() => setShowAuthPage(false)}
          onSuccess={() => setShowAuthPage(false)}
        />
      );
    }
    
    return (
      <LandingPage onGetStarted={() => setShowAuthPage(true)} />
    );
  }

  const handleCreateProject = (name: string, description: string, icon: string, color: string) => {
    const newProject = createProject(name, description, icon, color);
    setActiveProject(newProject);
  };

  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
  };

  const WelcomeScreen = () => (
    <div className={`flex-1 relative overflow-hidden`} style={{ backgroundColor: isDark ? '#1a1a1a' : '#f9fafb' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5"></div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className={`border-b px-8 py-6`} style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Welcome to ProjectFlow
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Let's get you started with your first project
                </p>
              </div>
            </div>
            
            <div className={`px-4 py-2 border rounded-lg text-sm font-medium`} style={{ 
              backgroundColor: isDark ? '#1f2937' : '#f0fdf4', 
              color: isDark ? '#10b981' : '#059669',
              borderColor: isDark ? '#374151' : '#bbf7d0'
            }}>
              ✓ Account Ready
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl"
          >
            {/* Hero Icon */}
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-600 to-gray-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <span className="text-5xl">🎯</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-sm">✨</span>
              </div>
            </div>
            
            {/* Main Message */}
            <h2 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Ready to Build Something Amazing?
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8 leading-relaxed`}>
              ProjectFlow helps engineering teams ship faster with Discord-style navigation, 
              real-time collaboration, and developer-focused workflows.
            </p>
            
            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className={`p-6 rounded-xl border shadow-sm`} style={{ 
                backgroundColor: isDark ? '#111111' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }}>
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Task Management</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Kanban boards, sprint planning, and developer workflows</p>
              </div>
              
              <div className={`p-6 rounded-xl border shadow-sm`} style={{ 
                backgroundColor: isDark ? '#111111' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }}>
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Documentation</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>PRDs, technical specs, and team knowledge base</p>
              </div>
              
              <div className={`p-6 rounded-xl border shadow-sm`} style={{ 
                backgroundColor: isDark ? '#111111' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }}>
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Team Chat</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Real-time communication with context</p>
              </div>
            </div>
            
            {/* CTA */}
            <div className="space-y-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🚀 Create Your First Project
              </button>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Takes less than 30 seconds to get started
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Stats */}
        <div className={`border-t px-8 py-4`} style={{ 
          backgroundColor: isDark ? 'rgba(17, 17, 17, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }}>
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Supabase Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Real-time Sync</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Enterprise Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Show loading while projects are loading
  if (projectsLoading) {
    return (
      <div className={`h-screen flex items-center justify-center`} style={{ backgroundColor: isDark ? '#09090b' : '#f3f4f6' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex overflow-hidden`} style={{ backgroundColor: isDark ? '#09090b' : '#f3f4f6' }}>
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        onProjectSelect={handleProjectSelect}
        onCreateProject={() => setShowCreateModal(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeProject ? (
          <motion.div
            key={activeProject.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <ProjectWorkspace project={activeProject} />
          </motion.div>
        ) : (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <WelcomeScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />

      {/* Connection Status */}
      <ConnectionStatus />
    </div>
  );
}

export default App;