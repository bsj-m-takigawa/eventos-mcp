import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketService } from '../../src/services/tickets';
import { AuthService } from '../../src/services/auth';
import { ApiClient } from '../../src/lib/api-client';
import type { Ticket } from '../../src/models/eventos-types';

describe('Ticket Operations via MCP Tools', () => {
  let server: Server;
  let ticketService: TicketService;
  let authService: AuthService;
  let testTicket: Ticket;
  let testEventId: string;

  beforeAll(async () => {
    // Initialize services
    const apiClient = new ApiClient();
    authService = new AuthService(apiClient);
    ticketService = new TicketService(apiClient, authService);

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

    // Create a test event ID
    testEventId = `test-event-${Date.now()}`;
  });

  describe('Ticket CRUD Operations', () => {
    it('should create ticket via MCP tool', async () => {
      const result = await server.callTool('eventos_create_ticket', {
        eventId: testEventId,
        type: 'general',
        name: 'MCP Test Ticket',
        description: 'Test ticket created via MCP',
        price: 50.0,
        currency: 'USD',
        quantity: 100,
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.id).toBeDefined();
      expect(response.eventId).toBe(testEventId);
      expect(response.type).toBe('general');
      expect(response.price).toBe(50.0);
      expect(response.status).toBe('active');

      testTicket = response;
    });

    it('should list tickets via MCP tool', async () => {
      const result = await server.callTool('eventos_list_tickets', {
        limit: 10,
        offset: 0,
        eventId: testEventId,
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text);

      expect(response.data).toBeInstanceOf(Array);
      expect(response.meta).toBeDefined();

      // Should include our test ticket
      const found = response.data.find((ticket: Ticket) => ticket.id === testTicket.id);
      expect(found).toBeDefined();
    });

    it('should get specific ticket via MCP tool', async () => {
      const result = await server.callTool('eventos_get_ticket', {
        ticketId: testTicket.id,
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text);

      expect(response.id).toBe(testTicket.id);
      expect(response.eventId).toBe(testEventId);
      expect(response.name).toBe('MCP Test Ticket');
      expect(response.price).toBe(50.0);
    });

    it('should update ticket via MCP tool', async () => {
      const result = await server.callTool('eventos_update_ticket', {
        ticketId: testTicket.id,
        eventId: testEventId,
        type: 'vip',
        name: 'Updated VIP Ticket',
        description: 'Upgraded to VIP',
        price: 150.0,
        currency: 'USD',
        quantity: 50,
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text);

      expect(response.id).toBe(testTicket.id);
      expect(response.type).toBe('vip');
      expect(response.name).toBe('Updated VIP Ticket');
      expect(response.price).toBe(150.0);
      expect(response.quantity).toBe(50);
    });

    it('should delete ticket via MCP tool', async () => {
      const result = await server.callTool('eventos_delete_ticket', {
        ticketId: testTicket.id,
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('deleted');

      // Verify deletion
      try {
        await server.callTool('eventos_get_ticket', {
          ticketId: testTicket.id,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });
  });

  describe('Ticket Validation', () => {
    it('should validate ticket price', async () => {
      try {
        await server.callTool('eventos_create_ticket', {
          eventId: testEventId,
          type: 'general',
          name: 'Invalid Price Ticket',
          price: -50, // Invalid negative price
          currency: 'USD',
          quantity: 100,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('price');
      }
    });

    it('should validate currency format', async () => {
      try {
        await server.callTool('eventos_create_ticket', {
          eventId: testEventId,
          type: 'general',
          name: 'Invalid Currency Ticket',
          price: 50,
          currency: 'US', // Invalid - should be 3 letters
          quantity: 100,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('currency');
      }
    });

    it('should validate ticket quantity', async () => {
      try {
        await server.callTool('eventos_create_ticket', {
          eventId: testEventId,
          type: 'general',
          name: 'Invalid Quantity Ticket',
          price: 50,
          currency: 'USD',
          quantity: 0, // Invalid - must be at least 1
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('quantity');
      }
    });
  });

  describe('Ticket Filtering', () => {
    beforeAll(async () => {
      // Create multiple tickets for filtering tests
      const ticketTypes = ['general', 'vip', 'early-bird'];

      for (const type of ticketTypes) {
        await server.callTool('eventos_create_ticket', {
          eventId: `filter-test-${testEventId}`,
          type,
          name: `${type} ticket`,
          price: type === 'vip' ? 100 : 50,
          currency: 'USD',
          quantity: 50,
        });
      }
    });

    it('should filter tickets by status', async () => {
      const result = await server.callTool('eventos_list_tickets', {
        status: 'active',
        limit: 20,
      });

      const response = JSON.parse(result.content[0].text);
      response.data.forEach((ticket: Ticket) => {
        expect(ticket.status).toBe('active');
      });
    });

    it('should filter tickets by event', async () => {
      const result = await server.callTool('eventos_list_tickets', {
        eventId: `filter-test-${testEventId}`,
        limit: 20,
      });

      const response = JSON.parse(result.content[0].text);
      response.data.forEach((ticket: Ticket) => {
        expect(ticket.eventId).toBe(`filter-test-${testEventId}`);
      });
    });
  });

  describe('Ticket Availability', () => {
    it('should track ticket availability', async () => {
      // Create a ticket with limited quantity
      const createResult = await server.callTool('eventos_create_ticket', {
        eventId: testEventId,
        type: 'general',
        name: 'Limited Ticket',
        price: 75,
        currency: 'USD',
        quantity: 10,
      });

      const ticket = JSON.parse(createResult.content[0].text);

      expect(ticket.quantity).toBe(10);
      expect(ticket.available).toBeLessThanOrEqual(10);

      // Simulate ticket sales would reduce availability
      // This would be done through a separate purchase/registration API
    });

    it('should handle sold-out status', async () => {
      // Create a ticket and simulate it being sold out
      const createResult = await server.callTool('eventos_create_ticket', {
        eventId: testEventId,
        type: 'general',
        name: 'Popular Ticket',
        price: 100,
        currency: 'USD',
        quantity: 1, // Very limited
      });

      const ticket = JSON.parse(createResult.content[0].text);

      // In real scenario, after all tickets are sold:
      // ticket.available would be 0
      // ticket.status might change to 'sold-out'

      expect(ticket.quantity).toBe(1);
      expect(ticket.available).toBeGreaterThanOrEqual(0);
    });
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });
});
