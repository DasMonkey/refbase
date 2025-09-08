# RefBase MCP - Testing Guide

This document provides comprehensive guidance on testing the RefBase MCP, including unit tests, integration tests, performance tests, and end-to-end testing strategies.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Unit Tests](#unit-tests)
5. [Integration Tests](#integration-tests)
6. [Performance Tests](#performance-tests)
7. [End-to-End Tests](#end-to-end-tests)
8. [Test Coverage](#test-coverage)
9. [CI/CD Integration](#cicd-integration)
10. [Test Data and Fixtures](#test-data-and-fixtures)
11. [Writing New Tests](#writing-new-tests)
12. [Troubleshooting Tests](#troubleshooting-tests)

---

## Testing Overview

The RefBase MCP uses a comprehensive testing strategy with multiple layers:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test workflows and component interactions
- **Performance Tests**: Validate performance and resource usage
- **End-to-End Tests**: Test complete user scenarios with real API calls

### Test Framework Stack

- **Jest**: Primary testing framework
- **TypeScript**: Type-safe test development  
- **Mock APIs**: Simulate RefBase API responses
- **Test Data Generators**: Create realistic test scenarios
- **Coverage Reports**: Track test coverage and quality

---

## Test Structure

```
tests/
├── setup.ts                           # Global test setup
├── api/                              # API client tests
│   └── RefBaseAPIClient.test.ts
├── auth/                             # Authentication tests
│   └── AuthMiddleware.test.ts
├── cli/                              # CLI interface tests
│   └── cli.test.ts
├── config/                           # Configuration tests
│   └── config.test.ts
├── integration/                      # Integration test suites
│   ├── setup.ts                      # Integration setup
│   ├── fixtures/                     # Test data generators
│   │   └── testDataGenerator.ts
│   ├── conversation-flow.test.ts     # Conversation workflow tests
│   ├── bug-tracking-flow.test.ts     # Bug tracking workflow tests
│   ├── feature-management-flow.test.ts
│   ├── project-context-flow.test.ts
│   ├── performance.test.ts           # Performance benchmarks
│   └── end-to-end.test.ts            # Complete E2E scenarios
├── security/                         # Security feature tests
│   ├── security.test.ts
│   └── advancedSecurity.test.ts
├── server/                           # MCP server tests
│   └── MCPServer.test.ts
├── tools/                            # Individual tool tests
│   ├── BaseTool.test.ts
│   ├── bug/
│   ├── conversation/
│   └── feature/
└── utils/                            # Utility function tests
    ├── cache.test.ts
    ├── logger.test.ts
    └── validation.test.ts
```

---

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run performance tests
npm run test:performance

# Run end-to-end tests
npm run test:e2e
```

### Running Specific Test Suites

```bash
# Run conversation flow tests
npm test -- tests/integration/conversation-flow.test.ts

# Run bug tracking tests
npm test -- tests/integration/bug-tracking-flow.test.ts

# Run performance tests
npm test -- tests/integration/performance.test.ts

# Run with verbose output
npm test -- --verbose

# Run with debugging
npm test -- --runInBand --verbose
```

### Environment-Specific Testing

```bash
# Test with different configurations
NODE_ENV=test npm test
NODE_ENV=development npm run test:integration

# Test with specific RefBase API
REFBASE_API_URL=https://staging.refbase.dev/api npm run test:e2e
```

---

## Unit Tests

Unit tests focus on individual components and functions in isolation.

### Example Unit Test Structure

```typescript
// tests/tools/conversation/SaveConversationTool.test.ts
import { SaveConversationTool } from '../../../src/tools/conversation/SaveConversationTool';
import { TestDataGenerator } from '../../integration/fixtures/testDataGenerator';

describe('SaveConversationTool', () => {
  let tool: SaveConversationTool;
  
  beforeEach(() => {
    tool = new SaveConversationTool();
  });
  
  describe('handler', () => {
    it('should save conversation successfully', async () => {
      const conversation = TestDataGenerator.generateConversation();
      const result = await tool.handler(conversation);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('conversationId');
    });
    
    it('should handle validation errors', async () => {
      const invalidConversation = { title: '' }; // Missing required fields
      
      await expect(tool.handler(invalidConversation))
        .rejects.toThrow('Validation failed');
    });
  });
});
```

### Unit Test Categories

1. **Tool Tests**: Test individual MCP tools
2. **API Client Tests**: Test RefBase API communication
3. **Authentication Tests**: Test token validation and security
4. **Utility Tests**: Test helper functions and utilities
5. **Configuration Tests**: Test config loading and validation

---

## Integration Tests

Integration tests verify that multiple components work together correctly.

### Conversation Flow Integration Test

```typescript
// tests/integration/conversation-flow.test.ts
import { MCPServer } from '../../src/server/MCPServer';
import { TestDataGenerator } from './fixtures/testDataGenerator';

describe('Conversation Flow Integration', () => {
  let server: MCPServer;
  
  beforeAll(async () => {
    server = new MCPServer();
    await server.initialize();
  });
  
  afterAll(async () => {
    await server.shutdown();
  });
  
  it('should complete full conversation workflow', async () => {
    const conversation = TestDataGenerator.generateConversation();
    
    // 1. Save conversation
    const saveResult = await server.handleToolCall('save_conversation', conversation);
    expect(saveResult.success).toBe(true);
    const conversationId = saveResult.data.conversationId;
    
    // 2. Search for the conversation
    const searchResult = await server.handleToolCall('search_conversations', {
      query: conversation.title
    });
    expect(searchResult.success).toBe(true);
    expect(searchResult.data.conversations).toHaveLength(1);
    
    // 3. Retrieve specific conversation
    const getResult = await server.handleToolCall('get_conversation', {
      conversationId
    });
    expect(getResult.success).toBe(true);
    expect(getResult.data.title).toBe(conversation.title);
  });
});
```

### Bug Tracking Flow Integration Test

```typescript
// tests/integration/bug-tracking-flow.test.ts
describe('Bug Tracking Flow Integration', () => {
  it('should complete bug resolution workflow', async () => {
    const scenario = TestDataGenerator.generateBugResolutionScenario();
    
    // 1. Log initial bug
    const bugResult = await server.handleToolCall('save_bug', scenario.initialBug);
    expect(bugResult.success).toBe(true);
    const bugId = bugResult.data.bugId;
    
    // 2. Search for similar bugs
    const searchResult = await server.handleToolCall('search_bugs', {
      query: 'image upload mobile'
    });
    expect(searchResult.success).toBe(true);
    
    // 3. Save debugging conversation
    const convResult = await server.handleToolCall('save_conversation', 
      scenario.debuggingConversation);
    expect(convResult.success).toBe(true);
    
    // 4. Save solution as feature
    const featureResult = await server.handleToolCall('save_feature', 
      scenario.finalSolution);
    expect(featureResult.success).toBe(true);
    
    // 5. Update bug status to resolved
    const updateResult = await server.handleToolCall('update_bug_status', {
      bugId,
      status: 'resolved',
      solution: 'Implemented mobile-optimized upload component'
    });
    expect(updateResult.success).toBe(true);
  });
});
```

---

## Performance Tests

Performance tests validate system behavior under load and measure resource usage.

### Performance Test Example

```typescript
// tests/integration/performance.test.ts
describe('Performance Tests', () => {
  const PERFORMANCE_THRESHOLDS = {
    maxResponseTime: 1000, // milliseconds
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    minThroughput: 100 // requests per second
  };
  
  it('should handle high conversation volume', async () => {
    const conversations = TestDataGenerator.generateBulkData({
      conversations: 100
    }).conversations;
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    // Execute operations concurrently
    const promises = conversations.map(conv => 
      server.handleToolCall('save_conversation', conv)
    );
    
    const results = await Promise.all(promises);
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    // Validate performance metrics
    const totalTime = endTime - startTime;
    const memoryIncrease = endMemory - startMemory;
    const throughput = conversations.length / (totalTime / 1000);
    
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxResponseTime * conversations.length);
    expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.maxMemoryUsage);
    expect(throughput).toBeGreaterThan(PERFORMANCE_THRESHOLDS.minThroughput);
    
    // Validate all operations succeeded
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
  
  it('should handle concurrent tool operations', async () => {
    const operations = [
      { tool: 'save_conversation', params: TestDataGenerator.generateConversation() },
      { tool: 'save_bug', params: TestDataGenerator.generateBug() },
      { tool: 'save_feature', params: TestDataGenerator.generateFeature() },
      { tool: 'search_conversations', params: { query: 'authentication' } },
      { tool: 'search_bugs', params: { query: 'validation' } },
      { tool: 'search_features', params: { query: 'middleware' } }
    ];
    
    const startTime = Date.now();
    
    const results = await Promise.all(
      operations.map(op => server.handleToolCall(op.tool, op.params))
    );
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(5000); // 5 seconds max
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
```

---

## End-to-End Tests

E2E tests validate complete user scenarios with real API interactions.

### End-to-End Test Example

```typescript
// tests/integration/end-to-end.test.ts
describe('End-to-End Tests', () => {
  let realServer: MCPServer;
  
  beforeAll(async () => {
    // Use real configuration for E2E tests
    process.env.NODE_ENV = 'test';
    process.env.REFBASE_API_URL = 'https://refbase.dev/api';
    
    realServer = new MCPServer();
    await realServer.initialize();
  });
  
  afterAll(async () => {
    await realServer.shutdown();
  });
  
  it('should complete developer workflow with real API', async () => {
    const scenario = TestDataGenerator.generateFeatureDevScenario();
    
    // 1. Get project context
    const contextResult = await realServer.handleToolCall('get_project_context', {
      projectPath: '/test/project'
    });
    
    if (contextResult.success) {
      expect(contextResult.data).toHaveProperty('projectName');
    } else {
      // Handle API unavailable case gracefully
      console.warn('RefBase API unavailable for E2E test');
      return;
    }
    
    // 2. Search for similar implementations
    const searchResult = await realServer.handleToolCall('search_features', {
      query: 'JWT authentication',
      techStack: ['node.js', 'express']
    });
    
    expect(searchResult.success).toBe(true);
    
    // 3. Save planning conversation
    const planResult = await realServer.handleToolCall('save_conversation', 
      scenario.planningPhase);
    expect(planResult.success).toBe(true);
    
    // 4. Save implementation
    const featureResult = await realServer.handleToolCall('save_feature', 
      scenario.finalFeature);
    expect(featureResult.success).toBe(true);
  }, 60000); // Extended timeout for API calls
});
```

---

## Test Coverage

### Coverage Configuration

Coverage is configured in `jest.config.js`:

```javascript
{
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/tools/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  }
}
```

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html

# View text summary
npm run test:coverage -- --coverage --coverageReporters=text
```

### Coverage Analysis

The test suite tracks coverage across:
- **Line Coverage**: Percentage of executed lines
- **Function Coverage**: Percentage of called functions  
- **Branch Coverage**: Percentage of executed branches
- **Statement Coverage**: Percentage of executed statements

High-priority areas (tools, core server) have stricter coverage requirements.

---

## CI/CD Integration

### GitHub Actions Workflow

The project includes automated testing via GitHub Actions:

- **Pull Request Tests**: Run full test suite on PRs
- **Integration Tests**: Daily scheduled integration tests
- **Performance Tests**: Weekly performance benchmarks
- **Coverage Reports**: Automatic coverage reporting

### Workflow Triggers

```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
```

### Test Matrix

Tests run across multiple scenarios:
- Different test suites (conversation, bug, feature, etc.)
- Different Node.js versions
- Different environments (development, production)

---

## Test Data and Fixtures

### Test Data Generator

The `TestDataGenerator` class provides realistic test data:

```typescript
import { TestDataGenerator } from './fixtures/testDataGenerator';

// Generate individual items
const conversation = TestDataGenerator.generateConversation();
const bug = TestDataGenerator.generateBug();
const feature = TestDataGenerator.generateFeature();

// Generate bulk data
const bulkData = TestDataGenerator.generateBulkData({
  conversations: 10,
  bugs: 15,
  features: 8
});

// Generate specific scenarios
const bugScenario = TestDataGenerator.generateBugResolutionScenario();
const devScenario = TestDataGenerator.generateFeatureDevScenario();
```

### Mock API Responses

```typescript
import { MockAPIResponseGenerator } from './fixtures/testDataGenerator';

// Generate mock responses
const conversationResponse = MockAPIResponseGenerator.generateAPIResponse(
  '/conversations', 'POST', true
);

const errorResponse = MockAPIResponseGenerator.generateAPIResponse(
  '/bugs', 'POST', false
);
```

---

## Writing New Tests

### Unit Test Template

```typescript
import { YourComponent } from '../../../src/path/to/YourComponent';
import { TestDataGenerator } from '../../integration/fixtures/testDataGenerator';

describe('YourComponent', () => {
  let component: YourComponent;
  
  beforeEach(() => {
    component = new YourComponent();
  });
  
  afterEach(() => {
    // Cleanup if needed
  });
  
  describe('methodName', () => {
    it('should handle valid input correctly', async () => {
      const input = TestDataGenerator.generateValidInput();
      const result = await component.methodName(input);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
    
    it('should handle invalid input gracefully', async () => {
      const invalidInput = {};
      
      await expect(component.methodName(invalidInput))
        .rejects.toThrow('Expected error message');
    });
    
    it('should handle edge cases', async () => {
      // Test edge cases
    });
  });
});
```

### Integration Test Template

```typescript
describe('Feature Integration', () => {
  let server: MCPServer;
  
  beforeAll(async () => {
    server = new MCPServer();
    await server.initialize();
  });
  
  afterAll(async () => {
    await server.shutdown();
  });
  
  beforeEach(() => {
    // Reset state between tests
  });
  
  it('should complete workflow successfully', async () => {
    const testData = TestDataGenerator.generateWorkflowData();
    
    // Step 1: Initial action
    const step1Result = await server.handleToolCall('tool1', testData.step1);
    expect(step1Result.success).toBe(true);
    
    // Step 2: Follow-up action
    const step2Result = await server.handleToolCall('tool2', {
      ...testData.step2,
      previousId: step1Result.data.id
    });
    expect(step2Result.success).toBe(true);
    
    // Validate final state
    const finalState = await server.getState();
    expect(finalState).toMatchExpectedState();
  });
});
```

### Test Best Practices

1. **Use Descriptive Names**: Test names should clearly describe what is being tested
2. **Test One Thing**: Each test should verify one specific behavior
3. **Use Setup/Teardown**: Properly initialize and cleanup test resources
4. **Mock External Dependencies**: Isolate the code under test
5. **Test Error Cases**: Include negative test cases
6. **Use Realistic Data**: Use the TestDataGenerator for realistic test scenarios

---

## Troubleshooting Tests

### Common Test Issues

**1. Test Timeouts**
```bash
# Increase timeout for slow tests
npm test -- --testTimeout=60000

# Run tests serially to avoid conflicts
npm test -- --runInBand
```

**2. Memory Issues**
```bash
# Run with more memory
node --max-old-space-size=4096 node_modules/.bin/jest

# Run specific test files
npm test -- tests/integration/conversation-flow.test.ts
```

**3. API Connection Issues**
```bash
# Check API connectivity
curl -I https://refbase.dev/api/health

# Use mock mode for offline testing
NODE_ENV=test npm test
```

**4. Coverage Issues**
```bash
# Check which files are missing coverage
npm run test:coverage -- --verbose

# Run specific test to improve coverage
npm test -- tests/tools/YourTool.test.ts --coverage
```

### Debug Mode

```bash
# Run tests with debugging
npm test -- --verbose --no-cache

# Run with Node.js debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Enable debug logging
DEBUG=refbase:* npm test
```

### Test Environment Variables

```bash
# Override test settings
NODE_ENV=test
REFBASE_API_URL=http://localhost:3000/api
LOG_LEVEL=debug
MCP_SERVER_PORT=3001
```

---

This testing guide provides comprehensive coverage of all testing aspects for the RefBase MCP. Regular testing ensures reliability, performance, and maintainability of the codebase.