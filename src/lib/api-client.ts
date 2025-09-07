/**
 * API client for eventos API with axios
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ErrorResponse } from '../models/eventos-types.js';
import { getRateLimiter, RateLimiter } from './rate-limiter.js';

export interface ApiClientConfig {
  baseURL?: string;
  clientId?: string;
  clientSecret?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  enableRetryLogging?: boolean;
}

export class ApiClient {
  private axios: AxiosInstance;
  private defaultHeaders: Record<string, string> = {};
  private maxRetries: number;
  private initialRetryDelay: number;
  private maxRetryDelay: number;
  private enableRetryLogging: boolean;
  private rateLimiter: RateLimiter;

  constructor(config?: ApiClientConfig) {
    // Use the public API URL for all API calls
    const baseURL =
      config?.baseURL || process.env.EVENTOS_API_URL || 'https://public-api.eventos.tokyo';

    this.axios = axios.create({
      baseURL,
      timeout: config?.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.maxRetries = config?.maxRetries || 3;
    this.initialRetryDelay = config?.retryDelay || 1000;
    this.maxRetryDelay = config?.maxRetryDelay || 32000;
    this.enableRetryLogging = config?.enableRetryLogging ?? false;
    this.rateLimiter = getRateLimiter();

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error),
    );
  }

  /**
   * GET request
   */
  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.retryWithBackoff(() =>
      this.axios.get<T>(path, {
        ...config,
        headers: {
          ...this.defaultHeaders,
          ...config?.headers,
        },
      }),
    );
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.retryWithBackoff(() =>
      this.axios.post<T>(path, data, {
        ...config,
        headers: {
          ...this.defaultHeaders,
          ...config?.headers,
        },
      }),
    );
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.retryWithBackoff(() =>
      this.axios.put<T>(path, data, {
        ...config,
        headers: {
          ...this.defaultHeaders,
          ...config?.headers,
        },
      }),
    );
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = void>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.retryWithBackoff(() =>
      this.axios.delete<T>(path, {
        ...config,
        headers: {
          ...this.defaultHeaders,
          ...config?.headers,
        },
      }),
    );
    return response.data;
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Get default headers
   */
  getDefaultHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }

  /**
   * Clear default headers
   */
  clearDefaultHeaders(): void {
    this.defaultHeaders = {};
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<AxiosResponse<T>>,
    retries = this.maxRetries,
    delay = this.initialRetryDelay,
  ): Promise<AxiosResponse<T>> {
    // Check rate limit before making request
    const canProceed = await this.rateLimiter.checkRateLimit();
    if (!canProceed) {
      const recommendedDelay = this.rateLimiter.getRecommendedDelay();
      if (this.enableRetryLogging) {
        console.log(`Rate limit reached. Waiting ${recommendedDelay}ms...`);
      }
      await this.sleep(recommendedDelay);
      return this.retryWithBackoff(fn, retries, delay);
    }

    const startTime = Date.now();
    try {
      const response = await fn();
      this.rateLimiter.recordSuccess(Date.now() - startTime);
      return response;
    } catch (error: any) {
      if (retries === 0) {
        if (this.enableRetryLogging) {
          console.error('Max retries exceeded. Final error:', error.message);
        }
        throw error;
      }

      // Record failure
      const isRateLimited = error.response?.status === 429;
      this.rateLimiter.recordFailure(isRateLimited);

      // Check if error is retryable
      if (this.isRetryableError(error)) {
        const retryAfter = this.getRetryAfter(error);
        const baseDelay = Math.min(delay, this.maxRetryDelay);
        const jitter = Math.random() * 0.3 * baseDelay; // Add 0-30% jitter
        const waitTime = retryAfter || baseDelay + jitter;

        if (this.enableRetryLogging) {
          console.log(
            `Retry ${this.maxRetries - retries + 1}/${this.maxRetries}: Waiting ${Math.round(waitTime)}ms before retry...`,
          );
          console.log(`  Error: ${error.response?.status || 'Network'} - ${error.message}`);
        }

        await this.sleep(waitTime);
        return this.retryWithBackoff(fn, retries - 1, delay * 2);
      }

      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error.response) {
      // Network errors are retryable
      return true;
    }

    const status = error.response.status;
    // Retry on rate limiting, server errors, and some client errors
    return status === 429 || status >= 500 || status === 408 || status === 423;
  }

  /**
   * Get retry-after header value
   */
  private getRetryAfter(error: any): number | null {
    const retryAfter = error.response?.headers?.['retry-after'];
    if (retryAfter) {
      // If it's a number, it's seconds
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
      // If it's a date, calculate the difference
      const retryDate = new Date(retryAfter);
      if (!isNaN(retryDate.getTime())) {
        return Math.max(0, retryDate.getTime() - Date.now());
      }
    }
    return null;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): never {
    if (error.response) {
      const errorResponse: ErrorResponse = {
        error: error.response.data?.error || error.message,
        code: error.response.status,
        details: error.response.data?.details,
      };

      const errorMessage = `API Error ${errorResponse.code}: ${errorResponse.error}`;
      const apiError = new Error(errorMessage) as any;
      apiError.response = error.response;
      apiError.code = errorResponse.code;
      apiError.details = errorResponse.details;

      throw apiError;
    } else if (error.request) {
      throw new Error('Network error: No response received from server');
    } else {
      throw error;
    }
  }
}
