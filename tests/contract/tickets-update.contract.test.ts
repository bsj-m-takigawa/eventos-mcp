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

describe('PUT /tickets/{id} - Update Ticket Contract', () => {
  const API_URL = process.env.EVENTOS_API_URL || 'https://public-api.eventos.tokyo';
  let accessToken: string;
  let testTicketId: string;
  let testEventId: string;

  beforeAll(async () => {
    // Get access token
    const tokenResponse = await axios.post(`${API_URL}/token`, {
      client_id: process.env.EVENTOS_CLIENT_ID || 'test_client_id',
      client_secret: process.env.EVENTOS_CLIENT_SECRET || 'test_client_secret',
      grant_type: 'client_credentials',
    });
    accessToken = tokenResponse.data.access_token;

    // Create a test ticket to update
    testEventId = 'test-event-' + Date.now();
    const createResponse = await axios.post(
      `${API_URL}/tickets`,
      {
        eventId: testEventId,
        type: 'general',
        name: 'Original Ticket Name',
        description: 'Original description',
        price: 30.0,
        currency: 'USD',
        quantity: 100,
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

  it('should update ticket with valid data', async () => {
    const updateData = {
      eventId: testEventId,
      type: 'vip' as const,
      name: 'Updated VIP Ticket',
      description: 'Updated VIP description',
      price: 75.0,
      currency: 'USD',
      quantity: 50,
    };

    const response = await axios.put(`${API_URL}/tickets/${testTicketId}`, updateData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);

    const result = TicketSchema.safeParse(response.data);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(testTicketId);
      expect(result.data.type).toBe('vip');
      expect(result.data.name).toBe('Updated VIP Ticket');
      expect(result.data.description).toBe('Updated VIP description');
      expect(result.data.price).toBe(75.0);
      expect(result.data.quantity).toBe(50);
    }
  });

  it('should return 400 for invalid update data', async () => {
    const invalidUpdate = {
      eventId: testEventId,
      type: 'general',
      name: 'Test',
      price: -100, // Invalid: negative price
      currency: 'USD',
      quantity: 50,
    };

    try {
      await axios.put(`${API_URL}/tickets/${testTicketId}`, invalidUpdate, {
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

  it('should return 404 for non-existent ticket', async () => {
    const updateData = {
      eventId: testEventId,
      type: 'general',
      name: 'Updated Name',
      price: 50,
      currency: 'USD',
      quantity: 100,
    };

    try {
      await axios.put(`${API_URL}/tickets/non-existent-ticket-12345`, updateData, {
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
      eventId: testEventId,
      type: 'general',
      name: 'Updated Name',
      price: 50,
      currency: 'USD',
      quantity: 100,
    };

    try {
      await axios.put(`${API_URL}/tickets/${testTicketId}`, updateData);
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
