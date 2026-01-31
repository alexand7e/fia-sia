/**
 * Generate a unique device fingerprint based on browser characteristics
 * This is used for rate limiting on a per-device basis
 */

class DeviceFingerprint {
    constructor() {
        this.storageKey = 'sia:device-fingerprint';
        this.fingerprint = null;
    }

    /**
     * Get or generate device fingerprint
     * @returns {string} Unique device fingerprint
     */
    async getFingerprint() {
        // Check if already cached in memory
        if (this.fingerprint) {
            return this.fingerprint;
        }

        // Check localStorage
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.fingerprint = stored;
            return stored;
        }

        // Generate new fingerprint
        const fingerprint = await this.generateFingerprint();
        localStorage.setItem(this.storageKey, fingerprint);
        this.fingerprint = fingerprint;

        return fingerprint;
    }

    /**
     * Generate fingerprint based on browser characteristics
     * @returns {Promise<string>} Generated fingerprint
     */
    async generateFingerprint() {
        const components = [];

        // User agent
        components.push(navigator.userAgent);

        // Screen resolution
        components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

        // Timezone
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

        // Language
        components.push(navigator.language);

        // Platform
        components.push(navigator.platform);

        // Hardware concurrency (CPU cores)
        components.push(navigator.hardwareConcurrency || 'unknown');

        // Canvas fingerprint
        const canvasFingerprint = await this.getCanvasFingerprint();
        components.push(canvasFingerprint);

        // Combine all components and hash
        const combined = components.join('|');
        const hash = await this.hashString(combined);

        return hash;
    }

    /**
     * Get canvas fingerprint
     * @returns {Promise<string>} Canvas fingerprint
     */
    async getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Draw text with specific styling
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('SIA Piauí', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('SIA Piauí', 4, 17);

            // Get canvas data
            const dataURL = canvas.toDataURL();
            return await this.hashString(dataURL);
        } catch (error) {
            console.warn('Canvas fingerprint failed:', error);
            return 'canvas-error';
        }
    }

    /**
     * Hash a string using SHA-256
     * @param {string} str - String to hash
     * @returns {Promise<string>} Hexadecimal hash
     */
    async hashString(str) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } catch (error) {
            console.warn('Hashing failed, using fallback:', error);
            // Fallback to simple hash
            return this.simpleHash(str);
        }
    }

    /**
     * Simple hash function fallback
     * @param {string} str - String to hash
     * @returns {string} Hash
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Reset fingerprint (for testing)
     */
    reset() {
        localStorage.removeItem(this.storageKey);
        this.fingerprint = null;
    }
}

// Export singleton instance
export default new DeviceFingerprint();
