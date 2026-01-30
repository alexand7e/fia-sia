// Especificar Page Customizer Module
// Manages the full-page prompt customization interface with tabs
import { addMyPrompt } from './myPrompts.js';

class EspecificarCustomizer {
    constructor() {
        this.currentTab = 'tradicional';
        this.promptTemplates = {};
        this.init();
    }

    async init() {
        await this.loadPromptTemplates();
        this.setupTabs();
        this.setupFormListeners();
        this.setupActionButtons();
    }

    async loadPromptTemplates() {
        console.log('📥 Loading prompt templates...');
        const baseUrl = new URL('../../../content/', import.meta.url);
        const templates = [
            { key: 'tradicional', file: 'como-usar-tradicional' },
            { key: 'invertida', file: 'como-usar-invertida' },
            { key: 'pbl', file: 'como-usar-pbl' },
            { key: 'adaptacao', file: 'como-usar-adaptacao' },
            { key: 'sequencia', file: 'como-usar-sequencia' },
            { key: 'avaliacao', file: 'como-usar-avaliacao' }
        ];

        for (const template of templates) {
            try {
                const fileUrl = new URL(`${template.file}.md`, baseUrl);
                const response = await fetch(fileUrl);
                if (!response.ok) {
                    console.error(`❌ Failed to load ${template.file}: ${response.status}`);
                    continue;
                }
                const text = await response.text();
                this.promptTemplates[template.key] = this.extractPromptFromMarkdown(text);
                console.log(`✅ Loaded template: ${template.key}`);
            } catch (error) {
                console.error(`❌ Error loading template ${template.key}:`, error);
            }
        }
        console.log('📦 All templates loaded:', Object.keys(this.promptTemplates));
    }

