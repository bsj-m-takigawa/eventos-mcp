/**
 * MCP chart and table tools for eventos
 */

import type {
  MCPToolResponse,
  ListTicketsArgs,
} from '../models/mcp-types.js';
import { MCPErrorHandler } from '../lib/error-handler.js';
import { TicketService } from '../services/tickets.js';
import { AuthService } from '../services/auth.js';
import { ApiClient } from '../lib/api-client.js';
import { ImageGenerator } from '../lib/image-generator.js';

let ticketService: TicketService | null = null;

/**
 * Initialize ticket service if not already initialized
 */
function getTicketService(): TicketService {
  if (!ticketService) {
    const apiClient = new ApiClient();
    const authService = new AuthService(apiClient);
    ticketService = new TicketService(apiClient, authService);
  }
  return ticketService;
}

/**
 * MCP tool: eventos_tickets_table
 * Display tickets in a formatted table
 */
export async function ticketsTableTool(args: ListTicketsArgs): Promise<MCPToolResponse> {
  try {
    const service = getTicketService();
    const tableOutput = await service.generateTicketsSummary({
      content_id: args.content_id,
      limit: args.limit,
      offset: args.offset,
      is_publish: args.is_publish,
      eventId: args.eventId,
      status: args.status,
    });

    return MCPErrorHandler.createSuccessResponse(
      tableOutput,
      'チケット一覧表を生成しました',
    );
  } catch (error: any) {
    MCPErrorHandler.logError('ticketsTableTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * MCP tool: eventos_tickets_simple_table
 * Display tickets in a simple formatted table (tickets only, no summary)
 */
export async function ticketsSimpleTableTool(args: ListTicketsArgs): Promise<MCPToolResponse> {
  try {
    const service = getTicketService();
    const response = await service.listTickets({
      content_id: args.content_id,
      limit: args.limit,
      offset: args.offset,
      is_publish: args.is_publish,
      eventId: args.eventId,
      status: args.status,
    });

    const tickets = response.tickets || [];
    const tableOutput = service.formatTicketsAsTable(tickets);

    return MCPErrorHandler.createSuccessResponse(
      tableOutput,
      `チケット一覧表を生成しました (${tickets.length}件)`,
    );
  } catch (error: any) {
    MCPErrorHandler.logError('ticketsSimpleTableTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * MCP tool: eventos_tickets_table_image
 * Generate tickets table as an image file
 */
export async function ticketsTableImageTool(args: ListTicketsArgs): Promise<MCPToolResponse> {
  try {
    const service = getTicketService();
    const response = await service.listTickets({
      content_id: args.content_id,
      limit: args.limit,
      offset: args.offset,
      is_publish: args.is_publish,
      eventId: args.eventId,
      status: args.status,
    });

    const tickets = response.tickets || [];
    const imageGenerator = new ImageGenerator();
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tickets-table-${args.content_id || 'default'}-${timestamp}.png`;
    
    const imagePath = await imageGenerator.generateSummaryImage(tickets, filename);

    return MCPErrorHandler.createSuccessResponse(
      `画像が生成されました: ${imagePath}\nチケット数: ${tickets.length}件`,
      `チケット一覧表を画像として生成しました (${tickets.length}件)`,
    );
  } catch (error: any) {
    MCPErrorHandler.logError('ticketsTableImageTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * Tool definitions for registration
 */
export const chartToolDefinitions = [
  {
    name: 'eventos_tickets_table' as const,
    description: 'Display tickets in a formatted table with summary statistics',
    inputSchema: {
      type: 'object',
      properties: {
        content_id: {
          type: 'string',
          description: 'Content ID for eventos API (required for actual API calls)',
        },
        limit: { type: 'number', description: 'Maximum number of tickets to return' },
        offset: { type: 'number', description: 'Number of tickets to skip' },
        is_publish: { type: 'boolean', description: 'Filter by publish status' },
        eventId: { type: 'string', description: 'Filter by event ID' },
        status: {
          type: 'string',
          enum: ['active', 'sold-out', 'cancelled'],
          description: 'Filter by ticket status',
        },
      },
      required: [],
    },
    handler: ticketsTableTool,
  },
  {
    name: 'eventos_tickets_simple_table' as const,
    description: 'Display tickets in a simple formatted table (no summary statistics)',
    inputSchema: {
      type: 'object',
      properties: {
        content_id: {
          type: 'string',
          description: 'Content ID for eventos API (required for actual API calls)',
        },
        limit: { type: 'number', description: 'Maximum number of tickets to return' },
        offset: { type: 'number', description: 'Number of tickets to skip' },
        is_publish: { type: 'boolean', description: 'Filter by publish status' },
        eventId: { type: 'string', description: 'Filter by event ID' },
        status: {
          type: 'string',
          enum: ['active', 'sold-out', 'cancelled'],
          description: 'Filter by ticket status',
        },
      },
      required: [],
    },
    handler: ticketsSimpleTableTool,
  },
  {
    name: 'eventos_tickets_table_image' as const,
    description: 'Generate tickets table as an image file (PNG)',
    inputSchema: {
      type: 'object',
      properties: {
        content_id: {
          type: 'string',
          description: 'Content ID for eventos API (required for actual API calls)',
        },
        limit: { type: 'number', description: 'Maximum number of tickets to return' },
        offset: { type: 'number', description: 'Number of tickets to skip' },
        is_publish: { type: 'boolean', description: 'Filter by publish status' },
        eventId: { type: 'string', description: 'Filter by event ID' },
        status: {
          type: 'string',
          enum: ['active', 'sold-out', 'cancelled'],
          description: 'Filter by ticket status',
        },
      },
      required: [],
    },
    handler: ticketsTableImageTool,
  },
];
