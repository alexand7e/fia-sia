const axios = require('axios');

/**
 * Middleware to verify Google reCAPTCHA token
 */
async function verifyRecaptcha(req, res, next) {
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

    const secretKey = process.env.RECAPTCHA_SECRET;

    if (!secretKey) {
        console.error('RECAPTCHA_SECRET não configurado nas variáveis de ambiente');
        return res.status(500).json({
            success: false,
            error: {
                message: 'Erro de configuração do servidor',
                code: 'SERVER_CONFIG_ERROR'
            }
        });
    }

    try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: secretKey,
                response: recaptchaToken,
                remoteip: req.ip
            }
        });

        const { success, score, 'error-codes': errorCodes } = response.data;

        if (!success) {
            console.warn('reCAPTCHA verification failed:', errorCodes);
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Verificação reCAPTCHA falhou',
                    code: 'RECAPTCHA_FAILED',
                    details: errorCodes
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

        // reCAPTCHA verified successfully
        req.recaptchaVerified = true;
        req.recaptchaScore = score;
        next();

    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error.message);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Erro ao verificar reCAPTCHA',
                code: 'RECAPTCHA_VERIFICATION_ERROR'
            }
        });
    }
}

module.exports = verifyRecaptcha;
