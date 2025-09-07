/**
 * Validation utilities for eventos API data
 */

interface TicketRequestData {
  common: any;
  language_data: any[];
  multiple_prices?: any[];
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate date format (YYYY-MM-DD HH:mm:ss)
 */
export function validateDateFormat(date?: string): void {
  if (!date) return;

  const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new ValidationError(`Invalid date format: ${date}. Expected YYYY-MM-DD HH:mm:ss`);
  }

  // Validate actual date
  const parts = date.split(' ');
  if (parts.length !== 2) {
    throw new ValidationError(`Invalid date format: ${date}`);
  }

  const [datePart, timePart] = parts as [string, string];
  const dateNumbers = datePart.split('-').map(Number);
  const timeNumbers = timePart.split(':').map(Number);

  if (dateNumbers.length !== 3 || timeNumbers.length !== 3) {
    throw new ValidationError(`Invalid date format: ${date}`);
  }

  const [year, month, day] = dateNumbers as [number, number, number];
  const [hour, minute, second] = timeNumbers as [number, number, number];

  const dateObj = new Date(year, month - 1, day, hour, minute, second);

  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day ||
    dateObj.getHours() !== hour ||
    dateObj.getMinutes() !== minute ||
    dateObj.getSeconds() !== second
  ) {
    throw new ValidationError(`Invalid date: ${date}`);
  }
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number | undefined, fieldName: string): void {
  if (value === undefined) return;

  if (value < 0) {
    throw new ValidationError(`${fieldName} must be 0 or greater`);
  }
}

/**
 * Validate required fields
 */
export function validateRequiredFields(data: any, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }
}

/**
 * Validate ticket data
 */
export function validateTicketData(data: TicketRequestData): void {
  // Validate top-level structure
  if (!data.common) {
    throw new ValidationError('common field is required');
  }

  if (!data.language_data) {
    throw new ValidationError('language_data field is required');
  }

  if (!Array.isArray(data.language_data) || data.language_data.length === 0) {
    throw new ValidationError('At least one language_data entry is required');
  }

  // Validate common fields
  const requiredCommonFields = [
    'visible_period',
    'enable_sales_period',
    'is_pay',
    'priority',
    'enable_purchasable_number',
    'enable_cancel_period',
    'checkin_method',
    'enable_unlimit_checkin',
    'enable_multiple_price',
    'hide_checkin_expiration_ticket',
    'enable_external_qr',
    'price',
    'enable_number_sold',
    'enable_remaining_number',
    'enable_remaining_text',
    'dynamic_checkin_period',
    'enable_checkin_user_form',
    'enable_entry_user_form',
  ];

  validateRequiredFields(data.common, requiredCommonFields);

  // Validate checkin_method structure
  if (data.common.checkin_method) {
    validateRequiredFields(data.common.checkin_method, ['qr', 'manual']);
  }

  // Validate numeric fields
  validatePositiveNumber(data.common.price, 'price');
  validatePositiveNumber(data.common.priority, 'priority');
  validatePositiveNumber(data.common.number_sold, 'number_sold');
  validatePositiveNumber(data.common.purchasable_number, 'purchasable_number');
  validatePositiveNumber(data.common.border_remaining_number, 'border_remaining_number');
  validatePositiveNumber(data.common.checkin_period_days, 'checkin_period_days');

  // Validate date fields
  validateDateFormat(data.common.visible_start_date);
  validateDateFormat(data.common.visible_end_date);
  validateDateFormat(data.common.sales_period_start);
  validateDateFormat(data.common.sales_period_end);
  validateDateFormat(data.common.cancel_period_start);
  validateDateFormat(data.common.cancel_period_end);
  validateDateFormat(data.common.checkin_period_start);
  validateDateFormat(data.common.checkin_period_end);

  // Validate language_data
  for (const langData of data.language_data) {
    const requiredLangFields = ['language_id', 'title'];
    validateRequiredFields(langData, requiredLangFields);

    // Validate remaining_text if present
    if (langData.remaining_text && Array.isArray(langData.remaining_text)) {
      for (const remainingText of langData.remaining_text) {
        validatePositiveNumber(remainingText.number, 'remaining_text.number');
      }
    }
  }

  // Validate multiple_prices if enabled
  if (data.common.enable_multiple_price && data.multiple_prices) {
    for (const multiPrice of data.multiple_prices) {
      validatePositiveNumber(multiPrice.price, 'Multiple price value');

      if (!multiPrice.language_data || multiPrice.language_data.length === 0) {
        throw new ValidationError('Multiple price must have at least one language_data entry');
      }

      for (const langData of multiPrice.language_data) {
        validateRequiredFields(langData, ['language_id']);
      }
    }
  }
}
