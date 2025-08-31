import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Search, Calendar, User, ChevronDown, ChevronRight, Code, FileText, Wrench, Clock } from 'lucide-react';
import { Project } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { ConversationParser, MessageTechnicalDetails } from '../utils/conversationParser';

interface ConversationsTabProps {
  project: Project;
}

interface Conversation {
  id: string;
  title: string;
  messages: any[];
  tags: string[];
  project_context: any;
  created_at: string;
  updated_at: string;
  // Enhanced technical details
  technical_details?: any;
  implementation_summary?: string;
  files_changed?: string[];
  code_changes?: any[];
  tool_usage?: any[];
}

export const ConversationsTab: React.FC<ConversationsTabProps> = ({ project }) => {
  const { isDark } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

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

  const ConversationDetail = ({ conversation }: { conversation: Conversation }) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      technicalDetails: false,
      filesChanged: false,
      codeChanges: false,
      toolUsage: false
    });

    // State for per-message expandable sections
    const [messageExpanded, setMessageExpanded] = useState<Record<number, Record<string, boolean>>>({});

    const toggleSection = (section: string) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    const toggleMessageSection = (messageIndex: number, section: string) => {
      setMessageExpanded(prev => ({
        ...prev,
        [messageIndex]: {
          ...prev[messageIndex],
          [section]: !prev[messageIndex]?.[section]
        }
      }));
    };

    // Check if conversation has technical details
    const hasTechnicalDetails = conversation.implementation_summary || 
                               (conversation.files_changed && conversation.files_changed.length > 0) ||
                               (conversation.code_changes && conversation.code_changes.length > 0) ||
                               (conversation.tool_usage && conversation.tool_usage.length > 0) ||
                               (conversation.technical_details && Object.keys(conversation.technical_details).length > 0);

    // Function to extract technical details from message content
    const getMessageTechnicalDetails = (message: any, index: number) => {
      if (message.role !== 'assistant') return null;
      
      const content = message.content || '';
      
      // Look for tool output patterns in the message content
      const toolOutputPattern = /●\s*(Read|Write|Edit|MultiEdit|Bash|Glob|Grep)\([^)]+\)/g;
      const fileUpdatePattern = /⎿\s*Updated\s+([^\s]+)\s+with\s+(\d+)\s+addition/g;
      const codeBlockPattern = /```[\s\S]*?```/g;
      
      const toolOutputs = content.match(toolOutputPattern) || [];
      const fileUpdates = [...content.matchAll(fileUpdatePattern)];
      const codeBlocks = content.match(codeBlockPattern) || [];
      
      // Extract file paths mentioned
      const filePathPattern = /(?:src\/|\.\/)[^\s<>:"|*?]+\.(ts|tsx|js|jsx|css|sql|md|json)/g;
      const filePaths = [...content.matchAll(filePathPattern)].map(match => match[0]);
      
      if (toolOutputs.length === 0 && fileUpdates.length === 0 && codeBlocks.length === 0 && filePaths.length === 0) {
        return null;
      }
      
      return {
        toolOutputs,
        fileUpdates: fileUpdates.map(match => ({
          file: match[1],
          additions: parseInt(match[2])
        })),
        codeBlocks,
        filesChanged: [...new Set(filePaths)],
        implementationSummary: content.split('.')[0].substring(0, 150) + '...'
      };
    };

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

      {/* Messages */}
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
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>

                {/* Technical Details for Assistant Messages */}
                {(() => {
                  const technicalDetails = getMessageTechnicalDetails(message, index);
                  if (!technicalDetails) return null;

                  return (
                    <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} flex items-center`}>
                        <Code size={12} className="mr-1" />
                        Technical Details
                      </div>

                      {/* Implementation Summary */}
                      {technicalDetails.implementationSummary && (
                        <div className={`mb-3 p-2 rounded text-xs ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-800'}`}>
                          <div className="flex items-center space-x-1 mb-1">
                            <FileText size={10} />
                            <span className="font-medium">Summary</span>
                          </div>
                          <div className="text-[11px] leading-relaxed">{technicalDetails.implementationSummary}</div>
                        </div>
                      )}

                      {/* Tool Outputs */}
                      {technicalDetails.toolOutputs && technicalDetails.toolOutputs.length > 0 && (
                        <div className="mb-2">
                          <button
                            onClick={() => toggleMessageSection(index, 'toolOutputs')}
                            className={`flex items-center space-x-1 text-xs font-medium ${isDark ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'} transition-colors`}
                          >
                            {messageExpanded[index]?.toolOutputs ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <Wrench size={10} />
                            <span>Tool Outputs ({technicalDetails.toolOutputs.length})</span>
                          </button>
                          
                          {messageExpanded[index]?.toolOutputs && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-1 space-y-1"
                            >
                              {technicalDetails.toolOutputs.map((output: string, outputIndex: number) => (
                                <div
                                  key={outputIndex}
                                  className={`text-[10px] font-mono p-2 rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} whitespace-pre-wrap`}
                                >
                                  {output}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Files Changed */}
                      {technicalDetails.filesChanged && technicalDetails.filesChanged.length > 0 && (
                        <div className="mb-2">
                          <button
                            onClick={() => toggleMessageSection(index, 'filesChanged')}
                            className={`flex items-center space-x-1 text-xs font-medium ${isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} transition-colors`}
                          >
                            {messageExpanded[index]?.filesChanged ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <Code size={10} />
                            <span>Files Changed ({technicalDetails.filesChanged.length})</span>
                          </button>
                          
                          {messageExpanded[index]?.filesChanged && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-1 space-y-1"
                            >
                              {technicalDetails.filesChanged.map((file: string, fileIndex: number) => (
                                <div
                                  key={fileIndex}
                                  className={`text-[10px] font-mono p-1.5 rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                >
                                  {file}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Tool Usage */}
                      {technicalDetails.toolUsage && technicalDetails.toolUsage.length > 0 && (
                        <div className="mb-2">
                          <button
                            onClick={() => toggleMessageSection(index, 'toolUsage')}
                            className={`flex items-center space-x-1 text-xs font-medium ${isDark ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'} transition-colors`}
                          >
                            {messageExpanded[index]?.toolUsage ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <Wrench size={10} />
                            <span>Tools Used ({technicalDetails.toolUsage.length})</span>
                          </button>
                          
                          {messageExpanded[index]?.toolUsage && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-1 space-y-1"
                            >
                              {technicalDetails.toolUsage.map((tool: any, toolIndex: number) => (
                                <div
                                  key={toolIndex}
                                  className={`text-[10px] p-2 rounded border-l-2 ${
                                    tool.success 
                                      ? (isDark ? 'bg-green-900/10 border-green-400 text-gray-300' : 'bg-green-50 border-green-400 text-gray-700')
                                      : (isDark ? 'bg-red-900/10 border-red-400 text-gray-300' : 'bg-red-50 border-red-400 text-gray-700')
                                  }`}
                                >
                                  <div className="flex items-center space-x-1 mb-1">
                                    <Clock size={8} />
                                    <span className="font-medium">{tool.tool}</span>
                                  </div>
                                  {tool.result && (
                                    <div className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
                      {technicalDetails.codeChanges && technicalDetails.codeChanges.length > 0 && (
                        <div className="mb-2">
                          <button
                            onClick={() => toggleMessageSection(index, 'codeChanges')}
                            className={`flex items-center space-x-1 text-xs font-medium ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} transition-colors`}
                          >
                            {messageExpanded[index]?.codeChanges ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <Code size={10} />
                            <span>Code Changes ({technicalDetails.codeChanges.length})</span>
                          </button>
                          
                          {messageExpanded[index]?.codeChanges && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-1 space-y-1"
                            >
                              {technicalDetails.codeChanges.map((change: any, changeIndex: number) => (
                                <div
                                  key={changeIndex}
                                  className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[9px] font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      {change.file_path}
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${
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
                                    <p className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                      {change.change_summary}
                                    </p>
                                  )}
                                  {change.lines_added !== undefined && change.lines_removed !== undefined && (
                                    <div className="flex space-x-2 text-[9px]">
                                      <span className={`${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                        +{change.lines_added}
                                      </span>
                                      <span className={`${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                        -{change.lines_removed}
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
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Chat History
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
    </div>
  );
};