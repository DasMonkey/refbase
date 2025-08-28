#!/usr/bin/env node

/**
 * Test script for RefBase MCP API endpoints (Local)
 */

const baseUrl = 'http://localhost:8888';
const userToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Im85eXhINXB4clVFdU8rU0IiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3ZmaWxyZGpvaHZ4eXBvbWNqbXR6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiZDI2MDQyMy0zNWZlLTQzNGEtOTBkMC1iNGIwOWMyYWVmNzQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU2MzIxMzY2LCJpYXQiOjE3NTYzMTc3NjYsImVtYWlsIjoiY2FsbG1ld2VubnlAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImNhbGxtZXdlbm55QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImJkMjYwNDIzLTM1ZmUtNDM0YS05MGQwLWI0YjA5YzJhZWY3NCJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzU2MzE3NzY2fV0sInNlc3Npb25faWQiOiI4YTY0ZmI2Mi1hNDJmLTQwNDAtYjU4ZC1iYWRkNjRiMWY3OTQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.PJWpll_3lGK9RjbxvttbxxVp7dwlO5b3ydUmZ7wpwFc';

// Test data
const testConversation = {
  title: "Test MCP Conversation - Local",
  messages: [
    { role: "user", content: "How do I implement React hooks?", timestamp: new Date().toISOString() },
    { role: "assistant", content: "You can implement React hooks using useState and useEffect...", timestamp: new Date().toISOString() }
  ],
  tags: ["react", "hooks", "test"],
  projectContext: {
    projectName: "Test Project",
    projectPath: "/test/project",
    techStack: ["react", "typescript"]
  }
};

const testBug = {
  title: "Login Button Not Working - Local Test",
  description: "The login button doesn't respond when clicked",
  symptoms: ["button not clickable", "no response on click"],
  reproduction: "1. Go to login page\n2. Click login button\n3. Nothing happens",
  status: "open",
  severity: "medium",
  tags: ["ui", "login", "bug"]
};

const testFeature = {
  title: "Dark Mode Implementation - Local Test",
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
  title: "Local API Test Documentation",
  content: "# API Testing\n\nThis is a test document created via MCP API locally.",
  type: "api-docs",
  tags: ["testing", "api", "local"],
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
      console.log('✅ Success:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log('❌ Error:', response.status, JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log('💥 Request failed:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Testing RefBase MCP API Endpoints (Local)');
  console.log('==============================================');

  // Test health check - skip JSON parsing for health check
  console.log('\n🏥 Testing Health Check');
  try {
    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    console.log('✅ Health Check Status:', response.status);
    const text = await response.text();
    console.log('📄 Health Response:', text.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }

  // Test conversations
  console.log('\n💬 Testing Conversations API');
  const conversation = await makeRequest('/api/conversations', 'POST', testConversation);
  if (conversation?.success) {
    console.log('📥 Testing conversation search...');
    await makeRequest('/api/conversations?query=React', 'GET');
    await makeRequest('/api/conversations?tags=hooks', 'GET');
  }

  // Test bugs
  console.log('\n🐛 Testing Bugs API');
  const bug = await makeRequest('/api/bugs', 'POST', testBug);
  if (bug?.success) {
    console.log('📥 Testing bug search...');
    await makeRequest('/api/bugs?query=login', 'GET');
    await makeRequest('/api/bugs?status=open', 'GET');
  }

  // Test features
  console.log('\n⭐ Testing Features API');
  const feature = await makeRequest('/api/features', 'POST', testFeature);
  if (feature?.success) {
    console.log('📥 Testing feature search...');
    await makeRequest('/api/features?query=dark mode', 'GET');
    await makeRequest('/api/features?techStack=react', 'GET');
  }

  // Test documents
  console.log('\n📚 Testing Documents API');
  const document = await makeRequest('/api/documents', 'POST', testDocument);
  if (document?.success) {
    console.log('📥 Testing document search...');
    await makeRequest('/api/documents?query=API', 'GET');
    await makeRequest('/api/documents?type=documentation', 'GET');
  }

  console.log('\n✨ Local API test complete!');
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.log('⚠️  node-fetch not found. Run: npm install node-fetch@2');
    process.exit(1);
  }
}

runTests().catch(console.error);