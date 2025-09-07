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

describe('GET /accounts/{id} - Get Account Contract', () => {
  const API_URL = process.env.EVENTOS_API_URL || 'https://public-api.eventos.tokyo';
  let accessToken: string;
  let testAccountId: string;

  beforeAll(async () => {
    // Get access token
    const tokenResponse = await axios.post(`${API_URL}/token`, {
      client_id: process.env.EVENTOS_CLIENT_ID || 'test_client_id',
      client_secret: process.env.EVENTOS_CLIENT_SECRET || 'test_client_secret',
      grant_type: 'client_credentials',
    });
    accessToken = tokenResponse.data.access_token;

    // Create a test account to retrieve
    const createResponse = await axios.post(
      `${API_URL}/accounts`,
      {
        email: `test${Date.now()}@example.com`,
        name: 'Test Account for Get',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    testAccountId = createResponse.data.id;
  });

  it('should retrieve account by ID with valid schema', async () => {
    const response = await axios.get(`${API_URL}/accounts/${testAccountId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status).toBe(200);

    const result = AccountSchema.safeParse(response.data);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(testAccountId);
      expect(result.data.email).toBeTruthy();
      expect(result.data.name).toBeTruthy();
    }
  });

  it('should return 404 for non-existent account', async () => {
    try {
      await axios.get(`${API_URL}/accounts/non-existent-id-12345`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(404);
      expect(error.response?.data).toHaveProperty('error');
    }
  });

  it('should return 401 without authorization', async () => {
    try {
      await axios.get(`${API_URL}/accounts/${testAccountId}`);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(401);
    }
  });

  afterAll(async () => {
    // Clean up: Delete the test account
    if (testAccountId && accessToken) {
      try {
        await axios.delete(`${API_URL}/accounts/${testAccountId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });
});
