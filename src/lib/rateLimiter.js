/**
 * Client-Side Tiered Rate Limiter & Exponential Backoff Manager
 * ==============================================================
 * Provides categorized rate limiting (Auth, Public LLM, User Action)
 * with configurable sliding window thresholds and exponential backoff.
 *
 * Configurable via environment variables:
 * - VITE_RATE_LIMIT_AUTH_MAX (default: 5 requests / min - strict)
 * - VITE_RATE_LIMIT_PUBLIC_MAX (default: 10 requests / min - moderate)
 * - VITE_RATE_LIMIT_USER_MAX (default: 30 requests / min - loose)
 * - VITE_RATE_LIMIT_WINDOW_MS (default: 60000 ms = 1 minute)
 * - VITE_EXPONENTIAL_BACKOFF_BASE_MS (default: 1000 ms)
 */

export const RATE_LIMIT_TIERS = {
  AUTH: 'auth',        // Strict: key configuration, auth routes
  PUBLIC: 'public',    // Moderate: LLM API evaluations (Ask Mode, Practice Mode)
  USER: 'user'         // Loose: interactive UI actions, local predictions
};

const TIER_LIMITS = {
  [RATE_LIMIT_TIERS.AUTH]: Number(import.meta.env.VITE_RATE_LIMIT_AUTH_MAX) || 5,
  [RATE_LIMIT_TIERS.PUBLIC]: Number(import.meta.env.VITE_RATE_LIMIT_PUBLIC_MAX) || 10,
  [RATE_LIMIT_TIERS.USER]: Number(import.meta.env.VITE_RATE_LIMIT_USER_MAX) || 30
};

const WINDOW_MS = Number(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS) || 60000;
const BACKOFF_BASE_MS = Number(import.meta.env.VITE_EXPONENTIAL_BACKOFF_BASE_MS) || 1000;

// Request history maps per tier
const tierHistories = {
  [RATE_LIMIT_TIERS.AUTH]: [],
  [RATE_LIMIT_TIERS.PUBLIC]: [],
  [RATE_LIMIT_TIERS.USER]: []
};

// Exponential backoff state
let consecutiveFailures = 0;
let backoffUntilTimestamp = 0;

/**
 * Check if a request is allowed under tier rate limits and exponential backoff
 * @param {string} tier - RATE_LIMIT_TIERS value (AUTH | PUBLIC | USER)
 * @returns {{ allowed: boolean, reason?: string, retryAfterSeconds?: number }}
 */
export function checkRateLimit(tier = RATE_LIMIT_TIERS.PUBLIC) {
  const now = Date.now();

  // 1. Check exponential backoff lock
  if (now < backoffUntilTimestamp) {
    const retryAfterSeconds = Math.ceil((backoffUntilTimestamp - now) / 1000);
    return {
      allowed: false,
      reason: `Exponential backoff active due to repeated failures. Please wait ${retryAfterSeconds}s.`,
      retryAfterSeconds
    };
  }

  // 2. Filter sliding window history for specified tier
  const history = tierHistories[tier] || tierHistories[RATE_LIMIT_TIERS.PUBLIC];
  const maxLimit = TIER_LIMITS[tier] || TIER_LIMITS[RATE_LIMIT_TIERS.PUBLIC];
  const windowStart = now - WINDOW_MS;

  while (history.length > 0 && history[0] < windowStart) {
    history.shift();
  }

  // 3. Check threshold
  if (history.length >= maxLimit) {
    const oldestInWindow = history[0];
    const retryAfterSeconds = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      reason: `Rate limit reached for ${tier} actions (${maxLimit} req/min). Retry in ${retryAfterSeconds}s.`,
      retryAfterSeconds
    };
  }

  return { allowed: true };
}

/**
 * Record a successful request attempt
 * @param {string} tier
 */
export function recordRequestSuccess(tier = RATE_LIMIT_TIERS.PUBLIC) {
  const history = tierHistories[tier] || tierHistories[RATE_LIMIT_TIERS.PUBLIC];
  history.push(Date.now());
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
  console.warn(`[RateLimiter] Failure recorded. Exponential backoff set to ${delayMs}ms (consecutive failures: ${consecutiveFailures}).`);
}

/**
 * Reset rate limiter state (e.g. on session restart)
 */
export function resetRateLimiter() {
  Object.keys(tierHistories).forEach(tier => {
    tierHistories[tier].length = 0;
  });
  consecutiveFailures = 0;
  backoffUntilTimestamp = 0;
}

