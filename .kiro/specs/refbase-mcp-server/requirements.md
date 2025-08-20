# Requirements Document

## Introduction

The RefBase MCP Server is a Node.js application that implements the Model Context Protocol (MCP) to automatically capture AI conversations from IDEs like Cursor, Claude Code, and Kiro. It serves as the automated conversation ingestion component of the RefBase AI Learning Loop system.

The MCP Server operates as a separate project from the RefBase webapp, communicating through a shared Supabase database to provide real-time conversation capture and rich project context extraction. This enables developers to build their AI knowledge base automatically without manual conversation import.

**Key Integration Points:**
- Connects to IDEs via MCP protocol for conversation capture
- Syncs captured data to shared Supabase database
- Provides rich project context (file paths, git info, code changes)
- Enables real-time updates in RefBase webapp
- Maintains session tracking and outcome monitoring

## Requirements

### Requirement 1: MCP Protocol Implementation and IDE Connectivity

**User Story:** As a developer using AI-powered IDEs, I want the MCP server to automatically connect to my IDE and capture my AI conversations, so that I can build my knowledge base without manual effort.

#### Acceptance Criteria

1. WHEN the MCP server starts THEN it SHALL implement the MCP protocol specification correctly
2. WHEN connecting to IDEs THEN the system SHALL support Cursor, Claude Code, and Kiro IDE integrations
3. WHEN establishing connections THEN the system SHALL handle authentication and maintain persistent connections
4. WHEN connection fails THEN the system SHALL retry with exponential backoff and provide clear error messages
5. IF multiple IDEs are running THEN the system SHALL manage multiple concurrent connections
6. WHEN IDE disconnects THEN the system SHALL detect disconnection and attempt reconnection automatically
7. WHEN receiving MCP messages THEN the system SHALL validate message format and handle protocol errors gracefully
8. WHEN IDE sends conversation data THEN the system SHALL acknowledge receipt and process data asynchronously

### Requirement 2: Real-time Conversation Capture and Processing

**User Story:** As a developer having AI conversations in my IDE, I want the MCP server to capture these conversations in real-time with full context, so that my knowledge base stays current with my development work.

#### Acceptance Criteria

1. WHEN AI conversation occurs in IDE THEN the system SHALL capture all messages with timestamps and sequence
2. WHEN capturing conversations THEN the system SHALL preserve message formatting, code blocks, and conversation flow
3. WHEN processing messages THEN the system SHALL extract code blocks and identify programming languages
4. WHEN conversation includes file references THEN the system SHALL capture file paths and modification context
5. IF conversation spans multiple files THEN the system SHALL maintain file relationship context
6. WHEN conversation ends THEN the system SHALL mark session completion and calculate session metrics
7. WHEN capturing large conversations THEN the system SHALL handle memory efficiently and avoid data loss
8. WHEN processing fails THEN the system SHALL queue conversations for retry and notify of processing errors

### Requirement 3: Rich Project Context Extraction

**User Story:** As a developer working on projects, I want the MCP server to automatically detect and capture rich project context from my IDE sessions, so that my conversations are organized with relevant project information.

#### Acceptance Criteria

1. WHEN conversation occurs THEN the system SHALL detect current project from file paths and workspace information
2. WHEN analyzing project context THEN the system SHALL extract git repository information, branch, and commit details
3. WHEN files are modified during conversation THEN the system SHALL capture before/after code changes
4. WHEN dependencies are mentioned THEN the system SHALL extract package names and version information
5. IF project structure changes THEN the system SHALL update project context dynamically
6. WHEN multiple projects are active THEN the system SHALL correctly associate conversations with appropriate projects
7. WHEN project detection fails THEN the system SHALL allow manual project assignment and learn from corrections
8. WHEN context is ambiguous THEN the system SHALL prompt for clarification and store user preferences

### Requirement 4: Database Integration and Real-time Sync

**User Story:** As a user of the RefBase webapp, I want conversations captured by the MCP server to appear in my webapp immediately, so that I can access and organize my AI conversations in real-time.

#### Acceptance Criteria

1. WHEN conversation is captured THEN the system SHALL store it in the shared Supabase database using the universal conversation schema
2. WHEN storing conversations THEN the system SHALL use the same data models as manual conversation import
3. WHEN conversation is saved THEN the system SHALL trigger real-time updates to connected RefBase webapp instances
4. WHEN database connection fails THEN the system SHALL queue conversations locally and sync when connection restored
5. IF data conflicts occur THEN the system SHALL resolve conflicts using timestamp-based precedence
6. WHEN storing rich context THEN the system SHALL populate project_context JSONB fields with extracted information
7. WHEN conversation processing completes THEN the system SHALL update conversation status and notify webapp
8. WHEN sync fails THEN the system SHALL retry with exponential backoff and maintain data integrity

### Requirement 5: Session Management and Outcome Tracking

**User Story:** As a developer, I want the MCP server to track my AI sessions and their outcomes, so that the system can learn which conversations lead to successful implementations.

#### Acceptance Criteria

