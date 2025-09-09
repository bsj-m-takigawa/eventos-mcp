#!/usr/bin/env node
/**
 * MCP server for eventos API integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Import tool definitions
import { authToolDefinition } from '../tools/auth-tool.js';
import { accountToolDefinitions } from '../tools/account-tools.js';
import { ticketToolDefinitions } from '../tools/ticket-tools.js';
import { chartToolDefinitions } from '../tools/chart-tool.js';

// Validate environment variables
function validateEnvironment(): void {
  const required = ['EVENTOS_TENANT', 'EVENTOS_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please create a .env file with the required variables.');
    console.error(
      'EVENTOS_TENANT should be your subdomain (e.g., "mycompany" for mycompany.eventos.tokyo)',
    );
    process.exit(1);
  }
}

// Main server setup
async function main() {
  validateEnvironment();

  // Create server instance
  const server = new Server(
    {
      name: 'eventos-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register all tools
  const allTools = [
    authToolDefinition,
    ...accountToolDefinitions,
    ...ticketToolDefinitions,
    ...chartToolDefinitions,
  ];

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;
    const tool = allTools.find((t) => t.name === name);

    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    const result = await tool.handler((args as any) || {});
    return {
      content: result.content,
    };
  });

  // Error handling
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    console.log('Shutting down MCP server...');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down MCP server...');
    await server.close();
    process.exit(0);
  });

  // Create and connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('eventos MCP server started successfully');
}

// Extension methods for Server class to match test expectations
declare module '@modelcontextprotocol/sdk/server/index.js' {
  interface Server {
    listTools(): any[];
    callTool(name: string, args: any): Promise<any>;
  }
}

// Add methods to Server prototype for testing
(Server.prototype as any).listTools = function () {
  const tools = [
    authToolDefinition,
    ...accountToolDefinitions,
    ...ticketToolDefinitions,
    ...chartToolDefinitions,
  ];

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
};

(Server.prototype as any).callTool = async function (name: string, args: any) {
  const allTools = [
    authToolDefinition,
    ...accountToolDefinitions,
    ...ticketToolDefinitions,
    ...chartToolDefinitions,
  ];

  const tool = allTools.find((t) => t.name === name);

  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  return tool.handler(args || {});
};

(Server.prototype as any).getCapabilities = function () {
  return {
    tools: {},
  };
};

// Run server if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

// Export for testing
export { Server };
export default main;
