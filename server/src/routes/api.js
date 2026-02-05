const express = require('express');
const router = express.Router();
const llmService = require('../services/llm.service');
const questaoService = require('../services/questao.service');
const verifyRecaptcha = require('../middleware/recaptcha');
const { rateLimiter, rateLimitStore } = require('../middleware/rateLimiter');

/**
 * POST /api/execute
 * Execute a prompt with the LLM
 * 
 * Body:
 * - prompt: string (required)
 * - model: 'base' | 'flash' (optional, default: 'base')
 * - recaptchaToken: string (required for first request)
 * 
 * Headers:
 * - x-device-fingerprint: string (optional, for better rate limiting)
 * - x-recaptcha-token: string (alternative to body)
 */
router.post('/execute', rateLimiter, verifyRecaptcha, async (req, res) => {
    try {
        const { prompt, model = 'base', maxTokens, temperature } = req.body;

        // Validate prompt
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'O campo "prompt" é obrigatório e deve ser uma string não vazia',
                    code: 'INVALID_PROMPT'
                }
            });
        }

        // Validate model
        if (model !== 'base' && model !== 'flash') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Modelo inválido. Use "base" ou "flash"',
                    code: 'INVALID_MODEL'
                }
            });
        }

        // Execute prompt
        const result = await llmService.executePrompt(prompt, {
            model,
            maxTokens,
            temperature
        });

        if (!result.success) {
            return res.status(500).json(result);
        }

        // Return success response with rate limit info
        return res.status(200).json({
            success: true,
            data: result.data,
            rateLimit: req.rateLimit
        });

    } catch (error) {
        console.error('Error in /api/execute:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/gerar-questao
 * Generate a structured question (enunciado, suporte, comando, alternativas, gabarito, avaliacaoAlternativas)
 *
 * Body:
 * - materia: string (required)
 * - descritor: string (required)
 * - turma: string (required)
 * - complexidade: 'facil' | 'medio' | 'dificil' (optional)
 * - tamanho: 'curta' | 'media' | 'longa' (optional)
 * - infoAdicional: string (optional)
 * - recaptchaToken: string (required for first request)
 */
router.post('/gerar-questao', rateLimiter, verifyRecaptcha, async (req, res) => {
    try {
        const { materia, descritor, turma, complexidade, tamanho, infoAdicional } = req.body;

        if (!materia || typeof materia !== 'string' || !materia.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'O campo "materia" é obrigatório',
                    code: 'INVALID_PAYLOAD'
                }
            });
        }
        if (!descritor || typeof descritor !== 'string' || !descritor.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'O campo "descritor" é obrigatório',
                    code: 'INVALID_PAYLOAD'
                }
            });
        }
        if (!turma || typeof turma !== 'string' || !turma.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'O campo "turma" é obrigatório',
                    code: 'INVALID_PAYLOAD'
                }
            });
        }

        const payload = {
            materia: materia.trim(),
            descritor: descritor.trim(),
            turma: turma.trim(),
            complexidade: ['facil', 'medio', 'dificil'].includes(complexidade) ? complexidade : 'medio',
            tamanho: ['curta', 'media', 'longa'].includes(tamanho) ? tamanho : 'media',
            infoAdicional: typeof infoAdicional === 'string' ? infoAdicional.trim() : undefined
        };

        const data = await questaoService.gerarQuestao(payload);

        return res.status(200).json({
            success: true,
            data,
            rateLimit: req.rateLimit
        });
    } catch (error) {
        console.error('Error in /api/gerar-questao:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Erro ao gerar questão',
                code: 'QUESTAO_ERROR'
            }
        });
    }
});

/**
 * GET /api/rate-limit-status
 * Get current rate limit status for the device/IP
 *
 * Headers:
 * - x-device-fingerprint: string (optional)
 */
router.get('/rate-limit-status', (req, res) => {
    const deviceFingerprint = req.headers['x-device-fingerprint'];
    const ip = req.ip || req.connection.remoteAddress;
    const key = deviceFingerprint || ip;

    const { count, resetAt } = rateLimitStore.get(key);
    const remaining = Math.max(0, rateLimitStore.dailyLimit - count);

    return res.status(200).json({
        success: true,
        data: {
            limit: rateLimitStore.dailyLimit,
            used: count,
            remaining,
            resetAt: resetAt ? new Date(resetAt).toISOString() : null,
            isLimitExceeded: rateLimitStore.isLimitExceeded(key)
        }
    });
});

/**
 * GET /api/models
 * Get available LLM models
 */
router.get('/models', (req, res) => {
    try {
        const models = llmService.getModels();
        return res.status(200).json({
            success: true,
            data: models
        });
    } catch (error) {
        console.error('Error getting models:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Erro ao obter modelos disponíveis',
                code: 'MODELS_ERROR'
            }
        });
    }
});

/**
 * GET /api/config
 * Get public configuration
 */
router.get('/config', (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            recaptchaSiteKey: process.env.RECAPTCHA_HTML
        }
    });
});

module.exports = router;
