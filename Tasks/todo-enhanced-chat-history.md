# Enhanced Chat History Implementation Plan

## Overview
Enhance the RefBase MCP integration to capture complete conversation history including code changes, tool usage, and implementation details. Support both full session exports and selective conversation exports across multiple IDEs.

## Current State Analysis
- ✅ Basic MCP integration working with `mcp__refbase__save_conversation`
- ✅ Database schema has `conversations` table with basic fields
- ✅ ConversationsTab displays saved conversations
- ❌ Missing code changes and technical implementation details
- ❌ Only captures high-level conversation messages
- ❌ No tool usage history or file modifications

## Enhanced Data Structure Design

### Current conversations table schema:
```sql
conversations (
  id uuid,
  user_id uuid,
  title text,
  messages jsonb DEFAULT '[]'::jsonb,
  tags text[],
  project_context jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'manual',
  created_at timestamptz,
  updated_at timestamptz
)
```

### Enhanced schema requirements:
```sql
-- New fields to add:
technical_details jsonb DEFAULT '{}'::jsonb,
implementation_summary text DEFAULT '',
files_changed text[] DEFAULT ARRAY[]::text[],
code_changes jsonb DEFAULT '[]'::jsonb,
tool_usage jsonb DEFAULT '[]'::jsonb
```

## Phase 1: Database Schema Enhancement

### Task 1.1: Create Database Migration
- [ ] Create new migration file: `add_technical_details_to_conversations.sql`
- [ ] Add `technical_details` JSONB field to store structured implementation data
- [ ] Add `implementation_summary` text field for high-level overview
- [ ] Add `files_changed` text array for quick file reference
- [ ] Add `code_changes` JSONB array for before/after code comparisons
- [ ] Add `tool_usage` JSONB array for tool call history
- [ ] Add database indexes for performance

### Task 1.2: Update Database
- [ ] Run the migration using Supabase CLI
- [ ] Verify new fields are added successfully
- [ ] Test RLS policies work with new fields

## Phase 2: Enhanced MCP save_conversation Function

### Task 2.1: Extend MCP Function Parameters
- [ ] Update `mcp__refbase__save_conversation` to accept `technical_details` parameter
- [ ] Add validation for new technical_details structure
- [ ] Maintain backward compatibility with existing calls

### Task 2.2: Enhanced Data Structure
Define the enhanced technical_details structure:
```typescript
technical_details: {
  tool_calls: [
    {
      tool: 'Read' | 'Write' | 'Edit' | 'MultiEdit' | 'Bash' | 'Glob' | 'Grep',
      timestamp: string,
      params: object,
      result: string,
      success: boolean
    }
  ],
  code_changes: [
    {
      file_path: string,
      action: 'create' | 'edit' | 'delete',
      before_content: string | null,
      after_content: string | null,
      diff: string,
      lines_added: number,
      lines_removed: number,
      change_summary: string
    }
  ],
  files_created: string[],
  files_modified: string[],
  files_deleted: string[],
  implementation_flow: string[],
  key_decisions: string[],
  challenges_faced: string[],
  solutions_applied: string[]
}
```

### Task 2.3: Update MCP Function Implementation
- [ ] Modify the function to handle and store technical_details
- [ ] Add data validation and sanitization
- [ ] Update function return type to include technical details confirmation

## Phase 3: Enhanced ConversationsTab UI

### Task 3.1: Update Conversation Display
- [ ] Add "Technical Details" section to conversation view
- [ ] Display code changes with syntax highlighting
- [ ] Show before/after comparisons for file edits
- [ ] Add expandable sections for tool usage history

### Task 3.2: Code Change Visualization
- [ ] Implement diff viewer component
- [ ] Add syntax highlighting for different file types
- [ ] Show file tree of changed files
- [ ] Add copy-to-clipboard functionality for code snippets

