/**
 * Simple test script to verify MCP server functionality
 */

const { spawn } = require('child_process');
const readline = require('readline');

console.log('Testing eventos MCP Server...\n');

// Start the MCP server
const server = spawn('node', ['dist/cli/server.js'], {
  env: {
    ...process.env,
    EVENTOS_API_KEY: process.env.EVENTOS_API_KEY || '22756fde-ef64-4528-9173-8cbb1b6c5864',
    EVENTOS_API_URL: 'https://public-api.eventos.tokyo',
    EVENTOS_TENANT: 'ev-kensho'
  }
});

// Create readline interfaces for stdin/stdout
const rlIn = readline.createInterface({
  input: server.stdout,
  crlfDelay: Infinity
});

const rlErr = readline.createInterface({
  input: server.stderr,
  crlfDelay: Infinity
});

// Track server state
let serverReady = false;
let testsPassed = 0;
let testsFailed = 0;

// Handle server output
rlIn.on('line', (line) => {
  try {
    const message = JSON.parse(line);
    console.log('Server response:', JSON.stringify(message, null, 2));
    
    // Check for initialize response
    if (message.jsonrpc === '2.0' && message.result && message.result.protocolVersion) {
      console.log('✅ Server initialized successfully');
      serverReady = true;
      testsPassed++;
      
      // Send list tools request
      sendRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      });
    }
    
    // Check for tools list response
    if (message.id === 2 && message.result && message.result.tools) {
      console.log(`✅ Found ${message.result.tools.length} tools`);
      testsPassed++;
      
      // List the tools
      message.result.tools.forEach(tool => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
      
      // Test authentication tool
      sendRequest({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'eventos_authenticate',
          arguments: {}
        }
      });
    }
    
    // Check for authentication response
    if (message.id === 3 && message.result) {
      if (message.result.content && message.result.content[0]) {
        const content = message.result.content[0].text;
        if (content.includes('Successfully authenticated')) {
          console.log('✅ Authentication successful');
          testsPassed++;
        } else if (content.includes('Authentication failed')) {
          console.log('❌ Authentication failed');
          testsFailed++;
        }
      }
      
      // Complete tests
      completeTests();
    }
    
  } catch (e) {
    // Not JSON, just log it
    console.log('Server output:', line);
  }
});

// Handle server errors
rlErr.on('line', (line) => {
  console.error('Server error:', line);
});

// Handle server exit
server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Send a request to the server
function sendRequest(request) {
  console.log('\nSending request:', JSON.stringify(request, null, 2));
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Complete tests and exit
function completeTests() {
  console.log('\n========================================');
  console.log('Test Results:');
  console.log(`  Passed: ${testsPassed}`);
  console.log(`  Failed: ${testsFailed}`);
  console.log('========================================\n');
  
  if (testsFailed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed.');
  }
  
  // Close the server
  server.kill();
  process.exit(testsFailed === 0 ? 0 : 1);
}

// Start by sending initialize request
console.log('Initializing MCP server...\n');
sendRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  if (!serverReady) {
    console.error('❌ Server did not respond within 10 seconds');
    server.kill();
    process.exit(1);
  }
}, 10000);