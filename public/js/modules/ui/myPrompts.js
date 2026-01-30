import { escapeHtml } from '../utils/text.js';
import { copyPlainText } from '../utils/clipboard.js';

const MY_PROMPTS_STORAGE_KEY = 'sia:my-prompts:v1';
const LEGACY_PROMPTS_STORAGE_KEY = 'myPrompts';
let myPromptsInitialized = false;
let myPromptsUI = null;

function migrateLegacyPrompts(currentItems) {
    try {
        const rawLegacy = localStorage.getItem(LEGACY_PROMPTS_STORAGE_KEY);
        const legacyParsed = rawLegacy ? JSON.parse(rawLegacy) : [];
        if (!Array.isArray(legacyParsed) || legacyParsed.length === 0) {
            return currentItems;
        }

        const merged = [...currentItems];
        legacyParsed.forEach(item => {
            const normalized = normalizePromptEntry(item, { source: item.source || 'legacy' });
            if (!findDuplicatePrompt(merged, normalized)) {
                merged.push(normalized);
            }
        });
        writeMyPrompts(merged);
        return merged;
    } catch (error) {
        console.error('Failed to migrate legacy prompts:', error);
        return currentItems;
    }
}

export function readMyPrompts() {
    try {
        const raw = localStorage.getItem(MY_PROMPTS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const items = Array.isArray(parsed) ? parsed : [];
        return migrateLegacyPrompts(items);
    } catch (error) {
        console.error('Failed to parse saved prompts:', error);
        return [];
    }
}

function writeMyPrompts(items) {
    localStorage.setItem(MY_PROMPTS_STORAGE_KEY, JSON.stringify(items || []));
}

function createPromptId() {
    return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePromptEntry(prompt, overrides = {}) {
    const now = new Date().toISOString();
    const tags = Array.isArray(prompt.tags)
        ? prompt.tags
        : String(prompt.tags || '')
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

    return {
        id: prompt.id || createPromptId(),
        title: String(prompt.title || '').trim(),
        description: String(prompt.description || '').trim(),
        template: String(prompt.template || '').trim(),
        methodology: String(prompt.methodology || '').trim(),
        tags,
        tips: String(prompt.tips || '').trim(),
        expected_output: String(prompt.expected_output || '').trim(),
        source: prompt.source || 'user',
        createdAt: prompt.createdAt || now,
        updatedAt: now,
        ...overrides
    };
}

export function promptIdentity(prompt) {
    const title = String(prompt.title || '').trim().toLowerCase();
    const template = String(prompt.template || '').trim();
    return `${title}::${template}`;
}

function findDuplicatePrompt(items, candidate) {
    const identity = promptIdentity(candidate);
    return items.find(item => promptIdentity(item) === identity);
}

export function addMyPrompt(candidate) {
    const items = readMyPrompts();
    const normalized = normalizePromptEntry(candidate);
    const duplicate = findDuplicatePrompt(items, normalized);
    if (duplicate) {
        return { added: false, reason: 'exists', prompt: duplicate };
    }
    items.unshift(normalized);
    writeMyPrompts(items);
    return { added: true, prompt: normalized };
}

function updateMyPrompt(id, updates) {
    const items = readMyPrompts();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    const updated = normalizePromptEntry({ ...items[index], ...updates }, { id, updatedAt: new Date().toISOString() });
    items[index] = updated;
    writeMyPrompts(items);
    return updated;
}

function removeMyPrompt(id) {
    const items = readMyPrompts().filter(item => item.id !== id);
    writeMyPrompts(items);
}

export function initMyPrompts() {
    if (myPromptsInitialized) return;
    const form = document.getElementById('my-prompts-form');
    if (!form) return;

    myPromptsInitialized = true;
    myPromptsUI = {
        form,
        title: document.getElementById('my-prompt-title'),
        method: document.getElementById('my-prompt-method-input'),
        tags: document.getElementById('my-prompt-tags'),
        description: document.getElementById('my-prompt-description'),
        template: document.getElementById('my-prompt-template'),
        tips: document.getElementById('my-prompt-tips'),
        expected: document.getElementById('my-prompt-expected'),
        error: document.getElementById('my-prompts-form-error'),
        list: document.getElementById('my-prompts-list'),
        empty: document.getElementById('my-prompts-empty'),
        count: document.getElementById('my-prompts-count'),
        search: document.getElementById('my-prompts-search'),
        methodFilter: document.getElementById('my-prompts-method'),
        methodOptions: document.getElementById('my-prompts-methods'),
        sort: document.getElementById('my-prompts-sort'),
        workspace: document.getElementById('my-prompts-workspace'),
        workspaceClear: document.getElementById('my-workspace-clear'),
        workspaceCopy: document.getElementById('my-workspace-copy'),
        clear: document.getElementById('my-prompts-clear'),
        save: document.getElementById('my-prompts-save')
    };

    myPromptsUI.form.addEventListener('submit', (event) => {
        event.preventDefault();
        saveMyPromptFromForm();
    });

    if (myPromptsUI.clear) {
        myPromptsUI.clear.addEventListener('click', resetMyPromptForm);
    }

    if (myPromptsUI.search) {
        myPromptsUI.search.addEventListener('input', renderMyPrompts);
    }

    if (myPromptsUI.methodFilter) {
        myPromptsUI.methodFilter.addEventListener('input', renderMyPrompts);
    }

    if (myPromptsUI.sort) {
        myPromptsUI.sort.addEventListener('change', renderMyPrompts);
    }

    if (myPromptsUI.workspaceClear && myPromptsUI.workspace) {
        myPromptsUI.workspaceClear.addEventListener('click', () => {
            myPromptsUI.workspace.value = '';
            myPromptsUI.workspace.focus();
        });
    }

    if (myPromptsUI.workspaceCopy && myPromptsUI.workspace) {
        myPromptsUI.workspaceCopy.addEventListener('click', () => {
            copyPlainText(myPromptsUI.workspaceCopy, myPromptsUI.workspace.value || '');
        });
    }

    if (myPromptsUI.list) {
        myPromptsUI.list.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            const action = button.dataset.action;
            const id = button.dataset.id;
            if (!id) return;
            handleMyPromptAction(action, id);
        });
    }
}