    extractPromptFromMarkdown(markdown) {
        // Extract the prompt content between ```markdown and ```
        const match = markdown.match(/```markdown\r?\n([\s\S]*?)\r?\n```/);
        if (match) return match[1].trim();

        // Fallback for any fenced code block
        const fallback = markdown.match(/```[a-zA-Z]*\r?\n([\s\S]*?)\r?\n```/);
        if (fallback) return fallback[1].trim();

        return markdown.trim();
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.prompt-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.prompt-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
            tab.setAttribute('aria-selected', tab.dataset.tab === tabName);
        });

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            const isActive = content.id === `tab-${tabName}`;
            content.classList.toggle('active', isActive);
            content.hidden = !isActive;
        });

        this.currentTab = tabName;
    }

    setupFormListeners() {
        const tabs = ['tradicional', 'invertida', 'pbl', 'adaptacao', 'sequencia', 'avaliacao'];

        tabs.forEach(tab => {
            const tabContent = document.getElementById(`tab-${tab}`);
            if (!tabContent) return;

            const inputs = tabContent.querySelectorAll('.field-input');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.updatePreview(tab));
            });
        });
    }

    setupActionButtons() {
        const tabs = ['tradicional', 'invertida', 'pbl', 'adaptacao', 'sequencia', 'avaliacao'];

        tabs.forEach(tab => {
            // Generate button
            const generateBtn = document.getElementById(`generate-${tab}`);
            if (generateBtn) {
                generateBtn.addEventListener('click', () => this.generatePrompt(tab));
            }

            // Clear button
            const clearBtn = document.getElementById(`clear-${tab}`);
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearForm(tab));
            }

            // Copy button
            const copyBtn = document.getElementById(`copy-${tab}`);
            if (copyBtn) {
                copyBtn.addEventListener('click', () => this.copyPrompt(tab));
            }

            // Save button
            const saveBtn = document.getElementById(`save-${tab}`);
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.savePrompt(tab));
            }
        });
    }

    updatePreview(tab) {
        const preview = document.getElementById(`preview-${tab}`);
        if (!preview) {
            console.warn(`⚠️ Preview element not found for tab: ${tab}`);
            return;
        }

        const prompt = this.generatePromptText(tab);
        const code = preview.querySelector('code');
        if (code) {
            code.textContent = prompt || 'Preencha os campos ao lado para gerar seu prompt personalizado...';
            console.log(`🔄 Preview updated for tab: ${tab}`);
        }
    }

    generatePrompt(tab) {
        // Validate required fields
        const tabContent = document.getElementById(`tab-${tab}`);
        const requiredFields = tabContent.querySelectorAll('.field-input[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'rgb(239 68 68)';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });

        if (!isValid) {
            this.showNotification('Por favor, preencha todos os campos obrigatórios (*)', 'error');
            return;
        }

        this.updatePreview(tab);
        this.showNotification('Prompt gerado com sucesso!', 'success');
    }

    generatePromptText(tab) {
        const template = this.promptTemplates[tab];
        if (!template) return '';

        const tabContent = document.getElementById(`tab-${tab}`);
        const inputs = tabContent.querySelectorAll('.field-input');

        let prompt = template;

        inputs.forEach(input => {
            const placeholder = input.dataset.placeholder;
            if (placeholder) {
                const value = input.value.trim() || `[${placeholder}]`;

                // Handle multi-line placeholders for adaptacao
                if (placeholder === 'DIFERENCAS' && value !== `[${placeholder}]`) {
                    const lines = value.split('\n').filter(line => line.trim());
                    const formatted = lines.map(line => {
                        if (!line.trim().startsWith('-')) {
                            return `- ${line.trim()}`;
                        }
                        return line;
                    }).join('\n');
                    prompt = prompt.replace(`[DIFERENCA_1]\n- [DIFERENCA_2]\n- [DIFERENCA_3]`, formatted);
                } else {
                    prompt = prompt.replace(new RegExp(`\\[${placeholder}\\]`, 'g'), value);
                }
            }
        });

        return prompt;
    }

    clearForm(tab) {
        const tabContent = document.getElementById(`tab-${tab}`);
        const inputs = tabContent.querySelectorAll('.field-input');

        inputs.forEach(input => {
            if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
            input.style.borderColor = '';
        });

        this.updatePreview(tab);
        this.showNotification('Formulário limpo', 'info');
    }

    async copyPrompt(tab) {
        const prompt = this.generatePromptText(tab);

        if (!prompt || prompt.includes('[')) {
            this.showNotification('Preencha todos os campos antes de copiar', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(prompt);
            this.showNotification('Prompt copiado para a área de transferência!', 'success');

            // Visual feedback
            const copyBtn = document.getElementById(`copy-${tab}`);
            const icon = copyBtn.querySelector('.material-symbols-outlined');
            const originalText = icon.textContent;
            icon.textContent = 'check';
            setTimeout(() => {
                icon.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showNotification('Erro ao copiar. Tente novamente.', 'error');
        }
    }

    savePrompt(tab) {
        const prompt = this.generatePromptText(tab);

        if (!prompt || prompt.includes('[')) {
            this.showNotification('Preencha todos os campos antes de salvar', 'warning');
            return;
        }

        // Get prompt metadata
        const tabContent = document.getElementById(`tab-${tab}`);
        const firstInput = tabContent.querySelector('.field-input[data-placeholder="DISCIPLINA"]') ||
            tabContent.querySelector('.field-input[data-placeholder="TEMA"]') ||
            tabContent.querySelector('.field-input[data-placeholder="TEMA_UNIDADE"]');

        const title = firstInput ? `Prompt ${this.getMethodName(tab)} - ${firstInput.value}` : `Prompt ${this.getMethodName(tab)}`;

        // Create prompt object
        const promptData = {
            id: Date.now(),
            title: title,
            method: this.getMethodName(tab),
            tags: [tab, 'customizado'],
            description: `Prompt ${this.getMethodName(tab)} gerado pelo customizador`,
            template: prompt,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const result = addMyPrompt(promptData);
        if (!result.added) {
            this.showNotification('Este prompt já está salvo em "Meus Prompts".', 'warning');
            return;
        }

        this.showNotification('Prompt salvo em "Meus Prompts"!', 'success');

        // Visual feedback
        const saveBtn = document.getElementById(`save-${tab}`);
        const icon = saveBtn.querySelector('.material-symbols-outlined');
        icon.textContent = 'bookmark_added';
        setTimeout(() => {
            icon.textContent = 'bookmark';
        }, 2000);
    }

    getMethodName(tab) {
        const names = {
            'tradicional': 'Tradicional',
            'invertida': 'Sala Invertida',
            'pbl': 'PBL',
            'adaptacao': 'Adaptação',
            'sequencia': 'Sequência Didática',
            'avaliacao': 'Avaliação'
        };
        return names[tab] || tab;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style based on type
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background-color: ${type === 'success' ? 'rgb(34 197 94)' :
                type === 'error' ? 'rgb(239 68 68)' :
                    type === 'warning' ? 'rgb(234 179 8)' :
                        'rgb(59 130 246)'};
            color: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
export function initEspecificarCustomizer() {
    // Add animations if not already added
    if (!document.getElementById('especificar-animations')) {
        const style = document.createElement('style');
        style.id = 'especificar-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    return new EspecificarCustomizer();
}
