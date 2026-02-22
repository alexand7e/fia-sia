const axios = require('axios');

/**
 * Service for interacting with Soberania LLM API (OpenAI-compatible) and Fallback API
 */
class LLMService {
    constructor() {
        // Primary API Configurations (e.g., OpenAI / Main endpoint)
        this.primaryBaseURL = process.env.OPENAI_URL;
        this.primaryApiKey = process.env.OPENAI_API;
        this.primaryModelBase = process.env.MODEL_BASE;
        this.primaryModelFlash = process.env.MODEL_FLASH;

        // Fallback API Configurations (e.g., Gemini, Groq via OpenAI proxy)
        this.fallbackBaseURL = process.env.FALLBACK_URL;
        this.fallbackApiKey = process.env.FALLBACK_API_KEY;
        this.fallbackModelBase = process.env.FALLBACK_MODEL_BASE || process.env.MODEL_BASE;
        this.fallbackModelFlash = process.env.FALLBACK_MODEL_FLASH || process.env.MODEL_FLASH;

        if (!this.primaryBaseURL || !this.primaryApiKey) {
            throw new Error('Missing required environment variables: OPENAI_URL or OPENAI_API');
        }

        this.primaryClient = axios.create({
            baseURL: this.primaryBaseURL,
            headers: {
                'Authorization': `Bearer ${this.primaryApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 60 seconds timeout
        });

        if (this.fallbackBaseURL && this.fallbackApiKey) {
            this.fallbackClient = axios.create({
                baseURL: this.fallbackBaseURL,
                headers: {
                    'Authorization': `Bearer ${this.fallbackApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60 seconds timeout
            });
        } else {
            this.fallbackClient = null;
        }
    }

    /**
     * Internal method to execute request with a specific client setup
     */
    async _executeRequest(client, modelName, systemPrompt, prompt, options) {
        const { maxTokens, temperature } = options;
        
        const response = await client.post('/v1/chat/completions', {
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
    }

    /**
     * Execute a prompt with the LLM and Fallback handling
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
            maxTokens = 8000, 
            temperature = 0.7,
            systemPrompt = 'Você é um assistente especializado em educação, focado em ajudar professores do ensino médio público do Piauí. IMPORTANTE: Sempre complete suas respostas totalmente. Nunca pare no meio de uma frase ou seção. Se a resposta for longa, organize-a em seções claras e complete todas elas.'
        } = options;

        const primaryModelName = model === 'flash' ? this.primaryModelFlash : this.primaryModelBase;
        const fallbackModelName = model === 'flash' ? this.fallbackModelFlash : this.fallbackModelBase;

        try {
            // Attempt primary provider
            console.log(`[LLM] Tentando provedor primário (${primaryModelName})...`);
            return await this._executeRequest(this.primaryClient, primaryModelName, systemPrompt, prompt, { maxTokens, temperature });
        } catch (error) {
            console.error(`[LLM] Provedor primário falhou: ${error.message}`);
            
            // Attempt fallback provider if configured
            if (this.fallbackClient) {
                try {
                    console.log(`[LLM] Iniciando fallback multi-agente (${fallbackModelName})...`);
                    const result = await this._executeRequest(this.fallbackClient, fallbackModelName, systemPrompt, prompt, { maxTokens, temperature });
                    console.log('[LLM] Fallback executado com sucesso.');
                    return result;
                } catch (fallbackError) {
                    console.error(`[LLM] Fallback falhou também: ${fallbackError.message}`);
                    return this._formatError(fallbackError);
                }
            } else {
                console.warn('[LLM] Nenhum fallback configurado. Retornando erro.');
                return this._formatError(error);
            }
        }
    }

    _formatError(error) {
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
                    message: 'A requisição demorou muito tempo. O sistema tentou múltiplos provedores.',
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

    /**
     * Get available models
     * @returns {object} Available models
     */
    getModels() {
        return {
            base: this.primaryModelBase,
            flash: this.primaryModelFlash
        };
    }
}

module.exports = new LLMService();
