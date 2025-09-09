/**
 * Ticket management service for eventos API
 */

import type {
  Ticket,
  TicketInput,
  SimpleTicketInput,
  TicketResponse,
  TicketListResponse,
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
  }): Promise<TicketListResponse> {
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

    return this.apiClient.get<TicketListResponse>(baseUrl, {
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
  async getTicket(ticketId: string, contentId?: string): Promise<TicketResponse> {
    const token = await this.authService.getValidToken();
    const apiKey = process.env.EVENTOS_API_KEY || '';

    // Construct the appropriate URL based on contentId
    const url = contentId
      ? `/api/v1/ticket/normal/master/${contentId}/${ticketId}`
      : `/api/v1/ticket/normal/master/${ticketId}`;

    return this.apiClient.get<TicketResponse>(url, {
      headers: {
        'X-API-Key': apiKey,
        Token: token.accessToken,
      },
    });
  }

  /**
   * Create a new ticket
   */
  async createTicket(input: TicketInput & { content_id?: string }): Promise<TicketResponse> {
    const token = await this.authService.getValidToken();
    const apiKey = process.env.EVENTOS_API_KEY || '';

    const contentId = input.content_id || '';
    const url = contentId
      ? `/api/v1/ticket/normal/master/${contentId}`
      : '/api/v1/ticket/normal/master/';

    return this.apiClient.post<TicketResponse>(url, input, {
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
  ): Promise<TicketResponse> {
    const token = await this.authService.getValidToken();
    const apiKey = process.env.EVENTOS_API_KEY || '';

    const contentId = input.content_id || '';
    const url = contentId
      ? `/api/v1/ticket/normal/master/${contentId}/${ticketId}`
      : `/api/v1/ticket/normal/master/${ticketId}`;

    // Remove content_id from the body as it's only used in URL
    const { content_id, ...ticketData } = input;

    return this.apiClient.put<TicketResponse>(url, ticketData, {
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
  async createSimpleTicket(input: SimpleTicketInput & { content_id?: string }): Promise<TicketResponse> {
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

  /**
   * Format tickets as a table for display
   */
  formatTicketsAsTable(tickets: TicketResponse[]): string {
    if (tickets.length === 0) {
      return 'チケットが見つかりませんでした。';
    }

    // Calculate column widths
    const colWidths = {
      id: Math.max(6, ...tickets.map(t => t.id.toString().length)),
      name: Math.max(12, ...tickets.map(t => this.getTicketName(t).length)),
      price: 8,
      priority: 6,
      salesPeriod: 20,
      checkin: 12,
      multiPrice: 8
    };

    // Create separator line
    const separator = '+-' + 
      '-'.repeat(colWidths.id) + '-+-' +
      '-'.repeat(colWidths.name) + '-+-' +
      '-'.repeat(colWidths.price) + '-+-' +
      '-'.repeat(colWidths.priority) + '-+-' +
      '-'.repeat(colWidths.salesPeriod) + '-+-' +
      '-'.repeat(colWidths.checkin) + '-+-' +
      '-'.repeat(colWidths.multiPrice) + '-+';

    // Create table
    const lines = [];
    lines.push(separator);
    
    // Header row
    lines.push('| ' +
      'ID'.padEnd(colWidths.id) + ' | ' +
      'チケット名'.padEnd(colWidths.name) + ' | ' +
      '価格'.padEnd(colWidths.price) + ' | ' +
      '優先度'.padEnd(colWidths.priority) + ' | ' +
      '販売期間'.padEnd(colWidths.salesPeriod) + ' | ' +
      'チェックイン'.padEnd(colWidths.checkin) + ' | ' +
      '複数料金'.padEnd(colWidths.multiPrice) + ' |'
    );
    
    lines.push(separator);

    // Data rows
    for (const ticket of tickets) {
      const name = this.getTicketName(ticket);
      const price = `¥${ticket.common.price}`;
      const priority = ticket.common.priority.toString();
      const salesPeriod = this.formatSalesPeriod(ticket);
      const checkin = this.formatCheckinMethod(ticket);
      const multiPrice = ticket.common.enable_multiple_price ? 'あり' : 'なし';

      lines.push('| ' +
        ticket.id.toString().padEnd(colWidths.id) + ' | ' +
        name.padEnd(colWidths.name) + ' | ' +
        price.padEnd(colWidths.price) + ' | ' +
        priority.padEnd(colWidths.priority) + ' | ' +
        salesPeriod.padEnd(colWidths.salesPeriod) + ' | ' +
        checkin.padEnd(colWidths.checkin) + ' | ' +
        multiPrice.padEnd(colWidths.multiPrice) + ' |'
      );
    }
    
    lines.push(separator);

    return lines.join('\n');
  }

  /**
   * Get ticket name (Japanese first, fallback to first available)
   */
  private getTicketName(ticket: TicketResponse): string {
    // Try to find Japanese (language_id: 1) first
    const japanese = ticket.language_data.find(ld => ld.language_id === 1);
    if (japanese?.title) {
      return japanese.title;
    }
    
    // Fallback to first available title
    const firstLang = ticket.language_data[0];
    return firstLang?.title || 'タイトルなし';
  }

  /**
   * Format sales period for display
   */
  private formatSalesPeriod(ticket: TicketResponse): string {
    if (!ticket.common.enable_sales_period) {
      return '期間設定なし';
    }
    
    const start = ticket.common.sales_period_start?.split(' ')[0] || '';
    const end = ticket.common.sales_period_end?.split(' ')[0] || '';
    
    if (start && end) {
      return `${start}～${end}`;
    }
    
    return '期間不明';
  }

  /**
   * Format checkin method for display
   */
  private formatCheckinMethod(ticket: TicketResponse): string {
    const methods = [];
    if (ticket.common.checkin_method?.qr) {
      methods.push('QR');
    }
    if (ticket.common.checkin_method?.manual) {
      methods.push('手動');
    }
    return methods.length > 0 ? methods.join(', ') : 'なし';
  }

  /**
   * Generate tickets summary table
   */
  async generateTicketsSummary(params?: {
    content_id?: string;
    limit?: number;
    offset?: number;
    is_publish?: boolean;
    eventId?: string;
    status?: 'active' | 'sold-out' | 'cancelled';
  }): Promise<string> {
    try {
      const response = await this.listTickets(params);
      const tickets = response.tickets || [];
      
      let summary = `\n=== チケット一覧 (${tickets.length}件) ===\n\n`;
      summary += this.formatTicketsAsTable(tickets);
      
      if (tickets.length > 0) {
        const totalRevenue = tickets.reduce((sum: number, ticket: TicketResponse) => sum + ticket.common.price, 0);
        const avgPrice = Math.round(totalRevenue / tickets.length);
        
        summary += `\n\n=== 統計情報 ===\n`;
        summary += `総チケット数: ${tickets.length}件\n`;
        summary += `総売上予想: ¥${totalRevenue.toLocaleString()}\n`;
        summary += `平均価格: ¥${avgPrice.toLocaleString()}\n`;
        
        const paidTickets = tickets.filter((t: TicketResponse) => t.common.is_pay);
        const freeTickets = tickets.filter((t: TicketResponse) => !t.common.is_pay);
        summary += `有料チケット: ${paidTickets.length}件\n`;
        summary += `無料チケット: ${freeTickets.length}件\n`;
      }
      
      return summary;
    } catch (error) {
      return `エラー: チケット情報の取得に失敗しました - ${error}`;
    }
  }
}
