/**
 * User listing service for eventos API
 */

import type { ApiClient } from '../lib/api-client.js';
import type { AuthService } from './auth.js';
import type { PagedUsersResponse } from '../models/eventos-types.js';

export class UserService {
  constructor(
    private apiClient: ApiClient,
    private authService: AuthService,
  ) {}

  /**
   * List users for an event
   * GET /api/v1/user/list?event_id&per_page&page
   * Requires headers: X-API-Key, Token
   */
  async listUsers(params: {
    event_id: string;
    per_page?: number;
    page?: number;
  }): Promise<PagedUsersResponse> {
    const token = await this.authService.getValidToken();
    const apiKey = process.env.EVENTOS_API_KEY || '';

    return this.apiClient.get<PagedUsersResponse>('/api/v1/user/list', {
      headers: {
        'X-API-Key': apiKey,
        Token: token.accessToken,
      },
      params: {
        event_id: params.event_id,
        per_page: params.per_page,
        page: params.page,
      },
    });
  }
}

