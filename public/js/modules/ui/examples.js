let chatTimers = [];

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

function clearChatTimers() {
    chatTimers.forEach((id) => clearTimeout(id));
    chatTimers = [];
}

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

export function initExamplesSimulation() {
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
