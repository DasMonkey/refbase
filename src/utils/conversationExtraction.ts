/**
 * Shared conversation extraction utilities
 * Used by both ConversationsTab (for display) and MCP integration (for storage)
 */

export interface CodeBlock {
  language: string;
  content: string;
  startLine?: number;
}

export interface ToolOutput {
  tool: string;
  output: string;
  filePaths: string[];
  errors: string[];
  success: boolean;
  timestamp: string;
}

export interface FileChange {
  file: string;
  additions: number;
  operation: string;
}

export interface ErrorContext {
  errors: string[];
  fixes: string[];
  hasErrors: boolean;
  hasFixAttempts: boolean;
}

export interface ApproachContext {
  approaches: string[];
  rejections: string[];
  decisionPoints: number;
}

export interface UserIntent {
  request: boolean;
  rejection: boolean;
  approval: boolean;
  feedback: boolean;
  question: boolean;
  primaryIntent: string;
}

export interface TechnicalDetails {
  // Legacy fields for backwards compatibility
  toolOutputs: string[];
  fileUpdates: FileChange[];
  codeBlocks: string[];
  filesChanged: string[];
  implementationSummary: string;
  
  // Enhanced fields
  enhancedToolOutputs: ToolOutput[];
  errorContext: ErrorContext;
  approachContext: ApproachContext;
  messageType: string;
  hasImplementationDetails: boolean;
  userIntent?: UserIntent;
}

/**
 * Enhanced tool output extraction with file paths, errors, success indicators
 */
export const extractEnhancedToolOutputs = (content: string): ToolOutput[] => {
  const toolOutputPattern = /●\s+(\w+):\s+(.+?)(?=●|$)/gs;
  const toolMatches = [...content.matchAll(toolOutputPattern)];
  
  return toolMatches.map(match => {
    const [, tool, output] = match;
    const filePaths = output.match(/[\w/\\.-]+\.(ts|tsx|js|jsx|css|sql|md|json|yml|yaml)/g) || [];
    const errors = output.match(/Error:|Failed:|Exception:|Uncaught/g) || [];
    const success = output.includes('✓') || output.includes('Success') || output.includes('completed');
    
    return {
      tool,
      output,
      filePaths,
      errors,
      success: success && errors.length === 0,
      timestamp: new Date().toISOString()
    };
  });
};

/**
 * User intent extraction to parse user message context
 */
export const extractUserIntent = (userMessage: string): UserIntent => {
  const intentions = {
    request: /please|can you|help me|i want|add|create|fix|implement/i.test(userMessage),
    rejection: /don't like|reject|no|stop|not good|bad|wrong/i.test(userMessage),
    approval: /good|great|yes|start|continue|looks good|perfect/i.test(userMessage),
    feedback: /but|however|issue|problem|error|broken/i.test(userMessage),
    question: /what|how|why|when|where|which|\?/i.test(userMessage)
  };
  
  return {
    ...intentions,
    primaryIntent: Object.keys(intentions).find(key => intentions[key as keyof typeof intentions]) || 'unknown'
  };
};

/**
 * Error context capture to track errors and fixes
 */
export const extractErrorContext = (content: string): ErrorContext => {
  const errorPattern = /(?:Error|Failed|Exception|Uncaught|Syntax|Type|Reference).*?(?=\n|$)/g;
  const fixPattern = /(?:Fix|Fixed|Solution|Resolved|Updated|Corrected).*?(?=\n|$)/g;
  const errors = content.match(errorPattern) || [];
  const fixes = content.match(fixPattern) || [];
  
  return {
    errors: errors.map(err => err.trim()),
    fixes: fixes.map(fix => fix.trim()),
    hasErrors: errors.length > 0,
    hasFixAttempts: fixes.length > 0
  };
};

/**
 * Implementation approach tracking for decision-making context
 */