function setMyPromptError(message) {
    if (!myPromptsUI || !myPromptsUI.error) return;
    if (message) {
        myPromptsUI.error.textContent = message;
        myPromptsUI.error.classList.remove('hidden');
    } else {
        myPromptsUI.error.textContent = '';
        myPromptsUI.error.classList.add('hidden');
    }
}

function resetMyPromptForm() {
    if (!myPromptsUI) return;
    myPromptsUI.form.reset();
    myPromptsUI.form.dataset.editingId = '';
    if (myPromptsUI.save) {
        myPromptsUI.save.textContent = 'Salvar';
    }
    setMyPromptError('');
}

function saveMyPromptFromForm() {
    if (!myPromptsUI) return;
    const title = myPromptsUI.title.value.trim();
    const template = myPromptsUI.template.value.trim();
    if (!title || !template) {
        setMyPromptError('Título e template são obrigatórios.');
        return;
    }

    const candidate = normalizePromptEntry({
        id: myPromptsUI.form.dataset.editingId || undefined,
        title,
        methodology: myPromptsUI.method.value.trim(),
        tags: myPromptsUI.tags.value,
        description: myPromptsUI.description.value.trim(),
        template,
        tips: myPromptsUI.tips.value.trim(),
        expected_output: myPromptsUI.expected.value.trim(),
        source: 'user'
    });

    if (myPromptsUI.form.dataset.editingId) {
        updateMyPrompt(candidate.id, candidate);
    } else {
        const result = addMyPrompt(candidate);
        if (!result.added) {
            setMyPromptError('Este prompt já existe.');
            return;
        }
    }

    resetMyPromptForm();
    renderMyPrompts();
}

function handleMyPromptAction(action, id) {
    const items = readMyPrompts();
    const prompt = items.find(item => item.id === id);
    if (!prompt) return;

    if (action === 'copy') {
        copyPlainText(null, prompt.template || '');
    }
    if (action === 'paste' && myPromptsUI && myPromptsUI.workspace) {
        myPromptsUI.workspace.value = myPromptsUI.workspace.value
            ? `${myPromptsUI.workspace.value}\n\n${prompt.template}`
            : prompt.template;
        myPromptsUI.workspace.focus();
    }
    if (action === 'edit') {
        populateMyPromptForm(prompt);
    }
    if (action === 'delete') {
        removeMyPrompt(id);
        renderMyPrompts();
    }
}

