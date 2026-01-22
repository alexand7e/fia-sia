/**
 * DOM Elements - Main application containers and controls
 */
const contentDiv = document.getElementById('content');
const navTabs = document.querySelectorAll('.nav-btn');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const roadmapDiv = document.getElementById('roadmap');
let chatTimers = [];

/**
 * Initialize Application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Load methodology by default
    loadMethodology();
    
    // Tab switching logic (Methodology vs Prompts)
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

/**
 * Marked.js Configuration
 * Customizes code block rendering with Highlight.js
 */
marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
});

/**
 * Utility Functions
 */

// Fetches raw text (Markdown) from a given path
async function fetchText(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Falha ao carregar: ${path}`);
    }
    return await response.text();
}

// Escapes HTML special characters for safe rendering
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Normalizes strings for use as IDs
function safeId(id) {
    return String(id || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Clears all active typing simulation timers
function clearChatTimers() {
    chatTimers.forEach((id) => clearTimeout(id));
    chatTimers = [];
}

// Adds 'Copy' button to all <pre> blocks in a container
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
            // Get text from code tag specifically to avoid copying the button text
            const codeEl = pre.querySelector('code');
            const textToCopy = codeEl ? codeEl.innerText : pre.innerText;
            copyToClipboard(btn, textToCopy);
        });
        pre.appendChild(btn);
    });
}

/**
 * Methodology Module
 * Loads and renders the step-by-step framework
 */
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
                
                // Load sub-sections if they exist
                const subSections = section.sub_sections 
                    ? await Promise.all(section.sub_sections.map(async (sub) => ({
                        ...sub,
                        body: marked.parse(await fetchText(sub.markdown_path))
                    })))
                    : null;

                return {
                    id: safeId(section.id),
                    title: section.title ? String(section.title) : '',
                    body: marked.parse(markdown),
                    subSections
                };
            })
        );

        const sectionMap = new Map(sections.map((section) => [section.id, section]));

        contentDiv.innerHTML = '<div id="methodology-content" class="markdown-body fade-in"></div>';
        const methodologyContent = document.getElementById('methodology-content');

        const setActiveStep = (stepId, subStepId = null) => {
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
            let contentHtml = `<div class="section mb-8">${title}`;
            
            // Add sub-navigation if sub-sections exist
            if (section.subSections) {
                const subNav = `<div class="sub-nav">
                    ${section.subSections.map(sub => `
                        <button class="sub-btn ${subStepId === sub.id ? 'active' : ''}" 
                                onclick="window.setSubSection('${section.id}', '${sub.id}')">
                            ${escapeHtml(sub.label)}
                        </button>
                    `).join('')}
                </div>`;
                
                const activeSub = subStepId 
                    ? section.subSections.find(s => s.id === subStepId)
                    : null;
                
                contentHtml += subNav;
                if (activeSub) {
                    contentHtml += `<div class="sub-section-content fade-in">${activeSub.body}</div>`;
                } else {
                    contentHtml += `<div class="sub-section-content">${section.body}</div>`;
                }
            } else {
                contentHtml += section.body;
            }
            
            contentHtml += `</div>`;
            methodologyContent.innerHTML = contentHtml;

            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            addCodeCopyButtons(methodologyContent);
            initExamplesSimulation();
            initPromptCustomizers(methodologyContent);
        };

        // Global function for sub-section switching
        window.setSubSection = (sectionId, subId) => {
            setActiveStep(sectionId, subId);
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

/**
 * Prompt Customizer Module
 * Finds placeholders like [TEMA] in code blocks and adds input fields
 */
function initPromptCustomizers(container) {
    if (!container) return;
    
    const codeBlocks = container.querySelectorAll('pre');
    codeBlocks.forEach((pre, index) => {
        const text = pre.innerText;
        // Regex to find [PLACEHOLDER] - matches [ followed by uppercase/numbers/underscore and ]
        const placeholders = [...new Set(text.match(/\[[A-Z0-9_]+\]/g))];
        
        if (placeholders.length > 0) {
            const customizerId = `customizer-${index}`;
            const customizer = document.createElement('div');
            customizer.className = 'prompt-customizer fade-in';
            customizer.id = customizerId;
            
            let fieldsHtml = placeholders.map(p => {
                const label = p.replace(/[\[\]]/g, '').toLowerCase().replace(/_/g, ' ');
                const cleanId = safeId(p);
                return `
                    <div class="placeholder-field">
                        <label for="${customizerId}-${cleanId}">${label}</label>
                        <input type="text" id="${customizerId}-${cleanId}" 
                               data-placeholder="${p}" 
                               placeholder="Ex: ${label}..." />
                    </div>
                `;
            }).join('');

            customizer.innerHTML = `
                <div class="customizer-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Personalizar Prompt
                </div>
                <div class="placeholder-grid">${fieldsHtml}</div>
            `;
            
            pre.parentNode.insertBefore(customizer, pre);
            
            // Store the original template on the pre element
            pre.dataset.originalTemplate = text;
            
            // Add listeners to all inputs in this customizer
            const inputs = customizer.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    let updatedText = pre.dataset.originalTemplate;
                    inputs.forEach(i => {
                        const val = i.value.trim();
                        if (val) {
                            // Escape regex special chars if needed, but [TEMA] is simple
                            const regex = new RegExp(i.dataset.placeholder.replace(/[\[\]]/g, '\\$&'), 'g');
                            updatedText = updatedText.replace(regex, val);
                        }
                    });
                    
                    // Update the code block display
                    const codeEl = pre.querySelector('code');
                    if (codeEl) {
                        codeEl.textContent = updatedText;
                        hljs.highlightElement(codeEl);
                    } else {
                        pre.firstChild.textContent = updatedText;
                    }
                });
            });
        }
    });
}

const chatScenarios = {
    linguagens: {
        title: 'Linguagens',
        messages: [
            { role: 'user', text: 'Crie um roteiro de debate sobre literatura para 2º ano do EM.' },
            { role: 'assistant', type: 'typing', duration: 800 },
            { role: 'assistant', text: 'Aqui está um roteiro geral sobre clássicos da literatura brasileira com 5 perguntas.' },
            { role: 'user', text: 'Está muito genérico. Refaça focando em Literatura Piauiense (ex: Da Costa e Silva) e use o modelo de Estudo de Caso.' },
            { role: 'assistant', type: 'typing', duration: 1000 },
            { role: 'assistant', text: 'Excelente escolha. Reformulei o roteiro como um Estudo de Caso sobre a obra "Zodíaco" de Da Costa e Silva, com conexões com a paisagem de Amarante.' },
            { role: 'user', text: 'Ótimo. Agora adicione 3 perguntas de nível "Analisar" da Taxonomia de Bloom e uma rubrica para avaliar a participação.' },
            { role: 'assistant', type: 'typing', duration: 900 },
            { role: 'assistant', type: 'file', fileName: 'Roteiro_Literatura_PI_EstudoCaso.pdf', fileNote: 'Roteiro + Bloom + Rubrica inclusos.' }
        ]
    },
    ciencias: {
        title: 'Ciências',
        messages: [
            { role: 'user', text: 'Monte uma aula sobre o Semiárido.' },
            { role: 'assistant', type: 'typing', duration: 800 },
            { role: 'assistant', text: 'Plano de aula sobre clima semiárido, vegetação de caatinga e índices pluviométricos.' },
            { role: 'user', text: 'Adapte para Ciências da Natureza (BNCC EM13CNT203). Use o modelo PBL com o problema: "Como otimizar o uso de cisternas em períodos de seca no Piauí?"' },
            { role: 'assistant', type: 'typing', duration: 1100 },
            { role: 'assistant', text: 'Plano PBL estruturado. O desafio agora envolve física (pressão hidrostática) e biologia (contaminação da água).' },
            { role: 'user', text: 'Ficou muito complexo para o 1º ano. Simplifique a linguagem e foque em materiais recicláveis para o protótipo.' },
            { role: 'assistant', type: 'typing', duration: 900 },
            { role: 'assistant', type: 'file', fileName: 'Plano_PBL_Cisternas_PI.pdf', fileNote: 'Versão simplificada para 1º ano com prototipagem de baixo custo.' }
        ]
    },
    matematica: {
        title: 'Matemática',
        messages: [
            { role: 'user', text: 'Crie exercícios de porcentagem.' },
            { role: 'assistant', type: 'typing', duration: 800 },
            { role: 'assistant', text: 'Lista com 10 exercícios padrão de cálculo de porcentagem, descontos e juros simples.' },
            { role: 'user', text: 'Quero algo mais prático. Use o contexto da agricultura no sul do Piauí (soja e milho). Crie 6 questões contextualizadas.' },
            { role: 'assistant', type: 'typing', duration: 1000 },
            { role: 'assistant', text: 'Exercícios criados! Agora as questões envolvem rendimento por hectare, perdas na safra e taxas de exportação no porto de Luís Correia.' },
            { role: 'user', text: 'Excelente. Entregue um gabarito comentado passo a passo para que os alunos possam se autocorrigir.' },
            { role: 'assistant', type: 'typing', duration: 900 },
            { role: 'assistant', type: 'file', fileName: 'Exercicios_Matematica_Agro_PI.pdf', fileNote: 'Questões contextualizadas + Gabarito comentado.' }
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
        
        file.innerHTML = `
            <div class="chat-file-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
            </div>
            <div class="chat-file-info">
                <div class="chat-file-name">${message.fileName || 'Arquivo gerado'}</div>
                <div class="chat-file-meta">${message.fileNote || 'Pronto para download.'}</div>
            </div>
        `;
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

/**
 * Prompts Module
 * Loads and renders the prompt library with search and workspace features
 */
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
