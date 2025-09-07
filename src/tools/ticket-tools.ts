/**
 * MCP ticket management tools for eventos
 */

import type {
  MCPToolResponse,
  ListTicketsArgs,
  GetTicketArgs,
  CreateTicketArgs,
  UpdateTicketArgs,
  DeleteTicketArgs,
} from '../models/mcp-types.js';
import { MCPErrorHandler } from '../lib/error-handler.js';
import { TicketService } from '../services/tickets.js';
import { AuthService } from '../services/auth.js';
import { ApiClient } from '../lib/api-client.js';

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
 * MCP tool: eventos_list_tickets
 */
export async function listTicketsTool(args: ListTicketsArgs): Promise<MCPToolResponse> {
  try {
    const service = getTicketService();
    const result = await service.listTickets({
      content_id: args.content_id,
      limit: args.limit,
      offset: args.offset,
      is_publish: args.is_publish,
      eventId: args.eventId,
      status: args.status,
    });

    return MCPErrorHandler.createSuccessResponse(result);
  } catch (error: any) {
    MCPErrorHandler.logError('listTicketsTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * MCP tool: eventos_get_ticket
 */
export async function getTicketTool(args: GetTicketArgs): Promise<MCPToolResponse> {
  try {
    const missing = MCPErrorHandler.validateRequiredParams(args, ['ticketId']);
    if (missing.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(missing.map((f) => `${f} is required`));
    }

    const service = getTicketService();
    const ticket = await service.getTicket(args.ticketId, args.content_id);

    return MCPErrorHandler.createSuccessResponse(ticket);
  } catch (error: any) {
    MCPErrorHandler.logError('getTicketTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * MCP tool: eventos_create_ticket
 */
export async function createTicketTool(args: CreateTicketArgs): Promise<MCPToolResponse> {
  try {
    const missing = MCPErrorHandler.validateRequiredParams(args, [
      'eventId',
      'type',
      'name',
      'price',
      'currency',
      'quantity',
    ]);
    if (missing.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(missing.map((f) => `${f} is required`));
    }

    const service = getTicketService();

    // Validate input
    const errors = service.validateTicketInput(args);
    if (errors.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(errors);
    }

    // Use createSimpleTicket which converts to API format
    const ticket = await service.createSimpleTicket({
      content_id: args.content_id,
      eventId: args.eventId,
      type: args.type,
      name: args.name,
      description: args.description,
      price: args.price,
      currency: args.currency,
      quantity: args.quantity,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
    });

    return MCPErrorHandler.createSuccessResponse(ticket);
  } catch (error: any) {
    MCPErrorHandler.logError('createTicketTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * MCP tool: eventos_update_ticket
 */
export async function updateTicketTool(args: UpdateTicketArgs): Promise<MCPToolResponse> {
  try {
    const missing = MCPErrorHandler.validateRequiredParams(args, [
      'ticketId',
      'eventId',
      'type',
      'name',
      'price',
      'currency',
      'quantity',
    ]);
    if (missing.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(missing.map((f) => `${f} is required`));
    }

    const service = getTicketService();

    const updateData = {
      eventId: args.eventId,
      type: args.type,
      name: args.name,
      description: args.description,
      price: args.price,
      currency: args.currency,
      quantity: args.quantity,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
    };

    // Validate input
    const errors = service.validateTicketInput(updateData);
    if (errors.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(errors);
    }

    // Convert to API format and update
    const fullInput = service.convertToAPIFormat(updateData);
    const ticket = await service.updateTicket(args.ticketId, {
      ...fullInput,
      content_id: args.content_id,
    });

    return MCPErrorHandler.createSuccessResponse(ticket);
  } catch (error: any) {
    MCPErrorHandler.logError('updateTicketTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * MCP tool: eventos_delete_ticket
 */
export async function deleteTicketTool(args: DeleteTicketArgs): Promise<MCPToolResponse> {
  try {
    const missing = MCPErrorHandler.validateRequiredParams(args, ['ticketId']);
    if (missing.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(missing.map((f) => `${f} is required`));
    }

    const service = getTicketService();
    await service.deleteTicket(args.ticketId, args.content_id);

    return MCPErrorHandler.createSuccessResponse(
      { success: true },
      `Ticket ${args.ticketId} deleted successfully`,
    );
  } catch (error: any) {
    MCPErrorHandler.logError('deleteTicketTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * Tool definitions for registration
 */
export const ticketToolDefinitions = [
  {
    name: 'eventos_list_tickets' as const,
    description: 'List all tickets with optional filtering',
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
    handler: listTicketsTool,
  },
  {
    name: 'eventos_get_ticket' as const,
    description: 'Get details of a specific ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string', description: 'The ID of the ticket to retrieve' },
        content_id: { type: 'string', description: 'Content ID for eventos API' },
      },
      required: ['ticketId'],
    },
    handler: getTicketTool,
  },
  {
    name: 'eventos_create_ticket' as const,
    description: 'Create a new ticket',
    inputSchema: {
      type: 'object',
      properties: {
        content_id: { type: 'string', description: 'Content ID for eventos API' },
        eventId: { type: 'string', description: 'Event ID for the ticket' },
        type: {
          type: 'string',
          enum: ['general', 'vip', 'early-bird', 'group'],
          description: 'Type of ticket',
        },
        name: { type: 'string', description: 'Name of the ticket' },
        description: { type: 'string', description: 'Description (optional)' },
        price: { type: 'number', description: 'Price of the ticket' },
        currency: { type: 'string', description: '3-letter ISO currency code' },
        quantity: { type: 'number', description: 'Total number of tickets available' },
        validFrom: { type: 'string', description: 'Valid from date (ISO 8601, optional)' },
        validUntil: { type: 'string', description: 'Valid until date (ISO 8601, optional)' },
      },
      required: ['eventId', 'type', 'name', 'price', 'currency', 'quantity'],
    },
    handler: createTicketTool,
  },
  {
    name: 'eventos_update_ticket' as const,
    description: 'Update an existing ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string', description: 'The ID of the ticket to update' },
        content_id: { type: 'string', description: 'Content ID for eventos API' },
        eventId: { type: 'string', description: 'Event ID for the ticket' },
        type: {
          type: 'string',
          enum: ['general', 'vip', 'early-bird', 'group'],
          description: 'Type of ticket',
        },
        name: { type: 'string', description: 'Name of the ticket' },
        description: { type: 'string', description: 'Description (optional)' },
        price: { type: 'number', description: 'Price of the ticket' },
        currency: { type: 'string', description: '3-letter ISO currency code' },
        quantity: { type: 'number', description: 'Total number of tickets available' },
        validFrom: { type: 'string', description: 'Valid from date (ISO 8601, optional)' },
        validUntil: { type: 'string', description: 'Valid until date (ISO 8601, optional)' },
      },
      required: ['ticketId', 'eventId', 'type', 'name', 'price', 'currency', 'quantity'],
    },
    handler: updateTicketTool,
  },
  {
    name: 'eventos_delete_ticket' as const,
    description: 'Delete a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string', description: 'The ID of the ticket to delete' },
        content_id: { type: 'string', description: 'Content ID for eventos API' },
      },
      required: ['ticketId'],
    },
    handler: deleteTicketTool,
  },
];
