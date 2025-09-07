import axios from 'axios';

describe('DELETE /tickets/{id} - Delete Ticket Contract', () => {
  const API_URL = process.env.EVENTOS_API_URL || 'https://public-api.eventos.tokyo';
  let accessToken: string;

  beforeAll(async () => {
    // Get access token
    const tokenResponse = await axios.post(`${API_URL}/token`, {
      client_id: process.env.EVENTOS_CLIENT_ID || 'test_client_id',
      client_secret: process.env.EVENTOS_CLIENT_SECRET || 'test_client_secret',
      grant_type: 'client_credentials',
    });
    accessToken = tokenResponse.data.access_token;
  });

  it('should delete existing ticket', async () => {
    // First create a ticket to delete
    const createResponse = await axios.post(
      `${API_URL}/tickets`,
      {
        eventId: 'test-event-delete-' + Date.now(),
        type: 'general',
        name: 'Ticket to Delete',
        price: 15.0,
        currency: 'USD',
        quantity: 20,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const ticketId = createResponse.data.id;

    // Delete the ticket
    const deleteResponse = await axios.delete(`${API_URL}/tickets/${ticketId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(deleteResponse.status).toBe(204);
    expect(deleteResponse.data).toBeFalsy(); // No content

    // Verify ticket is deleted
    try {
      await axios.get(`${API_URL}/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(404);
    }
  });

  it('should return 404 for non-existent ticket', async () => {
    try {
      await axios.delete(`${API_URL}/tickets/non-existent-ticket-12345`, {
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
      await axios.delete(`${API_URL}/tickets/some-id`);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(401);
    }
  });
});
