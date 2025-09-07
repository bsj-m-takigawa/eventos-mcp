/**
 * Ticket management service for eventos API
 */

import type {
  Ticket,
  TicketInput,
  SimpleTicketInput,
  ListResponse,
} from '../models/eventos-types.js';
import type { ApiClient } from '../lib/api-client.js';
import type { AuthService } from './auth.js';

export class TicketService {
  constructor(
    private apiClient: ApiClient,
    private authService: AuthService,
  ) {}

  /**
   * List tickets with optional filters
   */
  async listTickets(params?: {
    content_id?: string; // Content ID (required for actual API, optional for flexibility)
    limit?: number;
    offset?: number;
    is_publish?: boolean;
    eventId?: string;
    status?: 'active' | 'sold-out' | 'cancelled';
  }): Promise<ListResponse<Ticket>> {
    const token = await this.authService.getValidToken();
    const apiKey = process.env.EVENTOS_API_KEY || '';

    // Build the URL with content_id if provided
    const contentId = params?.content_id || '';
    const baseUrl = contentId
      ? `/api/v1/ticket/normal/master/${contentId}`
      : '/api/v1/ticket/normal/master/';

    // Extract query parameters
    const queryParams = {
      offset: params?.offset,
      limit: params?.limit,
      is_publish: params?.is_publish,
    };

    return this.apiClient.get<ListResponse<Ticket>>(baseUrl, {
      headers: {
        'X-API-Key': apiKey,
        Token: token.accessToken,
      },
      params: queryParams,
    });
  }

  /**
   * Get a specific ticket by ID
   */
  async getTicket(ticketId: string, contentId?: string): Promise<Ticket> {
    const token = await this.authService.getValidToken();
    const apiKey = process.env.EVENTOS_API_KEY || '';

    // Construct the appropriate URL based on contentId
    const url = contentId
      ? `/api/v1/ticket/normal/master/${contentId}/${ticketId}`
      : `/api/v1/ticket/normal/master/${ticketId}`;

    return this.apiClient.get<Ticket>(url, {
      headers: {
        'X-API-Key': apiKey,
        Token: token.accessToken,
      },
    });
  }

