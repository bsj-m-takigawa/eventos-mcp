import axios from 'axios';

describe('DELETE /accounts/{id} - Delete Account Contract', () => {
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

  it('should delete existing account', async () => {
    // First create an account to delete
    const createResponse = await axios.post(
      `${API_URL}/accounts`,
      {
        email: `delete-test${Date.now()}@example.com`,
        name: 'Account to Delete',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const accountId = createResponse.data.id;

    // Delete the account
    const deleteResponse = await axios.delete(`${API_URL}/accounts/${accountId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(deleteResponse.status).toBe(204);
    expect(deleteResponse.data).toBeFalsy(); // No content

    // Verify account is deleted
    try {
      await axios.get(`${API_URL}/accounts/${accountId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(404);
    }
  });

  it('should return 404 for non-existent account', async () => {
    try {
      await axios.delete(`${API_URL}/accounts/non-existent-id-12345`, {
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
      await axios.delete(`${API_URL}/accounts/some-id`);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response?.status).toBe(401);
    }
  });
});
