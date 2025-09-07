/**
 * Integration tests for MCP tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { EventosAuthService } from '../../src/services/auth.js';
import { EventosTicketsService } from '../../src/services/tickets.js';
import { setupServer } from '../../src/server.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Mock the stdio transport
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

describe('MCP Tools Integration', () => {
  let server: Server;
  let authService: EventosAuthService;
  let ticketsService: EventosTicketsService;

  beforeAll(() => {
    // Setup services
    authService = new EventosAuthService();
    ticketsService = new EventosTicketsService();

    // Create server
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

    // Setup server with our tools
    setupServer(server, authService, ticketsService);
  });

  describe('eventos_authenticate tool', () => {
    it('should authenticate and return token', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'eventos_authenticate',
          arguments: {},
        },
      };

      const mockApiResponse = {
        access_token: 'test-token-123',
        expired_at: '2025-09-08 12:00:00',
      };

      // Mock the API call
      jest.spyOn(authService, 'authenticate').mockResolvedValue(mockApiResponse);

      const handler = server.getRequestHandlers().get('tools/call');
      const result = await handler?.(request, {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Successfully authenticated'),
          },
        ],
      });

      expect(authService.authenticate).toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'eventos_authenticate',
          arguments: {},
        },
      };

      // Mock the API call to throw error
      jest.spyOn(authService, 'authenticate').mockRejectedValue(new Error('Invalid API key'));

      const handler = server.getRequestHandlers().get('tools/call');
      const result = await handler?.(request, {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Authentication failed'),
          },
        ],
        isError: true,
      });
    });
  });

  describe('eventos_list_tickets tool', () => {
    it('should list tickets with pagination', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'eventos_list_tickets',
          arguments: {
            content_id: '101103',
            limit: 10,
            offset: 0,
          },
        },
      };

      const mockTickets = {
        tickets: [
          {
            id: 1,
            common: { price: 5000 },
            language_data: [{ title: 'Test Ticket' }],
          },
        ],
      };

      jest.spyOn(ticketsService, 'listTickets').mockResolvedValue(mockTickets);

      const handler = server.getRequestHandlers().get('tools/call');
      const result = await handler?.(request, {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Found 1 ticket(s)'),
          },
        ],
      });

      expect(ticketsService.listTickets).toHaveBeenCalledWith('101103', 10, 0, undefined);
    });
  });

  describe('eventos_create_ticket tool', () => {
    it('should create a new ticket', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'eventos_create_ticket',
          arguments: {
            content_id: '101103',
            eventId: 'test-event',
            type: 'general',
            name: 'Test Ticket',
            description: 'Test Description',
            price: 5000,
            currency: 'JPY',
            quantity: 100,
            salesStartDate: '2025-01-07 12:00:00',
            salesEndDate: '2025-12-31 23:59:59',
            validFrom: '2025-01-07 12:00:00',
            validUntil: '2025-12-31 23:59:59',
          },
        },
      };

      const mockResponse = { id: 12345 };

      jest.spyOn(ticketsService, 'createTicket').mockResolvedValue(mockResponse);

      const handler = server.getRequestHandlers().get('tools/call');
      const result = await handler?.(request, {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Ticket created successfully'),
          },
        ],
      });

      expect(ticketsService.createTicket).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'eventos_create_ticket',
          arguments: {
            content_id: '101103',
            eventId: 'test-event',
            type: 'general',
            name: '', // Invalid: empty name
            price: -100, // Invalid: negative price
          },
        },
      };

      const handler = server.getRequestHandlers().get('tools/call');
      const result = await handler?.(request, {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Validation error'),
          },
        ],
        isError: true,
      });
    });
  });

  describe('eventos_update_ticket tool', () => {
    it('should update an existing ticket', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'eventos_update_ticket',
          arguments: {
            ticketId: '12345',
            content_id: '101103',
            eventId: 'test-event',
            type: 'general',
            name: 'Updated Ticket',
            price: 3000,
            currency: 'JPY',
            quantity: 50,
          },
        },
      };

      jest.spyOn(ticketsService, 'updateTicket').mockResolvedValue(undefined);

      const handler = server.getRequestHandlers().get('tools/call');
      const result = await handler?.(request, {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Ticket 12345 updated successfully'),
          },
        ],
      });

      expect(ticketsService.updateTicket).toHaveBeenCalledWith(
        '12345',
        '101103',
        expect.any(Object),
      );
    });
  });

  describe('eventos_delete_ticket tool', () => {
    it('should delete a ticket', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'eventos_delete_ticket',
          arguments: {
            ticketId: '12345',
            content_id: '101103',
          },
        },
      };

      jest.spyOn(ticketsService, 'deleteTicket').mockResolvedValue(undefined);

      const handler = server.getRequestHandlers().get('tools/call');
      const result = await handler?.(request, {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Ticket 12345 deleted successfully'),
          },
        ],
      });

      expect(ticketsService.deleteTicket).toHaveBeenCalledWith('12345', '101103');
    });

    it('should handle deletion errors', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'eventos_delete_ticket',
          arguments: {
            ticketId: '99999',
            content_id: '101103',
          },
        },
      };

      jest.spyOn(ticketsService, 'deleteTicket').mockRejectedValue(new Error('Ticket not found'));

      const handler = server.getRequestHandlers().get('tools/call');
      const result = await handler?.(request, {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Failed to delete ticket'),
          },
        ],
        isError: true,
      });
    });
  });

  describe('eventos_get_ticket tool', () => {
    it('should get ticket details', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'eventos_get_ticket',
          arguments: {
            ticketId: '12345',
            content_id: '101103',
          },
        },
      };

      const mockTicket = {
        id: 12345,
        common: {
          price: 5000,
          enable_sales_period: true,
          sales_period_start: '2025-01-07 12:00:00',
          sales_period_end: '2025-12-31 23:59:59',
        },
        language_data: [
          {
            language_id: 1,
            title: 'Test Ticket',
            description: 'Test Description',
          },
        ],
      };

      jest.spyOn(ticketsService, 'getTicket').mockResolvedValue(mockTicket);

      const handler = server.getRequestHandlers().get('tools/call');
      const result = await handler?.(request, {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Ticket 12345'),
          },
        ],
      });

      expect(ticketsService.getTicket).toHaveBeenCalledWith('12345', '101103');
    });
  });
});
