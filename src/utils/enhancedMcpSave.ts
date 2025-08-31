/**
 * Enhanced MCP Save - Automatically captures real technical details from conversations
 */

import { ConversationParser } from './conversationParser';

export interface EnhancedSaveParams {
  title: string;
  messages: any[];
  tags?: string[];
  projectContext?: any;
  projectPath?: string;
  project_context?: any;
  workspaceRoot?: string;
}

/**
 * Enhanced save conversation that automatically extracts technical details
 */
export async function saveConversationWithTechnicalDetails(params: EnhancedSaveParams) {
  // Parse conversation for real technical details
  const technicalDetails = ConversationParser.parseConversation(params.messages);
  
  // Use the existing MCP save function with enhanced technical details
  const enhancedParams = {
    ...params,
    technicalDetails: technicalDetails.technical_details || {},
    implementationSummary: technicalDetails.implementation_summary || '',
    filesChanged: technicalDetails.files_changed || [],
    codeChanges: technicalDetails.code_changes || [],
    toolUsage: technicalDetails.tool_usage || []
  };
  
  // Call the MCP function (this would be called from outside)
  return enhancedParams;
}

/**
 * Helper to format technical details for display
 */
export function formatTechnicalDetailsForDisplay(technicalDetails: any) {
  return {
    implementation_summary: technicalDetails.implementation_summary || '',
    files_changed: Array.isArray(technicalDetails.files_changed) ? technicalDetails.files_changed : [],
    code_changes: Array.isArray(technicalDetails.code_changes) ? technicalDetails.code_changes : [],
    tool_usage: Array.isArray(technicalDetails.tool_usage) ? technicalDetails.tool_usage : [],
    technical_details: typeof technicalDetails.technical_details === 'object' ? technicalDetails.technical_details : {}
  };
}