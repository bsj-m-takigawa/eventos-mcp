import axios from 'axios';
import { z } from 'zod';

const TicketSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  type: z.enum(['general', 'vip', 'early-bird', 'group']),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().regex(/^[A-Z]{3}$/),
  quantity: z.number().min(1),
  available: z.number().min(0),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  status: z.enum(['active', 'sold-out', 'cancelled']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

describe('GET /tickets/{id} - Get Ticket Contract', () => {
  const API_URL = process.env.EVENTOS_API_URL || 'https://public-api.eventos.tokyo';
  let accessToken: string;
  let testTicketId: string;

  beforeAll(async () => {
    // Get access token
    const tokenResponse = await axios.post(`${API_URL}/token`, {
      client_id: process.env.EVENTOS_CLIENT_ID || 'test_client_id',
      client_secret: process.env.EVENTOS_CLIENT_SECRET || 'test_client_secret',
      grant_type: 'client_credentials',
    });
    accessToken = tokenResponse.data.access_token;

    // Create a test ticket to retrieve
    const createResponse = await axios.post(
      `${API_URL}/tickets`,
      {
        eventId: 'test-event-' + Date.now(),
        type: 'general',
        name: 'Test Ticket for Get',
        price: 25.0,
        currency: 'USD',
        quantity: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    testTicketId = createResponse.data.id;
  });

  it('should retrieve ticket by ID with valid schema', async () => {
    const response = await axios.get(`${API_URL}/tickets/${testTicketId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status).toBe(200);

    const result = TicketSchema.safeParse(response.data);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(testTicketId);
      expect(result.data.name).toBe('Test Ticket for Get');
      expect(result.data.price).toBe(25.0);
      expect(result.data.currency).toBe('USD');
      expect(result.data.quantity).toBe(50);
    }
  });

  it('should return 404 for non-existent ticket', async () => {
    try {
      await axios.get(`${API_URL}/tickets/non-existent-ticket-12345`, {
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
      await axios.get(`${API_URL}/tickets/${testTicketId}`);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(401);
    }
  });

  afterAll(async () => {
    // Clean up: Delete the test ticket
    if (testTicketId && accessToken) {
      try {
        await axios.delete(`${API_URL}/tickets/${testTicketId}`, {
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
