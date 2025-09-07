import { RateLimiter } from '../../src/lib/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limits', async () => {
      rateLimiter = new RateLimiter({
        maxRequestsPerSecond: 2,
        maxRequestsPerMinute: 10,
        maxRequestsPerHour: 100,
      });

      expect(await rateLimiter.checkRateLimit()).toBe(true);
      expect(await rateLimiter.checkRateLimit()).toBe(true);
    });

    it('should block requests exceeding per-second limit', async () => {
      rateLimiter = new RateLimiter({
        maxRequestsPerSecond: 2,
      });

      expect(await rateLimiter.checkRateLimit()).toBe(true);
      expect(await rateLimiter.checkRateLimit()).toBe(true);
      expect(await rateLimiter.checkRateLimit()).toBe(false);

      const metrics = rateLimiter.getMetrics();
      expect(metrics.rateLimitedRequests).toBe(1);
    });

    it('should reset per-second limit after 1 second', async () => {
      rateLimiter = new RateLimiter({
        maxRequestsPerSecond: 1,
      });

      expect(await rateLimiter.checkRateLimit()).toBe(true);
      expect(await rateLimiter.checkRateLimit()).toBe(false);

      jest.advanceTimersByTime(1001);

      expect(await rateLimiter.checkRateLimit()).toBe(true);
    });

    it('should block requests exceeding per-minute limit', async () => {
      rateLimiter = new RateLimiter({
        maxRequestsPerSecond: 100,
        maxRequestsPerMinute: 2,
      });

      expect(await rateLimiter.checkRateLimit()).toBe(true);
      expect(await rateLimiter.checkRateLimit()).toBe(true);
      expect(await rateLimiter.checkRateLimit()).toBe(false);

      const metrics = rateLimiter.getMetrics();
      expect(metrics.rateLimitedRequests).toBe(1);
    });

    it('should block requests exceeding per-hour limit', async () => {
      rateLimiter = new RateLimiter({
        maxRequestsPerSecond: 100,
        maxRequestsPerMinute: 100,
        maxRequestsPerHour: 2,
      });

      expect(await rateLimiter.checkRateLimit()).toBe(true);
      expect(await rateLimiter.checkRateLimit()).toBe(true);
      expect(await rateLimiter.checkRateLimit()).toBe(false);

      const metrics = rateLimiter.getMetrics();
      expect(metrics.rateLimitedRequests).toBe(1);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after consecutive failures', async () => {
      rateLimiter = new RateLimiter({
        circuitBreakerThreshold: 3,
        circuitBreakerResetTime: 5000,
      });

      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure(true);

      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure(true);

      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure(true);

      const metrics = rateLimiter.getMetrics();
      expect(metrics.circuitBreakerOpen).toBe(true);
      expect(await rateLimiter.checkRateLimit()).toBe(false);
    });

    it('should reset circuit breaker after reset time', async () => {
      rateLimiter = new RateLimiter({
        circuitBreakerThreshold: 1,
        circuitBreakerResetTime: 5000,
      });

      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure(true);

      expect(rateLimiter.getMetrics().circuitBreakerOpen).toBe(true);
      expect(await rateLimiter.checkRateLimit()).toBe(false);

      jest.advanceTimersByTime(5001);

      expect(await rateLimiter.checkRateLimit()).toBe(true);
      expect(rateLimiter.getMetrics().circuitBreakerOpen).toBe(false);
    });

    it('should reset consecutive failures on success', async () => {
      rateLimiter = new RateLimiter({
        circuitBreakerThreshold: 3,
      });

      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure(true);

      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure(true);

      await rateLimiter.checkRateLimit();
      rateLimiter.recordSuccess(100);

      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure(true);

      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure(true);

      const metrics = rateLimiter.getMetrics();
      expect(metrics.circuitBreakerOpen).toBe(false);
    });
  });

  describe('Metrics', () => {
    it('should track request metrics', async () => {
      rateLimiter = new RateLimiter();

      await rateLimiter.checkRateLimit();
      rateLimiter.recordSuccess(100);

      await rateLimiter.checkRateLimit();
      rateLimiter.recordSuccess(200);

      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure();

      const metrics = rateLimiter.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.successfulRequests).toBe(2);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.averageResponseTime).toBe(150);
    });

    it('should calculate average response time correctly', async () => {
      rateLimiter = new RateLimiter();

      await rateLimiter.checkRateLimit();
      rateLimiter.recordSuccess(100);

      await rateLimiter.checkRateLimit();
      rateLimiter.recordSuccess(200);

      await rateLimiter.checkRateLimit();
      rateLimiter.recordSuccess(300);

      const metrics = rateLimiter.getMetrics();
      expect(metrics.averageResponseTime).toBe(200);
    });

    it('should reset metrics', async () => {
      rateLimiter = new RateLimiter();

      await rateLimiter.checkRateLimit();
      rateLimiter.recordSuccess(100);
      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure();

      rateLimiter.resetMetrics();

      const metrics = rateLimiter.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
    });
  });

  describe('Recommended Delay', () => {
    it('should recommend delay when rate limited', async () => {
      rateLimiter = new RateLimiter({
        maxRequestsPerSecond: 1,
      });

      await rateLimiter.checkRateLimit();
      await rateLimiter.checkRateLimit();

      const delay = rateLimiter.getRecommendedDelay();
      expect(delay).toBe(1000);
    });

    it('should recommend delay based on circuit breaker', async () => {
      rateLimiter = new RateLimiter({
        circuitBreakerThreshold: 1,
        circuitBreakerResetTime: 10000,
      });

      await rateLimiter.checkRateLimit();
      rateLimiter.recordFailure(true);

      const delay = rateLimiter.getRecommendedDelay();
      expect(delay).toBeLessThanOrEqual(10000);
      expect(delay).toBeGreaterThan(9000);
    });

    it('should recommend delay when close to minute limit', async () => {
      rateLimiter = new RateLimiter({
        maxRequestsPerSecond: 100,
        maxRequestsPerMinute: 10,
      });

      for (let i = 0; i < 9; i++) {
        await rateLimiter.checkRateLimit();
      }

      const delay = rateLimiter.getRecommendedDelay();
      expect(delay).toBe(600);
    });

    it('should recommend no delay when within limits', async () => {
      rateLimiter = new RateLimiter({
        maxRequestsPerSecond: 100,
        maxRequestsPerMinute: 100,
        maxRequestsPerHour: 1000,
      });

      await rateLimiter.checkRateLimit();

      const delay = rateLimiter.getRecommendedDelay();
      expect(delay).toBe(0);
    });
  });

  describe('Timestamp Cleanup', () => {
    it('should clean up old timestamps', async () => {
      rateLimiter = new RateLimiter({
        maxRequestsPerSecond: 10,
      });

      await rateLimiter.checkRateLimit();
      await rateLimiter.checkRateLimit();

      jest.advanceTimersByTime(2000);

      await rateLimiter.checkRateLimit();

      const metrics = rateLimiter.getMetrics();
      expect(metrics.totalRequests).toBe(3);
    });
  });
});
