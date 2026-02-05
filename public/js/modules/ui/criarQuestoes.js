/**
 * Criar Questões page: form, API call, and question card rendering
 */
import deviceFingerprint from '../utils/deviceFingerprint.js';
import rateLimitTracker from '../utils/rateLimitTracker.js';
import llmClient from '../services/llm-client.js';

let questaoData = { materias: [], descritores: {}, turmasSugeridas: [] };
let lastQuestaoJson = null;

/**
 * Load questoes.json and populate form
 */
async function loadQuestoesData() {
    try {
        const response = await fetch('data/questoes.json');
        if (!response.ok) throw new Error('Falha ao carregar dados');
        questaoData = await response.json();
        return questaoData;
    } catch (e) {
        console.error('Error loading questoes.json:', e);
        return null;
    }
}

function getMateriaNome(id) {
    const m = questaoData.materias.find((x) => x.id === id);
    return m ? m.nome : id || 'Selecione a matéria...';
}

function getDescritorTexto(materiaId, descritorId) {
    const list = questaoData.descritores[materiaId];
    if (!list) return 'Selecione o descritor...';
    const d = list.find((x) => x.id === descritorId);
    return d ? d.texto : descritorId || 'Selecione o descritor...';
}

function renderQuestaoCard(questao) {
    const alt = questao.alternativas || {};
    const gabarito = (questao.gabarito || '').toUpperCase().trim();
    const avaliacao = questao.avaliacaoAlternativas || {};
    const letters = ['A', 'B', 'C', 'D', 'E'];

    let html = '';

    if (questao.suporte) {
        html += `
            <div class="questao-card-section">
                <h4 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Suporte</h4>
                <div class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">${escapeHtml(questao.suporte)}</div>
            </div>`;
    }

    if (questao.enunciado) {
        html += `
            <div class="questao-card-section">
                <h4 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Enunciado</h4>
                <div class="text-slate-800 dark:text-slate-200">${escapeHtml(questao.enunciado)}</div>
            </div>`;
    }

    if (questao.comando) {
        html += `
            <div class="questao-card-section">
                <h4 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Comando</h4>
                <div class="text-slate-700 dark:text-slate-300 font-medium">${escapeHtml(questao.comando)}</div>
            </div>`;
    }

    html += `<div class="questao-card-section"><h4 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Alternativas</h4><div class="space-y-2">`;
    letters.forEach((letra) => {
        const texto = alt[letra] || '(não definida)';
        const isCorreta = letra === gabarito;
        html += `<div class="questao-alternativa ${isCorreta ? 'correta' : ''}"><strong>${letra})</strong> ${escapeHtml(texto)}</div>`;
    });
    html += `</div></div>`;

    if (gabarito) {
        html += `
            <div class="questao-card-section">
                <h4 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Gabarito</h4>
                <p class="text-lg font-bold text-green-600 dark:text-green-400">${escapeHtml(gabarito)}</p>
            </div>`;
    }

    if (Object.keys(avaliacao).length > 0) {
        html += `<div class="questao-card-section"><h4 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Avaliação das alternativas</h4><div class="space-y-1">`;
        letters.forEach((letra) => {
            const texto = avaliacao[letra] || '';
            if (!texto) return;
            html += `<div class="questao-avaliacao-item"><strong>${letra}:</strong> ${escapeHtml(texto)}</div>`;
        });
        html += `</div></div>`;
    }

    return html;
}

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showPlaceholder() {
    document.getElementById('questao-result-placeholder').classList.remove('hidden');
    document.getElementById('questao-result-card').classList.add('hidden');
    document.getElementById('questao-result-card').innerHTML = '';
    document.getElementById('questao-result-loading').classList.add('hidden');
    document.getElementById('questao-result-error').classList.add('hidden');
    document.getElementById('questao-result-actions').classList.add('hidden');
}

function showLoading() {
    document.getElementById('questao-result-placeholder').classList.add('hidden');
    document.getElementById('questao-result-card').classList.add('hidden');
    document.getElementById('questao-result-card').innerHTML = '';
    document.getElementById('questao-result-loading').classList.remove('hidden');
    document.getElementById('questao-result-error').classList.add('hidden');
    document.getElementById('questao-result-actions').classList.add('hidden');
}

function showError(message) {
    document.getElementById('questao-result-placeholder').classList.add('hidden');
    document.getElementById('questao-result-card').classList.add('hidden');
    document.getElementById('questao-result-loading').classList.add('hidden');
    const errEl = document.getElementById('questao-result-error');
    errEl.textContent = message;
    errEl.classList.remove('hidden');
    document.getElementById('questao-result-actions').classList.add('hidden');
}

function showCard(questao) {
    lastQuestaoJson = questao;
    document.getElementById('questao-result-placeholder').classList.add('hidden');
    document.getElementById('questao-result-loading').classList.add('hidden');
    document.getElementById('questao-result-error').classList.add('hidden');
    const cardEl = document.getElementById('questao-result-card');
    cardEl.innerHTML = renderQuestaoCard(questao);
    cardEl.classList.remove('hidden');
    document.getElementById('questao-result-actions').classList.remove('hidden');
}

