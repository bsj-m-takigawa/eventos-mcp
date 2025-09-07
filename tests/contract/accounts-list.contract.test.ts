import axios from 'axios';
import { z } from 'zod';

// Account schema based on OpenAPI spec
const AccountSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  role: z.enum(['admin', 'organizer', 'attendee']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const AccountListResponseSchema = z.object({
  data: z.array(AccountSchema),
  meta: z
    .object({
      total: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
      hasMore: z.boolean().optional(),
    })
    .optional(),
});

describe('GET /accounts - List Accounts Contract', () => {
  const API_URL = process.env.EVENTOS_API_URL || 'https://public-api.eventos.tokyo';
  let accessToken: string;

  beforeAll(async () => {
    // Get access token for tests
    const response = await axios.post(`${API_URL}/token`, {
      client_id: process.env.EVENTOS_CLIENT_ID || 'test_client_id',
      client_secret: process.env.EVENTOS_CLIENT_SECRET || 'test_client_secret',
      grant_type: 'client_credentials',
    });
    accessToken = response.data.access_token;
  });

  it('should return list of accounts with valid schema', async () => {
    const response = await axios.get(`${API_URL}/accounts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit: 20,
        offset: 0,
      },
    });

    expect(response.status).toBe(200);

    const result = AccountListResponseSchema.safeParse(response.data);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(Array.isArray(result.data.data)).toBe(true);
      result.data.data.forEach((account) => {
        expect(account.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(['active', 'inactive', 'suspended']).toContain(account.status);
      });
    }
  });

  it('should filter accounts by status', async () => {
    const response = await axios.get(`${API_URL}/accounts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        status: 'active',
        limit: 10,
      },
    });

    expect(response.status).toBe(200);

    const result = AccountListResponseSchema.safeParse(response.data);
    if (result.success) {
      result.data.data.forEach((account) => {
        expect(account.status).toBe('active');
      });
    }
  });

  it('should respect pagination parameters', async () => {
    const response = await axios.get(`${API_URL}/accounts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit: 5,
        offset: 10,
      },
    });

    expect(response.status).toBe(200);

    const result = AccountListResponseSchema.safeParse(response.data);
    if (result.success) {
      expect(result.data.data.length).toBeLessThanOrEqual(5);
      if (result.data.meta) {
        expect(result.data.meta.limit).toBe(5);
        expect(result.data.meta.offset).toBe(10);
      }
    }
  });

  it('should return 401 without authorization', async () => {
    try {
      await axios.get(`${API_URL}/accounts`);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(401);
    }
  });
});
