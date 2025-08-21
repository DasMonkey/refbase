# Implementation Plan

- [x] 1. Set up core types and interfaces


  - Create TypeScript interfaces for session-based API key management in types/index.ts
  - Define ApiKeyState, ApiConfig, and ApiMode types
  - Add proper type exports for use across the application
  - _Requirements: 6.3, 4.1_

- [x] 2. Create simple API key validation service


  - Create apiKeyService.ts in src/lib/ with basic validation methods
  - Implement simple API key format validation (length, prefix checks)
  - Add getApiConfig method for generating configuration objects
  - Write unit tests for validation functionality
  - _Requirements: 3.2, 8.3_

- [x] 3. Create API Key Context provider


  - Implement ApiKeyContext following ThemeContext pattern
  - Add session-only state management for API mode and custom key
  - Implement context methods for setting mode and custom key
  - Create custom hook useApiKeys for component access
  - Add automatic session cleanup on browser close
  - Write unit tests for context functionality
  - _Requirements: 6.1, 6.2, 4.2, 7.2_

- [x] 4. Build API Storage Tab component


  - Create ApiStorageTab.tsx component with two radio button options
  - Implement "Use RefBase AI (default)" option that's always available
  - Add "Use my own API key" option with input field that appears when selected
  - Style component to match existing settings modal design patterns
  - _Requirements: 1.2, 2.1, 2.2, 3.1_

- [x] 5. Implement simple selection interface

  - Add radio button selection between default and custom options
  - Implement input field for custom API key that shows/hides based on selection
  - Add clear button or mechanism to easily remove custom key
  - Create visual indicators for active selection
  - _Requirements: 4.1, 4.2, 5.1, 5.2_

- [x] 6. Add basic validation and visual feedback

  - Implement basic format validation for custom API key input
  - Add visual feedback for valid/invalid custom keys
  - Create clear indication of which option is currently active
  - Show helpful validation messages for invalid key formats
  - _Requirements: 8.1, 8.2, 8.3, 3.2_

- [x] 7. Integrate API Storage tab into Settings Modal


  - Add 'api-storage' tab to settingsTabs array in SettingsModal.tsx
  - Import and render ApiStorageTab component in renderTabContent method
  - Add appropriate icon (Key) for the new tab
  - Ensure proper navigation and styling consistency
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 8. Implement API configuration service

  - Create getActiveApiConfig method in ApiKeyContext
  - Implement simple configuration generation for default vs custom modes
  - Add support for default webapp API configuration
  - Handle switching between default and custom API configurations
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 9. Add session management and cleanup

  - Implement automatic cleanup when browser/tab closes
  - Add cleanup on user logout
  - Ensure custom keys never persist beyond session
  - Create session state reset functionality
  - _Requirements: 4.3, 5.4, 7.2, 7.3_

- [x] 10. Create error handling and validation

  - Implement validation error messages for custom key input
  - Add user-friendly error notifications
  - Create fallback to default API when custom key is invalid
  - Handle edge cases like empty inputs and malformed keys
  - _Requirements: 3.2, 8.3_

- [x] 11. Add security measures

  - Ensure custom keys never appear in console logs or error messages
  - Implement secure memory cleanup on component unmount
  - Add API key masking in UI (show only last 4 characters when entered)
  - Verify no accidental persistence of sensitive data
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 12. Write comprehensive tests


  - Create unit tests for context operations and validation
  - Add integration tests for Settings Modal tab integration
  - Write tests for session cleanup and security measures
  - Test switching between default and custom modes
  - _Requirements: All requirements validation_

- [x] 13. Integrate with application root and providers



  - Wrap App component with ApiKeyProvider in main.tsx
  - Ensure proper provider ordering with existing ThemeProvider
  - Test context availability throughout component tree
  - Verify session cleanup works correctly
  - _Requirements: 6.2, 6.4_

- [x] 14. Add provider selection and OpenRouter support


  - Update types to include provider and model selection
  - Add provider selection UI (OpenAI, OpenRouter, Custom)
  - Implement OpenRouter model list and selection
  - Update validation service to handle different providers
  - _Requirements: 3.1, 3.1.1, 3.1.2_

- [x] 15. Implement OpenRouter model management

  - Create OpenRouter model list (GPT-4, Claude, Llama, etc.)
  - Add model selection dropdown that appears for OpenRouter
  - Update API configuration to include model and baseUrl
  - Handle model selection state in context
  - _Requirements: 3.1.2, 3.1.3, 3.1.4_

- [x] 16. Update UI for provider and model selection



  - Modify ApiStorageTab to show provider selection
  - Add conditional model selection for OpenRouter
  - Update validation messages for different providers
  - Enhance status display to show provider and model
  - _Requirements: 3.1.1, 3.1.2, 3.1.3_