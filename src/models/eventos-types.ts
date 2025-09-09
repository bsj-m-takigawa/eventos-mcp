/**
 * eventos API type definitions
 */

// T023: Token model with validation
export interface Token {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: 'Bearer';
  scope?: string;
}

// T024: Account, Event, Venue, Ticket, Registration models

export interface Account {
  id: string;
  email: string;
  name: string;
  phone?: string;
  organization?: string;
  role?: 'admin' | 'organizer' | 'attendee';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  venue: Venue;
  capacity?: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  organizerId: string;
  tags?: string[];
  registrationOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id?: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  capacity?: number;
  amenities?: string[];
}

export interface Ticket {
  id: string;
  eventId: string;
  type: 'general' | 'vip' | 'early-bird' | 'group';
  name: string;
  description?: string;
  price: number;
  currency: string; // ISO 4217
  quantity: number;
  available: number;
  validFrom?: string; // ISO 8601
  validUntil?: string; // ISO 8601
  status: 'active' | 'sold-out' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  ticketId: string;
  accountId: string;
  eventId: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  confirmationCode: string;
  registeredAt: string;
  attendedAt?: string;
}

// API Response types
export interface PaginationMeta {
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
}

export interface ListResponse<T> {
  data: T[];
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  error: string;
  code: number;
  details?: Record<string, any>;
}

// Input types for API operations
export interface AccountInput {
  email: string;
  name: string;
  phone?: string;
  organization?: string;
  role?: 'admin' | 'organizer' | 'attendee';
}

// eventos API ticket input format
export interface TicketCommon {
  visible_period: boolean;
  visible_start_date?: string;
  visible_end_date?: string;
  enable_sales_period: boolean;
  sales_period_start?: string;
  sales_period_end?: string;
  is_pay: boolean;
  priority: number;
  enable_purchasable_number: boolean;
  purchasable_number?: number;
  enable_cancel_period: boolean;
  cancel_period_start?: string;
  cancel_period_end?: string;
  checkin_method: {
    qr: boolean;
    manual: boolean;
  };
  enable_unlimit_checkin: boolean;
  enable_multiple_price: boolean;
  remarks?: string;
  hide_checkin_expiration_ticket: boolean;
  enable_external_qr: boolean;
  price: number;
  enable_number_sold: boolean;
  number_sold?: number;
  enable_remaining_number: boolean;
  border_remaining_number?: number;
  enable_remaining_text: boolean;
  checkin_period_start?: string;
  checkin_period_end?: string;
  dynamic_checkin_period: boolean;
  checkin_period_days?: number;
  enable_checkin_user_form: boolean;
  enable_entry_user_form: boolean;
}

export interface TicketLanguageData {
  language_id: number;
  title: string;
  image?: {
    width: number;
    height: number;
    file: string;
    size: number;
    mime: string;
  } | null;
  description?: string;
  my_ticket_description?: string;
  remaining_text?: Array<{
    number: number;
    label: string | null;
  }>;
  cancel_policy?: string;
}

export interface TicketMultiplePrice {
  ticket_multiple_price_id?: number | null;
  price: number;
  language_data: Array<{
    language_id: number;
    label: string;
  }>;
}

export interface TicketInput {
  ticket: {
    common: TicketCommon;
    language_data: TicketLanguageData[];
    multiple_prices?: TicketMultiplePrice[];
  };
  content_id?: string; // For URL path
}

// Simplified input for MCP tools
export interface SimpleTicketInput {
  eventId: string;
  type: 'general' | 'vip' | 'early-bird' | 'group';
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  validFrom?: string;
  validUntil?: string;
}

// Authentication types
export interface TokenRequest {
  tenant_url: string; // e.g., "https://ev-kensho.eventos.tokyo/"
  grant_type: 'client_credentials' | 'refresh_token';
  refresh_token?: string;
}

export interface TokenResponse {
  access_token: string;
  expired_at: string; // "2025-09-07 21:14:49" format
  refresh_token?: string;
  token_type?: 'Bearer';
  expires_in?: number;
  scope?: string;
}

// User listing types for /api/v1/user/list
export interface UserProfileSelectorValue {
  key: string;
  value: string | number | null;
}

export interface UserShareProfileItem {
  share_profile_id: number;
  text_value: string | number | null;
  selector_value: UserProfileSelectorValue[] | null;
}

export interface UserEventProfileItem {
  event_profile_id: number;
  text_value: string | number | null;
  selector_value: UserProfileSelectorValue[] | null;
}

export interface UserProfiles {
  share_profiles: UserShareProfileItem[];
  event_profiles: UserEventProfileItem[];
}

export interface UserSummary {
  user_id: number;
  user_account_id: number;
  account: string; // e.g., email
  auth_method: string; // e.g., "Eventos"
  user_qrcode: string | null;
  external_qrcode: string | null;
  profiles: UserProfiles;
}

export interface PagedUsersResponse {
  total: number;
  page: number;
  per_page: number;
  data: UserSummary[];
}
