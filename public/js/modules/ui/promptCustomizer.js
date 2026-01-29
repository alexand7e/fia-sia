import { safeId } from '../utils/text.js';

export function initPromptCustomizers(container) {
    if (!container) return;
    const codeBlocks = container.querySelectorAll('pre');
    codeBlocks.forEach((pre, index) => {
        const text = pre.innerText;
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
            pre.dataset.originalTemplate = text;

            const inputs = customizer.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    let updatedText = pre.dataset.originalTemplate;
                    inputs.forEach(i => {
                        const val = i.value.trim();
                        if (val) {
                            const regex = new RegExp(i.dataset.placeholder.replace(/[\[\]]/g, '\\$&'), 'g');
                            updatedText = updatedText.replace(regex, val);
                        }
                    });

                    const codeEl = pre.querySelector('code');
                    if (codeEl) {
                        codeEl.textContent = updatedText;
                        if (window.hljs) {
                            window.hljs.highlightElement(codeEl);
                        }
                    } else {
                        pre.firstChild.textContent = updatedText;
                    }
                });
            });
        }
    });
}
