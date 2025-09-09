/**
 * MCP user listing tools for eventos
 */

import type { MCPToolResponse, ListUsersArgs } from '../models/mcp-types.js';
import { MCPErrorHandler } from '../lib/error-handler.js';
import { ApiClient } from '../lib/api-client.js';
import { AuthService } from '../services/auth.js';
import { UserService } from '../services/users.js';

let userService: UserService | null = null;

function getUserService(): UserService {
  if (!userService) {
    const apiClient = new ApiClient();
    const authService = new AuthService(apiClient);
    userService = new UserService(apiClient, authService);
  }
  return userService;
}

/**
 * MCP tool: eventos_list_users
 * List users for an event
 */
export async function listUsersTool(args: ListUsersArgs): Promise<MCPToolResponse> {
  try {
    const missing = MCPErrorHandler.validateRequiredParams(args, ['event_id']);
    if (missing.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(missing.map((f) => `${f} is required`));
    }

    const service = getUserService();
    const result = await service.listUsers({
      event_id: args.event_id,
      per_page: args.per_page,
      page: args.page,
    });

    return MCPErrorHandler.createSuccessResponse(result);
  } catch (error: any) {
    MCPErrorHandler.logError('listUsersTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

export const userToolDefinitions = [
  {
    name: 'eventos_list_users' as const,
    description: 'List users for an event',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'Target event ID' },
        per_page: { type: 'number', description: 'Items per page (optional)' },
        page: { type: 'number', description: 'Page number (optional)' },
      },
      required: ['event_id'],
    },
    handler: listUsersTool,
  },
];

