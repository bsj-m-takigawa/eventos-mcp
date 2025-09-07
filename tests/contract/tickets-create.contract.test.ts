/**
 * Contract test for POST /api/v1/ticket/normal/master/{content_id}
 */

import https from 'https';
import { config } from 'dotenv';

config();

describe('POST /tickets - Create Ticket Contract', () => {
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

  it('should create ticket with valid data', async () => {
    const ticketData = {
      ticket: {
        common: {
          visible_period: true,
          visible_start_date: '2025-01-07 12:00:00',
          visible_end_date: '2026-01-07 12:00:00',
          enable_sales_period: true,
          sales_period_start: '2025-01-07 12:00:00',
          sales_period_end: '2026-01-07 12:00:00',
          is_pay: true,
          priority: 1,
          enable_purchasable_number: true,
          purchasable_number: 1,
          enable_cancel_period: true,
          cancel_period_start: '2025-01-07 12:00:00',
          cancel_period_end: '2026-01-07 12:00:00',
          checkin_method: {
            qr: true,
            manual: false,
          },
          enable_unlimit_checkin: false,
          enable_multiple_price: false,
          remarks: null,
          hide_checkin_expiration_ticket: false,
          enable_external_qr: false,
          price: 3000,
          enable_number_sold: true,
          number_sold: 50,
          enable_remaining_number: true,
          border_remaining_number: 10,
          enable_remaining_text: true,
          checkin_period_start: '2025-01-07 12:00:00',
          checkin_period_end: '2026-01-07 12:00:00',
          dynamic_checkin_period: false,
          checkin_period_days: 0,
          enable_checkin_user_form: false,
          enable_entry_user_form: true,
        },
        language_data: [
          {
            language_id: 1,
            title: 'テストチケット',
            image: null,
            description: 'テスト用チケット',
            my_ticket_description: 'イベント開始までにご来場ください',
            remaining_text: [
              {
                number: 25,
                label: null,
              },
              {
                number: 5,
                label: '残りわずか',
              },
            ],
            cancel_policy: 'キャンセルは前日まで',
          },
        ],
        multiple_prices: [],
      },
    };

    const response = await makeRequest(
      `/api/v1/ticket/normal/master/${CONTENT_ID}`,
      'POST',
      {
        'X-API-Key': API_KEY!,
        Token: accessToken,
        'Content-Type': 'application/json',
      },
      ticketData,
    );

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id');
    expect(typeof response.data.id).toBe('number');
  });

  it('should return error for invalid ticket data', async () => {
    const invalidTicket = {
      ticket: {
        // Missing required fields
        common: {
          price: -100, // Invalid negative price
        },
      },
    };

    const response = await makeRequest(
      `/api/v1/ticket/normal/master/${CONTENT_ID}`,
      'POST',
      {
        'X-API-Key': API_KEY!,
        Token: accessToken,
        'Content-Type': 'application/json',
      },
      invalidTicket,
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it('should return 401 without authentication', async () => {
    const ticketData = {
      ticket: {
        common: { price: 1000 },
        language_data: [],
      },
    };

    const response = await makeRequest(
      `/api/v1/ticket/normal/master/${CONTENT_ID}`,
      'POST',
      {},
      ticketData,
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
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
    const postData = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: 'public-api.eventos.tokyo',
      path,
      method,
      headers: {
        ...headers,
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
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

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}
