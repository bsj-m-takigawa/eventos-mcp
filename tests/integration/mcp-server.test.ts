/**
 * Integration test for MCP server tool registration and execution
 */

import { spawn } from 'child_process';
import { config } from 'dotenv';

config();

describe('MCP Server Integration', () => {
  describe('Tool Registration', () => {
    it('should list all registered tools', async () => {
      const tools = await callMCPMethod('tools/list', {});

      expect(tools).toBeDefined();
      expect(Array.isArray(tools.tools)).toBe(true);

      const toolNames = tools.tools.map((t: any) => t.name);

      // Check authentication tool
      expect(toolNames).toContain('eventos_authenticate');

      // Check ticket tools
      expect(toolNames).toContain('eventos_list_tickets');
      expect(toolNames).toContain('eventos_get_ticket');
      expect(toolNames).toContain('eventos_create_ticket');
      expect(toolNames).toContain('eventos_update_ticket');
      expect(toolNames).toContain('eventos_delete_ticket');
    });

    it('should provide proper input schemas for tools', async () => {
      const tools = await callMCPMethod('tools/list', {});

      const createTicketTool = tools.tools.find((t: any) => t.name === 'eventos_create_ticket');
      expect(createTicketTool).toBeDefined();
      expect(createTicketTool.inputSchema).toBeDefined();
      expect(createTicketTool.inputSchema.type).toBe('object');
      expect(createTicketTool.inputSchema.properties).toHaveProperty('eventId');
      expect(createTicketTool.inputSchema.properties).toHaveProperty('name');
      expect(createTicketTool.inputSchema.properties).toHaveProperty('price');
      expect(createTicketTool.inputSchema.required).toContain('eventId');
    });
  });

  describe('Tool Execution', () => {
    it('should execute authentication tool', async () => {
      const result = await callMCPMethod('tools/call', {
        name: 'eventos_authenticate',
        arguments: {},
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);

      if (result.content[0].type === 'text') {
        const data = JSON.parse(result.content[0].text);
        expect(data).toHaveProperty('accessToken');
        expect(data).toHaveProperty('expiresIn');
      }
    });

    it('should handle missing required parameters', async () => {
      const result = await callMCPMethod('tools/call', {
        name: 'eventos_get_ticket',
        arguments: {}, // Missing required ticketId
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();

      if (result.content[0].type === 'text') {
        const response = JSON.parse(result.content[0].text);
        expect(response.error).toBeDefined();
        expect(response.error).toContain('required');
      }
    });

    it('should list tickets with content_id', async () => {
      const result = await callMCPMethod('tools/call', {
        name: 'eventos_list_tickets',
        arguments: {
          content_id: '101103',
          limit: 5,
        },
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();

      if (result.content[0].type === 'text') {
        const response = JSON.parse(result.content[0].text);
        if (!response.error) {
          expect(response.data).toBeDefined();
          expect(Array.isArray(response.data)).toBe(true);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool names', async () => {
      const result = await callMCPMethod('tools/call', {
        name: 'invalid_tool_name',
        arguments: {},
      });

      expect(result).toBeDefined();
      // The server should return an error or undefined
    });

    it('should handle network errors gracefully', async () => {
      // Temporarily set invalid API URL
      const originalUrl = process.env.EVENTOS_API_URL;
      process.env.EVENTOS_API_URL = 'https://invalid-url-that-does-not-exist.com';

      const result = await callMCPMethod('tools/call', {
        name: 'eventos_authenticate',
        arguments: {},
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();

      if (result.content[0].type === 'text') {
        const response = JSON.parse(result.content[0].text);
        expect(response.error).toBeDefined();
      }

      // Restore original URL
      process.env.EVENTOS_API_URL = originalUrl;
    });
  });
});

// Helper function to call MCP methods
function callMCPMethod(method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('node', ['dist/cli/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    const request = {
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    };

    mcpProcess.stdin.write(JSON.stringify(request) + '\n');

    let response = '';
    mcpProcess.stdout.on('data', (data) => {
      response += data.toString();
      try {
        const lines = response.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const parsed = JSON.parse(line);
            if (parsed.id === 1) {
              mcpProcess.kill();
              resolve(parsed.result);
              return;
            }
          }
        }
      } catch (e) {
        // Continue collecting data
      }
    });

    mcpProcess.stderr.on('data', (data) => {
      // Ignore server startup messages
    });

    setTimeout(() => {
      mcpProcess.kill();
      reject(new Error('Timeout waiting for response'));
    }, 5000);
  });
}
