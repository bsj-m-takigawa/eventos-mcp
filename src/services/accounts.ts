/**
 * Account management service for eventos API
 */

import type { Account, AccountInput, ListResponse } from '../models/eventos-types.js';
import type { ApiClient } from '../lib/api-client.js';
import type { AuthService } from './auth.js';

export class AccountService {
  constructor(
    private apiClient: ApiClient,
    private authService: AuthService,
  ) {}

  /**
   * List accounts with optional filters
   */
  async listAccounts(params?: {
    limit?: number;
    offset?: number;
    status?: 'active' | 'inactive' | 'suspended';
  }): Promise<ListResponse<Account>> {
    const token = await this.authService.getValidToken();

    return this.apiClient.get<ListResponse<Account>>('/accounts', {
      headers: {
        Authorization: this.authService.getAuthorizationHeader(token),
      },
      params,
    });
  }

  /**
   * Get a specific account by ID
   */
  async getAccount(accountId: string): Promise<Account> {
    const token = await this.authService.getValidToken();

    return this.apiClient.get<Account>(`/accounts/${accountId}`, {
      headers: {
        Authorization: this.authService.getAuthorizationHeader(token),
      },
    });
  }

  /**
   * Create a new account
   */
  async createAccount(input: AccountInput): Promise<Account> {
    const token = await this.authService.getValidToken();

    return this.apiClient.post<Account>('/accounts', input, {
      headers: {
        Authorization: this.authService.getAuthorizationHeader(token),
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Update an existing account
   */
  async updateAccount(accountId: string, input: Partial<AccountInput>): Promise<Account> {
    const token = await this.authService.getValidToken();

    return this.apiClient.put<Account>(`/accounts/${accountId}`, input, {
      headers: {
        Authorization: this.authService.getAuthorizationHeader(token),
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Delete an account
   */
  async deleteAccount(accountId: string): Promise<void> {
    const token = await this.authService.getValidToken();

    await this.apiClient.delete(`/accounts/${accountId}`, {
      headers: {
        Authorization: this.authService.getAuthorizationHeader(token),
      },
    });
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate account input
   */
  validateAccountInput(input: AccountInput): string[] {
    const errors: string[] = [];

    if (!input.email || !this.validateEmail(input.email)) {
      errors.push('Invalid email format');
    }

    if (!input.name || input.name.length < 1 || input.name.length > 100) {
      errors.push('Name must be between 1 and 100 characters');
    }

    if (input.role && !['admin', 'organizer', 'attendee'].includes(input.role)) {
      errors.push('Invalid role');
    }

    return errors;
  }
}
