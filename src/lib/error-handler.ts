/**
 * Error handler for MCP responses
 */

import type { MCPError, MCPToolResponse } from '../models/mcp-types.js';

export class MCPErrorHandler {
  /**
   * Map HTTP status code to MCP error
   */
  static mapHttpStatusToMCPError(status: number, message?: string): MCPError {
    const baseMessage = message || 'An error occurred';

    switch (status) {
      case 400:
        return {
          code: -32602,
          message: `Invalid parameters: ${baseMessage}`,
          details: { httpStatus: status },
        };
      case 401:
        return {
          code: -32003,
          message: `Authentication failed: ${baseMessage}`,
          details: { httpStatus: status },
        };
      case 403:
        return {
          code: -32004,
          message: `Permission denied: ${baseMessage}`,
          details: { httpStatus: status },
        };
      case 404:
        return {
          code: -32005,
          message: `Resource not found: ${baseMessage}`,
          details: { httpStatus: status },
        };
      case 429:
        return {
          code: -32006,
          message: `Rate limit exceeded: ${baseMessage}`,
          details: { httpStatus: status },
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: -32000,
          message: `Server error: ${baseMessage}`,
          details: { httpStatus: status },
        };
      default:
        return {
          code: -32603,
          message: `Internal error: ${baseMessage}`,
          details: { httpStatus: status },
        };
    }
  }

  /**
   * Create error response
   */
  static createErrorResponse(error: any): MCPToolResponse {
    let mcpError: MCPError;

    if (error.response) {
      // HTTP error from API
      mcpError = this.mapHttpStatusToMCPError(
        error.response.status,
        error.response.data?.error || error.message,
      );
    } else if (error.code) {
      // Already an MCP error
      mcpError = {
        code: error.code,
        message: error.message,
        details: error.details,
      };
    } else {
      // Generic error
      mcpError = {
        code: -32603,
        message: error.message || 'An unexpected error occurred',
        details: {},
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: mcpError.message,
            code: mcpError.code,
            details: mcpError.details,
          }),
        },
      ],
    };
  }

  /**
   * Create success response
   */
  static createSuccessResponse<T>(data: T, message?: string): MCPToolResponse<T> {
    return {
      content: [
        {
          type: 'text',
          text: message || JSON.stringify(data),
        },
      ],
    };
  }

  /**
   * Validate required parameters
   */
  static validateRequiredParams(params: Record<string, any>, required: string[]): string[] {
    const missing: string[] = [];

    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        missing.push(field);
      }
    }

    return missing;
  }

  /**
   * Format validation errors
   */
  static formatValidationErrors(errors: string[]): MCPError {
    return {
      code: -32602,
      message: `Validation failed: ${errors.join(', ')}`,
      details: { errors },
    };
  }

  /**
   * Log error for debugging
   */
  static logError(context: string, error: any): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      message: error.message,
      code: error.code,
      stack: error.stack,
      details: error.details,
    };

    if (process.env.LOG_LEVEL === 'debug') {
      console.error('[MCP Error]', JSON.stringify(errorInfo, null, 2));
    } else {
      console.error(`[MCP Error] ${context}: ${error.message}`);
    }
  }

  /**
   * Wrap async handler with error handling
   */
  static wrapHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R>,
    context: string,
  ): (...args: T) => Promise<R | MCPToolResponse> {
    return async (...args: T) => {
      try {
        return await handler(...args);
      } catch (error: any) {
        this.logError(context, error);
        return this.createErrorResponse(error);
      }
    };
  }

  /**
   * Check if response is an error
   */
  static isErrorResponse(response: MCPToolResponse): boolean {
    if (response.content.length === 0) return false;

    const content = response.content[0];
    if (!content || content.type !== 'text' || !content.text) return false;

    try {
      const parsed = JSON.parse(content.text);
      return 'error' in parsed && 'code' in parsed;
    } catch {
      return false;
    }
  }
}
