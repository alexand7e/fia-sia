const axios = require('axios');

/**
 * Service for interacting with Soberania LLM API (OpenAI-compatible)
 */
class LLMService {
    constructor() {
        this.baseURL = process.env.OPENAI_URL;
        this.apiKey = process.env.OPENAI_API;
        this.modelBase = process.env.MODEL_BASE;
        this.modelFlash = process.env.MODEL_FLASH;

        if (!this.baseURL || !this.apiKey) {
            throw new Error('Missing required environment variables: OPENAI_URL or OPENAI_API');
        }

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 60 seconds timeout
        });
    }

    /**
     * Execute a prompt with the LLM
     * @param {string} prompt - The prompt to execute
     * @param {object} options - Execution options
     * @param {string} options.model - 'base' or 'flash'
     * @param {number} options.maxTokens - Maximum tokens to generate
     * @param {number} options.temperature - Temperature for generation (0-1)
     * @returns {Promise<object>} Response from the LLM
     */
    async executePrompt(prompt, options = {}) {
        const {
            model = 'base',
            maxTokens = 2000,
            temperature = 0.7,
            systemPrompt = 'Você é um assistente especializado em educação, focado em ajudar professores do ensino médio público do Piauí.'
        } = options;

        const modelName = model === 'flash' ? this.modelFlash : this.modelBase;

        try {
            const response = await this.client.post('/v1/chat/completions', {
                model: modelName,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: temperature
            });

            return {
                success: true,
                data: {
                    text: response.data.choices[0].message.content,
                    model: modelName,
                    usage: response.data.usage
                }
            };
        } catch (error) {
            console.error('Error executing prompt:', error.message);

            if (error.response) {
                // API error
                return {
                    success: false,
                    error: {
                        message: error.response.data?.error?.message || 'Erro ao executar prompt',
                        status: error.response.status,
                        code: error.response.data?.error?.code
                    }
                };
            } else if (error.code === 'ECONNABORTED') {
                // Timeout
                return {
                    success: false,
                    error: {
                        message: 'A requisição demorou muito tempo. Tente novamente.',
                        code: 'TIMEOUT'
                    }
                };
            } else {
                // Network or other errors
                return {
                    success: false,
                    error: {
                        message: 'Erro de conexão com o serviço de IA',
                        code: 'NETWORK_ERROR'
                    }
                };
            }
        }
    }

    /**
     * Get available models
     * @returns {object} Available models
     */
    getModels() {
        return {
            base: this.modelBase,
            flash: this.modelFlash
        };
    }
}

module.exports = new LLMService();
