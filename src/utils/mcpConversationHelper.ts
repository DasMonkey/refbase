/**
 * MCP Integration Helper for Enhanced Conversation Preparation
 * Prepares conversations with complete technical context before MCP saving
 */

import { enhanceConversationForMCP } from './conversationExtraction';
import { supabase } from '../lib/supabase';

export interface MCPConversationMessage {
  role: string;
  content: string;
  timestamp?: string;
}

export interface MCPProjectContext {
  projectName?: string;
  language?: string;
  framework?: string;
  techStack?: string[];
}

export interface MCPConversationData {
  title: string;
  messages: MCPConversationMessage[];
  tags?: string[];
  project_context?: MCPProjectContext;
  projectPath?: string;
  workspaceRoot?: string;
}

/**
 * Prepare conversation for MCP saving with enhanced technical context
 */
export const prepareConversationForMCP = (
  title: string,
  messages: MCPConversationMessage[],
  projectContext?: MCPProjectContext,
  additionalTags: string[] = []
): MCPConversationData => {
  // Enhance messages with technical context extraction
  const enhancedMessages = enhanceConversationForMCP(messages);
  
  // Determine conversation tags based on content analysis
  const autoTags = [...additionalTags];
  
  // Add technical tags based on message content
  const hasCodeBlocks = enhancedMessages.some(msg => msg.content.includes('```'));
  const hasErrors = enhancedMessages.some(msg => msg.content.includes('Error') || msg.content.includes('Failed'));
  const hasToolUsage = enhancedMessages.some(msg => msg.content.includes('●'));
  const hasImplementation = enhancedMessages.some(msg => 
    msg.content.includes('implementation') || 
    msg.content.includes('approach') || 
    msg.content.includes('strategy')
  );
  
  if (hasCodeBlocks) autoTags.push('code-implementation');
  if (hasErrors) autoTags.push('error-resolution');
  if (hasToolUsage) autoTags.push('tool-usage');
  if (hasImplementation) autoTags.push('implementation-details');
  
  // Detect programming languages from code blocks
  const codeBlockPattern = /```(\w+)/g;
  const languages = new Set<string>();
  let match;
  const fullContent = enhancedMessages.map(m => m.content).join(' ');
  
  while ((match = codeBlockPattern.exec(fullContent)) !== null) {
    if (match[1] && match[1] !== 'text') {
      languages.add(match[1]);
    }
  }
  
  languages.forEach(lang => autoTags.push(`lang-${lang}`));
  
  return {
    title,
    messages: enhancedMessages,
    tags: [...new Set(autoTags)], // Remove duplicates
    project_context: projectContext,
    projectPath: process.cwd(),
    workspaceRoot: process.cwd()
  };
};

/**
 * Save conversation using MCP with enhanced context
 * This is a wrapper around the MCP save_conversation call
 */
export const saveMCPConversation = async (
  title: string,
  messages: MCPConversationMessage[],
  projectContext?: MCPProjectContext,
  additionalTags: string[] = []
) => {
  const enhancedData = prepareConversationForMCP(title, messages, projectContext, additionalTags);
  
  // This would be called by Claude Code when using MCP tools
  // The actual MCP call should use this enhanced data:
  /*
  await mcp__refbase__save_conversation({
    title: enhancedData.title,
    messages: enhancedData.messages,
    tags: enhancedData.tags,
    project_context: enhancedData.project_context,
    projectPath: enhancedData.projectPath,
    workspaceRoot: enhancedData.workspaceRoot
  });
  */
  
  return enhancedData;
};

/**
 * Extract current project context from the environment
 */
export const getCurrentProjectContext = async (): Promise<MCPProjectContext> => {
  try {
    // Try to get project context from current session or settings
    // This is a placeholder - in real usage, this would be determined by the current environment
    
    return {
      projectName: 'RefBase',
      language: 'typescript',
      framework: 'react',
      techStack: ['react', 'typescript', 'supabase', 'tailwindcss']
    };
  } catch (error) {
    console.error('Error getting project context:', error);
    return {};
  }
};

/**
 * Enhanced conversation saving for manual sessions
 * Updates the conversation in the database with enhanced technical context
 */
export const saveEnhancedManualSession = async (
  conversationId: string,
  content: string,
  projectContext?: MCPProjectContext
) => {
  try {
    // Parse content into messages (assuming it's markdown/text format)
    const messages: MCPConversationMessage[] = [{
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }];
    
    // Enhance messages with technical context
    const enhancedMessages = enhanceConversationForMCP(messages);
    
    // Update conversation in database
    const { error } = await supabase
      .from('conversations')
      .update({
        messages: enhancedMessages,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
    
    if (error) {
      console.error('Error saving enhanced manual session:', error);
      throw error;
    }
    
    return enhancedMessages;
  } catch (error) {
    console.error('Error in saveEnhancedManualSession:', error);
    throw error;
  }
};