### Task 3.3: Implementation Flow Display
- [ ] Create timeline view of implementation steps
- [ ] Show tool usage sequence
- [ ] Display key decisions and challenges
- [ ] Add search functionality within technical details

## Phase 4: Smart Conversation Capture

### Task 4.1: Conversation Parser
- [ ] Create utility to parse Claude Code conversation format
- [ ] Extract tool calls from conversation history
- [ ] Generate diff information from file changes
- [ ] Identify implementation patterns and flow

### Task 4.2: Selective Export Interface
- [ ] Add "Export Conversation" button to current chat
- [ ] Allow user to select conversation segments
- [ ] Auto-detect related code changes in selected segments
- [ ] Provide preview of what will be exported

### Task 4.3: Enhanced Export Function
- [ ] Create new export function that captures current context
- [ ] Parse recent tool usage and file changes
- [ ] Generate implementation summary automatically
- [ ] Save with enhanced technical details

## Phase 5: Multi-IDE Support

### Task 5.1: Claude Code Integration
- [ ] Direct integration with existing MCP calls
- [ ] Real-time capture of tool usage
- [ ] Automatic code change detection

### Task 5.2: Cursor Session Import
- [ ] Create parser for Cursor session export format
- [ ] Map Cursor tool usage to RefBase format
- [ ] Import conversations with code changes preserved

### Task 5.3: Manual Entry Interface
- [ ] Create rich text editor for manual conversation entry
- [ ] Add code block support with syntax highlighting
- [ ] Allow manual file attachment and diff creation
- [ ] Support copy-paste from other IDEs

## Phase 6: Testing and Refinement

### Task 6.1: Comprehensive Testing
- [ ] Test enhanced conversation saving with various scenarios
- [ ] Verify code change capture accuracy
- [ ] Test UI performance with large conversations
- [ ] Validate search and filter functionality

### Task 6.2: Performance Optimization
- [ ] Optimize database queries for technical details
- [ ] Add pagination for large conversation lists
- [ ] Implement lazy loading for code changes
- [ ] Add compression for large code blocks

### Task 6.3: User Experience Polish
- [ ] Add loading states for technical details
- [ ] Implement error handling for failed exports
- [ ] Add keyboard shortcuts for common actions
- [ ] Create onboarding guide for new features

## Implementation Priority

### High Priority (Phase 1-2)
1. Database schema enhancement
2. Enhanced MCP function implementation
3. Basic technical details capture

### Medium Priority (Phase 3-4)
1. Enhanced UI for displaying technical details
2. Smart conversation parsing and capture
3. Selective export functionality

### Lower Priority (Phase 5-6)
1. Multi-IDE support
2. Advanced features and optimizations
3. Polish and user experience improvements

## Success Metrics

### Technical Success
- [ ] Full conversation history captured including code changes
- [ ] Technical details properly stored and retrievable
- [ ] No performance degradation in ConversationsTab
- [ ] Backward compatibility maintained

### User Experience Success
- [ ] Users can easily export conversation segments with code
- [ ] Code changes are clearly visible and understandable
- [ ] Implementation flow is documented and searchable
- [ ] Export works across different IDEs

### Data Quality Success
- [ ] Code changes accurately captured with proper diffs
- [ ] Implementation decisions and challenges documented
- [ ] Tool usage history preserved and searchable
- [ ] Conversation context maintained with technical details

## Next Steps

1. **Immediate**: Start with Phase 1 - Database schema enhancement
2. **Week 1**: Complete database migration and enhanced MCP function
3. **Week 2**: Implement basic technical details UI display
4. **Week 3**: Add smart conversation capture and selective export
5. **Week 4**: Polish and testing

## Dependencies

- Supabase database access for migrations
- MCP server modification capabilities
- React/TypeScript for UI components
- Syntax highlighting libraries for code display
- Diff generation utilities

---

*Created: 2025-08-31*
*Status: Planning Phase*
*Priority: High*