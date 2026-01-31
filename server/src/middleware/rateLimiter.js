/**
 * In-memory store for rate limiting
 * Stores request counts per device/IP with TTL
 */
class RateLimitStore {
    constructor() {
        this.store = new Map();
        this.dailyLimit = 10; // 10 requests per day
        this.windowMs = 24 * 60 * 60 * 1000; // 24 hours

        // Clean up expired entries every hour
        setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }

    /**
     * Get the current count and reset time for a key
     * @param {string} key - Device fingerprint or IP
     * @returns {object} Current count and reset time
     */
    get(key) {
        const entry = this.store.get(key);

        if (!entry) {
            return { count: 0, resetAt: null };
        }

        // Check if window has expired
        if (Date.now() > entry.resetAt) {
            this.store.delete(key);
            return { count: 0, resetAt: null };
        }

        return {
            count: entry.count,
            resetAt: entry.resetAt
        };
    }

    /**
     * Increment the count for a key
     * @param {string} key - Device fingerprint or IP
     * @returns {object} Updated count and reset time
     */
    increment(key) {
        const existing = this.get(key);

        const resetAt = existing.resetAt || Date.now() + this.windowMs;
        const count = existing.count + 1;

        this.store.set(key, {
            count,
            resetAt
        });

        return {
            count,
            resetAt,
            remaining: Math.max(0, this.dailyLimit - count)
        };
    }

    /**
     * Check if a key has exceeded the limit
     * @param {string} key - Device fingerprint or IP
     * @returns {boolean} True if limit exceeded
     */
    isLimitExceeded(key) {
        const { count } = this.get(key);
        return count >= this.dailyLimit;
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetAt) {
                this.store.delete(key);
            }
        }
        console.log(`Rate limit cleanup: ${this.store.size} active entries`);
    }

    /**
     * Reset count for a key (for testing)
     * @param {string} key - Device fingerprint or IP
     */
    reset(key) {
        this.store.delete(key);
    }

    /**
     * Get all stats
     * @returns {object} Store statistics
     */
    getStats() {
        return {
            totalEntries: this.store.size,
            dailyLimit: this.dailyLimit,
            windowMs: this.windowMs
        };
    }
}

// Create singleton instance
const rateLimitStore = new RateLimitStore();

/**
 * Rate limiting middleware
 * Limits requests per device fingerprint (from header) or IP
 */
function rateLimiter(req, res, next) {
    // Get device fingerprint from header or fall back to IP
    const deviceFingerprint = req.headers['x-device-fingerprint'];
    const ip = req.ip || req.connection.remoteAddress;
    const key = deviceFingerprint || ip;

    // Check if limit is exceeded
    if (rateLimitStore.isLimitExceeded(key)) {
        const { resetAt } = rateLimitStore.get(key);
        const resetDate = new Date(resetAt);

        return res.status(429).json({
            success: false,
            error: {
                message: 'Limite diário de requisições atingido. Tente novamente amanhã.',
                code: 'RATE_LIMIT_EXCEEDED',
                resetAt: resetDate.toISOString(),
                limit: rateLimitStore.dailyLimit
            }
        });
    }

    // Increment counter
    const { count, resetAt, remaining } = rateLimitStore.increment(key);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimitStore.dailyLimit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', new Date(resetAt).toISOString());

    // Attach rate limit info to request
    req.rateLimit = {
        count,
        remaining,
        resetAt,
        limit: rateLimitStore.dailyLimit
    };

    next();
}

module.exports = { rateLimiter, rateLimitStore };
