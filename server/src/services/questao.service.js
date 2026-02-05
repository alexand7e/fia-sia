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
 * Get avaliacaoAlternativas from parsed object (may be under different keys)
 */
function getAvaliacaoAlternativas(parsed) {
    const av = parsed?.avaliacaoAlternativas ?? parsed?.avaliacao_alternativas ?? parsed?.justificativas;
    if (av && typeof av === 'object') return av;
    return null;
}

/**
 * Ensure avaliacaoAlternativas has A–E with non-empty strings
 */
function normalizeAvaliacao(av) {
    const out = {};
    LETRAS.forEach((letra) => {
        const v = av && (av[letra] ?? av[letra.toLowerCase()]);
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

const COMPLEXIDADE_INSTRUCOES = {
    facil: 'COMPLEXIDADE FÁCIL: Questão acessível, que exige reconhecimento ou aplicação direta. Suporte curto e claro; alternativas com distratores evidentes; comando direto (ex.: identificar, assinalar o que...). Linguagem simples.',
    medio: 'COMPLEXIDADE MÉDIA: Questão que exige compreensão ou aplicação em contexto. Suporte com contexto suficiente; alternativas plausíveis exigindo análise; comando pode pedir interpretação ou relação entre ideias.',
    dificil: 'COMPLEXIDADE DIFÍCIL: Questão que exige análise, inferência, síntese ou múltiplos passos. Suporte pode conter informações que precisam ser selecionadas ou relacionadas; alternativas mais sutis; comando pode exigir justificativa conceitual ou conclusão a partir de evidências.'
};

const TAMANHO_INSTRUCOES = {
    curta: 'TAMANHO CURTO: Suporte conciso (ex.: um recado, uma fórmula, um trecho de 2–4 linhas). Enunciado e comando em uma ou duas frases. Alternativas objetivas, uma linha cada.',
    media: 'TAMANHO MÉDIO: Suporte com extensão moderada (ex.: parágrafo, tabela pequena, trecho de 5–10 linhas). Enunciado e comando claros. Alternativas podem ter uma ou duas frases.',
    longa: 'TAMANHO LONGO/EXTENSO: Suporte mais longo (ex.: texto de 15–30 linhas, carta, reportagem, trecho literário, problema com contexto). Enunciado pode contextualizar melhor. Comando e alternativas podem ser mais elaborados; avaliacaoAlternativas com explicações um pouco mais desenvolvidas.'
};

/**
 * Build prompt for full question generation (single LLM call returning JSON)
 */
function buildPrompt(payload) {
    const { materia, descritor, turma, complexidade = 'medio', tamanho = 'media', infoAdicional } = payload;
    const extra = infoAdicional ? `\nInformações adicionais para a questão: ${infoAdicional}` : '';
    const instComplexidade = COMPLEXIDADE_INSTRUCOES[complexidade] || COMPLEXIDADE_INSTRUCOES.medio;
    const instTamanho = TAMANHO_INSTRUCOES[tamanho] || TAMANHO_INSTRUCOES.media;

    return `Você é um professor experiente criando uma questão objetiva de múltipla escolha para o ensino médio público.

Contexto:
- Matéria: ${materia}
- Descritor/habilidade: ${descritor}
- Turma: ${turma}
- ${instComplexidade}
- ${instTamanho}${extra}

IMPORTANTE - Definição dos campos:
- **suporte**: É o CONTEÚDO em si que o aluno usa para responder. Deve ser o material completo: o recado, a carta, o trecho de jornal, a fórmula, a tabela, o gráfico (descrito em texto), a notícia, a charge descrita, etc. Exemplo: se for sobre gênero textual "recado", o suporte é o texto do recado em si (ex.: "Oi, pessoal! Preciso do livro X. Obrigado!"). NÃO é uma descrição do tipo "um recado deixado no mural"; é o recado completo.
- **enunciado**: É a frase (ou frases) que APRESENTA a questão e faz referência ao suporte, sem repetir o conteúdo do suporte. Ex.: "O texto a seguir foi deixado por um estudante no mural da escola. Com base nele, responda à questão." ou "A fórmula abaixo representa... Com base nela, assinale..."
- **comando**: O que o aluno deve fazer. Ex.: "Assinale a alternativa que identifica o gênero textual do suporte." ou "Assinale a alternativa correta."

Gere uma questão com EXATAMENTE a estrutura abaixo. Responda APENAS com um bloco JSON válido, sem texto antes ou depois.

Estrutura obrigatória do JSON (todos os campos são obrigatórios):
{
  "suporte": "O MATERIAL COMPLETO que o aluno lê para responder: o recado, a carta, o trecho, a fórmula, a tabela em texto, etc. Cole aqui o conteúdo real, não uma descrição.",
  "enunciado": "Frase(s) que apresentam a questão e referenciam o suporte (ex.: O texto acima é... Com base nele...)",
  "comando": "O que o aluno deve fazer (ex.: Assinale a alternativa que...)",
  "alternativas": {
    "A": "texto da alternativa A",
    "B": "texto da alternativa B",
    "C": "texto da alternativa C",
    "D": "texto da alternativa D",
    "E": "texto da alternativa E"
  },
  "gabarito": "uma única letra: A, B, C, D ou E",
  "avaliacaoAlternativas": {
    "A": "Uma frase explicando: se A é a correta, por que está certa; se não, por que o aluno erra ao marcar A",
    "B": "Uma frase explicando por que B está certa ou por que está errada",
    "C": "Uma frase explicando por que C está certa ou por que está errada",
    "D": "Uma frase explicando por que D está certa ou por que está errada",
    "E": "Uma frase explicando por que E está certa ou por que está errada"
  }
}

Regras: (1) Respeite a complexidade e o tamanho pedidos acima. (2) suporte = conteúdo real (recado, carta, trecho, fórmula); enunciado = texto que apresenta e referencia o suporte. (3) Preencha TODAS as chaves de avaliacaoAlternativas com uma explicação para cada letra (mais breve se questão curta/fácil, um pouco mais desenvolvida se longa/difícil). (4) Apenas uma alternativa correta; gabarito uma letra maiúscula; linguagem adequada ao ensino médio.`;
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
    const tamanho = payload.tamanho || 'media';
    const maxTokens = tamanho === 'longa' ? 4500 : 3000;
    const result = await llmService.executePrompt(prompt, {
        model: 'base',
        maxTokens,
        temperature: 0.6,
        systemPrompt: 'Você é um assistente especializado em gerar questões objetivas em JSON válido. Gera questões curtas, médias ou longas e de complexidade fácil, média ou difícil conforme solicitado. Respeite sempre a estrutura JSON pedida e não inclua markdown ou texto fora do JSON.'
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
    const avaliacaoAlternativas = normalizeAvaliacao(getAvaliacaoAlternativas(parsed));

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
