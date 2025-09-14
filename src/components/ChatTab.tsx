import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Smile, Paperclip, User } from 'lucide-react';
import { Project } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface ChatTabProps {
  project: Project;
}

export const ChatTab: React.FC<ChatTabProps> = ({ project }) => {
  const { messages, addMessage } = useSupabaseProjects();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const projectMessages = messages.filter(m => m.projectId === project.id);
  const currentUser = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [projectMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      addMessage(project.id, currentUser, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-6 border-b`} style={{ 
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Project Chat (Coming soon)</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Team communication for {project.name}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-6`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        {projectMessages.length > 0 ? (
          <>
            {projectMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.author === currentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                  message.author === currentUser ? 'order-2' : 'order-1'
                }`}>
                  <div className={`rounded-2xl px-6 py-4 shadow-sm ${
                    message.author === currentUser
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : `border`
                  }`}
                  style={{
                    backgroundColor: message.author === currentUser 
                      ? undefined
                      : (isDark ? '#1a1a1a' : '#ffffff'),
                    color: message.author === currentUser 
                      ? '#ffffff'
                      : (isDark ? '#ffffff' : '#000000'),
                    borderColor: message.author === currentUser 
                      ? 'transparent'
                      : (isDark ? '#2a2a2a' : '#e2e8f0')
                  }}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <div className={`flex items-center space-x-2 mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ${
                    message.author === currentUser ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className="font-medium">{message.author}</span>
                    <span>•</span>
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  message.author === currentUser ? 'order-1 mr-4' : 'order-2 ml-4'
                }`} style={{ backgroundColor: isDark ? '#1a1a1a' : '#f1f5f9' }}>
                  <User size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6`} style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}>
                <Send className={`w-10 h-10 opacity-30`} />
              </div>
              <p className="text-xl font-semibold mb-2">Start the conversation</p>
              <p className="text-sm">Send your first message to get the team chat going!</p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className={`p-6 border-t`} style={{ 
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className={`w-full p-4 pr-16 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200`}
              style={{ 
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#000000',
                minHeight: '56px',
                maxHeight: '120px'
              }}
            />
            
            <div className="absolute right-4 bottom-4 flex items-center space-x-2">
              <button className={`${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors p-1 rounded-lg hover:bg-gray-100/10`}>
                <Smile size={18} />
              </button>
              <button className={`${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors p-1 rounded-lg hover:bg-gray-100/10`}>
                <Paperclip size={18} />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
        
        <div className={`flex items-center justify-between mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <span>Press Enter to send, Shift + Enter for new line</span>
          <span className="font-medium">{newMessage.length}/1000</span>
        </div>
      </div>
    </div>
  );
};