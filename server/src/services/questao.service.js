const llmService = require('./llm.service');

const LETRAS = ['A', 'B', 'C', 'D', 'E'];
const FALLBACK_TEXTO = 'Texto não gerado.';
const FALLBACK_ALTERNATIVA = 'Alternativa não gerada.';
const FALLBACK_AVALIACAO = 'Avaliação não gerada.';

/**
 * Extract JSON from LLM response (may be inside markdown code block)
 */
function extractJson(text) {
    if (!text || typeof text !== 'string') return null;
    const trimmed = text.trim();
    const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = codeBlock ? codeBlock[1].trim() : trimmed;
    try {
        return JSON.parse(raw);
    } catch (e) {
        try {
            return JSON.parse(trimmed);
        } catch (e2) {
            return null;
        }
    }
}

/**
 * Ensure alternativas has exactly A–E with non-empty strings
 */
function normalizeAlternativas(alt) {
    const out = {};
    LETRAS.forEach((letra) => {
        const v = alt && alt[letra];
        out[letra] = typeof v === 'string' && v.trim() ? v.trim() : FALLBACK_ALTERNATIVA;
    });
    return out;
}

/**
 * Ensure avaliacaoAlternativas has A–E with non-empty strings
 */
function normalizeAvaliacao(av) {
    const out = {};
    LETRAS.forEach((letra) => {
        const v = av && av[letra];
        out[letra] = typeof v === 'string' && v.trim() ? v.trim() : FALLBACK_AVALIACAO;
    });
    return out;
}

/**
 * Validate and normalize gabarito (single letter A–E)
 */
function normalizeGabarito(g) {
    if (g == null) return 'A';
    const letra = String(g).trim().toUpperCase().slice(0, 1);
    return LETRAS.includes(letra) ? letra : 'A';
}

function fallbackStr(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : FALLBACK_TEXTO;
}

/**
 * Build prompt for full question generation (single LLM call returning JSON)
 */
function buildPrompt(payload) {
    const { materia, descritor, turma, infoAdicional } = payload;
    const extra = infoAdicional ? `\nInformações adicionais para a questão: ${infoAdicional}` : '';
    return `Você é um professor experiente criando uma questão objetiva de múltipla escolha para o ensino médio público.

Contexto:
- Matéria: ${materia}
- Descritor/habilidade: ${descritor}
- Turma: ${turma}${extra}

Gere uma questão com EXATAMENTE a estrutura abaixo. Responda APENAS com um bloco JSON válido, sem texto antes ou depois.

Estrutura obrigatória do JSON:
{
  "enunciado": "texto do enunciado da questão (uma ou mais frases claras)",
  "suporte": "texto de apoio ou contexto (tabela, trecho, gráfico descrito, etc.) que contextualiza a questão",
  "comando": "frase que indica o que o aluno deve fazer (ex.: 'Assinale a alternativa correta.', 'Com base no texto, ...')",
  "alternativas": {
    "A": "texto da alternativa A",
    "B": "texto da alternativa B",
    "C": "texto da alternativa C",
    "D": "texto da alternativa D",
    "E": "texto da alternativa E"
  },
  "gabarito": "uma única letra: A, B, C, D ou E",
  "avaliacaoAlternativas": {
    "A": "breve explicação: por que está correta ou por que está errada (se o aluno marcar A)",
    "B": "breve explicação para a alternativa B",
    "C": "breve explicação para a alternativa C",
    "D": "breve explicação para a alternativa D",
    "E": "breve explicação para a alternativa E"
  }
}

Regras: alternativas devem ser plausíveis; apenas uma correta; linguagem adequada ao ensino médio; gabarito deve ser uma letra maiúscula.`;
}

/**
 * Generate full question with one LLM call, then validate and apply fallbacks
 */
async function gerarQuestao(payload) {
    const { materia, descritor, turma } = payload || {};

    if (!materia || !descritor || !turma) {
        throw new Error('Campos obrigatórios: materia, descritor e turma');
    }

    const prompt = buildPrompt(payload);
    const result = await llmService.executePrompt(prompt, {
        model: 'base',
        maxTokens: 3000,
        temperature: 0.6,
        systemPrompt: 'Você é um assistente que gera questões objetivas em JSON válido, sem markdown extra.'
    });

    if (!result.success || !result.data || !result.data.text) {
        return buildFallbackQuestao(payload);
    }

    const parsed = extractJson(result.data.text);
    if (!parsed || typeof parsed !== 'object') {
        return buildFallbackQuestao(payload);
    }

    const enunciado = fallbackStr(parsed.enunciado);
    const suporte = fallbackStr(parsed.suporte);
    const comando = fallbackStr(parsed.comando);
    const alternativas = normalizeAlternativas(parsed.alternativas);
    const gabarito = normalizeGabarito(parsed.gabarito);
    const avaliacaoAlternativas = normalizeAvaliacao(parsed.avaliacaoAlternativas);

    return {
        enunciado,
        suporte,
        comando,
        alternativas,
        gabarito,
        avaliacaoAlternativas
    };
}

/**
 * Return a minimal valid question when LLM fails (fallback)
 */
function buildFallbackQuestao(payload) {
    const { materia, descritor, turma } = payload || {};
    const alt = {};
    const av = {};
    LETRAS.forEach((l) => {
        alt[l] = FALLBACK_ALTERNATIVA;
        av[l] = FALLBACK_AVALIACAO;
    });
    return {
        enunciado: `Questão sobre ${materia} (${descritor}) para a turma ${turma}. Não foi possível gerar o enunciado.`,
        suporte: FALLBACK_TEXTO,
        comando: 'Assinale a alternativa correta.',
        alternativas: alt,
        gabarito: 'A',
        avaliacaoAlternativas: av
    };
}

module.exports = {
    gerarQuestao,
    buildFallbackQuestao
};
