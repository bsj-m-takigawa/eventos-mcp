import axios from 'axios';
import { z } from 'zod';

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

describe('POST /accounts - Create Account Contract', () => {
  const API_URL = process.env.EVENTOS_API_URL || 'https://public-api.eventos.tokyo';
  let accessToken: string;

  beforeAll(async () => {
    const response = await axios.post(`${API_URL}/token`, {
      client_id: process.env.EVENTOS_CLIENT_ID || 'test_client_id',
      client_secret: process.env.EVENTOS_CLIENT_SECRET || 'test_client_secret',
      grant_type: 'client_credentials',
    });
    accessToken = response.data.access_token;
  });

  it('should create account with valid data', async () => {
    const newAccount = {
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      phone: '+1234567890',
      organization: 'Test Org',
      role: 'attendee' as const,
    };

    const response = await axios.post(`${API_URL}/accounts`, newAccount, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(201);

    const result = AccountSchema.safeParse(response.data);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe(newAccount.email);
      expect(result.data.name).toBe(newAccount.name);
      expect(result.data.status).toBe('active');
      expect(result.data.id).toBeTruthy();
    }
  });

  it('should return 400 for invalid email format', async () => {
    const invalidAccount = {
      email: 'invalid-email',
      name: 'Test User',
    };

    try {
      await axios.post(`${API_URL}/accounts`, invalidAccount, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(400);
      expect(error.response?.data).toHaveProperty('error');
    }
  });

  it('should return 400 for missing required fields', async () => {
    const incompleteAccount = {
      email: 'test@example.com',
      // name is missing
    };

    try {
      await axios.post(`${API_URL}/accounts`, incompleteAccount, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(400);
    }
  });

  it('should return 401 without authorization', async () => {
    const newAccount = {
      email: 'test@example.com',
      name: 'Test User',
    };

    try {
      await axios.post(`${API_URL}/accounts`, newAccount);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(401);
    }
  });
});
