import { escapeHtml } from '../utils/text.js';
import { copyWithFeedback } from '../utils/clipboard.js';

export async function loadPrompts({
    contentDiv,
    pageTitle,
    pageSubtitle,
    roadmapDiv,
    addMyPrompt,
    promptIdentity,
    readMyPrompts
}) {
    try {
        contentDiv.innerHTML = '<div class="text-center">Carregando prompts...</div>';
        const response = await fetch('data/prompts.json');
        const prompts = await response.json();
        const promptLibrary = Array.isArray(prompts) ? prompts : [];
        const savedPrompts = readMyPrompts();
        const savedSet = new Set(savedPrompts.map(promptIdentity));

        if (pageTitle) pageTitle.textContent = 'Banco de Prompts';
        if (pageSubtitle) pageSubtitle.textContent = 'Modelos prontos para aplicação imediata';
        if (roadmapDiv) {
            roadmapDiv.innerHTML = '';
            roadmapDiv.style.display = 'none';
        }

        const methods = Array.from(
            new Set((promptLibrary || []).map(p => p && p.methodology).filter(Boolean))
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
                const identity = promptIdentity({ title: prompt.title, template: prompt.template });
                const alreadySaved = savedSet.has(identity);
                const saveLabel = alreadySaved ? 'Salvo' : 'Salvar';
                const saveDisabled = alreadySaved ? 'disabled' : '';

                return `
                    <div class="prompt-item fade-in" style="animation-delay: ${index * 0.04}s">
                        <div class="prompt-header">
                            <div>
                                <h3 class="prompt-title">${title}</h3>
                                ${tagsHtml}
                                <p class="prompt-desc">${description}</p>
                            </div>
                            <div class="prompt-actions-inline">
                                <button class="prompt-btn" data-action="copy" data-index="${index}">Copiar</button>
                                <button class="prompt-btn" data-action="paste" data-index="${index}">Colar</button>
                                <button class="prompt-btn" data-action="save" data-index="${index}" ${saveDisabled}>${saveLabel}</button>
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
            return (promptLibrary || []).filter(p => {
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

        const handleListAction = (event) => {
            const btn = event.target.closest('button[data-action]');
            if (!btn) return;
            const index = Number(btn.dataset.index);
            const prompt = promptLibrary[index];
            if (!prompt) return;

            if (btn.dataset.action === 'copy') {
                copyWithFeedback(btn, prompt.template || '');
            }
            if (btn.dataset.action === 'paste') {
                workspace.value = workspace.value ? `${workspace.value}\n\n${prompt.template}` : prompt.template;
                workspace.focus();
            }
            if (btn.dataset.action === 'save') {
                const result = addMyPrompt({
                    title: prompt.title,
                    description: prompt.description,
                    template: prompt.template,
                    methodology: prompt.methodology,
                    tags: prompt.tags,
                    tips: prompt.tips,
                    expected_output: prompt.expected_output,
                    source: 'library'
                });
                if (result.added) {
                    btn.textContent = 'Salvo';
                    btn.setAttribute('disabled', 'disabled');
                    savedSet.add(promptIdentity({ title: prompt.title, template: prompt.template }));
                }
            }
        };

        if (searchInput) searchInput.addEventListener('input', update);
        if (methodSelect) methodSelect.addEventListener('change', update);
        update();

        if (listEl) listEl.addEventListener('click', handleListAction);

        if (workspaceClear && workspace) {
            workspaceClear.addEventListener('click', () => {
                workspace.value = '';
                workspace.focus();
            });
        }

        if (workspaceCopy && workspace) {
            workspaceCopy.addEventListener('click', () => {
                copyWithFeedback(workspaceCopy, workspace.value || '');
            });
        }

    } catch (error) {
        console.error('Error loading prompts:', error);
        contentDiv.innerHTML = '<p class="error">Erro ao carregar prompts.</p>';
    }
}
