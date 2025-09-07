/**
 * Rate limiter with circuit breaker pattern for eventos API
 */

export interface RateLimitConfig {
  maxRequestsPerSecond?: number;
  maxRequestsPerMinute?: number;
  maxRequestsPerHour?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerResetTime?: number;
}

export interface RateLimitMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  averageResponseTime: number;
  lastRateLimitTime?: Date;
  circuitBreakerOpen: boolean;
}

export class RateLimiter {
  private requestsPerSecond: number[] = [];
  private requestsPerMinute: number[] = [];
  private requestsPerHour: number[] = [];

  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rateLimitedRequests: 0,
    averageResponseTime: 0,
    circuitBreakerOpen: false,
  };

  private consecutiveFailures = 0;
  private circuitBreakerOpenTime?: Date;

  constructor(private config: RateLimitConfig = {}) {
    this.config = {
      maxRequestsPerSecond: 10,
      maxRequestsPerMinute: 100,
      maxRequestsPerHour: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerResetTime: 60000, // 1 minute
      ...config,
    };
  }

  /**
   * Check if request is allowed
   */
  async checkRateLimit(): Promise<boolean> {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      return false;
    }

    const now = Date.now();

    // Clean up old timestamps
    this.cleanupTimestamps(now);

    // Check rate limits
    if (this.requestsPerSecond.length >= (this.config.maxRequestsPerSecond || 10)) {
      this.metrics.rateLimitedRequests++;
      this.metrics.lastRateLimitTime = new Date();
      return false;
    }

    if (this.requestsPerMinute.length >= (this.config.maxRequestsPerMinute || 100)) {
      this.metrics.rateLimitedRequests++;
      this.metrics.lastRateLimitTime = new Date();
      return false;
    }

    if (this.requestsPerHour.length >= (this.config.maxRequestsPerHour || 1000)) {
      this.metrics.rateLimitedRequests++;
      this.metrics.lastRateLimitTime = new Date();
      return false;
    }

    // Add current request
    this.requestsPerSecond.push(now);
    this.requestsPerMinute.push(now);
    this.requestsPerHour.push(now);
    this.metrics.totalRequests++;

    return true;
  }

  /**
   * Record successful request
   */
  recordSuccess(responseTime: number): void {
    this.metrics.successfulRequests++;
    this.consecutiveFailures = 0;
    this.updateAverageResponseTime(responseTime);

    // Close circuit breaker if it was open
    if (this.metrics.circuitBreakerOpen) {
      this.metrics.circuitBreakerOpen = false;
      this.circuitBreakerOpenTime = undefined;
    }
  }

  /**
   * Record failed request
   */
  recordFailure(isRateLimited = false): void {
    this.metrics.failedRequests++;

    if (isRateLimited) {
      this.metrics.rateLimitedRequests++;
      this.consecutiveFailures++;

      // Open circuit breaker if threshold reached
      if (this.consecutiveFailures >= (this.config.circuitBreakerThreshold || 5)) {
        this.openCircuitBreaker();
      }
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): RateLimitMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      averageResponseTime: 0,
      circuitBreakerOpen: false,
    };
    this.consecutiveFailures = 0;
  }

  /**
   * Get recommended delay before next request
   */
  getRecommendedDelay(): number {
    const now = Date.now();

    // If circuit breaker is open, wait until reset time
    if (this.isCircuitBreakerOpen()) {
      const resetTime =
        this.circuitBreakerOpenTime!.getTime() + (this.config.circuitBreakerResetTime || 60000);
      return Math.max(0, resetTime - now);
    }

    // Calculate based on current rate
    if (this.requestsPerSecond.length >= (this.config.maxRequestsPerSecond || 10)) {
      return 1000; // Wait 1 second
    }

    if (this.requestsPerMinute.length >= (this.config.maxRequestsPerMinute || 100) * 0.9) {
      return 600; // Wait 600ms if close to minute limit
    }

    if (this.requestsPerHour.length >= (this.config.maxRequestsPerHour || 1000) * 0.9) {
      return 3600; // Wait 3.6 seconds if close to hour limit
    }

    return 0; // No delay needed
  }

  /**
   * Clean up old timestamps
   */
  private cleanupTimestamps(now: number): void {
    // Keep only timestamps within the last second
    this.requestsPerSecond = this.requestsPerSecond.filter((t) => now - t < 1000);

    // Keep only timestamps within the last minute
    this.requestsPerMinute = this.requestsPerMinute.filter((t) => now - t < 60000);

    // Keep only timestamps within the last hour
    this.requestsPerHour = this.requestsPerHour.filter((t) => now - t < 3600000);
  }

  /**
   * Open circuit breaker
   */
  private openCircuitBreaker(): void {
    this.metrics.circuitBreakerOpen = true;
    this.circuitBreakerOpenTime = new Date();
    console.warn(`Circuit breaker opened due to ${this.consecutiveFailures} consecutive failures`);
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(): boolean {
    if (!this.metrics.circuitBreakerOpen) {
      return false;
    }

    // Check if reset time has passed
    const now = Date.now();
    const resetTime =
      this.circuitBreakerOpenTime!.getTime() + (this.config.circuitBreakerResetTime || 60000);

    if (now >= resetTime) {
      // Try to close the circuit breaker
      this.metrics.circuitBreakerOpen = false;
      this.circuitBreakerOpenTime = undefined;
      this.consecutiveFailures = 0;
      console.log('Circuit breaker reset');
      return false;
    }

    return true;
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    const totalResponseTime =
      this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1);
    this.metrics.averageResponseTime =
      (totalResponseTime + responseTime) / this.metrics.successfulRequests;
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

/**
 * Get or create rate limiter instance
 */
export function getRateLimiter(config?: RateLimitConfig): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter(config);
  }
  return rateLimiterInstance;
}
