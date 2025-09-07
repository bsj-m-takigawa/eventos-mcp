import {
  validateTicketData,
  validateDateFormat,
  validatePositiveNumber,
  validateRequiredFields,
  ValidationError,
} from '../../src/lib/validators';

describe('Validators', () => {
  describe('validateDateFormat', () => {
    it('should validate correct date format', () => {
      expect(() => validateDateFormat('2025-01-07 12:00:00')).not.toThrow();
      expect(() => validateDateFormat('2025-12-31 23:59:59')).not.toThrow();
    });

    it('should reject invalid date format', () => {
      expect(() => validateDateFormat('2025/01/07 12:00:00')).toThrow(ValidationError);
      expect(() => validateDateFormat('2025-01-07')).toThrow(ValidationError);
      expect(() => validateDateFormat('12:00:00')).toThrow(ValidationError);
      expect(() => validateDateFormat('invalid')).toThrow(ValidationError);
    });

    it('should reject invalid dates', () => {
      expect(() => validateDateFormat('2025-13-01 12:00:00')).toThrow(ValidationError);
      expect(() => validateDateFormat('2025-01-32 12:00:00')).toThrow(ValidationError);
      expect(() => validateDateFormat('2025-02-30 12:00:00')).toThrow(ValidationError);
    });

    it('should allow undefined values', () => {
      expect(() => validateDateFormat(undefined)).not.toThrow();
    });
  });

  describe('validatePositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(() => validatePositiveNumber(1, 'test')).not.toThrow();
      expect(() => validatePositiveNumber(100, 'test')).not.toThrow();
      expect(() => validatePositiveNumber(0, 'test')).not.toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => validatePositiveNumber(-1, 'test')).toThrow(ValidationError);
      expect(() => validatePositiveNumber(-100, 'test')).toThrow(ValidationError);
    });

    it('should allow undefined values', () => {
      expect(() => validatePositiveNumber(undefined, 'test')).not.toThrow();
    });
  });

  describe('validateRequiredFields', () => {
    it('should validate when all required fields are present', () => {
      const data = {
        field1: 'value1',
        field2: 123,
        field3: true,
        field4: [],
      };
      const required = ['field1', 'field2', 'field3'];

      expect(() => validateRequiredFields(data, required)).not.toThrow();
    });

    it('should throw when required fields are missing', () => {
      const data = {
        field1: 'value1',
        field2: 123,
      };
      const required = ['field1', 'field2', 'field3'];

      expect(() => validateRequiredFields(data, required)).toThrow(ValidationError);
      expect(() => validateRequiredFields(data, required)).toThrow(
        'Missing required field: field3',
      );
    });

    it('should throw when required fields are null', () => {
      const data = {
        field1: 'value1',
        field2: null,
        field3: true,
      };
      const required = ['field1', 'field2', 'field3'];

      expect(() => validateRequiredFields(data, required)).toThrow(ValidationError);
      expect(() => validateRequiredFields(data, required)).toThrow(
        'Missing required field: field2',
      );
    });

    it('should allow empty arrays and strings', () => {
      const data = {
        field1: '',
        field2: [],
        field3: 0,
      };
      const required = ['field1', 'field2', 'field3'];

      expect(() => validateRequiredFields(data, required)).not.toThrow();
    });
  });

  describe('validateTicketData', () => {
    const validTicketData = {
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
        price: 5000,
        enable_number_sold: true,
        number_sold: 100,
        enable_remaining_number: true,
        border_remaining_number: 20,
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
          title: 'Test Ticket',
          image: null,
          description: 'Test description',
          my_ticket_description: 'My ticket description',
          remaining_text: [],
          cancel_policy: 'Cancel policy',
        },
      ],
      multiple_prices: [],
    };

    it('should validate correct ticket data', () => {
      expect(() => validateTicketData(validTicketData)).not.toThrow();
    });

    it('should throw when common is missing', () => {
      const invalidData = { ...validTicketData, common: undefined };
      expect(() => validateTicketData(invalidData as any)).toThrow(ValidationError);
      expect(() => validateTicketData(invalidData as any)).toThrow('common field is required');
    });

    it('should throw when language_data is missing', () => {
      const invalidData = { ...validTicketData, language_data: undefined };
      expect(() => validateTicketData(invalidData as any)).toThrow(ValidationError);
      expect(() => validateTicketData(invalidData as any)).toThrow(
        'language_data field is required',
      );
    });

    it('should throw when language_data is empty', () => {
      const invalidData = { ...validTicketData, language_data: [] };
      expect(() => validateTicketData(invalidData)).toThrow(ValidationError);
      expect(() => validateTicketData(invalidData)).toThrow(
        'At least one language_data entry is required',
      );
    });

    it('should throw when required common fields are missing', () => {
      const invalidData = {
        ...validTicketData,
        common: { ...validTicketData.common, is_pay: undefined },
      };
      expect(() => validateTicketData(invalidData as any)).toThrow(ValidationError);
      expect(() => validateTicketData(invalidData as any)).toThrow(
        'Missing required field: is_pay',
      );
    });

    it('should throw when required language_data fields are missing', () => {
      const invalidData = {
        ...validTicketData,
        language_data: [{ ...validTicketData.language_data[0], title: undefined }],
      };
      expect(() => validateTicketData(invalidData as any)).toThrow(ValidationError);
      expect(() => validateTicketData(invalidData as any)).toThrow('Missing required field: title');
    });

    it('should throw when price is negative', () => {
      const invalidData = {
        ...validTicketData,
        common: { ...validTicketData.common, price: -100 },
      };
      expect(() => validateTicketData(invalidData)).toThrow(ValidationError);
      expect(() => validateTicketData(invalidData)).toThrow('price must be 0 or greater');
    });

    it('should throw when priority is negative', () => {
      const invalidData = {
        ...validTicketData,
        common: { ...validTicketData.common, priority: -1 },
      };
      expect(() => validateTicketData(invalidData)).toThrow(ValidationError);
      expect(() => validateTicketData(invalidData)).toThrow('priority must be 0 or greater');
    });

    it('should throw when dates have invalid format', () => {
      const invalidData = {
        ...validTicketData,
        common: { ...validTicketData.common, visible_start_date: '2025/01/07' },
      };
      expect(() => validateTicketData(invalidData)).toThrow(ValidationError);
      expect(() => validateTicketData(invalidData)).toThrow('Invalid date format');
    });

    it('should validate multiple price data when enabled', () => {
      const dataWithMultiplePrices = {
        ...validTicketData,
        common: { ...validTicketData.common, enable_multiple_price: true },
        multiple_prices: [
          {
            price: 3000,
            language_data: [
              {
                language_id: 1,
                label: 'Early Bird',
              },
            ],
          },
        ],
      };
      expect(() => validateTicketData(dataWithMultiplePrices)).not.toThrow();
    });

    it('should throw when multiple_prices has negative price', () => {
      const invalidData = {
        ...validTicketData,
        common: { ...validTicketData.common, enable_multiple_price: true },
        multiple_prices: [
          {
            price: -1000,
            language_data: [
              {
                language_id: 1,
                label: 'Invalid Price',
              },
            ],
          },
        ],
      };
      expect(() => validateTicketData(invalidData)).toThrow(ValidationError);
      expect(() => validateTicketData(invalidData)).toThrow(
        'Multiple price value must be 0 or greater',
      );
    });

    it('should throw when multiple_prices missing language_data', () => {
      const invalidData = {
        ...validTicketData,
        common: { ...validTicketData.common, enable_multiple_price: true },
        multiple_prices: [
          {
            price: 3000,
            language_data: [],
          },
        ],
      };
      expect(() => validateTicketData(invalidData)).toThrow(ValidationError);
      expect(() => validateTicketData(invalidData)).toThrow(
        'Multiple price must have at least one language_data entry',
      );
    });

    it('should allow optional fields to be undefined', () => {
      const minimalData = {
        common: {
          visible_period: false,
          enable_sales_period: false,
          is_pay: false,
          priority: 1,
          enable_purchasable_number: false,
          enable_cancel_period: false,
          checkin_method: {
            qr: true,
            manual: false,
          },
          enable_unlimit_checkin: false,
          enable_multiple_price: false,
          remarks: null,
          hide_checkin_expiration_ticket: false,
          enable_external_qr: false,
          price: 0,
          enable_number_sold: false,
          enable_remaining_number: false,
          enable_remaining_text: false,
          dynamic_checkin_period: false,
          enable_checkin_user_form: false,
          enable_entry_user_form: false,
        },
        language_data: [
          {
            language_id: 1,
            title: 'Minimal Ticket',
          },
        ],
        multiple_prices: [],
      };
      expect(() => validateTicketData(minimalData as any)).not.toThrow();
    });
  });
});
