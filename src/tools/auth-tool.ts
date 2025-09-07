/**
 * MCP authentication tool for eventos
 */

import type { MCPToolResponse } from '../models/mcp-types.js';
import { MCPErrorHandler } from '../lib/error-handler.js';
import { AuthService } from '../services/auth.js';
import { ApiClient } from '../lib/api-client.js';

let authService: AuthService | null = null;

/**
 * Initialize auth service if not already initialized
 */
function getAuthService(): AuthService {
  if (!authService) {
    const apiClient = new ApiClient();
    authService = new AuthService(apiClient);
  }
  return authService;
}

/**
 * MCP tool: eventos_authenticate
 * Authenticate with eventos API and get access token
 */
export async function authenticateTool(): Promise<MCPToolResponse> {
  try {
    const service = getAuthService();
    const token = await service.authenticate();

    return MCPErrorHandler.createSuccessResponse(
      {
        accessToken: token.accessToken,
        expiresIn: token.expiresIn,
        tokenType: token.tokenType,
        message: 'Authentication successful',
      },
      `Successfully authenticated. Token valid for ${token.expiresIn} seconds.`,
    );
  } catch (error: any) {
    MCPErrorHandler.logError('authenticateTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * Tool definition for registration
 */
export const authToolDefinition = {
  name: 'eventos_authenticate' as const,
  description: 'Authenticate with eventos API and get access token',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: authenticateTool,
};
