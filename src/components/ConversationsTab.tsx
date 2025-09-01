import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Search, Calendar, User, ChevronDown, ChevronRight, Code, FileText, Wrench, Clock, Plus } from 'lucide-react';
import { Project } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { EnhancedEditor } from './ui/EnhancedEditor';
import { 
  extractEnhancedToolOutputs,
  extractUserIntent,
  extractErrorContext,
  extractApproachContext,
  getMessageTechnicalDetails,
  enhanceConversationForMCP
} from '../utils/conversationExtraction';
import { saveEnhancedManualSession, getCurrentProjectContext } from '../utils/mcpConversationHelper';

interface ConversationsTabProps {
  project: Project;
}

interface Conversation {
  id: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp?: string;
  }>;
  tags: string[];
  project_context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  source?: 'mcp' | 'manual'; // Add source property for conditional rendering
  // Enhanced technical details
  technical_details?: Record<string, unknown>;
  implementation_summary?: string;
  files_changed?: string[];
  code_changes?: Array<{
    file_path: string;
    action: string;
    change_summary?: string;
    lines_added?: number;
    lines_removed?: number;
  }>;
  tool_usage?: Array<{
    tool: string;
    timestamp: string;
    success: boolean;
    result?: string;
  }>;
}

const sessionSources = [
  { id: 'claude-code', label: 'Claude Code', description: 'Chat session from Claude Code IDE' },
  { id: 'claude-web', label: 'Claude Web', description: 'Chat session from Claude.ai website' },
  { id: 'chatgpt', label: 'ChatGPT', description: 'Chat session from OpenAI ChatGPT' },
  { id: 'other', label: 'Other AI', description: 'Chat session from another AI tool' },
  { id: 'custom', label: 'Custom', description: 'Custom formatted chat session' },
];

