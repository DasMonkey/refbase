# Requirements Document

## Introduction

This feature adds a "Developer Settings" section to RefBase where authenticated users can view and copy their Supabase JWT authentication token for use with MCP (Model Context Protocol) tools in IDEs like Claude Code, Cursor, and Kiro. The token display will be integrated into the existing Settings modal as a new tab, following RefBase's established patterns and design system.

## Requirements

### Requirement 1

**User Story:** As a developer using RefBase, I want to access my Supabase authentication token so that I can configure MCP tools in my IDE to access RefBase's API endpoints.

#### Acceptance Criteria

1. WHEN I am authenticated and open the Settings modal THEN I SHALL see a "Developer Settings" tab in the settings navigation
2. WHEN I click on the "Developer Settings" tab THEN I SHALL see my current Supabase JWT token displayed in a secure, readable format
3. WHEN I view my token THEN it SHALL be displayed in a monospace font with proper formatting for easy reading
4. WHEN my token is displayed THEN it SHALL show the full token value (not masked) since it's needed for MCP configuration

### Requirement 2

**User Story:** As a developer, I want to easily copy my authentication token so that I can quickly paste it into MCP tool configurations without manual selection errors.

#### Acceptance Criteria

1. WHEN I view my token in Developer Settings THEN I SHALL see a "Copy Token" button next to the token display
2. WHEN I click the "Copy Token" button THEN the full token SHALL be copied to my clipboard
3. WHEN the token is successfully copied THEN I SHALL see a visual confirmation (success message or icon change)
4. WHEN the copy operation fails THEN I SHALL see an appropriate error message

### Requirement 3

**User Story:** As a developer, I want clear instructions on how to use my token so that I can properly configure MCP tools without confusion.

#### Acceptance Criteria

1. WHEN I view the Developer Settings tab THEN I SHALL see clear instructions explaining what the token is for
2. WHEN I view the instructions THEN they SHALL mention MCP tools and IDE integration specifically
3. WHEN I view the instructions THEN they SHALL include the RefBase API base URL (https://refbase.dev/api)
4. WHEN I view the instructions THEN they SHALL provide a basic example of how to use the token in API requests

### Requirement 4

**User Story:** As a security-conscious user, I want appropriate warnings about token security so that I understand the importance of keeping my token secure.

#### Acceptance Criteria

1. WHEN I view my token THEN I SHALL see a security warning about keeping the token confidential
2. WHEN I view the security warning THEN it SHALL advise not to share the token publicly or commit it to version control
3. WHEN I view the token display THEN it SHALL indicate the token's expiration information if available
4. WHEN my token is expired or invalid THEN I SHALL see appropriate messaging and guidance

### Requirement 5

**User Story:** As a user, I want the Developer Settings to integrate seamlessly with the existing RefBase interface so that it feels like a natural part of the application.

#### Acceptance Criteria

1. WHEN I access Developer Settings THEN it SHALL follow the same visual design patterns as other settings tabs
2. WHEN I view Developer Settings THEN it SHALL respect the current theme (dark/light mode) settings
3. WHEN I navigate to Developer Settings THEN it SHALL use the same navigation patterns as other settings tabs
4. WHEN I interact with Developer Settings THEN all UI elements SHALL follow RefBase's established component styling

### Requirement 6

**User Story:** As a user, I want proper error handling in case my authentication token is unavailable so that I receive helpful guidance.

#### Acceptance Criteria

1. WHEN I am not authenticated and try to access Developer Settings THEN I SHALL see an appropriate message
2. WHEN my token is unavailable or invalid THEN I SHALL see an error message with guidance on how to resolve it
3. WHEN there are token retrieval errors THEN I SHALL see a "Refresh Token" or "Re-authenticate" option if applicable
4. WHEN token operations fail THEN error messages SHALL be user-friendly and actionable