export const extractApproachContext = (content: string): ApproachContext => {
  const approachPattern = /(?:approach|strategy|method|way|solution|implementation).*?(?=\n|$)/gi;
  const rejectionPattern = /(?:rejected|abandoned|changed from|don't like|not working).*?(?=\n|$)/gi;
  const approaches = content.match(approachPattern) || [];
  const rejections = content.match(rejectionPattern) || [];
  
  return {
    approaches: approaches.map(app => app.trim()),
    rejections: rejections.map(rej => rej.trim()),
    decisionPoints: approaches.length + rejections.length
  };
};

/**
 * Extract code blocks with language detection
 */
export const extractCodeBlocks = (content: string): CodeBlock[] => {
  const codeBlockPattern = /```(\w+)?\n?([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match;
  
  while ((match = codeBlockPattern.exec(content)) !== null) {
    let detectedLanguage = match[1] || 'text';
    const codeContent = match[2] || '';
    
    // Auto-detect TypeScript/JavaScript if no language specified
    if (!match[1] || match[1] === 'text') {
      if (codeContent.includes('const ') || codeContent.includes('function ') || 
          codeContent.includes('return ') || codeContent.includes('className=') ||
          codeContent.includes('interface ') || codeContent.includes('type ') ||
          codeContent.includes('React') || codeContent.includes('useState') ||
          codeContent.includes('=>') || codeContent.includes('...')) {
        detectedLanguage = 'typescript';
      }
    }
    
    blocks.push({
      language: detectedLanguage,
      content: codeContent,
      startLine: extractStartLineNumber(content, match.index || 0)
    });
  }
  
  return blocks;
};

/**
 * Extract starting line number from context around code block
 */
const extractStartLineNumber = (fullContent: string, codeBlockIndex: number): number | undefined => {
  const beforeCodeBlock = fullContent.substring(0, codeBlockIndex);
  const toolOutputMatch = beforeCodeBlock.match(/Updated\s+[^\s]+\s+with\s+\d+\s+additions?\s+and\s+\d+\s+removals?/);
  
  if (toolOutputMatch) {
    const afterToolOutput = fullContent.substring(fullContent.indexOf(toolOutputMatch[0]) + toolOutputMatch[0].length, codeBlockIndex);
    const lineNumberMatch = afterToolOutput.match(/\b(\d{2,4})\b/);
    return lineNumberMatch ? parseInt(lineNumberMatch[1]) : undefined;
  }
  
  return undefined;
};

/**
 * Enhanced function to extract technical details from message content
 */
export const getMessageTechnicalDetails = (message: { role: string; content: string; timestamp?: string }): TechnicalDetails | null => {
  if (message.role !== 'assistant') {
    // For user messages, extract intent and context
    const userIntent = extractUserIntent(message.content || '');
    return {
      toolOutputs: [],
      fileUpdates: [],
      codeBlocks: [],
      filesChanged: [],
      implementationSummary: '',
      enhancedToolOutputs: [],
      errorContext: { errors: [], fixes: [], hasErrors: false, hasFixAttempts: false },
      approachContext: { approaches: [], rejections: [], decisionPoints: 0 },
      messageType: 'user_input',
      hasImplementationDetails: false,
      userIntent
    };
  }
  
  const content = message.content || '';
  
  // Enhanced tool output extraction
  const enhancedToolOutputs = extractEnhancedToolOutputs(content);
  
  // Legacy pattern matching for backwards compatibility
  const toolOutputPattern = /●\s*(Read|Write|Edit|MultiEdit|Bash|Glob|Grep)\([^)]+\)/g;
  const fileUpdatePattern = /⎿\s*Updated\s+([^\s]+)\s+with\s+(\d+)\s+addition/g;
  
  const toolOutputs = content.match(toolOutputPattern) || [];
  const fileUpdates = [...content.matchAll(fileUpdatePattern)];
  
  // Extract comprehensive context
  const errorContext = extractErrorContext(content);
  const approachContext = extractApproachContext(content);
  
  // Extract file paths mentioned
  const filePathPattern = /(?:src\/|\.\/)[^\s<>:"|*?]+\.(ts|tsx|js|jsx|css|sql|md|json)/g;
  const filePaths = [...content.matchAll(filePathPattern)].map(match => match[0]);
  
  // Extract code blocks
  const codeBlocks = extractCodeBlocks(content);
  
  if (toolOutputs.length === 0 && fileUpdates.length === 0 && filePaths.length === 0 && 
      enhancedToolOutputs.length === 0 && !errorContext.hasErrors && approachContext.decisionPoints === 0 &&
      codeBlocks.length === 0) {
    return null;
  }
  
  return {
    // Legacy fields for backwards compatibility
    toolOutputs,
    fileUpdates: fileUpdates.map(match => ({
      file: match[1],
      additions: parseInt(match[2]),
      operation: 'update'
    })),
    codeBlocks: codeBlocks.map(block => `\`\`\`${block.language}\n${block.content}\`\`\``),
    filesChanged: [...new Set(filePaths)],
    implementationSummary: content.split('.')[0].substring(0, 150) + '...',
    
    // Enhanced fields
    enhancedToolOutputs,
    errorContext,
    approachContext,
    messageType: 'assistant_response',
    hasImplementationDetails: toolOutputs.length > 0 || enhancedToolOutputs.length > 0 || codeBlocks.length > 0
  };
};

/**
 * Prepare conversation for MCP saving with enhanced technical context
 */
export const enhanceConversationForMCP = (messages: Array<{role: string; content: string; timestamp?: string}>) => {
  return messages.map(message => {
    const technicalDetails = getMessageTechnicalDetails(message);
    
    if (!technicalDetails || !technicalDetails.hasImplementationDetails) {
      return message;
    }
    
    // Enhance message content with extracted technical context
    let enhancedContent = message.content;
    const contextAdditions = [];
    
    // Add error context
    if (technicalDetails.errorContext.hasErrors) {
      contextAdditions.push(`\n\n❌ **Errors Encountered:**\n${technicalDetails.errorContext.errors.join('\n')}`);
    }
    
    if (technicalDetails.errorContext.hasFixAttempts) {
      contextAdditions.push(`\n\n🔧 **Fixes Applied:**\n${technicalDetails.errorContext.fixes.join('\n')}`);
    }
    
    // Add approach context
    if (technicalDetails.approachContext.approaches.length > 0) {
      contextAdditions.push(`\n\n💡 **Implementation Approaches:**\n${technicalDetails.approachContext.approaches.join('\n')}`);
    }
    
    // Add tool outputs
    if (technicalDetails.enhancedToolOutputs.length > 0) {
      const toolSummary = technicalDetails.enhancedToolOutputs.map(tool => {
        const status = tool.success ? '✅' : '❌';
        const files = tool.filePaths.length > 0 ? ` (${tool.filePaths.join(', ')})` : '';
        return `${status} **${tool.tool}**${files}`;
      }).join('\n');
      contextAdditions.push(`\n\n🔧 **Tool Operations:**\n${toolSummary}`);
    }
    
    // Add files changed
    if (technicalDetails.filesChanged.length > 0) {
      contextAdditions.push(`\n\n📁 **Files Modified:** ${technicalDetails.filesChanged.join(', ')}`);
    }
    
    return {
      ...message,
      content: enhancedContent + contextAdditions.join(''),
      technicalDetails // Include structured technical details
    };
  });
};