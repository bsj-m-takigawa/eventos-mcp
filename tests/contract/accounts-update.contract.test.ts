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

describe('PUT /accounts/{id} - Update Account Contract', () => {
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

    // Create a test account to update
    const createResponse = await axios.post(
      `${API_URL}/accounts`,
      {
        email: `test${Date.now()}@example.com`,
        name: 'Original Name',
        organization: 'Original Org',
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

  it('should update account with valid data', async () => {
    const updateData = {
      name: 'Updated Name',
      organization: 'Updated Organization',
      phone: '+9876543210',
      role: 'organizer' as const,
    };

    const response = await axios.put(`${API_URL}/accounts/${testAccountId}`, updateData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);

    const result = AccountSchema.safeParse(response.data);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(testAccountId);
      expect(result.data.name).toBe(updateData.name);
      expect(result.data.organization).toBe(updateData.organization);
      expect(result.data.phone).toBe(updateData.phone);
      expect(result.data.role).toBe(updateData.role);
    }
  });

  it('should return 400 for invalid update data', async () => {
    const invalidUpdate = {
      email: 'invalid-email-format',
      name: 'Test',
    };

    try {
      await axios.put(`${API_URL}/accounts/${testAccountId}`, invalidUpdate, {
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

  it('should return 404 for non-existent account', async () => {
    const updateData = {
      name: 'Updated Name',
    };

    try {
      await axios.put(`${API_URL}/accounts/non-existent-id-12345`, updateData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(404);
    }
  });

  it('should return 401 without authorization', async () => {
    const updateData = {
      name: 'Updated Name',
    };

    try {
      await axios.put(`${API_URL}/accounts/${testAccountId}`, updateData);
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
