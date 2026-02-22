export function initHistoryViewer() {
    renderHistory();
}

export function renderHistory() {
    const listContainer = document.getElementById('history-list');
    if (!listContainer) return;

    try {
        const saved = JSON.parse(localStorage.getItem('sia:saved-results') || '[]');

        if (saved.length === 0) {
            listContainer.innerHTML = `
                <div class="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 text-center text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    <span class="material-symbols-outlined text-5xl text-slate-400 mb-4 opacity-50">history_toggle_off</span>
                    <h4 class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Seu Histórico Está Vazio</h4>
                    <p>Você ainda não salvou resultados gerados pela IA.</p>
                    <p class="mt-2 text-sm text-slate-500">Ao executar um prompt e gerar uma aula, clique no ícone de "Salvar Localmente" (marcador de página) para guardar o texto aqui.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="space-y-6">';

        saved.forEach((item, index) => {
            const preview = item.content.length > 200 ? item.content.substring(0, 200) + '...' : item.content;
            const dateStr = new Date(item.date).toLocaleString('pt-BR');
            html += `
                <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow group relative">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-md">
                                Resultado Salvo
                            </span>
                            <span class="text-xs text-slate-500 ml-2"><span class="material-symbols-outlined text-[14px] align-middle -mt-0.5 mr-1">schedule</span>${dateStr}</span>
                        </div>
                        <div class="flex gap-2">
                            <button class="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors history-copy-btn" data-index="${index}" title="Copiar tudo">
                                <span class="material-symbols-outlined">content_copy</span>
                            </button>
                            <button class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors history-delete-btn" data-index="${index}" title="Excluir">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    </div>
                    <div class="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 relative">
                        <div class="max-h-40 overflow-hidden relative">
                            ${window.marked ? window.marked.parse(preview) : preview}
                            <div class="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white dark:from-surface-dark to-transparent"></div>
                        </div>
                    </div>
                    <button class="mt-4 text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 history-view-btn" data-index="${index}">
                        Ler Completo <span class="material-symbols-outlined text-[16px]">expand_more</span>
                    </button>
                    <!-- Expandable content details -->
                     <div class="hidden mt-4 pt-4 border-t border-slate-100 dark:border-slate-800" id="hist-content-${index}">
                        <div class="prose prose-sm dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            ${window.marked ? window.marked.parse(item.content) : item.content}
                        </div>
                         <button class="mt-4 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center gap-1 history-close-btn" data-index="${index}">
                            Minimizar <span class="material-symbols-outlined text-[16px]">expand_less</span>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        listContainer.innerHTML = html;

        setupHistoryListeners(saved);

    } catch (error) {
        console.error('Erro ao ler histórico:', error);
        listContainer.innerHTML = '<p class="text-red-500 text-center">Ocorreu um erro ao carregar o histórico de resultados.</p>';
    }
}

function setupHistoryListeners(savedData) {
    document.querySelectorAll('.history-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.currentTarget.dataset.index;
            document.getElementById(`hist-content-${idx}`).classList.remove('hidden');
            e.currentTarget.classList.add('hidden');
        });
    });

    document.querySelectorAll('.history-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.currentTarget.dataset.index;
            document.getElementById(`hist-content-${idx}`).classList.add('hidden');
            document.querySelector(`.history-view-btn[data-index="${idx}"]`).classList.remove('hidden');
        });
    });

    document.querySelectorAll('.history-copy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idx = e.currentTarget.dataset.index;
            try {
                await navigator.clipboard.writeText(savedData[idx].content);
                const originalHtml = e.currentTarget.innerHTML;
                e.currentTarget.innerHTML = '<span class="material-symbols-outlined text-green-500">check</span>';
                setTimeout(() => {
                    e.currentTarget.innerHTML = originalHtml;
                }, 2000);
            } catch (err) {
                alert('Erro ao copiar.');
            }
        });
    });

    document.querySelectorAll('.history-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm('Tem certeza que deseja excluir esse resultado?')) {
                const idx = e.currentTarget.dataset.index;
                savedData.splice(idx, 1);
                localStorage.setItem('sia:saved-results', JSON.stringify(savedData));
                renderHistory();
            }
        });
    });
}
