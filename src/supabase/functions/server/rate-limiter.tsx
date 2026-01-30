/**
 * Rate limiter utility for Resend API calls
 * Resend free tier: 2 requests per second
 * Resend paid tier: 10 requests per second
 * This ensures we stay safely under the limit
 */

class RateLimiter {
  private lastRequestTime: number = 0;
  private readonly minDelayMs: number;

  constructor(requestsPerSecond: number = 8) {
    // Calculate minimum delay between requests (in milliseconds)
    // Using 8 req/sec for paid tier (10 req/sec limit with safety buffer)
    // For free tier, use 1.5 req/sec
    this.minDelayMs = Math.ceil(1000 / requestsPerSecond);
  }

  /**
   * Wait until it's safe to make the next request
   */
  async waitForNextSlot(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minDelayMs) {
      const waitTime = this.minDelayMs - timeSinceLastRequest;
      console.log(`⏳ [Rate Limiter] Waiting ${waitTime}ms to respect rate limits...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Reset the rate limiter (useful for testing or manual override)
   */
  reset(): void {
    this.lastRequestTime = 0;
  }
}

// Singleton instance for Resend API
// 8 requests per second = 125ms between requests (paid tier)
// Change to 1.5 for free tier (667ms between requests)
export const resendRateLimiter = new RateLimiter(8);