  /**
   * Create a new ticket
   */
  async createTicket(input: TicketInput & { content_id?: string }): Promise<Ticket> {
    const token = await this.authService.getValidToken();
    const apiKey = process.env.EVENTOS_API_KEY || '';

    const contentId = input.content_id || '';
    const url = contentId
      ? `/api/v1/ticket/normal/master/${contentId}`
      : '/api/v1/ticket/normal/master/';

    return this.apiClient.post<Ticket>(url, input, {
      headers: {
        'X-API-Key': apiKey,
        Token: token.accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Update an existing ticket
   */
  async updateTicket(
    ticketId: string,
    input: TicketInput & { content_id?: string },
  ): Promise<Ticket> {
    const token = await this.authService.getValidToken();
    const apiKey = process.env.EVENTOS_API_KEY || '';

    const contentId = input.content_id || '';
    const url = contentId
      ? `/api/v1/ticket/normal/master/${contentId}/${ticketId}`
      : `/api/v1/ticket/normal/master/${ticketId}`;

    // Remove content_id from the body as it's only used in URL
    const { content_id, ...ticketData } = input;

    return this.apiClient.put<Ticket>(url, ticketData, {
      headers: {
        'X-API-Key': apiKey,
        Token: token.accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Delete a ticket
   */
  async deleteTicket(ticketId: string, contentId?: string): Promise<void> {
    const token = await this.authService.getValidToken();
    const apiKey = process.env.EVENTOS_API_KEY || '';

    const url = contentId
      ? `/api/v1/ticket/normal/master/${contentId}/${ticketId}`
      : `/api/v1/ticket/normal/master/${ticketId}`;

    await this.apiClient.delete(url, {
      headers: {
        'X-API-Key': apiKey,
        Token: token.accessToken,
      },
    });
  }

  /**
   * Convert simple input to full API format
   */
  public convertToAPIFormat(simple: SimpleTicketInput & { content_id?: string }): TicketInput {
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const formatDate = (date: Date): string => {
      return date.toISOString().replace('T', ' ').substring(0, 19);
    };

    const startDate = simple.validFrom || formatDate(now);
    const endDate = simple.validUntil || formatDate(oneYearLater);

    const ticketInput: TicketInput = {
      ticket: {
        common: {
          visible_period: true,
          visible_start_date: startDate,
          visible_end_date: endDate,
          enable_sales_period: true,
          sales_period_start: startDate,
          sales_period_end: endDate,
          is_pay: simple.price > 0,
          priority: 1,
          enable_purchasable_number: true,
          purchasable_number: 1,
          enable_cancel_period: true,
          cancel_period_start: startDate,
          cancel_period_end: endDate,
          checkin_method: {
            qr: true,
            manual: false,
          },
          enable_unlimit_checkin: false,
          enable_multiple_price: false,
          remarks: undefined,
          hide_checkin_expiration_ticket: false,
          enable_external_qr: false,
          price: simple.price,
          enable_number_sold: true,
          number_sold: simple.quantity,
          enable_remaining_number: true,
          border_remaining_number: Math.min(20, Math.floor(simple.quantity * 0.2)),
          enable_remaining_text: true,
          checkin_period_start: startDate,
          checkin_period_end: endDate,
          dynamic_checkin_period: false,
          checkin_period_days: 0,
          enable_checkin_user_form: false,
          enable_entry_user_form: true,
        },
        language_data: [
          {
            language_id: 1, // Japanese
            title: simple.name,
            image: undefined,
            description: simple.description || '',
            my_ticket_description: 'イベント開始までにご来場お願いいたします。',
            remaining_text: [
              {
                number: Math.floor(simple.quantity * 0.5),
                label: null as string | null,
              },
              {
                number: Math.floor(simple.quantity * 0.1),
                label: '残りわずか',
              },
            ],
            cancel_policy: 'キャンセルされる場合は、イベントの前日までにキャンセルしてください',
          },
        ],
        multiple_prices: [],
      },
      content_id: simple.content_id,
    };

    return ticketInput;
  }

  /**
   * Create a new ticket from simple input
   */
  async createSimpleTicket(input: SimpleTicketInput & { content_id?: string }): Promise<Ticket> {
    const fullInput = this.convertToAPIFormat(input);
    // Pass the content_id separately
    return this.createTicket({
      ...fullInput,
      content_id: input.content_id,
    });
  }

  /**
   * Validate currency code (ISO 4217)
   */
  validateCurrency(currency: string): boolean {
    return /^[A-Z]{3}$/.test(currency);
  }

  /**
   * Validate ticket input
   */
  validateTicketInput(input: SimpleTicketInput): string[] {
    const errors: string[] = [];

    if (!input.eventId) {
      errors.push('Event ID is required');
    }

    if (!input.name || input.name.length < 1 || input.name.length > 100) {
      errors.push('Name must be between 1 and 100 characters');
    }

    if (input.price < 0) {
      errors.push('Price cannot be negative');
    }

    if (!this.validateCurrency(input.currency)) {
      errors.push('Currency must be a valid 3-letter ISO code');
    }

    if (input.quantity < 1) {
      errors.push('Quantity must be at least 1');
    }

    if (!['general', 'vip', 'early-bird', 'group'].includes(input.type)) {
      errors.push('Invalid ticket type');
    }

    if (input.validFrom && input.validUntil) {
      const from = new Date(input.validFrom);
      const until = new Date(input.validUntil);
      if (from >= until) {
        errors.push('Valid from date must be before valid until date');
      }
    }

    return errors;
  }

  /**
   * Check if ticket is available
   */
  isTicketAvailable(ticket: Ticket): boolean {
    return ticket.status === 'active' && ticket.available > 0;
  }

  /**
   * Calculate ticket availability percentage
   */
  getAvailabilityPercentage(ticket: Ticket): number {
    if (ticket.quantity === 0) return 0;
    return (ticket.available / ticket.quantity) * 100;
  }
}