function populateMyPromptForm(prompt) {
    if (!myPromptsUI) return;
    myPromptsUI.form.dataset.editingId = prompt.id;
    myPromptsUI.title.value = prompt.title || '';
    myPromptsUI.method.value = prompt.methodology || '';
    myPromptsUI.tags.value = Array.isArray(prompt.tags) ? prompt.tags.join(', ') : '';
    myPromptsUI.description.value = prompt.description || '';
    myPromptsUI.template.value = prompt.template || '';
    myPromptsUI.tips.value = prompt.tips || '';
    myPromptsUI.expected.value = prompt.expected_output || '';
    if (myPromptsUI.save) {
        myPromptsUI.save.textContent = 'Atualizar';
    }
    setMyPromptError('');
}

function updateMyPromptMethodOptions(items) {
    if (!myPromptsUI || !myPromptsUI.methodOptions) return;
    const methods = Array.from(new Set(items.map(item => item.methodology).filter(Boolean)))
        .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
    myPromptsUI.methodOptions.innerHTML = methods.map(method => `<option value="${escapeHtml(method)}"></option>`).join('');
}

export function renderMyPrompts() {
    if (!myPromptsUI) return;
    const items = readMyPrompts();
    const query = (myPromptsUI.search.value || '').trim().toLowerCase();
    const methodFilter = (myPromptsUI.methodFilter.value || '').trim().toLowerCase();

    const filtered = items.filter(item => {
        const matchesMethod = !methodFilter || String(item.methodology || '').toLowerCase().includes(methodFilter);
        if (!matchesMethod) return false;
        if (!query) return true;
        const hay = [
            item.title,
            item.description,
            item.methodology,
            Array.isArray(item.tags) ? item.tags.join(' ') : ''
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(query);
    });

    const sortValue = myPromptsUI.sort ? myPromptsUI.sort.value : 'updated-desc';
    const sorted = [...filtered].sort((a, b) => {
        if (sortValue === 'title-asc') {
            return String(a.title || '').localeCompare(String(b.title || ''), 'pt-BR');
        }
        if (sortValue === 'title-desc') {
            return String(b.title || '').localeCompare(String(a.title || ''), 'pt-BR');
        }
        if (sortValue === 'updated-asc') {
            return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
        }
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });

    if (myPromptsUI.count) {
        myPromptsUI.count.textContent = `${items.length} salvos`;
    }

    updateMyPromptMethodOptions(items);

    if (myPromptsUI.list) {
        myPromptsUI.list.innerHTML = sorted.map((prompt, index) => {
            const tags = Array.isArray(prompt.tags) && prompt.tags.length
                ? prompt.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
                : '';
            const description = escapeHtml(prompt.description || '');
            const title = escapeHtml(prompt.title || '');
            const tips = escapeHtml(prompt.tips || '');
            const expected = escapeHtml(prompt.expected_output || '');
            const template = escapeHtml(prompt.template || '');
            const method = prompt.methodology ? `<span class="tag">${escapeHtml(prompt.methodology)}</span>` : '';

            return `
                <div class="prompt-item fade-in" style="animation-delay: ${index * 0.03}s">
                    <div class="prompt-header">
                        <div>
                            <h3 class="prompt-title">${title}</h3>
                            <div class="prompt-tags">${method}${tags}</div>
                            <p class="prompt-desc">${description}</p>
                        </div>
                        <div class="prompt-actions-inline">
                            <button class="prompt-btn" data-action="copy" data-id="${prompt.id}">Copiar</button>
                            <button class="prompt-btn" data-action="paste" data-id="${prompt.id}">Colar</button>
                            <button class="prompt-btn" data-action="edit" data-id="${prompt.id}">Editar</button>
                            <button class="prompt-btn" data-action="delete" data-id="${prompt.id}">Excluir</button>
                        </div>
                    </div>
                    <div class="prompt-content">
                        <pre class="prompt-code">${template}</pre>
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
    }

    if (myPromptsUI.empty) {
        myPromptsUI.empty.classList.toggle('hidden', items.length > 0);
    }
}
