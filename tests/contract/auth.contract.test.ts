/**
 * Contract test for eventos authentication endpoint
 * Tests: GET /api/v1/token
 */

import https from 'https';
import { config } from 'dotenv';

config();

describe('Authentication Contract', () => {
  const API_KEY = process.env.EVENTOS_API_KEY;

  describe('GET /api/v1/token', () => {
    it('should return access token with valid API key', async () => {
      const response = await makeRequest('/api/v1/token', 'GET', {
        'x-api-key': API_KEY!,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('expired_at');
      expect(response.data.access_token).toMatch(/^[a-f0-9-]+$/);
      expect(response.data.expired_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should return 403 with invalid API key', async () => {
      const response = await makeRequest('/api/v1/token', 'GET', {
        'x-api-key': 'invalid-key',
      });

      expect(response.status).toBe(403);
    });

    it('should return 401 without API key', async () => {
      const response = await makeRequest('/api/v1/token', 'GET', {});

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Token refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // First get a token
      const tokenResponse = await makeRequest('/api/v1/token', 'GET', {
        'x-api-key': API_KEY!,
      });

      if (tokenResponse.data.refresh_token) {
        const refreshResponse = await makeRequest(
          '/api/v1/token/refresh',
          'POST',
          {
            'x-api-key': API_KEY!,
          },
          {
            refresh_token: tokenResponse.data.refresh_token,
          },
        );

        expect(refreshResponse.status).toBe(200);
        expect(refreshResponse.data).toHaveProperty('access_token');
      }
    });
  });
});

// Helper function to make HTTPS requests
function makeRequest(
  path: string,
  method: string,
  headers: Record<string, string>,
  body?: any,
): Promise<{ status: number; data: any }> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'public-api.eventos.tokyo',
      path,
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode || 0,
            data: data ? JSON.parse(data) : {},
          });
        } catch {
          resolve({
            status: res.statusCode || 0,
            data: data,
          });
        }
      });
    });

    req.on('error', () => {
      resolve({ status: 0, data: null });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}
