/**
 * Client for interacting with the LLM API
 */
import deviceFingerprint from '../utils/deviceFingerprint.js';
import rateLimitTracker from '../utils/rateLimitTracker.js';

class LLMClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.apiPath = '/api';
        this.recaptchaSiteKey = null;
    }

    /**
     * Initialize reCAPTCHA
     * @param {string} siteKey - reCAPTCHA site key
     */
    initRecaptcha(siteKey) {
        this.recaptchaSiteKey = siteKey;

        // Load reCAPTCHA script if not already loaded
        if (!window.grecaptcha && !document.getElementById('recaptcha-script')) {
            const script = document.createElement('script');
            script.id = 'recaptcha-script';
            script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                console.log('reCAPTCHA script loaded successfully');
            };

            script.onerror = (e) => {
                console.error('Failed to load reCAPTCHA script:', e);
            };

            document.head.appendChild(script);
            console.log('reCAPTCHA script injected with key:', siteKey);
        }
    }

    /**
     * Get reCAPTCHA token
     * @returns {Promise<string>} reCAPTCHA token
     */
    async getRecaptchaToken() {
        if (!this.recaptchaSiteKey) {
            throw new Error('reCAPTCHA not initialized');
        }

        return new Promise((resolve, reject) => {
            // Wait for grecaptcha to be ready
            const checkReady = setInterval(() => {
                if (window.grecaptcha && window.grecaptcha.ready) {
                    clearInterval(checkReady);

                    window.grecaptcha.ready(() => {
                        window.grecaptcha.execute(this.recaptchaSiteKey, { action: 'execute_prompt' })
                            .then(resolve)
                            .catch(reject);
                    });
                }
            }, 100);

            // Timeout after 30 seconds
            setTimeout(() => {
                clearInterval(checkReady);
                console.error('reCAPTCHA timeout after 30s waiting for grecaptcha.ready');
                reject(new Error('reCAPTCHA timeout'));
            }, 30000);
        });
    }

    /**
     * Execute a prompt with the LLM
     * @param {string} prompt - The prompt to execute
     * @param {object} options - Execution options
     * @returns {Promise<object>} Response from the API
     */
    async executePrompt(prompt, options = {}) {
        const {
            model = 'base',
            maxTokens = 2000,
            temperature = 0.7,
            requireRecaptcha = rateLimitTracker.isFirstRequestOfDay()
        } = options;

        // Check rate limit
        if (!rateLimitTracker.canMakeRequest()) {
            const status = rateLimitTracker.getStatus();
            throw new Error(`Limite diário atingido. Você poderá fazer novas requisições após ${new Date(status.resetAt).toLocaleString('pt-BR')}`);
        }

        // Get device fingerprint
        const fingerprint = await deviceFingerprint.getFingerprint();

        // Prepare request body
        const body = {
            prompt,
            model,
            maxTokens,
            temperature
        };

        // Get reCAPTCHA token if needed
        if (requireRecaptcha && this.recaptchaSiteKey) {
            try {
                body.recaptchaToken = await this.getRecaptchaToken();
            } catch (error) {
                console.error('reCAPTCHA error:', error);
                throw new Error('Falha na verificação de segurança. Recarregue a página e tente novamente.');
            }
        }

        // Make API request
        try {
            const response = await fetch(`${this.baseURL}${this.apiPath}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Fingerprint': fingerprint
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Erro ao executar prompt');
            }

            // Update rate limit tracker
            rateLimitTracker.increment();

            // Sync with server if rate limit info is provided
            if (data.rateLimit) {
                rateLimitTracker.syncWithServer(data.rateLimit);
            }

            return data;

        } catch (error) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
            }
            throw error;
        }
    }

    /**
     * Get rate limit status from server
     * @returns {Promise<object>} Rate limit status
     */
    async getRateLimitStatus() {
        const fingerprint = await deviceFingerprint.getFingerprint();

        try {
            const response = await fetch(`${this.baseURL}${this.apiPath}/rate-limit-status`, {
                method: 'GET',
                headers: {
                    'X-Device-Fingerprint': fingerprint
                }
            });

            const data = await response.json();

            if (data.success && data.data) {
                // Sync with local tracker
                rateLimitTracker.syncWithServer(data.data);
                return data.data;
            }

            return rateLimitTracker.getStatus();

        } catch (error) {
            console.error('Error fetching rate limit status:', error);
            return rateLimitTracker.getStatus();
        }
    }

    /**
     * Get available models
     * @returns {Promise<object>} Available models
     */
    async getModels() {
        try {
            const response = await fetch(`${this.baseURL}${this.apiPath}/models`);
            const data = await response.json();

            if (data.success) {
                return data.data;
            }

            return { base: 'Modelo Base', flash: 'Modelo Rápido' };

        } catch (error) {
            console.error('Error fetching models:', error);
            return { base: 'Modelo Base', flash: 'Modelo Rápido' };
        }
    }
}

// Export singleton instance
export default new LLMClient();
