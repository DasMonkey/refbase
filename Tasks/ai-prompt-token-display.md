# AI Assistant Prompt: Add API Token Display to RefBase

## Context & Objective
I need to add a "Developer Settings" or "API Access" section to my RefBase webapp where logged-in users can view and copy their Supabase authentication token for use with MCP (Model Context Protocol) tools.

## Background Information
- **Project**: RefBase - a knowledge management webapp for developers
- **Tech Stack**: React, TypeScript, Supabase for auth/database, hosted on Netlify
- **Purpose**: Users need their Supabase JWT token to configure MCP tools in IDEs like Claude Code, Cursor, Kiro
- **API Endpoints**: Already implemented at `https://refbase.dev/api` (conversations, bugs, features, documents)
- **Token Location**: Currently stored in browser localStorage as `sb-[project-id]-auth-token`

## Key Files to Examine First
1. **`src/components/`** - Check existing component structure and patterns
2. **`src/pages/`** or **`src/app/`** - Understand routing and page structure  
3. **`src/contexts/AuthContext.tsx`** or similar - Find how authentication is handled
4. **`src/hooks/`** - Look for `useAuth` or similar authentication hooks
5. **`src/components/layout/`** - Find navigation/sidebar components to add new menu item
6. **`package.json`** - Understand the React framework being used (Next.js, Vite, CRA, etc.)

## Requirements

### Core Functionality
1. **New Page/Section**: Create a "Developer Settings" or "API Access" page
2. **Token Display**: Show the user's current Supabase JWT authentication token
3. **Copy Function**: Add a "Copy Token" button with clipboard functionality
4. **User-Friendly Instructions**: Explain what the token is for and how to use it with MCP tools
5. **Security Notice**: Add warning about keeping the token secure

### UI/UX Requirements
- Follow existing RefBase design patterns and component styles
- Should feel integrated with the current app (not like an afterthought)
- Add navigation item to reach this page (sidebar, header menu, or settings dropdown)
- Responsive design that works on desktop and mobile
- Loading states and error handling

### Technical Requirements
- Get token from Supabase auth context/session (not directly from localStorage)
- Handle cases where user is not authenticated
- Show token expiration if available
- Option to "refresh" token if supported by your auth implementation

## Implementation Approach
1. **Examine the codebase** to understand current patterns
2. **Create a plan** listing specific files to create/modify
3. **Follow existing conventions** for:
   - Component structure and naming
   - Styling approach (CSS modules, Tailwind, styled-components, etc.)
   - TypeScript interfaces and types
   - Error handling patterns
4. **Test the implementation** to ensure token retrieval works correctly

## Expected Deliverables
- New page/component for API token display
- Navigation integration to access the new page
- Copy-to-clipboard functionality
- User instructions and security warnings
- Updated routing (if needed)
- TypeScript types for any new interfaces

## Important Notes
- **Security**: Don't log the token to console or expose it unnecessarily
- **User Experience**: Make it clear this is for advanced users/developers
- **Integration**: Should feel like a natural part of the RefBase app
- **Future-Proof**: Consider that this will be used by developers setting up MCP tools

## Context Files to Reference
- The user has recently implemented MCP API endpoints in `netlify/functions/api.ts`
- There's a detailed implementation report in `Tasks/mcp-api-implementation-report.md`
- The app uses Supabase authentication with JWT tokens for API access

Please examine the codebase structure first, create a detailed plan, and then implement this token display feature following RefBase's existing patterns and conventions.