export const ConversationsTab: React.FC<ConversationsTabProps> = ({ project }) => {
  const { isDark } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // New Session Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionSource, setNewSessionSource] = useState<string>('claude-code');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Fetch conversations from the database
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching conversations:', error);
        } else {
          setConversations(data || []);
        }
      } catch (error) {
        console.error('Error in fetchConversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [project.id]);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Parse chat content into messages based on source format
  const parseChat = (content: string, source: string): Array<{role: string; content: string; timestamp?: string}> => {
    const lines = content.split('\n');
    const messages: Array<{role: string; content: string; timestamp?: string}> = [];
    let currentMessage = { role: '', content: '', timestamp: undefined as string | undefined };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Different parsing strategies based on source
      if (source === 'claude-code') {
        // Parse Claude Code format (User: / Assistant:)
        if (line.match(/^(User|Assistant):\s*/)) {
          // Save previous message if exists
          if (currentMessage.role && currentMessage.content.trim()) {
            messages.push({...currentMessage, content: currentMessage.content.trim()});
          }
          // Start new message
          currentMessage = {
            role: line.startsWith('User:') ? 'user' : 'assistant',
            content: line.replace(/^(User|Assistant):\s*/, ''),
            timestamp: new Date(Date.now() + i * 1000).toISOString() // Incremental timestamps
          };
        } else {
          // Continue current message
          if (currentMessage.role) {
            currentMessage.content += '\n' + line;
          }
        }
      } else if (source === 'claude-web') {
        // Parse Claude.ai format (Human: / Assistant:)
        if (line.match(/^(Human|Assistant):\s*/)) {
          if (currentMessage.role && currentMessage.content.trim()) {
            messages.push({...currentMessage, content: currentMessage.content.trim()});
          }
          currentMessage = {
            role: line.startsWith('Human:') ? 'user' : 'assistant',
            content: line.replace(/^(Human|Assistant):\s*/, ''),
            timestamp: new Date(Date.now() + i * 1000).toISOString()
          };
        } else {
          if (currentMessage.role) {
            currentMessage.content += '\n' + line;
          }
        }
      } else if (source === 'chatgpt') {
        // Parse ChatGPT format (User: / ChatGPT:)
        if (line.match(/^(User|ChatGPT):\s*/)) {
          if (currentMessage.role && currentMessage.content.trim()) {
            messages.push({...currentMessage, content: currentMessage.content.trim()});
          }
          currentMessage = {
            role: line.startsWith('User:') ? 'user' : 'assistant',
            content: line.replace(/^(User|ChatGPT):\s*/, ''),
            timestamp: new Date(Date.now() + i * 1000).toISOString()
          };
        } else {
          if (currentMessage.role) {
            currentMessage.content += '\n' + line;
          }
        }
      } else {
        // Custom format - try to detect roles automatically
        if (line.match(/^(user|assistant|human|ai|me|you):\s*/i)) {
          if (currentMessage.role && currentMessage.content.trim()) {
            messages.push({...currentMessage, content: currentMessage.content.trim()});
          }
          const roleMatch = line.match(/^(user|assistant|human|ai|me|you):\s*/i);
          const detectedRole = roleMatch?.[1].toLowerCase() || '';
          const role = ['user', 'me', 'human'].includes(detectedRole) ? 'user' : 'assistant';
          
          currentMessage = {
            role,
            content: line.replace(/^(user|assistant|human|ai|me|you):\s*/i, ''),
            timestamp: new Date(Date.now() + i * 1000).toISOString()
          };
        } else {
          if (currentMessage.role) {
            currentMessage.content += '\n' + line;
          }
        }
      }
    }
    
    // Add final message
    if (currentMessage.role && currentMessage.content.trim()) {
      messages.push({...currentMessage, content: currentMessage.content.trim()});
    }
    
    return messages.filter(msg => msg.content.trim().length > 0);
  };

  // Handle creating new session - save directly to database
  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) return;
    
    setIsCreatingSession(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save directly to database
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert([{
          title: newSessionTitle,
          messages: [{
            role: 'user',
            content: '',
            timestamp: new Date().toISOString()
          }],
          tags: ['manual-entry', newSessionSource, 'draft'],
          project_context: {
            projectName: project.name,
            language: undefined, // Project doesn't have language property
            framework: undefined, // Project doesn't have framework property  
            techStack: undefined // Project doesn't have techStack property
          },
          project_id: project.id,
          user_id: user.id,
          source: 'manual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Refresh conversations list
      const { data: updatedConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (!fetchError && updatedConversations) {
        setConversations(updatedConversations);
        // Select the new conversation to open it for editing
        setSelectedConversation(newConversation);
      }

      // Reset modal
      setShowCreateModal(false);
      setNewSessionTitle('');
      setNewSessionSource('claude-code');
      
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Handle saving conversation content (for manual sessions) with enhanced technical context
  const handleSaveConversation = async (conversation: Conversation, newContent: string) => {
    try {
      // Get current project context for enhancement
      const projectContext = await getCurrentProjectContext();
      
      // Use enhanced saving with technical context extraction
      const enhancedMessages = await saveEnhancedManualSession(
        conversation.id, 
        newContent, 
        projectContext
      );

      // Update the conversation in the local state with enhanced messages
      setConversations(prev => prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, messages: enhancedMessages, updated_at: new Date().toISOString() }
          : conv
      ));
      setSelectedConversation(prev => 
        prev?.id === conversation.id 
          ? { ...prev, messages: enhancedMessages, updated_at: new Date().toISOString() }
          : prev
      );
    } catch (error) {
      console.error('Error in handleSaveConversation:', error);
      alert('Failed to save conversation. Please try again.');
    }
  };

  const ConversationDetail = ({ conversation }: { conversation: Conversation }) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      technicalDetails: false,
      filesChanged: false,
      codeChanges: false,
      toolUsage: false
    });

    const toggleSection = (section: string) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    // Check if conversation has technical details
    const hasTechnicalDetails = conversation.implementation_summary || 
                               (conversation.files_changed && conversation.files_changed.length > 0) ||
                               (conversation.code_changes && conversation.code_changes.length > 0) ||
                               (conversation.tool_usage && conversation.tool_usage.length > 0) ||
                               (conversation.technical_details && Object.keys(conversation.technical_details).length > 0);


    return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-6 border-b`} style={{ 
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {conversation.title}
            </h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {new Date(conversation.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle size={14} />
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {conversation.messages.length} messages
                </span>
              </div>
            </div>
            {conversation.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {conversation.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded-full text-xs font-medium`}
                    style={{
                      backgroundColor: isDark ? '#374151' : '#f1f5f9',
                      color: isDark ? '#d1d5db' : '#475569'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Implementation Summary */}
      {conversation.implementation_summary && (
        <div className={`border-b p-4`} style={{ 
          backgroundColor: isDark ? '#111111' : '#f8fafc',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}>
          <div className="flex items-center space-x-2 mb-2">
            <FileText size={16} className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Implementation Summary
            </span>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
            {conversation.implementation_summary}
          </p>
        </div>
      )}

      {/* Technical Details Section */}
      {hasTechnicalDetails && (
        <div className={`border-b`} style={{ 
          backgroundColor: isDark ? '#111111' : '#f8fafc',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}>
          {/* Files Changed */}
          {conversation.files_changed && conversation.files_changed.length > 0 && (
            <div className="p-4 border-b" style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
              <button
                onClick={() => toggleSection('filesChanged')}
                className={`flex items-center space-x-2 text-sm font-medium ${isDark ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'} transition-colors`}
              >
                {expandedSections.filesChanged ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Code size={16} className={`${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <span>Files Changed ({conversation.files_changed.length})</span>
              </button>
              
              {expandedSections.filesChanged && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-1"
                >
                  {conversation.files_changed.map((file, index) => (
                    <div
                      key={index}
                      className={`text-xs font-mono p-2 rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {file}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Tool Usage */}
          {conversation.tool_usage && conversation.tool_usage.length > 0 && (
            <div className="p-4 border-b" style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
              <button
                onClick={() => toggleSection('toolUsage')}
                className={`flex items-center space-x-2 text-sm font-medium ${isDark ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'} transition-colors`}
              >
                {expandedSections.toolUsage ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Wrench size={16} className={`${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                <span>Tool Usage ({conversation.tool_usage.length})</span>
              </button>
              
              {expandedSections.toolUsage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-2"
                >
                  {conversation.tool_usage.map((tool, index) => (
                    <div
                      key={index}
                      className={`text-xs p-3 rounded border-l-2 ${
                        tool.success 
                          ? (isDark ? 'bg-green-900/20 border-green-400 text-gray-300' : 'bg-green-50 border-green-400 text-gray-700')
                          : (isDark ? 'bg-red-900/20 border-red-400 text-gray-300' : 'bg-red-50 border-red-400 text-gray-700')
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock size={12} />
                        <span className="font-medium">{tool.tool}</span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {tool.timestamp ? new Date(tool.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      {tool.result && (
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                          {tool.result}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Code Changes */}
          {conversation.code_changes && conversation.code_changes.length > 0 && (
            <div className="p-4">
              <button
                onClick={() => toggleSection('codeChanges')}
                className={`flex items-center space-x-2 text-sm font-medium ${isDark ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'} transition-colors`}
              >
                {expandedSections.codeChanges ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Code size={16} className={`${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <span>Code Changes ({conversation.code_changes.length})</span>
              </button>
              
              {expandedSections.codeChanges && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-3"
                >
                  {conversation.code_changes.map((change, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {change.file_path}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          change.action === 'create' 
                            ? (isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800')
                            : change.action === 'edit'
                            ? (isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800') 
                            : (isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800')
                        }`}>
                          {change.action}
                        </span>
                      </div>
                      {change.change_summary && (
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                          {change.change_summary}
                        </p>
                      )}
                      {change.lines_added !== undefined && change.lines_removed !== undefined && (
                        <div className="flex space-x-4 text-xs">
                          <span className={`${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            +{change.lines_added} lines
                          </span>
                          <span className={`${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            -{change.lines_removed} lines
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages or Editor Content */}
      {conversation.source === 'manual' ? (
        /* Manual Session Editor */
        <div className={`flex-1 min-h-0`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
          <div className="h-full p-4">
            <div className={`h-full border rounded-lg overflow-hidden`} style={{ 
              backgroundColor: isDark ? '#111111' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}>
              <EnhancedEditor
                content={conversation.messages[0]?.content || ''}
                onChange={(newContent) => handleSaveConversation(conversation, newContent)}
                language="markdown"
                placeholder="Paste your chat content here..."
                fileName={conversation.title}
                onBlur={() => {}} // Auto-save handled by onChange
              />
            </div>
          </div>
        </div>
      ) : (
        /* Regular Messages Display */
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`} 
             style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
          {conversation.messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-4xl ${
              message.role === 'assistant' ? 'order-2' : 'order-1'
            }`}>
              <div className={`rounded-2xl px-6 py-4 shadow-sm ${
                message.role === 'assistant'
                  ? `border`
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              }`}
              style={{
                backgroundColor: message.role === 'assistant' 
                  ? (isDark ? '#1a1a1a' : '#ffffff')
                  : undefined,
                color: message.role === 'assistant' 
                  ? (isDark ? '#ffffff' : '#000000')
                  : '#ffffff',
                borderColor: message.role === 'assistant' 
                  ? (isDark ? '#2a2a2a' : '#e2e8f0')
                  : 'transparent'
              }}
              >
                {/* Render message content with enhanced inline context */}
                {(() => {
                  const content = message.content || '';
                  const technicalDetails = getMessageTechnicalDetails(message);
                  
                  // Enhanced content with inline context
                  let enhancedContent = content;
                  
                  // For user messages, add intent indicators
                  if (message.role === 'user' && technicalDetails?.userIntent) {
                    const intent = technicalDetails.userIntent;
                    let intentBadge = '';
                    
                    if (intent.request) intentBadge = '🔵 Request: ';
                    else if (intent.approval) intentBadge = '✅ Approval: ';
                    else if (intent.rejection) intentBadge = '❌ Rejection: ';
                    else if (intent.question) intentBadge = '❓ Question: ';
                    else if (intent.feedback) intentBadge = '💬 Feedback: ';
                    
                    if (intentBadge) {
                      enhancedContent = intentBadge + enhancedContent;
                    }
                  }
                  
                  // For assistant messages, add inline context
                  if (message.role === 'assistant' && technicalDetails) {
                    const contextAdditions = [];
                    
                    // Add error context
                    if (technicalDetails.errorContext?.hasErrors && technicalDetails.errorContext.errors) {
                      contextAdditions.push(`\n\n❌ **Errors Encountered:**\n${technicalDetails.errorContext.errors.join('\n')}`);
                    }
                    
                    if (technicalDetails.errorContext?.hasFixAttempts && technicalDetails.errorContext.fixes) {
                      contextAdditions.push(`\n\n🔧 **Fixes Applied:**\n${technicalDetails.errorContext.fixes.join('\n')}`);
                    }
                    
                    // Add approach context
                    if (technicalDetails.approachContext?.approaches && technicalDetails.approachContext.approaches.length > 0) {
                      contextAdditions.push(`\n\n💡 **Implementation Approaches:**\n${technicalDetails.approachContext.approaches.join('\n')}`);
                    }
                    
                    if (technicalDetails.approachContext?.rejections && technicalDetails.approachContext.rejections.length > 0) {
                      contextAdditions.push(`\n\n🚫 **Rejected Approaches:**\n${technicalDetails.approachContext.rejections.join('\n')}`);
                    }
                    
                    // Add enhanced tool outputs
                    if (technicalDetails.enhancedToolOutputs && technicalDetails.enhancedToolOutputs.length > 0) {
                      const toolSummary = technicalDetails.enhancedToolOutputs.map(tool => {
                        const status = tool.success ? '✅' : '❌';
                        const files = tool.filePaths && tool.filePaths.length > 0 ? ` (${tool.filePaths.join(', ')})` : '';
                        return `${status} **${tool.tool}**${files}`;
                      }).join('\n');
                      contextAdditions.push(`\n\n🔧 **Tool Operations:**\n${toolSummary}`);
                    }
                    
                    // Add files changed context
                    if (technicalDetails.filesChanged && technicalDetails.filesChanged.length > 0) {
                      contextAdditions.push(`\n\n📁 **Files Modified:** ${technicalDetails.filesChanged.join(', ')}`);
                    }
                    
                    // Add code blocks summary (they'll be rendered by the main code block processor)
                    if (technicalDetails.codeBlocks && technicalDetails.codeBlocks.length > 0) {
                      contextAdditions.push(`\n\n💻 **Code Changes:** ${technicalDetails.codeBlocks.length} code block${technicalDetails.codeBlocks.length > 1 ? 's' : ''} with implementation details`);
                    }
                    
                    enhancedContent = enhancedContent + contextAdditions.join('');
                  }
                  
                  // Parse enhanced content for rendering
                  const codeBlockPattern = /```(\w+)?\n?([\s\S]*?)```/g;
                  const parts = [];
                  let lastIndex = 0;
                  let match;
                  
                  // Split content into text and code block parts
                  while ((match = codeBlockPattern.exec(enhancedContent)) !== null) {
                    // Add text before code block
                    if (match.index > lastIndex) {
                      parts.push({
                        type: 'text',
                        content: enhancedContent.substring(lastIndex, match.index)
                      });
                    }
                    
                    // Determine language - be more aggressive in detecting TypeScript/JavaScript
                    let detectedLanguage = match[1] || 'text';
                    const codeContent = match[2] || '';
                    
                    // If no language specified, try to detect from content
                    if (!match[1] || match[1] === 'text') {
                      if (codeContent.includes('const ') || codeContent.includes('function ') || 
                          codeContent.includes('return ') || codeContent.includes('className=') ||
                          codeContent.includes('interface ') || codeContent.includes('type ') ||
                          codeContent.includes('React') || codeContent.includes('useState') ||
                          codeContent.includes('=>') || codeContent.includes('...')) {
                        detectedLanguage = 'typescript';
                      }
                    }
                    
                    // Add code block
                    parts.push({
                      type: 'code',
                      language: detectedLanguage,
                      content: codeContent
                    });
                    
                    lastIndex = match.index + match[0].length;
                  }
                  
                  // Add remaining text
                  if (lastIndex < enhancedContent.length) {
                    parts.push({
                      type: 'text',
                      content: enhancedContent.substring(lastIndex)
                    });
                  }
                  
                  return (
                    <div className="text-sm leading-relaxed">
                      {parts.map((part, partIndex) => {
                        if (part.type === 'text') {
                          // Enhanced text rendering with markdown-style formatting
                          const renderEnhancedText = (text: string) => {
                            // Split by **bold** patterns while preserving them
                            const parts = text.split(/(\*\*.*?\*\*)/g);
                            
                            return parts.map((chunk, chunkIndex) => {
                              if (chunk.startsWith('**') && chunk.endsWith('**')) {
                                // Bold text
                                return (
                                  <strong key={chunkIndex} className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {chunk.slice(2, -2)}
                                  </strong>
                                );
                              } else {
                                // Regular text with emoji support
                                return (
                                  <span key={chunkIndex} className="whitespace-pre-wrap">
                                    {chunk}
                                  </span>
                                );
                              }
                            });
                          };
                          
                          return (
                            <div key={partIndex} className="whitespace-pre-wrap">
                              {renderEnhancedText(part.content)}
                            </div>
                          );
                        } else {
                          // Render code block with syntax highlighting
                          const lines = part.content.split('\n');
                          
                          // Try to extract starting line number from tool outputs in the message
                          const messageText = content;
                          const codeBlockIndex = messageText.indexOf('```' + part.language);
                          const beforeCodeBlock = messageText.substring(0, codeBlockIndex);
                          
                          // Look for patterns like "Updated file.tsx with X additions and Y removals" followed by line numbers
                          const toolOutputMatch = beforeCodeBlock.match(/Updated\s+[^\s]+\s+with\s+\d+\s+additions?\s+and\s+\d+\s+removals?/);
                          const afterToolOutput = toolOutputMatch ? messageText.substring(messageText.indexOf(toolOutputMatch[0]) + toolOutputMatch[0].length, codeBlockIndex) : '';
                          
                          // Extract the first line number mentioned after the tool output
                          const lineNumberInContext = afterToolOutput.match(/\b(\d{2,4})\b/);
                          const contextStartingLineNumber = lineNumberInContext ? parseInt(lineNumberInContext[1]) : null;
                          return (
                            <div
                              key={partIndex}
                              className={`my-3 rounded-lg border font-mono text-xs overflow-hidden ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                            >
                              {/* Language header */}
                              <div className={`px-3 py-1.5 border-b text-[10px] font-medium ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                {part.language}
                              </div>
                              {/* Code content with line numbers */}
                              <div className={`p-3 overflow-x-auto max-h-96 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
                                {lines.map((line, lineIndex) => {
                                  // Use context starting line number if available, otherwise try to extract from line, fallback to sequential
                                  const lineNumberMatch = line.match(/^\s*(\d+)[\s→+-]/);
                                  const actualLineNumber = contextStartingLineNumber ? 
                                    contextStartingLineNumber + lineIndex : 
                                    lineNumberMatch ? parseInt(lineNumberMatch[1]) : lineIndex + 1;
                                  
                                  // Clean the line content by removing the line number prefix
                                  const cleanLine = lineNumberMatch ? line.replace(/^\s*\d+[\s→+-]\s*/, '') : line;
                                  
                                  return (
                                    <div key={lineIndex} className="flex items-start">
                                      <span className={`select-none w-12 text-right pr-3 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {actualLineNumber}
                                      </span>
                                    <span className="whitespace-pre flex-1 min-w-0">
                                      {(() => {
                                        // Basic syntax highlighting for TypeScript/JavaScript
                                        if (part.language === 'typescript' || part.language === 'javascript' || part.language === 'tsx' || part.language === 'jsx') {
                                          return cleanLine.split(/(\b(?:const|let|var|function|return|if|else|for|while|class|interface|type|import|export|from|async|await|try|catch|finally|throw|new|this|super|extends|implements|public|private|protected|readonly|static)\b|\/\/.*|\/\*[\s\S]*?\*\/|'[^']*'|"[^"]*"|`[^`]*`|\d+)/g).map((token, tokenIndex) => {
                                            // Keywords
                                            if (/^(const|let|var|function|return|if|else|for|while|class|interface|type|import|export|from|async|await|try|catch|finally|throw|new|this|super|extends|implements|public|private|protected|readonly|static)$/.test(token)) {
                                              return <span key={tokenIndex} className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{token}</span>;
                                            }
                                            // Comments
                                            if (/^(\/\/.*|\/\*[\s\S]*?\*\/)$/.test(token)) {
                                              return <span key={tokenIndex} className={`${isDark ? 'text-green-500' : 'text-green-600'}`}>{token}</span>;
                                            }
                                            // Strings
                                            if (/^(['"`]).*\1$/.test(token)) {
                                              return <span key={tokenIndex} className={`${isDark ? 'text-yellow-400' : 'text-orange-600'}`}>{token}</span>;
                                            }
                                            // Numbers
                                            if (/^\d+$/.test(token)) {
                                              return <span key={tokenIndex} className={`${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{token}</span>;
                                            }
                                            // Default
                                            return <span key={tokenIndex} className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{token}</span>;
                                          });
                                        } else {
                                          // For other languages, just show plain text
                                          return <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{cleanLine || '\u00A0'}</span>;
                                        }
                                        })()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  );
                })()}

              </div>
              <div className={`flex items-center space-x-2 mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ${
                message.role === 'assistant' ? 'justify-start' : 'justify-end'
              }`}>
                <span className="font-medium">
                  {message.role === 'assistant' ? 'Assistant' : 'User'}
                </span>
                {message.timestamp && (
                  <>
                    <span>•</span>
                    <span>{formatDate(message.timestamp)}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              message.role === 'assistant' ? 'order-1 mr-4' : 'order-2 ml-4'
            }`} style={{ backgroundColor: isDark ? '#1a1a1a' : '#f1f5f9' }}>
              <User size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          </motion.div>
        ))}
        </div>
      )}
    </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Conversations List - Left Panel */}
      <div className={`w-64 border-r flex flex-col flex-shrink-0`} style={{ 
        backgroundColor: isDark ? '#111111' : '#f8fafc',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        {/* Header */}
        <div className={`p-4 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium transition-all duration-200 border rounded-lg mb-3 ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Plus size={16} className="mr-2" />
            New Session
          </button>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Sessions
          </h3>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {conversations.length} conversations
          </div>
        </div>

        {/* Search */}
        <div className={`p-3`}>
          <div className="relative">
            <Search 
              size={16} 
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} 
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              style={{ 
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className={`flex-1 overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
          {filteredConversations.length > 0 ? (
            <div className="space-y-0.5 p-2">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedConversation?.id === conversation.id
                      ? (isDark ? 'bg-blue-900/50 border border-blue-700' : 'bg-blue-50 border border-blue-200')
                      : (isDark ? 'hover:bg-gray-800' : 'hover:bg-white border border-transparent')
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="space-y-1">
                    <h4 className={`text-sm font-medium truncate ${
                      selectedConversation?.id === conversation.id
                        ? (isDark ? 'text-blue-300' : 'text-blue-900')
                        : (isDark ? 'text-gray-200' : 'text-gray-900')
                    }`}>
                      {conversation.title}
                    </h4>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={`flex items-center space-x-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <MessageCircle size={12} />
                        <span>{conversation.messages.length}</span>
                      </span>
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(conversation.created_at)}
                      </span>
                    </div>

                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle className={`w-12 h-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm ? 'No matches' : 'No conversations'}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {searchTerm ? 'Try different terms' : 'Saved MCP chats will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Detail - Right Panel */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ConversationDetail conversation={selectedConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <MessageCircle className={`w-16 h-16 mx-auto mb-4 opacity-30`} />
              <p className="text-lg font-medium mb-2">Select a conversation</p>
              <p className="text-sm">Choose from your saved chat history to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Create New Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl p-6 w-full max-w-md mx-4 border`}
            style={{ 
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}
          >
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Create New Session</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Session Title
                </label>
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="Enter session title"
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  style={{ 
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Session Type
                </label>
                <div className="space-y-3">
                  {sessionSources.map((source) => (
                    <label key={source.id} className="flex items-start space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="sessionSource"
                        value={source.id}
                        checked={newSessionSource === source.id}
                        onChange={(e) => setNewSessionSource(e.target.value)}
                        className="mt-1 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-blue-500 transition-colors`}>{source.label}</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{source.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewSessionTitle('');
                  setNewSessionSource('claude-code');
                }}
                disabled={isCreatingSession}
                className={`px-4 py-2 rounded-xl transition-colors font-medium`}
                style={{ 
                  color: isDark ? '#d1d5db' : '#374151',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!newSessionTitle.trim() || isCreatingSession}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isCreatingSession ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};