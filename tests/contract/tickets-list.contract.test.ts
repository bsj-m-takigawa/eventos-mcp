/**
 * Contract test for GET /api/v1/ticket/normal/master/{content_id}
 */

import https from 'https';
import { config } from 'dotenv';

config();

describe('GET /tickets - List Tickets Contract', () => {
  const API_KEY = process.env.EVENTOS_API_KEY;
  const CONTENT_ID = '101103';
  let accessToken: string;

  beforeAll(async () => {
    // Get access token
    const response = await makeRequest('/api/v1/token', 'GET', {
      'x-api-key': API_KEY!,
    });
    accessToken = response.data.access_token;
  });

  it('should return list of tickets with valid authentication', async () => {
    const response = await makeRequest(`/api/v1/ticket/normal/master/${CONTENT_ID}`, 'GET', {
      'X-API-Key': API_KEY!,
      Token: accessToken,
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('tickets');
    expect(Array.isArray(response.data.tickets)).toBe(true);

    if (response.data.tickets.length > 0) {
      const ticket = response.data.tickets[0];
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('common');
      expect(ticket).toHaveProperty('language_data');
    }
  });

  it('should support pagination parameters', async () => {
    const response = await makeRequest(
      `/api/v1/ticket/normal/master/${CONTENT_ID}?limit=10&offset=0`,
      'GET',
      {
        'X-API-Key': API_KEY!,
        Token: accessToken,
      },
    );

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('tickets');
  });

  it('should return 401 without authentication', async () => {
    const response = await makeRequest(`/api/v1/ticket/normal/master/${CONTENT_ID}`, 'GET', {});

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it('should return 401 or 403 with invalid token', async () => {
    const response = await makeRequest(`/api/v1/ticket/normal/master/${CONTENT_ID}`, 'GET', {
      'X-API-Key': API_KEY!,
      Token: 'invalid-token',
    });

    expect([401, 403]).toContain(response.status);
  });
});

// Helper function
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
