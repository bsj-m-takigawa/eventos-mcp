import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { AccountService } from '../../src/services/accounts';
import { AuthService } from '../../src/services/auth';
import { ApiClient } from '../../src/lib/api-client';
import type { Account } from '../../src/models/eventos-types';

describe('Account Operations via MCP Tools', () => {
  let server: Server;
  let accountService: AccountService;
  let authService: AuthService;
  let testAccount: Account;

  beforeAll(async () => {
    // Initialize services
    const apiClient = new ApiClient();
    authService = new AuthService(apiClient);
    accountService = new AccountService(apiClient, authService);

    // Initialize MCP server
    server = new Server(
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

    // Authenticate
    await authService.authenticate();
  });

  describe('Account CRUD Operations', () => {
    it('should create account via MCP tool', async () => {
      const result = await server.callTool('eventos_create_account', {
        email: `mcp-test-${Date.now()}@example.com`,
        name: 'MCP Test User',
        organization: 'Test Org',
        role: 'attendee',
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.id).toBeDefined();
      expect(response.email).toContain('@example.com');
      expect(response.status).toBe('active');

      testAccount = response;
    });

    it('should list accounts via MCP tool', async () => {
      const result = await server.callTool('eventos_list_accounts', {
        limit: 10,
        offset: 0,
        status: 'active',
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text);

      expect(response.data).toBeInstanceOf(Array);
      expect(response.meta).toBeDefined();

      // Should include our test account
      const found = response.data.find((acc: Account) => acc.id === testAccount.id);
      expect(found).toBeDefined();
    });

    it('should get specific account via MCP tool', async () => {
      const result = await server.callTool('eventos_get_account', {
        accountId: testAccount.id,
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text);

      expect(response.id).toBe(testAccount.id);
      expect(response.email).toBe(testAccount.email);
      expect(response.name).toBe(testAccount.name);
    });

    it('should update account via MCP tool', async () => {
      const result = await server.callTool('eventos_update_account', {
        accountId: testAccount.id,
        name: 'Updated MCP User',
        organization: 'Updated Org',
        phone: '+1234567890',
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text);

      expect(response.id).toBe(testAccount.id);
      expect(response.name).toBe('Updated MCP User');
      expect(response.organization).toBe('Updated Org');
      expect(response.phone).toBe('+1234567890');
    });

    it('should delete account via MCP tool', async () => {
      const result = await server.callTool('eventos_delete_account', {
        accountId: testAccount.id,
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('deleted');

      // Verify deletion
      try {
        await server.callTool('eventos_get_account', {
          accountId: testAccount.id,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid account ID', async () => {
      try {
        await server.callTool('eventos_get_account', {
          accountId: 'invalid-id-12345',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should validate email format', async () => {
      try {
        await server.callTool('eventos_create_account', {
          email: 'invalid-email',
          name: 'Test User',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('invalid');
      }
    });

    it('should handle missing required fields', async () => {
      try {
        await server.callTool('eventos_create_account', {
          email: 'test@example.com',
          // name is missing
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('required');
      }
    });
  });

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      // Get first page
      const page1 = await server.callTool('eventos_list_accounts', {
        limit: 5,
        offset: 0,
      });

      const response1 = JSON.parse(page1.content[0].text);
      expect(response1.data.length).toBeLessThanOrEqual(5);

      // Get second page
      const page2 = await server.callTool('eventos_list_accounts', {
        limit: 5,
        offset: 5,
      });

      const response2 = JSON.parse(page2.content[0].text);

      // Ensure different data
      if (response1.data.length > 0 && response2.data.length > 0) {
        expect(response1.data[0].id).not.toBe(response2.data[0].id);
      }
    });
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });
});
