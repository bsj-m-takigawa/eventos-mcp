/**
 * MCP (Model Context Protocol) type definitions
 */

// T025: MCP protocol types

export interface MCPToolRequest {
  tool: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse<T = any> {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: T;
  }>;
}

export interface MCPError {
  code: number;
  message: string;
  details?: Record<string, any>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// Tool-specific argument types
export interface ListAccountsArgs {
  limit?: number;
  offset?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface GetAccountArgs {
  accountId: string;
}

export interface CreateAccountArgs {
  email: string;
  name: string;
  phone?: string;
  organization?: string;
  role?: 'admin' | 'organizer' | 'attendee';
}

export interface UpdateAccountArgs {
  accountId: string;
  name?: string;
  phone?: string;
  organization?: string;
  role?: 'admin' | 'organizer' | 'attendee';
}

export interface DeleteAccountArgs {
  accountId: string;
}

export interface ListTicketsArgs {
  content_id?: string; // Content ID for eventos API
  limit?: number;
  offset?: number;
  is_publish?: boolean;
  eventId?: string;
  status?: 'active' | 'sold-out' | 'cancelled';
}

export interface GetTicketArgs {
  ticketId: string;
  content_id?: string; // Content ID for eventos API
}

export interface CreateTicketArgs {
  content_id?: string; // Content ID for eventos API
  eventId: string;
  type: 'general' | 'vip' | 'early-bird' | 'group';
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  validFrom?: string;
  validUntil?: string;
}

export interface UpdateTicketArgs {
  ticketId: string;
  content_id?: string; // Content ID for eventos API
  eventId: string;
  type: 'general' | 'vip' | 'early-bird' | 'group';
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  validFrom?: string;
  validUntil?: string;
}

export interface DeleteTicketArgs {
  ticketId: string;
  content_id?: string; // Content ID for eventos API
}

// Tool registry type
export type MCPToolName =
  | 'eventos_authenticate'
  | 'eventos_list_accounts'
  | 'eventos_get_account'
  | 'eventos_create_account'
  | 'eventos_update_account'
  | 'eventos_delete_account'
  | 'eventos_list_tickets'
  | 'eventos_get_ticket'
  | 'eventos_create_ticket'
  | 'eventos_update_ticket'
  | 'eventos_delete_ticket'
  | 'eventos_list_users';

export interface MCPToolDefinition {
  name: MCPToolName;
  description: string;
  handler: (args: any) => Promise<MCPToolResponse>;
  inputSchema: object;
}

// Users tool args
export interface ListUsersArgs {
  event_id: string;
  per_page?: number;
  page?: number;
}
