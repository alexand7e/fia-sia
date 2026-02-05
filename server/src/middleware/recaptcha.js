const axios = require('axios');

/**
 * Middleware to verify Google reCAPTCHA token
 */
async function verifyRecaptcha(req, res, next) {
    const secretKey = process.env.RECAPTCHA_SECRET;

    if (!secretKey) {
        console.warn('RECAPTCHA_SECRET não configurado; verificação reCAPTCHA desativada');
        return next();
    }

    const recaptchaToken = req.body.recaptchaToken || req.headers['x-recaptcha-token'];

    if (!recaptchaToken) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'reCAPTCHA token é obrigatório',
                code: 'RECAPTCHA_REQUIRED'
            }
        });
    }

    try {
        const body = new URLSearchParams({
            secret: secretKey,
            response: recaptchaToken,
            ...(req.ip && { remoteip: req.ip })
        }).toString();

        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000
        });

        const data = response.data;
        if (!data || typeof data !== 'object') {
            console.warn('reCAPTCHA: resposta inválida da Google', response.status);
            return res.status(502).json({
                success: false,
                error: {
                    message: 'Resposta inválida do serviço de verificação',
                    code: 'RECAPTCHA_VERIFICATION_ERROR'
                }
            });
        }

        const { success, score, 'error-codes': errorCodes } = data;

        if (!success) {
            console.warn('reCAPTCHA verification failed:', errorCodes);
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Verificação reCAPTCHA falhou',
                    code: 'RECAPTCHA_FAILED',
                    details: errorCodes || []
                }
            });
        }

        // For reCAPTCHA v3, check score (optional)
        if (score !== undefined && score < 0.5) {
            console.warn(`Low reCAPTCHA score: ${score} for IP ${req.ip}`);
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Verificação de segurança falhou',
                    code: 'SECURITY_CHECK_FAILED'
                }
            });
        }

        req.recaptchaVerified = true;
        req.recaptchaScore = score;
        next();

    } catch (error) {
        const msg = error.response?.data
            ? JSON.stringify(error.response.data)
            : error.code === 'ECONNABORTED'
                ? 'timeout'
                : error.message;
        console.error('Error verifying reCAPTCHA:', msg);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Erro ao verificar reCAPTCHA',
                code: 'RECAPTCHA_VERIFICATION_ERROR',
                ...(process.env.NODE_ENV !== 'production' && { detail: msg })
            }
        });
    }
}

module.exports = verifyRecaptcha;
