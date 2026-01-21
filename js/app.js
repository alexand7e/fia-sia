// DOM Elements
const contentDiv = document.getElementById('content');
const navTabs = document.querySelectorAll('.nav-btn');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const roadmapDiv = document.getElementById('roadmap');
let chatTimers = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check which tab is active, default to methodology
    loadMethodology();
    
    // Setup tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            navTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            const target = e.target.dataset.tab;
            if (target === 'methodology') {
                loadMethodology();
            } else if (target === 'prompts') {
                loadPrompts();
            }
        });
    });
});

// Configure marked
marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
});

async function fetchText(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Falha ao carregar: ${path}`);
    }
    return await response.text();
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeId(id) {
    return String(id || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function clearChatTimers() {
    chatTimers.forEach((id) => clearTimeout(id));
    chatTimers = [];
}

function addCodeCopyButtons(container) {
    if (!container) return;
    const blocks = container.querySelectorAll('pre');
    blocks.forEach((pre) => {
        if (pre.querySelector('.code-copy-btn')) return;
        const btn = document.createElement('button');
        btn.className = 'code-copy-btn';
        btn.type = 'button';
        btn.textContent = 'Copiar';
        btn.addEventListener('click', () => {
            copyToClipboard(btn, pre.innerText || '');
        });
        pre.appendChild(btn);
    });
}

async function loadMethodology() {
    try {
        clearChatTimers();
        contentDiv.innerHTML = '<div class="text-center">Carregando...</div>';
        const response = await fetch('data/methodology.json');
        const data = await response.json();
        
        // Update Header
        pageTitle.textContent = data.title;
        pageSubtitle.textContent = data.subtitle || 'Framework Educacional';

        const roadmapSteps = Array.isArray(data.roadmap) && data.roadmap.length > 0
            ? data.roadmap
            : [
                { id: 'contextualizar', label: 'Contextualizar', sectionId: 'visao-geral' },
                { id: 'especificar', label: 'Especificar', sectionId: 'como-usar' },
                { id: 'estruturar', label: 'Estruturar', sectionId: 'templates' },
                { id: 'validar', label: 'Validar', sectionId: 'validacao' },
                { id: 'iterar', label: 'Iterar', sectionId: 'exemplos' }
            ];

        if (roadmapDiv) {
            roadmapDiv.style.display = '';
            roadmapDiv.innerHTML = roadmapSteps.map((step) => `
                <button class="roadmap-step" data-step="${escapeHtml(step.id)}" type="button">
                    <span class="roadmap-dot"></span>${escapeHtml(step.label)}
                </button>
            `).join('');
        }

        const sections = await Promise.all(
            (data.sections || []).map(async (section) => {
                const markdown = section.markdown_path
                    ? await fetchText(section.markdown_path)
                    : (section.content || '');
                return {
                    id: safeId(section.id),
                    title: section.title ? String(section.title) : '',
                    body: marked.parse(markdown)
                };
            })
        );

        const sectionMap = new Map(sections.map((section) => [section.id, section]));

        contentDiv.innerHTML = '<div id="methodology-content" class="markdown-body fade-in"></div>';
        const methodologyContent = document.getElementById('methodology-content');

        const setActiveStep = (stepId) => {
            clearChatTimers();
            const normalized = safeId(stepId);
            const step = roadmapSteps.find((item) => safeId(item.id) === normalized);
            const targetSectionId = safeId(step && step.sectionId ? step.sectionId : normalized);
            const section = sectionMap.get(targetSectionId);

            document.querySelectorAll('.roadmap-step').forEach((btn) => {
                btn.classList.toggle('is-active', safeId(btn.dataset.step) === normalized);
            });

            if (!methodologyContent) return;

            if (!section) {
                methodologyContent.innerHTML = '<div class="section"><p class="error">Seção não encontrada.</p></div>';
                return;
            }

            const title = section.title ? `<h2>${escapeHtml(section.title)}</h2>` : '';
            methodologyContent.innerHTML = `<div class="section mb-8">${title}${section.body}</div>`;

            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            addCodeCopyButtons(methodologyContent);
            initExamplesSimulation();
        };

        document.querySelectorAll('.roadmap-step').forEach((btn) => {
            btn.addEventListener('click', () => setActiveStep(btn.dataset.step));
        });

        if (roadmapSteps.length > 0) {
            setActiveStep(roadmapSteps[0].id);
        }

    } catch (error) {
        console.error('Error loading methodology:', error);
        contentDiv.innerHTML = '<p class="error">Erro ao carregar metodologia.</p>';
    }
}

const chatScenarios = {
    linguagens: {
        title: 'Linguagens',
        messages: [
            { role: 'user', text: 'Crie um roteiro de debate sobre diversidade cultural para 2º ano do EM, com linguagem acessível.' },
            { role: 'assistant', type: 'typing', duration: 800 },
            { role: 'assistant', text: 'Aqui está um roteiro com objetivos, passos do debate e critérios de participação.' },
            { role: 'user', text: 'Inclua exemplos do Piauí e reduza para 50 minutos.' },
            { role: 'assistant', type: 'typing', duration: 700 },
            { role: 'assistant', text: 'Atualizei o roteiro com exemplos locais e cronograma em 50 minutos.' },
            { role: 'user', text: 'Gere o arquivo final com roteiro + rubrica simplificada.' },
            { role: 'assistant', type: 'typing', duration: 900 },
            { role: 'assistant', type: 'file', fileName: 'Roteiro_Debate_Linguagens.pdf', fileNote: 'Roteiro e rubrica prontos para impressão.' }
        ]
    },
    ciencias: {
        title: 'Ciências',
        messages: [
            { role: 'user', text: 'Monte um plano de aula investigativa sobre água potável para 1º ano do EM.' },
            { role: 'assistant', type: 'typing', duration: 800 },
            { role: 'assistant', text: 'Plano inicial com perguntas-guias, atividade prática e avaliação formativa.' },
            { role: 'user', text: 'Adapte para aula sem laboratório e com materiais simples.' },
            { role: 'assistant', type: 'typing', duration: 700 },
            { role: 'assistant', text: 'Incluí experimento com filtro caseiro e coleta de dados em sala.' },
            { role: 'user', text: 'Crie um checklist de segurança e um resumo em 1 página.' },
            { role: 'assistant', type: 'typing', duration: 900 },
            { role: 'assistant', type: 'file', fileName: 'Plano_Aula_Ciencias.pdf', fileNote: 'Plano + checklist prontos para uso.' }
        ]
    },
    matematica: {
        title: 'Matemática',
        messages: [
            { role: 'user', text: 'Crie uma sequência didática sobre porcentagem com situações do cotidiano.' },
            { role: 'assistant', type: 'typing', duration: 800 },
            { role: 'assistant', text: 'Sequência com objetivos, exemplos e prática guiada.' },
            { role: 'user', text: 'Inclua 6 exercícios com níveis fácil/médio/difícil.' },
            { role: 'assistant', type: 'typing', duration: 700 },
            { role: 'assistant', text: 'Adicionei exercícios graduados e gabarito comentado curto.' },
            { role: 'user', text: 'Entregue a versão final pronta para imprimir.' },
            { role: 'assistant', type: 'typing', duration: 900 },
            { role: 'assistant', type: 'file', fileName: 'Sequencia_Porcentagem.pdf', fileNote: 'Versão final em PDF.' }
        ]
    }
};

function createChatBubble(message) {
    const bubble = document.createElement('div');
    const roleClass = message.role === 'user' ? 'is-user' : 'is-bot';
    bubble.className = `chat-bubble ${roleClass}`;

    if (message.type === 'typing') {
        bubble.classList.add('is-typing');
        bubble.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        return bubble;
    }

    if (message.type === 'file') {
        const file = document.createElement('div');
        file.className = 'chat-file';
        const name = document.createElement('div');
        name.className = 'chat-file-name';
        name.textContent = message.fileName || 'Arquivo gerado';
        const meta = document.createElement('div');
        meta.className = 'chat-file-meta';
        meta.textContent = message.fileNote || 'Pronto para download.';
        file.appendChild(name);
        file.appendChild(meta);
        bubble.appendChild(file);
        return bubble;
    }

    bubble.textContent = message.text || '';
    return bubble;
}

function runChatAnimation(container, scenarioKey) {
    const scenario = chatScenarios[scenarioKey];
    if (!scenario || !container) return;
    clearChatTimers();
    container.innerHTML = '';

    let delay = 200;
    scenario.messages.forEach((message) => {
        const showMessage = () => {
            const bubble = createChatBubble(message);
            container.appendChild(bubble);
            requestAnimationFrame(() => bubble.classList.add('is-visible'));
            container.scrollTop = container.scrollHeight;

            if (message.type === 'typing') {
                const removeId = setTimeout(() => bubble.remove(), message.duration || 800);
                chatTimers.push(removeId);
            }
        };

        chatTimers.push(setTimeout(showMessage, delay));
        delay += message.duration || 1100;
    });
}

function initExamplesSimulation() {
    const simulator = document.getElementById('examples-simulator');
    if (!simulator) return;
    const buttons = simulator.querySelectorAll('.chat-btn');
    const stream = simulator.querySelector('.chat-stream');
    if (!stream || !buttons.length) return;

    const setScenario = (key) => {
        buttons.forEach((btn) => btn.classList.toggle('active', btn.dataset.scenario === key));
        runChatAnimation(stream, key);
    };

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => setScenario(btn.dataset.scenario));
    });

    const activeButton = simulator.querySelector('.chat-btn.active') || buttons[0];
    setScenario(activeButton.dataset.scenario);
}

async function loadPrompts() {
    try {
        clearChatTimers();
        contentDiv.innerHTML = '<div class="text-center">Carregando prompts...</div>';
        const response = await fetch('data/prompts.json');
        const prompts = await response.json();
        
        pageTitle.textContent = 'Banco de Prompts';
        pageSubtitle.textContent = 'Modelos prontos para aplicação imediata';
        if (roadmapDiv) {
            roadmapDiv.innerHTML = '';
            roadmapDiv.style.display = 'none';
        }
        
        const methods = Array.from(
            new Set((prompts || []).map(p => p && p.methodology).filter(Boolean))
        ).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
        const methodOptions = methods
            .map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`)
            .join('');

        contentDiv.innerHTML = `
            <div class="prompts-toolbar fade-in">
                <input id="prompt-search" class="search-input" type="search" placeholder="Buscar (título, descrição, tags)" aria-label="Buscar prompts" />
                <select id="prompt-method" class="select-input" aria-label="Filtrar por metodologia">
                    <option value="">Todas as metodologias</option>
                    ${methodOptions}
                </select>
            </div>
            <div class="prompt-workspace fade-in">
                <label for="prompt-workspace">Área de trabalho</label>
                <textarea id="prompt-workspace" placeholder="Cole e ajuste os prompts aqui antes de usar."></textarea>
                <div class="workspace-actions">
                    <button class="workspace-btn" id="workspace-clear" type="button">Limpar</button>
                    <button class="workspace-btn" id="workspace-copy" type="button">Copiar tudo</button>
                </div>
            </div>
            <div class="prompts-list" id="prompts-list"></div>
        `;

        const listEl = document.getElementById('prompts-list');
        const searchInput = document.getElementById('prompt-search');
        const methodSelect = document.getElementById('prompt-method');
        const workspace = document.getElementById('prompt-workspace');
        const workspaceClear = document.getElementById('workspace-clear');
        const workspaceCopy = document.getElementById('workspace-copy');

        const renderCards = (list) => {
            return (list || []).map((prompt, index) => {
                const template = prompt && prompt.template ? String(prompt.template) : '';
                const cleanTemplate = template.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const title = escapeHtml(prompt && prompt.title ? prompt.title : '');
                const description = escapeHtml(prompt && prompt.description ? prompt.description : '');
                const tips = escapeHtml(prompt && prompt.tips ? prompt.tips : '');
                const expected = escapeHtml(prompt && prompt.expected_output ? prompt.expected_output : '');
                const tags = Array.isArray(prompt && prompt.tags) ? prompt.tags : [];
                const tagsHtml = tags.length
                    ? `<div class="prompt-tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
                    : '';

                return `
                    <div class="prompt-item fade-in" style="animation-delay: ${index * 0.04}s">
                        <div class="prompt-header">
                            <div>
                                <h3 class="prompt-title">${title}</h3>
                                ${tagsHtml}
                                <p class="prompt-desc">${description}</p>
                            </div>
                            <div class="prompt-actions-inline">
                                <button class="prompt-btn" onclick="copyToClipboard(this, '${encodeURIComponent(template)}')">Copiar</button>
                                <button class="prompt-btn" onclick="pasteToWorkspace('${encodeURIComponent(template)}')">Colar</button>
                            </div>
                        </div>

                        <div class="prompt-content">
                            <pre class="prompt-code">${cleanTemplate}</pre>
                        </div>

                        <div class="prompt-meta">
                            <h4>Dica de uso</h4>
                            <p class="prompt-tips">${tips}</p>
                            <h4 style="margin-top: 1rem">Output esperado</h4>
                            <p class="prompt-tips">${expected}</p>
                        </div>
                    </div>
                `;
            }).join('');
        };

        const getFiltered = () => {
            const q = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
            const m = methodSelect && methodSelect.value ? methodSelect.value : '';
            return (prompts || []).filter(p => {
                if (!p) return false;
                if (m && String(p.methodology || '') !== m) return false;
                if (!q) return true;
                const hay = [
                    p.title,
                    p.description,
                    p.methodology,
                    Array.isArray(p.tags) ? p.tags.join(' ') : ''
                ].filter(Boolean).join(' ').toLowerCase();
                return hay.includes(q);
            });
        };

        const update = () => {
            if (!listEl) return;
            const filtered = getFiltered();
            listEl.innerHTML = renderCards(filtered);
        };

        if (searchInput) searchInput.addEventListener('input', update);
        if (methodSelect) methodSelect.addEventListener('change', update);
        update();

        if (workspaceClear && workspace) {
            workspaceClear.addEventListener('click', () => {
                workspace.value = '';
                workspace.focus();
            });
        }

        if (workspaceCopy && workspace) {
            workspaceCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(workspace.value || '').then(() => {
                    const originalText = workspaceCopy.textContent;
                    workspaceCopy.textContent = 'Copiado!';
                    setTimeout(() => {
                        workspaceCopy.textContent = originalText;
                    }, 2000);
                });
            });
        }
        
    } catch (error) {
        console.error('Error loading prompts:', error);
        contentDiv.innerHTML = '<p class="error">Erro ao carregar prompts.</p>';
    }
}

// Window scope for onclick handler
window.copyToClipboard = function(btn, text) {
    let decoded = text;
    try {
        decoded = decodeURIComponent(text);
    } catch (error) {
        decoded = text;
    }
    navigator.clipboard.writeText(decoded || '').then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.style.background = 'rgba(27, 154, 89, 0.92)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    });
};

window.pasteToWorkspace = function(text) {
    const workspace = document.getElementById('prompt-workspace');
    if (!workspace) return;
    const decoded = decodeURIComponent(text);
    workspace.value = workspace.value ? `${workspace.value}\n\n${decoded}` : decoded;
    workspace.focus();
};
