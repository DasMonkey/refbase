import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { Sidebar } from './components/Sidebar';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ChatBubble } from './components/ChatBubble';
import { ChatBubbleErrorBoundary } from './components/ChatBubbleErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import { useSupabaseProjects } from './hooks/useSupabaseProjects';
import { useTheme } from './contexts/ThemeContext';
import { Project } from './types';

function App() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { projects, createProject, deleteProject, updateProject, loading: projectsLoading } = useSupabaseProjects();
  const { isDark } = useTheme();

  // Handle /dashboard redirect after OAuth
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/dashboard' && isAuthenticated && !authLoading) {
      // Clear the /dashboard from URL and show the main dashboard
      window.history.replaceState(null, '', '/');
    }
  }, [isAuthenticated, authLoading]);
  
  // Helper functions for URL hash state management
  const getStateFromHash = () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return {
      projectId: params.get('project'),
      tab: params.get('tab')
    };
  };

  const updateHashState = (projectId?: string, tab?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.set('project', projectId);
    if (tab) params.set('tab', tab);
    
    const hashString = params.toString();
    const newHash = hashString ? `#${hashString}` : '';
    
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', window.location.pathname + newHash);
    }
  };

  // All hooks must be called before any conditional returns
  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    // Try to restore from URL hash first, then localStorage
    const hashState = getStateFromHash();
    const projectId = hashState.projectId || localStorage.getItem('activeProjectId');
    return projectId ? { id: projectId } as Project : null;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [showDocumentationPage, setShowDocumentationPage] = useState(false);
  
  // AI Chat state management
  const [aiChatOpen, setAiChatOpen] = useState<boolean>(false);
  const [forceShowAiChat, setForceShowAiChat] = useState<boolean>(false);
  
  // Anti-flash loading state with minimum display time
  const [showStableLoading, setShowStableLoading] = useState(true);
  const loadingStartTime = useRef<number>(Date.now());

  // Handle chat bubble click - toggle functionality
  const handleChatBubbleClick = React.useCallback(() => {
    const newState = !aiChatOpen;
    setForceShowAiChat(newState);
    setAiChatOpen(newState);
  }, [aiChatOpen]);

  // Handle AI chat state changes from ProjectWorkspace - must be defined before any conditional returns
  const handleAiChatStateChange = React.useCallback((isOpen: boolean) => {
    setAiChatOpen(isOpen);
    if (!isOpen) {
      setForceShowAiChat(false);
    }
  }, []);

  // Handle force show AI chat changes - must be defined before any conditional returns
  const handleForceShowAiChatChange = React.useCallback((show: boolean) => {
    setForceShowAiChat(show);
    setAiChatOpen(show);
  }, []);

  // Track user activity for background sync
  useEffect(() => {
    const updateActivity = () => {
      (window as unknown as { lastUserActivity: number }).lastUserActivity = Date.now();
    };

    // Track various user interactions
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    
    // Initialize
    updateActivity();

    return () => {
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Save active project to localStorage and URL hash
  useEffect(() => {
    if (activeProject?.id) {
      localStorage.setItem('activeProjectId', activeProject.id);
      const hashState = getStateFromHash();
      updateHashState(activeProject.id, hashState.tab);
    }
  }, [activeProject?.id]);

  // Initialize with saved project or first project or show welcome state
  useEffect(() => {
    if (projects.length > 0) {
      // Try to get project ID from URL hash first, then localStorage
      const hashState = getStateFromHash();
      const targetProjectId = hashState.projectId || localStorage.getItem('activeProjectId');
      
      if (targetProjectId) {
        // Try to find the target project
        const targetProject = projects.find(p => p.id === targetProjectId);
        if (targetProject && (!activeProject || activeProject.id !== targetProject.id)) {
          setActiveProject(targetProject);
          return;
        }
      }
      
      // Fallback to first project if no saved project or saved project not found
      if (!activeProject) {
        setActiveProject(projects[0]);
      }
    } else {
      // Clear activeProject when no projects exist
      if (activeProject) {
        setActiveProject(null);
        localStorage.removeItem('activeProjectId');
      }
    }
  }, [projects, activeProject]);

  // Anti-flash loading logic with minimum display time
  // Also show loading if on /dashboard route (OAuth callback) while auth is resolving
  const isOnDashboardRoute = window.location.pathname === '/dashboard';
  const isActuallyLoading = authLoading || projectsLoading || (isOnDashboardRoute && !isAuthenticated);
  
  useEffect(() => {
    if (!isActuallyLoading) {
      // Ensure loading screen shows for at least 300ms to prevent flash
      const elapsed = Date.now() - loadingStartTime.current;
      const minLoadingTime = 300;
      
      if (elapsed < minLoadingTime) {
        setTimeout(() => {
          setShowStableLoading(false);
        }, minLoadingTime - elapsed);
      } else {
        setShowStableLoading(false);
      }
    } else {
      setShowStableLoading(true);
      loadingStartTime.current = Date.now();
    }
  }, [isActuallyLoading]);
  
  const shouldShowLoading = showStableLoading;
  if (shouldShowLoading) {
    return (
      <div className={`h-screen flex items-center justify-center`} style={{ backgroundColor: isDark ? '#09090b' : '#f3f4f6' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show documentation page if requested
  if (showDocumentationPage) {
    return (
      <DocumentationPage onBack={() => setShowDocumentationPage(false)} />
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
    // Prevent unnecessary re-renders if the same project is selected
    if (activeProject?.id !== project.id) {
      setActiveProject(project);
    }
  };

  const handleViewDocs = () => {
    setShowDocumentationPage(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      
      // If the deleted project was the active project, switch to another one or clear active project
      if (activeProject?.id === projectId) {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        if (remainingProjects.length > 0) {
          setActiveProject(remainingProjects[0]);
        } else {
          setActiveProject(null);
          localStorage.removeItem('activeProjectId');
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      // You could add a toast notification here for error feedback
    }
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
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Welcome to Refbase
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
            {/* Main Message */}
            <h2 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Your Knowledge Base Starts Here
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8 leading-relaxed`}>
              Refbase helps engineering teams capture, organize, and share knowledge with 
              AI-powered search, conversation tracking, and bug management.
            </p>
            
            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className={`p-6 rounded-xl border shadow-sm`} style={{ 
                backgroundColor: isDark ? '#111111' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }}>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Conversations</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Save and search conversations with AI-powered insights</p>
              </div>
              
              <div className={`p-6 rounded-xl border shadow-sm`} style={{ 
                backgroundColor: isDark ? '#111111' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }}>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Features</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Track working solutions with code examples and patterns</p>
              </div>
              
              <div className={`p-6 rounded-xl border shadow-sm`} style={{ 
                backgroundColor: isDark ? '#111111' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }}>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">🐛</span>
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Bug Management</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Document, track, and resolve issues systematically</p>
              </div>
            </div>
            
            {/* CTA */}
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📊 Create Your First Project
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDocumentationPage(true)}
                  className={`px-6 py-3 border rounded-lg transition-all font-medium ${
                    isDark 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  📚 View Documentation
                </button>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
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
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Database Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>AI-Powered Search</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Knowledge Management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  return (
    <div className={`h-screen flex overflow-hidden`} style={{ backgroundColor: isDark ? '#09090b' : '#f3f4f6' }}>
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        onProjectSelect={handleProjectSelect}
        onCreateProject={() => setShowCreateModal(true)}
        onDeleteProject={handleDeleteProject}
        onUpdateProject={updateProject}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onViewDocs={handleViewDocs}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {projects.length > 0 && activeProject ? (
          <ProjectWorkspace 
            key={activeProject.id}
            project={activeProject}
            onAiChatStateChange={handleAiChatStateChange}
            forceShowAiChat={forceShowAiChat}
            onForceShowAiChatChange={handleForceShowAiChatChange}
            initialTab={getStateFromHash().tab}
            onTabChange={(tab) => updateHashState(activeProject.id, tab)}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />

      {/* Connection Status */}
      <ConnectionStatus />

      {/* Chat Bubble - Only show when user is authenticated and has projects */}
      {isAuthenticated && (
        <ChatBubbleErrorBoundary>
          <ChatBubble
            onClick={handleChatBubbleClick}
            isAiChatOpen={aiChatOpen}
          />
        </ChatBubbleErrorBoundary>
      )}
    </div>
  );
}

export default App;