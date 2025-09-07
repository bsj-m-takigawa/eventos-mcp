import { AuthService } from '../../src/services/auth';
import { ApiClient } from '../../src/lib/api-client';
import type { Token } from '../../src/models/eventos-types';

describe('Authentication Flow Integration', () => {
  let authService: AuthService;
  let apiClient: ApiClient;

  beforeAll(() => {
    apiClient = new ApiClient();
    authService = new AuthService(apiClient);
  });

  describe('Token Management', () => {
    let token: Token;

    it('should authenticate and receive token', async () => {
      token = await authService.authenticate();

      expect(token).toBeDefined();
      expect(token.accessToken).toBeTruthy();
      expect(token.tokenType).toBe('Bearer');
      expect(token.expiresIn).toBeGreaterThan(0);
    });

    it('should cache token for subsequent requests', async () => {
      const cachedToken = authService.getCachedToken();

      expect(cachedToken).toBeDefined();
      expect(cachedToken?.accessToken).toBe(token.accessToken);
    });

    it('should determine when token needs refresh', () => {
      const needsRefresh = authService.isTokenExpired();

      // Token should be fresh
      expect(needsRefresh).toBe(false);
    });

    it('should refresh token when expired', async () => {
      // Force token expiration
      authService.forceTokenExpiration();

      const refreshedToken = await authService.getValidToken();

      expect(refreshedToken).toBeDefined();
      expect(refreshedToken.accessToken).toBeTruthy();
      // Should be different from original token
      expect(refreshedToken.accessToken).not.toBe(token.accessToken);
    });
  });

  describe('Authorization Headers', () => {
    it('should generate correct authorization header', async () => {
      const token = await authService.authenticate();
      const header = authService.getAuthorizationHeader(token);

      expect(header).toBe(`Bearer ${token.accessToken}`);
    });

    it('should automatically add auth headers to requests', async () => {
      await authService.authenticate();

      const headers = apiClient.getDefaultHeaders();
      expect(headers['Authorization']).toMatch(/^Bearer .+/);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials', async () => {
      const invalidAuthService = new AuthService(
        new ApiClient({
          clientId: 'invalid',
          clientSecret: 'invalid',
        }),
      );

      await expect(invalidAuthService.authenticate()).rejects.toThrow();
    });

    it('should retry on network errors', async () => {
      // Mock network error
      const mockApiClient = new ApiClient();
      jest
        .spyOn(mockApiClient, 'post')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          access_token: 'test-token',
          token_type: 'Bearer',
          expires_in: 3600,
        });

      const service = new AuthService(mockApiClient);
      const token = await service.authenticate();

      expect(token).toBeDefined();
      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    });

    it('should handle token refresh failures', async () => {
      const service = new AuthService(apiClient);

      // Mock refresh token failure
      jest.spyOn(service, 'refreshToken').mockRejectedValueOnce(new Error('Refresh failed'));

      // Should fall back to new authentication
      const token = await service.getValidToken();
      expect(token).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit responses', async () => {
      const mockApiClient = new ApiClient();

      // Mock rate limit response
      jest.spyOn(mockApiClient, 'post').mockRejectedValueOnce({
        response: {
          status: 429,
          headers: {
            'retry-after': '2',
          },
        },
      });

      const service = new AuthService(mockApiClient);

      // Should handle rate limiting with retry
      const startTime = Date.now();
      try {
        await service.authenticate();
      } catch (error) {
        const elapsed = Date.now() - startTime;
        // Should have waited at least 2 seconds
        expect(elapsed).toBeGreaterThanOrEqual(2000);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