1. WHEN AI session starts THEN the system SHALL create session record with start time and context
2. WHEN session progresses THEN the system SHALL track conversation flow and implementation attempts
3. WHEN files are modified THEN the system SHALL associate changes with the current AI session
4. WHEN session ends THEN the system SHALL analyze outcomes and mark session success/failure
5. IF implementation succeeds THEN the system SHALL extract successful patterns and approaches
6. WHEN git commits occur THEN the system SHALL link commits to AI sessions for success tracking
7. WHEN tests pass/fail THEN the system SHALL use test results as success indicators
8. WHEN session analysis completes THEN the system SHALL update pattern library with new insights

### Requirement 6: Configuration and Setup Management

**User Story:** As a developer setting up the RefBase system, I want easy configuration and setup of the MCP server, so that I can quickly start capturing conversations without complex technical setup.

#### Acceptance Criteria

1. WHEN installing MCP server THEN the system SHALL provide simple npm install or executable download
2. WHEN configuring server THEN the system SHALL support configuration file and environment variables
3. WHEN setting up database connection THEN the system SHALL validate Supabase credentials and connection
4. WHEN configuring IDE connections THEN the system SHALL provide clear setup instructions for each supported IDE
5. IF configuration is invalid THEN the system SHALL provide specific error messages and correction guidance
6. WHEN server starts THEN the system SHALL validate all configurations and report status
7. WHEN updating configuration THEN the system SHALL reload settings without requiring restart
8. WHEN troubleshooting THEN the system SHALL provide diagnostic commands and health check endpoints

### Requirement 7: Error Handling and Reliability

**User Story:** As a developer relying on automated conversation capture, I want the MCP server to be reliable and handle errors gracefully, so that I don't lose important conversations due to technical issues.

#### Acceptance Criteria

1. WHEN errors occur THEN the system SHALL log detailed error information for debugging
2. WHEN connection drops THEN the system SHALL attempt reconnection and preserve queued data
3. WHEN processing fails THEN the system SHALL retry with exponential backoff and eventual failure handling
4. WHEN memory usage is high THEN the system SHALL implement memory management and garbage collection
5. IF disk space is low THEN the system SHALL clean up old logs and temporary files
6. WHEN database is unavailable THEN the system SHALL queue data locally and sync when available
7. WHEN IDE sends malformed data THEN the system SHALL handle gracefully and request retransmission
8. WHEN system crashes THEN the system SHALL recover gracefully and resume from last known state

### Requirement 8: Performance and Scalability

**User Story:** As a developer with high conversation volume, I want the MCP server to handle large amounts of conversation data efficiently, so that it doesn't impact my IDE performance or system resources.

#### Acceptance Criteria

1. WHEN processing conversations THEN the system SHALL handle concurrent processing without blocking
2. WHEN memory usage grows THEN the system SHALL implement efficient memory management and cleanup
3. WHEN conversation volume is high THEN the system SHALL queue and batch process data efficiently
4. WHEN database operations are slow THEN the system SHALL implement connection pooling and query optimization
5. IF system resources are limited THEN the system SHALL prioritize real-time capture over background processing
6. WHEN multiple IDEs connect THEN the system SHALL scale to handle multiple concurrent connections
7. WHEN processing large files THEN the system SHALL stream data and avoid loading entire files into memory
8. WHEN system load is high THEN the system SHALL provide performance metrics and resource usage monitoring

### Requirement 9: Security and Privacy

**User Story:** As a developer working with sensitive code, I want the MCP server to handle my conversations securely and respect privacy settings, so that my proprietary code and conversations remain protected.

#### Acceptance Criteria

1. WHEN handling conversations THEN the system SHALL encrypt sensitive data in transit and at rest
2. WHEN storing conversations THEN the system SHALL respect user privacy settings and data retention policies
3. WHEN connecting to IDEs THEN the system SHALL use secure authentication and encrypted connections
4. WHEN accessing database THEN the system SHALL use secure credentials and connection encryption
5. IF sensitive information is detected THEN the system SHALL provide options to exclude or anonymize data
6. WHEN sharing data THEN the system SHALL implement access controls and audit logging
7. WHEN user requests data deletion THEN the system SHALL completely remove data and confirm deletion
8. WHEN handling API keys THEN the system SHALL store credentials securely and rotate them regularly

### Requirement 10: Monitoring and Observability

**User Story:** As a developer and system administrator, I want comprehensive monitoring and logging of the MCP server, so that I can troubleshoot issues and ensure the system is working correctly.

#### Acceptance Criteria

1. WHEN server operates THEN the system SHALL provide health check endpoints for monitoring
2. WHEN processing conversations THEN the system SHALL log processing metrics and performance data
3. WHEN errors occur THEN the system SHALL provide detailed error logs with context and stack traces
4. WHEN connections change THEN the system SHALL log connection status and provide connection metrics
5. IF performance degrades THEN the system SHALL alert and provide diagnostic information
6. WHEN data sync occurs THEN the system SHALL log sync status and data transfer metrics
7. WHEN system resources are consumed THEN the system SHALL monitor and report resource usage
8. WHEN troubleshooting THEN the system SHALL provide debug modes and detailed operational logs