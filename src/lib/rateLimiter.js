/**
 * Client-Side Rate Limiter & Backoff Manager
 * ===========================================
 * Provides configurable rate limiting, window tracking, and exponential backoff
 * for LLM API calls and user actions to prevent abuse and quota exhaustion.
 *
 * Configurable via environment variables:
 * - VITE_RATE_LIMIT_MAX_REQUESTS (default: 6 requests / window)
 * - VITE_RATE_LIMIT_WINDOW_MS (default: 60000 ms = 1 minute)
 * - VITE_EXPONENTIAL_BACKOFF_BASE_MS (default: 1000 ms)
 */

const MAX_REQUESTS = Number(import.meta.env.VITE_RATE_LIMIT_MAX_REQUESTS) || 6;
const WINDOW_MS = Number(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS) || 60000;
const BACKOFF_BASE_MS = Number(import.meta.env.VITE_EXPONENTIAL_BACKOFF_BASE_MS) || 1000;

// Request timestamps history
const requestHistory = [];

// Backoff state
let consecutiveFailures = 0;
let backoffUntilTimestamp = 0;

/**
 * Check if a new request is allowed under rate limits and backoff
 * @returns {{ allowed: boolean, reason?: string, retryAfterSeconds?: number }}
 */
export function checkRateLimit() {
  const now = Date.now();

  // 1. Check exponential backoff lock out
  if (now < backoffUntilTimestamp) {
    const retryAfterSeconds = Math.ceil((backoffUntilTimestamp - now) / 1000);
    return {
      allowed: false,
      reason: `Rate limit backoff active. Please wait ${retryAfterSeconds}s before retrying.`,
      retryAfterSeconds
    };
  }

  // 2. Filter history within window
  const windowStart = now - WINDOW_MS;
  while (requestHistory.length > 0 && requestHistory[0] < windowStart) {
    requestHistory.shift();
  }

  // 3. Check sliding window limit
  if (requestHistory.length >= MAX_REQUESTS) {
    const oldestInWindow = requestHistory[0];
    const retryAfterSeconds = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      reason: `Request limit reached (${MAX_REQUESTS} calls/min). Retry in ${retryAfterSeconds}s.`,
      retryAfterSeconds
    };
  }

  return { allowed: true };
}

/**
 * Record a successful request attempt
 */
export function recordRequestSuccess() {
  requestHistory.push(Date.now());
  consecutiveFailures = 0;
  backoffUntilTimestamp = 0;
}

/**
 * Record a request failure and trigger exponential backoff
 */
export function recordRequestFailure() {
  consecutiveFailures += 1;
  // Exponential backoff: base * 2^(failures - 1), capped at 30 seconds
  const delayMs = Math.min(BACKOFF_BASE_MS * Math.pow(2, consecutiveFailures - 1), 30000);
  backoffUntilTimestamp = Date.now() + delayMs;
  console.warn(`[RateLimiter] Failure recorded. Exponential backoff set to ${delayMs}ms (attempts: ${consecutiveFailures}).`);
}

/**
 * Reset rate limiter state (e.g. on session restart)
 */
export function resetRateLimiter() {
  requestHistory.length = 0;
  consecutiveFailures = 0;
  backoffUntilTimestamp = 0;
}
