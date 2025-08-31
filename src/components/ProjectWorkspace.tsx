import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  FileText, 
  CheckSquare, 
  Lightbulb,
  Bug, 
  Calendar, 
  FolderOpen, 
  MessageCircle,
  Moon,
  Sun
} from 'lucide-react';
import { Project, TabType } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { Dashboard } from './Dashboard';
import { DocumentsTab } from './DocumentsTab';
import { TasksTab } from './TasksTab';
import { FeaturesTab } from './FeaturesTab';
import { BugsTab } from './BugsTab';
import { CalendarTab } from './CalendarTab';
import { FilesTab } from './FilesTab';
import { ChatTab } from './ChatTab';
import { PromptInputBox } from './ui/ai-prompt-box';

interface ProjectWorkspaceProps {
  project: Project;
  onAiChatStateChange?: (isOpen: boolean) => void;
  forceShowAiChat?: boolean;
  onForceShowAiChatChange?: (show: boolean) => void;
}

const tabs = [
  { id: 'dashboard' as TabType, label: 'Dashboard', icon: Home, shortcut: '1' },
  { id: 'docs' as TabType, label: 'Documents', icon: FileText, shortcut: '2' },
  { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare, shortcut: '3' },
  { id: 'features' as TabType, label: 'Features', icon: Lightbulb, shortcut: '4' },
  { id: 'bugs' as TabType, label: 'Bugs', icon: Bug, shortcut: '5' },
  { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar, shortcut: '6' },
  { id: 'files' as TabType, label: 'Files', icon: FolderOpen, shortcut: '7' },
  { id: 'chat' as TabType, label: 'Chat', icon: MessageCircle, shortcut: '8' },
];

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ 
  project,
  onAiChatStateChange,
  forceShowAiChat: externalForceShowAiChat = false,
  onForceShowAiChatChange
}) => {
  // Initialize activeTab from localStorage or default to 'dashboard'
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem(`activeTab_${project.id}`);
    return (saved as TabType) || 'dashboard';
  });


  const { isDark, toggleTheme } = useTheme();
  const { tasks, features, bugs, documents, files, messages } = useSupabaseProjects();

  // Note: Removed smart refresh system - will implement proper CRDT-based collaboration instead

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`activeTab_${project.id}`, activeTab);
  }, [activeTab, project.id]);
  const [isMac, setIsMac] = useState(false);
  const [aiChatVisible, setAiChatVisible] = useState(true);
  const [internalForceShowAiChat, setInternalForceShowAiChat] = useState(false);
  
  // Use external forceShowAiChat if provided, otherwise use internal state
  const forceShowAiChat = externalForceShowAiChat || internalForceShowAiChat;

  // Detect operating system
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`activeTab_${project.id}`, activeTab);
  }, [activeTab, project.id]);



  // Calculate if AI chat should be visible - now only based on forceShowAiChat
  const shouldShowAiChat = forceShowAiChat;

  // Notify parent component of AI chat state changes
  useEffect(() => {
    onAiChatStateChange?.(shouldShowAiChat);
  }, [shouldShowAiChat, onAiChatStateChange]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;
      
      if (isModifierPressed) {
        const pressedNumber = event.key;
        
        // Handle AI chat shortcut (Ctrl+0 / Cmd+0)
        if (pressedNumber === '0') {
          event.preventDefault();
          if (onForceShowAiChatChange) {
            onForceShowAiChatChange(true);
          } else {
            setInternalForceShowAiChat(true);
          }
          // Focus will be handled by the PromptInputBox component
          return;
        }
        
        // Handle tab shortcuts (1-7)
        const tab = tabs.find(t => t.shortcut === pressedNumber);
        if (tab) {
          event.preventDefault();
          setActiveTab(tab.id);
        }
      }
      
      // Hide AI chat when Escape is pressed (if it was force-shown)
      if (event.key === 'Escape' && forceShowAiChat) {
        event.preventDefault();
        if (onForceShowAiChatChange) {
          onForceShowAiChatChange(false);
        } else {
          setInternalForceShowAiChat(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMac, forceShowAiChat, onForceShowAiChatChange]);

  const renderTabContent = () => {
    return (
      <div className="h-full relative">
        <div 
          className="h-full absolute inset-0" 
          style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}
        >
          <Dashboard project={project} />
        </div>
        <div 
          className="h-full absolute inset-0" 
          style={{ display: activeTab === 'docs' ? 'block' : 'none' }}
        >
          <DocumentsTab project={project} />
        </div>
        <div 
          className="h-full absolute inset-0" 
          style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}
        >
          <TasksTab project={project} />
        </div>
        <div 
          className="h-full absolute inset-0" 
          style={{ display: activeTab === 'features' ? 'block' : 'none' }}
        >
          <FeaturesTab project={project} />
        </div>
        <div 
          className="h-full absolute inset-0" 
          style={{ display: activeTab === 'bugs' ? 'block' : 'none' }}
        >
          <BugsTab project={project} />
        </div>
        <div 
          className="h-full absolute inset-0" 
          style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}
        >
          <CalendarTab project={project} />
        </div>
        <div 
          className="h-full absolute inset-0" 
          style={{ display: activeTab === 'files' ? 'block' : 'none' }}
        >
          <FilesTab project={project} />
        </div>
        <div 
          className="h-full absolute inset-0" 
          style={{ display: activeTab === 'chat' ? 'block' : 'none' }}
        >
          <ChatTab project={project} />
        </div>
      </div>
    );
  };

  const handleAiMessage = async (message: string, files?: File[]) => {
    console.log('AI Message:', message);
    console.log('Files:', files);
    console.log('Project Context:', project);
    
    // Get project-specific data for AI context
    const projectContext = getProjectContext();
    
    // TODO: Send to AI API with full project context
    const aiRequest = {
      message,
      files,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        context: projectContext
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('AI Request with Context:', aiRequest);
    // TODO: Implement actual AI API call here
  };

  // Get comprehensive project context for AI
  const getProjectContext = () => {
    // Filter data for current project
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const projectFeatures = features.filter(f => f.projectId === project.id);
    const projectBugs = bugs.filter(b => b.projectId === project.id);
    const projectDocs = documents.filter(d => d.projectId === project.id);
    const projectFiles = files?.filter(f => f.projectId === project.id) || [];
    const projectMessages = messages.filter(m => m.projectId === project.id);
    
    return {
      tasks: {
        total: projectTasks.length,
        completed: projectTasks.filter(t => t.status === 'done').length,
        pending: projectTasks.filter(t => t.status !== 'done').length,
        highPriority: projectTasks.filter(t => t.priority === 'high').length,
        recentTasks: projectTasks.slice(0, 5).map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority
        }))
      },
      features: {
        total: projectFeatures.length,
        types: [...new Set(projectFeatures.map(f => f.type))],
        recentFeatures: projectFeatures.slice(0, 5).map(f => ({
          id: f.id,
          title: f.title,
          type: f.type
        }))
      },
      bugs: {
        total: projectBugs.length,
        open: projectBugs.filter(b => b.status === 'open').length,
        recentBugs: projectBugs.slice(0, 5).map(b => ({
          id: b.id,
          title: b.title,
          status: b.status,
          severity: b.severity
        }))
      },
      documents: {
        total: projectDocs.length,
        types: [...new Set(projectDocs.map(d => d.type))],
        recentDocs: projectDocs.slice(0, 5).map(d => ({
          id: d.id,
          title: d.title,
          type: d.type
        }))
      },
      files: {
        total: projectFiles.length,
        totalSize: projectFiles.reduce((sum, f) => sum + (f.size || 0), 0),
        types: [...new Set(projectFiles.map(f => f.type))],
        recentFiles: projectFiles.slice(0, 5).map(f => ({
          id: f.id,
          name: f.name,
          type: f.type
        }))
      },
      activity: {
        totalMessages: projectMessages.length,
        lastActivity: projectMessages.length > 0 ? projectMessages[projectMessages.length - 1].timestamp : null
      },
      currentTab: activeTab
    };
  };

  return (
    <>
      {/* Main Content Area - No relative positioning to avoid layout shifts */}
      <div className="flex-1 flex flex-col h-full">
        {/* Tab Navigation */}
        <div className={`border-b`} style={{ 
          backgroundColor: isDark ? '#111111' : '#ffffff',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}>
          <div className="flex items-center justify-between">
            <nav className="flex" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative py-3 px-4 text-sm font-medium transition-all duration-200 pr-12 ${
                      tab.label.length <= 5 ? 'w-[115px]' : 
                      tab.label === 'Calendar' ? 'w-[135px]' : 'w-[155px]'
                    } ${
                      activeTab === tab.id
                        ? `${isDark ? 'bg-gray-300 text-gray-900' : 'bg-gray-700 text-gray-100'}`
                        : `${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`
                    }`}
                     title={`${tab.label} (${isMac ? '⌘' : 'Ctr'}+${tab.shortcut})`}
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <Icon size={16} className="flex-shrink-0 w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    
                    {/* Keyboard Shortcut Display - Bottom right corner */}
                    <div className={`absolute bottom-1 right-2 px-1 py-0 rounded-md font-mono border transition-all duration-200 bg-transparent ${
                      activeTab === tab.id
                        ? `${isDark ? 'text-gray-900 border-gray-400' : 'text-gray-100 border-gray-600'}`
                        : `${isDark ? 'text-gray-400 border-gray-700' : 'text-gray-600 border-gray-200'}`
                    }`}>
                      <span className="text-[9px]">{isMac ? '⌘' : 'Ctr'}</span>
                      <span className="ml-0.5 text-[9px]">{tab.shortcut}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
            
            {/* Theme Toggle */}
            <div className="px-6">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* AI Chat Overlay Layer - Only cover center area where chat input appears */}
      {aiChatVisible && (
        <div 
          className="fixed bottom-0 pointer-events-none z-30"
          style={{ 
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '768px', // Max width of the chat input
            height: '200px' // Only cover bottom area where chat appears
          }}
        >

          {/* AI Chat Component - Auto-hide based on mouse position */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ 
              opacity: shouldShowAiChat ? 1 : 0,
              y: shouldShowAiChat ? 0 : 50 
            }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 1,
              opacity: { duration: 0.15 }
            }}
            className="absolute bottom-0 left-0 right-0 p-4"
            style={{
              pointerEvents: shouldShowAiChat ? 'auto' : 'none'
            }}
          >
            <div className="max-w-2xl mx-auto">
              <PromptInputBox
                onSend={handleAiMessage}
                placeholder="Ask AI anything about your project..."
                className="shadow-2xl"
                autoFocus={forceShowAiChat}
              />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};