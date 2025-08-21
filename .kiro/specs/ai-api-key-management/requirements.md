# Requirements Document

## Introduction

This feature adds a simple AI API key selection interface to the RefBase webapp, allowing users to choose between the webapp's default AI service or temporarily use their own API key during their session. The system provides two options: a default webapp API (stored securely in edge functions) and a session-only custom API key option where users can paste their own key for immediate use. Custom keys are never stored permanently and are automatically cleared when the session ends, eliminating security concerns while providing flexibility.

## Requirements

### Requirement 1

**User Story:** As a user, I want to access API key management settings through the existing settings popup, so that I can configure my AI preferences in a familiar interface.

#### Acceptance Criteria

1. WHEN the user opens the settings popup THEN the system SHALL display an "API Storage" tab alongside existing tabs
2. WHEN the user clicks the "API Storage" tab THEN the system SHALL display the API key management interface
3. IF the settings popup is already open THEN the system SHALL allow seamless navigation to the API Storage tab

### Requirement 2

**User Story:** As a user, I want to see a default webapp API option that requires no configuration, so that I can use AI features immediately without setup.

#### Acceptance Criteria

1. WHEN the user opens the API Storage tab THEN the system SHALL display a default "RefBase AI" option at the top
2. WHEN the default option is displayed THEN the system SHALL show it as pre-configured and ready to use
3. WHEN no custom API keys are configured THEN the system SHALL automatically select the default option
4. IF the user selects the default option THEN the system SHALL use the webapp's built-in AI service

### Requirement 3

**User Story:** As a user, I want to temporarily use my own API key during my session, so that I can use my preferred AI provider without permanent storage concerns.

#### Acceptance Criteria

1. WHEN the user selects "Use my own API key" option THEN the system SHALL display provider selection options (OpenAI, OpenRouter, Custom)
2. WHEN the user selects a provider THEN the system SHALL display an input field for the API key
3. WHEN the user enters a valid API key THEN the system SHALL immediately make it available for AI features during the current session
4. WHEN the user clears the API key field THEN the system SHALL automatically switch back to the default option
5. IF the API key format appears invalid THEN the system SHALL display a validation warning

### Requirement 3.1

**User Story:** As a user, I want to use OpenRouter with model selection, so that I can access multiple AI models through a single API key.

#### Acceptance Criteria

1. WHEN the user selects OpenRouter as provider THEN the system SHALL display a model selection dropdown
2. WHEN the user enters a valid OpenRouter API key THEN the system SHALL populate available models
3. WHEN the user selects a model THEN the system SHALL use that specific model for AI requests
4. WHEN no model is selected THEN the system SHALL use a sensible default model
5. IF the OpenRouter API key is invalid THEN the system SHALL disable model selection

### Requirement 4

**User Story:** As a user, I want to easily switch between the default API and my custom key, so that I can control which AI service processes my requests during my session.

#### Acceptance Criteria

1. WHEN the API options are displayed THEN the system SHALL show two radio button options: "Use RefBase AI (default)" and "Use my own API key"
2. WHEN the user selects an option THEN the system SHALL immediately switch to that API configuration
3. WHEN the user refreshes the page or starts a new session THEN the system SHALL default back to the webapp's default API
4. IF no custom key is entered THEN the custom option SHALL be disabled or show as inactive

### Requirement 5

**User Story:** As a user, I want to easily clear my custom API key, so that I can quickly switch back to the default service.

#### Acceptance Criteria

1. WHEN a custom API key is entered THEN the system SHALL show a clear button or similar mechanism to remove it
2. WHEN the user clicks clear or empties the API key field THEN the system SHALL immediately switch back to the default option
3. WHEN the user closes the settings modal with a custom key entered THEN the system SHALL retain the key for the current session only
4. WHEN the user closes the browser or the session ends THEN the system SHALL automatically clear the custom key
5. IF the user navigates away and returns to settings THEN the current session's custom key SHALL still be visible

### Requirement 6

**User Story:** As a developer implementing AI features, I want a centralized API key service, so that all AI functionality can access the currently selected API configuration.

#### Acceptance Criteria

1. WHEN AI features need API access THEN the system SHALL provide a service that returns the currently selected API key and provider information
2. WHEN the selected API key changes THEN the system SHALL update all active AI connections to use the new configuration
3. WHEN the API service is called THEN the system SHALL return the API key, provider type, and any necessary configuration parameters
4. IF no API key is selected THEN the system SHALL return the default webapp API configuration

### Requirement 7

**User Story:** As a user, I want my custom API key to be secure and never permanently stored, so that my sensitive information is protected.

#### Acceptance Criteria

1. WHEN a custom API key is entered THEN the system SHALL store it only in memory during the active session
2. WHEN the user closes the browser or tab THEN the system SHALL automatically clear the custom API key from memory
3. WHEN the user logs out THEN the system SHALL clear any custom API keys from memory
4. WHEN the browser session ends THEN the system SHALL ensure no custom API keys persist anywhere

### Requirement 8

**User Story:** As a user, I want clear visual feedback about which API option is active, so that I can understand which service is processing my requests.

#### Acceptance Criteria

1. WHEN an API option is selected THEN the system SHALL visually highlight it as the active choice
2. WHEN a custom API key is entered and valid THEN the system SHALL show a success indicator
3. WHEN a custom API key appears invalid or fails basic validation THEN the system SHALL display a warning message
4. WHEN no custom key is entered THEN the system SHALL clearly show that the default API is active