/**
 * UI Component for LLM Execution and Response Display
 */
import llmClient from '../services/llm-client.js';
import rateLimitTracker from '../utils/rateLimitTracker.js';

class LLMExecutor {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.currentResponse = null;
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="llm-executor-modal" class="llm-modal hidden">
                <div class="llm-modal-overlay"></div>
                <div class="llm-modal-content">
                    <div class="llm-modal-header">
                        <h3 class="llm-modal-title">Resposta da IA</h3>
                        <button class="llm-modal-close" aria-label="Fechar">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div class="llm-modal-body">
                        <div id="llm-loading" class="llm-loading hidden">
                            <div class="llm-spinner"></div>
                            <p>Processando sua solicitação...</p>
                        </div>
                        <div id="llm-response" class="llm-response hidden"></div>
                        <div id="llm-error" class="llm-error hidden"></div>
                    </div>
                    <div class="llm-modal-footer">
                        <div class="llm-rate-limit-info">
                            <span class="material-symbols-outlined">schedule</span>
                            <span id="llm-rate-info">Verificando limite...</span>
                        </div>
                        <div class="llm-modal-actions">
                            <button id="llm-copy-response" class="llm-btn llm-btn-secondary" disabled>
                                <span class="material-symbols-outlined">content_copy</span>
                                Copiar
                            </button>
                            <button id="llm-close-modal" class="llm-btn llm-btn-primary">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert modal into body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);

        this.modal = document.getElementById('llm-executor-modal');
    }

    setupEventListeners() {
        // Close button
        const closeBtn = this.modal.querySelector('.llm-modal-close');
        closeBtn.addEventListener('click', () => this.close());

        // Close modal button
        const closeModalBtn = document.getElementById('llm-close-modal');
        closeModalBtn.addEventListener('click', () => this.close());

        // Copy button
        const copyBtn = document.getElementById('llm-copy-response');
        copyBtn.addEventListener('click', () => this.copyResponse());

        // Overlay click
        const overlay = this.modal.querySelector('.llm-modal-overlay');
        overlay.addEventListener('click', () => this.close());

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    async execute(prompt, options = {}) {
        this.open();
        this.showLoading();
        this.updateRateLimitInfo();

        try {
            const response = await llmClient.executePrompt(prompt, options);

            if (response.success) {
                this.showResponse(response.data.text);
                this.currentResponse = response.data.text;
            } else {
                throw new Error(response.error?.message || 'Erro desconhecido');
            }

        } catch (error) {
            console.error('Error executing prompt:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
            this.updateRateLimitInfo();
        }
    }

    showLoading() {
        document.getElementById('llm-loading').classList.remove('hidden');
        document.getElementById('llm-response').classList.add('hidden');
        document.getElementById('llm-error').classList.add('hidden');
        document.getElementById('llm-copy-response').disabled = true;
    }

    hideLoading() {
        document.getElementById('llm-loading').classList.add('hidden');
    }

    showResponse(text) {
        const responseDiv = document.getElementById('llm-response');

        // Render markdown if marked.js is available
        if (window.marked) {
            responseDiv.innerHTML = window.marked.parse(text);

            // Highlight code blocks if highlight.js is available
            if (window.hljs) {
                responseDiv.querySelectorAll('pre code').forEach((block) => {
                    window.hljs.highlightElement(block);
                });
            }
        } else {
            responseDiv.textContent = text;
        }

        responseDiv.classList.remove('hidden');
        document.getElementById('llm-copy-response').disabled = false;
    }

    showError(message) {
        const errorDiv = document.getElementById('llm-error');
        errorDiv.innerHTML = `
            <div class="llm-error-content">
                <span class="material-symbols-outlined">error</span>
                <div>
                    <strong>Erro ao executar prompt</strong>
                    <p>${message}</p>
                </div>
            </div>
        `;
        errorDiv.classList.remove('hidden');
    }

    async updateRateLimitInfo() {
        const status = rateLimitTracker.getStatus();
        const infoSpan = document.getElementById('llm-rate-info');

        if (status.isLimitExceeded) {
            const resetDate = new Date(status.resetAt);
            infoSpan.innerHTML = `<strong>Limite atingido.</strong> Resetará em ${resetDate.toLocaleString('pt-BR')}`;
            infoSpan.style.color = 'rgb(239 68 68)';
        } else {
            infoSpan.innerHTML = `${status.remaining} de ${status.limit} requisições restantes hoje`;
            infoSpan.style.color = '';
        }
    }

    async copyResponse() {
        if (!this.currentResponse) return;

        try {
            await navigator.clipboard.writeText(this.currentResponse);

            // Visual feedback
            const copyBtn = document.getElementById('llm-copy-response');
            const icon = copyBtn.querySelector('.material-symbols-outlined');
            const originalIcon = icon.textContent;

            icon.textContent = 'check';
            copyBtn.classList.add('success');

            setTimeout(() => {
                icon.textContent = originalIcon;
                copyBtn.classList.remove('success');
            }, 2000);

        } catch (error) {
            console.error('Error copying response:', error);
            alert('Erro ao copiar. Tente selecionar e copiar manualmente.');
        }
    }

    open() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
    }

    close() {
        this.modal.classList.remove('active');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            document.body.style.overflow = '';
            this.isOpen = false;
        }, 200);
    }
}

// Export singleton instance
export default new LLMExecutor();
