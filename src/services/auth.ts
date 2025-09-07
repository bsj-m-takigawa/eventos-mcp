/**
 * Authentication service for eventos API
 */

import type { Token, TokenResponse } from '../models/eventos-types.js';
import type { ApiClient } from '../lib/api-client.js';

export class AuthService {
  private token: Token | null = null;
  private tokenExpiry: number = 0;

  constructor(private apiClient: ApiClient) {}

  /**
   * Authenticate with eventos API and get access token
   */
  async authenticate(): Promise<Token> {
    // Use API key authentication with GET method
    const apiKey = process.env.EVENTOS_API_KEY || '';

    const response = await this.apiClient.get<TokenResponse>('/api/v1/token', {
      headers: {
        'x-api-key': apiKey,
      },
    });

    this.token = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in || 3600, // Default to 1 hour if not provided
      tokenType: response.token_type || 'Bearer',
      scope: response.scope,
    };

    // Calculate token expiry time from expired_at or expires_in
    if (response.expired_at) {
      // Parse the expired_at timestamp
      this.tokenExpiry = new Date(response.expired_at).getTime();
    } else if (response.expires_in) {
      // Calculate from expires_in (with 1 minute buffer)
      this.tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
    } else {
      // Default to 1 hour
      this.tokenExpiry = Date.now() + 3540000; // 59 minutes
    }

    return this.token;
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshToken(): Promise<Token> {
    if (!this.token?.refreshToken) {
      return this.authenticate();
    }

    // Use API key authentication for refresh as well
    const apiKey = process.env.EVENTOS_API_KEY || process.env.EVENTOS_CLIENT_SECRET || '';

    try {
      const response = await this.apiClient.post<TokenResponse>(
        '/api/v1/token/refresh',
        {
          refresh_token: this.token.refreshToken,
        },
        {
          headers: {
            'x-api-key': apiKey,
          },
        },
      );

      this.token = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token || this.token.refreshToken,
        expiresIn: response.expires_in || 3600,
        tokenType: response.token_type || 'Bearer',
        scope: response.scope,
      };

      // Calculate token expiry time from expired_at or expires_in
      if (response.expired_at) {
        this.tokenExpiry = new Date(response.expired_at).getTime();
      } else if (response.expires_in) {
        this.tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
      } else {
        this.tokenExpiry = Date.now() + 3540000; // 59 minutes
      }
      return this.token;
    } catch (error) {
      // If refresh fails, re-authenticate
      return this.authenticate();
    }
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  async getValidToken(): Promise<Token> {
    if (!this.token || this.isTokenExpired()) {
      if (this.token?.refreshToken) {
        return this.refreshToken();
      }
      return this.authenticate();
    }
    return this.token;
  }

  /**
   * Check if the current token is expired
   */
  isTokenExpired(): boolean {
    return Date.now() >= this.tokenExpiry;
  }

  /**
   * Get the cached token
   */
  getCachedToken(): Token | null {
    return this.token;
  }

  /**
   * Force token expiration (for testing)
   */
  forceTokenExpiration(): void {
    this.tokenExpiry = 0;
  }

  /**
   * Get authorization header value
   */
  getAuthorizationHeader(token?: Token): string {
    const t = token || this.token;
    if (!t) {
      throw new Error('No token available');
    }
    return `${t.tokenType} ${t.accessToken}`;
  }

  /**
   * Clear cached token
   */
  clearToken(): void {
    this.token = null;
    this.tokenExpiry = 0;
  }
}
