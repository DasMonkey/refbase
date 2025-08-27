#!/usr/bin/env node

/**
 * Test script for RefBase MCP API endpoints
 * Run with: node test-api.js
 */

const baseUrl = process.env.API_BASE_URL || 'http://localhost:8888/.netlify/functions/api';
const userToken = process.env.USER_TOKEN || 'your-supabase-user-token-here';

// Test data
const testConversation = {
  title: "Test MCP Conversation",
  messages: [
    { role: "user", content: "How do I implement authentication?" },
    { role: "assistant", content: "You can implement authentication using Supabase Auth..." }
  ],
  tags: ["authentication", "supabase", "test"],
  projectContext: {
    projectName: "Test Project",
    projectPath: "/test/project",
    techStack: ["react", "typescript", "supabase"]
  }
};

const testBug = {
  title: "Login Button Not Working",
  description: "The login button doesn't respond when clicked",
  symptoms: ["button not clickable", "no response on click"],
  reproduction: "1. Go to login page\n2. Click login button\n3. Nothing happens",
  status: "open",
  severity: "medium",
  tags: ["ui", "login", "bug"]
};

const testFeature = {
  title: "Dark Mode Implementation",
  description: "Add dark mode support to the application",
  implementation: "Use CSS variables and context API",
  codeExamples: [
    {
      language: "typescript",
      code: "const ThemeContext = createContext<'light' | 'dark'>('light');",
      description: "Theme context setup"
    }
  ],
  techStack: ["react", "css", "typescript"],
  tags: ["ui", "theme", "feature"]
};

const testDocument = {
  title: "API Documentation",
  content: "# API Documentation\n\n## Authentication\n\nUse Bearer tokens...",
  type: "api-docs",
  tags: ["documentation", "api"],
  language: "markdown"
};

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`\n🔄 ${method} ${endpoint}`);
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data);
      return data;
    } else {
      console.log('❌ Error:', response.status, data);
      return null;
    }
  } catch (error) {
    console.log('💥 Request failed:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Testing RefBase MCP API Endpoints');
  console.log('=====================================');
  
  if (userToken === 'your-supabase-user-token-here') {
    console.log('⚠️  Please set your USER_TOKEN environment variable');
    console.log('   Example: USER_TOKEN=your-actual-token node test-api.js');
    process.exit(1);
  }

  // Test health check
  await makeRequest('/', 'GET');

  // Test conversations
  console.log('\n📝 Testing Conversations API');
  const conversation = await makeRequest('/api/conversations', 'POST', testConversation);
  if (conversation) {
    await makeRequest('/api/conversations?query=authentication', 'GET');
    await makeRequest('/api/conversations?tags=supabase', 'GET');
  }

  // Test bugs
  console.log('\n🐛 Testing Bugs API');
  const bug = await makeRequest('/api/bugs', 'POST', testBug);
  if (bug) {
    await makeRequest('/api/bugs?query=login', 'GET');
    await makeRequest('/api/bugs?status=open', 'GET');
    await makeRequest('/api/bugs?severity=medium', 'GET');
  }

  // Test features
  console.log('\n⭐ Testing Features API');
  const feature = await makeRequest('/api/features', 'POST', testFeature);
  if (feature) {
    await makeRequest('/api/features?query=dark mode', 'GET');
    await makeRequest('/api/features?techStack=react', 'GET');
  }

  // Test documents
  console.log('\n📚 Testing Documents API');
  const document = await makeRequest('/api/documents', 'POST', testDocument);
  if (document) {
    await makeRequest('/api/documents?query=API', 'GET');
    await makeRequest('/api/documents?type=api-docs', 'GET');
  }

  console.log('\n✨ Test complete!');
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runTests().catch(console.error);