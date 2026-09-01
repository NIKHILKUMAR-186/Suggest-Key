import { Request, Response, NextFunction } from 'express';

export interface RateLimiterOptions {
  /**
   * Time window in milliseconds (default: 15 minutes = 900,000 ms)
   */
  windowMs?: number;
  /**
   * Maximum number of connections/requests allowed per windowMs (default: 100)
   */
  max?: number;
  /**
   * Custom message or error payload when rate limit is exceeded
   */
  message?: string | object;
  /**
   * Key generator function to identify client (defaults to client IP)
   */
  keyGenerator?: (req: Request) => string;
  /**
   * Custom check function to determine if this limiter is enabled (defaults to isRateLimitEnabled)
   */
  enabledCheck?: () => boolean;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

/**
 * Checks if global rate limiting is enabled based on server-side environment variables.
 *
 * SAFE FAIL-SAFE RULES:
 * - RATE_LIMIT_ENABLED === 'false' => DISABLED (returns false)
 * - RATE_LIMIT_ENABLED === 'true'  => ENABLED (returns true)
 * - RATE_LIMIT_ENABLED === ''      => ENABLED (returns true)
 * - RATE_LIMIT_ENABLED is missing  => ENABLED (returns true)
 * - Any other string               => ENABLED (returns true)
 */
export function isRateLimitEnabled(): boolean {
  return process.env.RATE_LIMIT_ENABLED !== 'false';
}

/**
 * Checks if auth-specific rate limiting is enabled.
 */
export function isAuthRateLimitEnabled(): boolean {
  return (
    process.env.AUTH_RATE_LIMIT_ENABLED !== 'false' &&
    process.env.RATE_LIMIT_ENABLED !== 'false'
  );
}


/**
 * In-memory client tracking store for sliding window rate limits.
 */
const rateLimitStore = new Map<string, ClientRecord>();

// Clean up expired records every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates an Express middleware for rate limiting with the environment-controlled toggle.
 */
export function createRateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const isEnabled = options.enabledCheck || isRateLimitEnabled;
  const message = options.message || {
    success: false,
    error: 'Too many requests. Rate limit exceeded, please try again later.',
  };
  const keyGenerator =
    options.keyGenerator ||
    ((req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
      }
      return req.ip || req.socket.remoteAddress || '127.0.0.1';
    });

  return (req: Request, res: Response, next: NextFunction): void => {
    // 1. Check if rate limiting is enabled via environment variable
    if (!isEnabled()) {
      // Safe bypass: Proceed immediately to next middleware without blocking or counting
      res.setHeader('X-RateLimit-Bypassed', 'true');
      return next();
    }

    // 2. Rate limiting is active - enforce quotas
    const clientKey = keyGenerator(req);
    const now = Date.now();
    let record = rateLimitStore.get(clientKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(clientKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.status(429).json(
        typeof message === 'string'
          ? { success: false, error: message, retryAfterSeconds }
          : { ...message, retryAfterSeconds }
      );
      return;
    }

    next();
  };
}

/**
 * Pre-configured general API rate limiter (120 requests / 15 min)
 */
export const generalApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  enabledCheck: isRateLimitEnabled,
  message: {
    success: false,
    error: 'API rate limit exceeded. Please wait a few moments before trying again.',
  },
});

/**
 * Pre-configured strict rate limiter for sensitive operations such as Auth & Booking Locks (30 requests / 15 min)
 */
export const strictApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  enabledCheck: isAuthRateLimitEnabled,
  message: {
    success: false,
    error: 'Too many sensitive requests. Please wait 15 minutes before retrying.',
  },
});
