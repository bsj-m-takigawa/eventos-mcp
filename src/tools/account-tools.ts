/**
 * MCP account management tools for eventos
 */

import type {
  MCPToolResponse,
  ListAccountsArgs,
  GetAccountArgs,
  CreateAccountArgs,
  UpdateAccountArgs,
  DeleteAccountArgs,
} from '../models/mcp-types.js';
import { MCPErrorHandler } from '../lib/error-handler.js';
import { AccountService } from '../services/accounts.js';
import { AuthService } from '../services/auth.js';
import { ApiClient } from '../lib/api-client.js';

let accountService: AccountService | null = null;

/**
 * Initialize account service if not already initialized
 */
function getAccountService(): AccountService {
  if (!accountService) {
    const apiClient = new ApiClient();
    const authService = new AuthService(apiClient);
    accountService = new AccountService(apiClient, authService);
  }
  return accountService;
}

/**
 * MCP tool: eventos_list_accounts
 */
export async function listAccountsTool(args: ListAccountsArgs): Promise<MCPToolResponse> {
  try {
    const service = getAccountService();
    const result = await service.listAccounts({
      limit: args.limit,
      offset: args.offset,
      status: args.status,
    });

    return MCPErrorHandler.createSuccessResponse(result);
  } catch (error: any) {
    MCPErrorHandler.logError('listAccountsTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * MCP tool: eventos_get_account
 */
export async function getAccountTool(args: GetAccountArgs): Promise<MCPToolResponse> {
  try {
    const missing = MCPErrorHandler.validateRequiredParams(args, ['accountId']);
    if (missing.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(missing.map((f) => `${f} is required`));
    }

    const service = getAccountService();
    const account = await service.getAccount(args.accountId);

    return MCPErrorHandler.createSuccessResponse(account);
  } catch (error: any) {
    MCPErrorHandler.logError('getAccountTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * MCP tool: eventos_create_account
 */
export async function createAccountTool(args: CreateAccountArgs): Promise<MCPToolResponse> {
  try {
    const missing = MCPErrorHandler.validateRequiredParams(args, ['email', 'name']);
    if (missing.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(missing.map((f) => `${f} is required`));
    }

    const service = getAccountService();

    // Validate input
    const errors = service.validateAccountInput(args);
    if (errors.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(errors);
    }

    const account = await service.createAccount({
      email: args.email,
      name: args.name,
      phone: args.phone,
      organization: args.organization,
      role: args.role,
    });

    return MCPErrorHandler.createSuccessResponse(account);
  } catch (error: any) {
    MCPErrorHandler.logError('createAccountTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * MCP tool: eventos_update_account
 */
export async function updateAccountTool(args: UpdateAccountArgs): Promise<MCPToolResponse> {
  try {
    const missing = MCPErrorHandler.validateRequiredParams(args, ['accountId']);
    if (missing.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(missing.map((f) => `${f} is required`));
    }

    const service = getAccountService();

    const updateData: any = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.organization !== undefined) updateData.organization = args.organization;
    if (args.role !== undefined) updateData.role = args.role;

    const account = await service.updateAccount(args.accountId, updateData);

    return MCPErrorHandler.createSuccessResponse(account);
  } catch (error: any) {
    MCPErrorHandler.logError('updateAccountTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * MCP tool: eventos_delete_account
 */
export async function deleteAccountTool(args: DeleteAccountArgs): Promise<MCPToolResponse> {
  try {
    const missing = MCPErrorHandler.validateRequiredParams(args, ['accountId']);
    if (missing.length > 0) {
      throw MCPErrorHandler.formatValidationErrors(missing.map((f) => `${f} is required`));
    }

    const service = getAccountService();
    await service.deleteAccount(args.accountId);

    return MCPErrorHandler.createSuccessResponse(
      { success: true },
      `Account ${args.accountId} deleted successfully`,
    );
  } catch (error: any) {
    MCPErrorHandler.logError('deleteAccountTool', error);
    return MCPErrorHandler.createErrorResponse(error);
  }
}

/**
 * Tool definitions for registration
 */
export const accountToolDefinitions = [
  {
    name: 'eventos_list_accounts' as const,
    description: 'List all accounts with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of accounts to return' },
        offset: { type: 'number', description: 'Number of accounts to skip' },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'suspended'],
          description: 'Filter by account status',
        },
      },
      required: [],
    },
    handler: listAccountsTool,
  },
  {
    name: 'eventos_get_account' as const,
    description: 'Get details of a specific account',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'The ID of the account to retrieve' },
      },
      required: ['accountId'],
    },
    handler: getAccountTool,
  },
  {
    name: 'eventos_create_account' as const,
    description: 'Create a new account',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email address for the account' },
        name: { type: 'string', description: 'Name of the account holder' },
        phone: { type: 'string', description: 'Phone number (optional)' },
        organization: { type: 'string', description: 'Organization name (optional)' },
        role: {
          type: 'string',
          enum: ['admin', 'organizer', 'attendee'],
          description: 'Account role (optional)',
        },
      },
      required: ['email', 'name'],
    },
    handler: createAccountTool,
  },
  {
    name: 'eventos_update_account' as const,
    description: 'Update an existing account',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'The ID of the account to update' },
        name: { type: 'string', description: 'New name (optional)' },
        phone: { type: 'string', description: 'New phone number (optional)' },
        organization: { type: 'string', description: 'New organization (optional)' },
        role: {
          type: 'string',
          enum: ['admin', 'organizer', 'attendee'],
          description: 'New role (optional)',
        },
      },
      required: ['accountId'],
    },
    handler: updateAccountTool,
  },
  {
    name: 'eventos_delete_account' as const,
    description: 'Delete an account',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'The ID of the account to delete' },
      },
      required: ['accountId'],
    },
    handler: deleteAccountTool,
  },
];