async function callGerarQuestao(payload) {
    const fingerprint = await deviceFingerprint.getFingerprint();
    const requireRecaptcha = rateLimitTracker.isFirstRequestOfDay();
    const body = { ...payload };

    if (requireRecaptcha && llmClient.recaptchaSiteKey) {
        try {
            body.recaptchaToken = await llmClient.getRecaptchaToken();
        } catch (e) {
            throw new Error(`Falha de Segurança: ${e.message}`);
        }
    }

    const response = await fetch(`${window.location.origin}/api/gerar-questao`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Device-Fingerprint': fingerprint
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao gerar questão');
    }

    rateLimitTracker.increment();
    if (data.rateLimit) {
        rateLimitTracker.syncWithServer(data.rateLimit);
    }

    return data.data;
}

function setupMateriaDescritor() {
    const materiaSelect = document.getElementById('questao-materia');
    const descritorSelect = document.getElementById('questao-descritor');
    if (!materiaSelect || !descritorSelect) return;

    materiaSelect.addEventListener('change', () => {
        const materiaId = materiaSelect.value;
        const list = questaoData.descritores[materiaId] || [];
        descritorSelect.innerHTML = '<option value="">Selecione...</option>';
        list.forEach((d) => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.texto;
            descritorSelect.appendChild(opt);
        });
        descritorSelect.disabled = !materiaId;
    });
}

function copyQuestao() {
    if (!lastQuestaoJson) return;
    const lines = [];
    if (lastQuestaoJson.suporte) lines.push('Suporte:\n' + lastQuestaoJson.suporte + '\n');
    if (lastQuestaoJson.enunciado) lines.push('Enunciado:\n' + lastQuestaoJson.enunciado + '\n');
    if (lastQuestaoJson.comando) lines.push('Comando: ' + lastQuestaoJson.comando + '\n');
    const alt = lastQuestaoJson.alternativas || {};
    ['A', 'B', 'C', 'D', 'E'].forEach((l) => {
        if (alt[l]) lines.push(l + ') ' + alt[l]);
    });
    lines.push('\nGabarito: ' + (lastQuestaoJson.gabarito || ''));
    const av = lastQuestaoJson.avaliacaoAlternativas || {};
    Object.keys(av).forEach((l) => {
        lines.push(l + ': ' + av[l]);
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        const btn = document.getElementById('questao-copiar');
        const icon = btn.querySelector('.material-symbols-outlined');
        const prev = icon.textContent;
        icon.textContent = 'check';
        setTimeout(() => { icon.textContent = prev; }, 2000);
    });
}

function downloadQuestao() {
    if (!lastQuestaoJson) return;
    const text = JSON.stringify(lastQuestaoJson, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questao-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function initCriarQuestoes() {
    const materiaSelect = document.getElementById('questao-materia');
    const descritorSelect = document.getElementById('questao-descritor');
    const turmaSelect = document.getElementById('questao-turma');
    const btnGerar = document.getElementById('questao-gerar');
    const btnLimpar = document.getElementById('questao-limpar');
    const btnCopiar = document.getElementById('questao-copiar');
    const btnDownload = document.getElementById('questao-download');

    if (!materiaSelect || !btnGerar) return;

    loadQuestoesData().then((data) => {
        if (!data) return;
        materiaSelect.innerHTML = '<option value="">Selecione...</option>';
        data.materias.forEach((m) => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.nome;
            materiaSelect.appendChild(opt);
        });
        turmaSelect.innerHTML = '<option value="">Selecione...</option>';
        (data.turmasSugeridas || []).forEach((t) => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            turmaSelect.appendChild(opt);
        });
    });

    setupMateriaDescritor();

    btnGerar.addEventListener('click', async () => {
        const materia = document.getElementById('questao-materia').value;
        const descritor = document.getElementById('questao-descritor').value;
        const turma = document.getElementById('questao-turma').value;
        const infoAdicional = document.getElementById('questao-info-adicional').value.trim();

        if (!materia || !descritor || !turma) {
            showError('Preencha Matéria, Descritor e Turma.');
            return;
        }

        if (!rateLimitTracker.canMakeRequest()) {
            const st = rateLimitTracker.getStatus();
            showError(`Limite diário atingido. Tente após ${new Date(st.resetAt).toLocaleString('pt-BR')}`);
            return;
        }

        showLoading();
        try {
            const questao = await callGerarQuestao({
                materia: getMateriaNome(materia),
                descritor: getDescritorTexto(materia, descritor),
                turma,
                infoAdicional: infoAdicional || undefined
            });
            showCard(questao);
        } catch (e) {
            showError(e.message || 'Erro ao gerar questão.');
        }
    });

    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            const materiaEl = document.getElementById('questao-materia');
            const descritorEl = document.getElementById('questao-descritor');
            if (materiaEl) materiaEl.value = '';
            if (descritorEl) {
                descritorEl.innerHTML = '<option value="">Primeiro selecione a matéria</option>';
                descritorEl.disabled = true;
            }
            const turmaEl = document.getElementById('questao-turma');
            const infoEl = document.getElementById('questao-info-adicional');
            if (turmaEl) turmaEl.value = '';
            if (infoEl) infoEl.value = '';
            showPlaceholder();
            lastQuestaoJson = null;
        });
    }

    if (btnCopiar) btnCopiar.addEventListener('click', copyQuestao);
    if (btnDownload) btnDownload.addEventListener('click', downloadQuestao);
}
