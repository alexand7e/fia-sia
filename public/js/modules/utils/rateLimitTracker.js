/**
 * Track and manage rate limiting on the client side
 * Stores request count in localStorage with daily reset
 */

class RateLimitTracker {
    constructor() {
        this.storageKey = 'sia:rate-limit';
        this.dailyLimit = 10;
    }

    /**
     * Get current rate limit data
     * @returns {object} Rate limit data
     */
    getData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                return this.createNewData();
            }

            const data = JSON.parse(stored);

            // Check if we need to reset (new day)
            if (this.shouldReset(data.resetAt)) {
                return this.createNewData();
            }

            return data;
        } catch (error) {
            console.error('Error reading rate limit data:', error);
            return this.createNewData();
        }
    }

    /**
     * Create new rate limit data structure
     * @returns {object} New rate limit data
     */
    createNewData() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(24, 0, 0, 0); // Midnight tomorrow

        const data = {
            count: 0,
            limit: this.dailyLimit,
            resetAt: tomorrow.toISOString(),
            firstRequestAt: null
        };

        this.saveData(data);
        return data;
    }

    /**
     * Check if rate limit should be reset
     * @param {string} resetAt - ISO date string
     * @returns {boolean} True if should reset
     */
    shouldReset(resetAt) {
        if (!resetAt) return true;
        return new Date() >= new Date(resetAt);
    }

    /**
     * Save rate limit data to localStorage
     * @param {object} data - Rate limit data
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving rate limit data:', error);
        }
    }

    /**
     * Increment request count
     * @returns {object} Updated rate limit data
     */
    increment() {
        const data = this.getData();

        data.count += 1;

        if (!data.firstRequestAt) {
            data.firstRequestAt = new Date().toISOString();
        }

        this.saveData(data);
        return data;
    }

    /**
     * Check if can make a request
     * @returns {boolean} True if can make request
     */
    canMakeRequest() {
        const data = this.getData();
        return data.count < data.limit;
    }

    /**
     * Get remaining requests
     * @returns {number} Number of remaining requests
     */
    getRemaining() {
        const data = this.getData();
        return Math.max(0, data.limit - data.count);
    }

    /**
     * Get status object
     * @returns {object} Status with all rate limit info
     */
    getStatus() {
        const data = this.getData();
        const remaining = this.getRemaining();

        return {
            limit: data.limit,
            used: data.count,
            remaining,
            resetAt: data.resetAt,
            canMakeRequest: remaining > 0,
            isLimitExceeded: remaining === 0
        };
    }

    /**
     * Check if this is the first request of the day
     * (used to determine if reCAPTCHA is needed)
     * @returns {boolean} True if first request
     */
    isFirstRequestOfDay() {
        const data = this.getData();
        return data.count === 0;
    }

    /**
     * Reset (for testing)
     */
    reset() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Sync with server status
     * @param {object} serverStatus - Status from server
     */
    syncWithServer(serverStatus) {
        if (!serverStatus) return;

        const data = {
            count: serverStatus.used || 0,
            limit: serverStatus.limit || this.dailyLimit,
            resetAt: serverStatus.resetAt || this.getData().resetAt,
            firstRequestAt: this.getData().firstRequestAt
        };

        this.saveData(data);
    }
}

// Export singleton instance
export default new RateLimitTracker();
