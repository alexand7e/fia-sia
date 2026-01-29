import { escapeHtml, safeId } from '../utils/text.js';
import { fetchText } from '../utils/fetch.js';

export function addCodeCopyButtons(container, copyWithFeedback) {
    if (!container) return;
    const blocks = container.querySelectorAll('pre');
    blocks.forEach((pre) => {
        if (pre.querySelector('.code-copy-btn')) return;
        const btn = document.createElement('button');
        btn.className = 'code-copy-btn';
        btn.type = 'button';
        btn.textContent = 'Copiar';
        btn.addEventListener('click', () => {
            const codeEl = pre.querySelector('code');
            const textToCopy = codeEl ? codeEl.innerText : pre.innerText;
            copyWithFeedback(btn, textToCopy);
        });
        pre.appendChild(btn);
    });
}

export async function loadMethodology({
    contentDiv,
    pageTitle,
    pageSubtitle,
    roadmapDiv,
    initExamplesSimulation,
    initPromptCustomizers,
    copyWithFeedback
}) {
    try {
        contentDiv.innerHTML = '<div class="text-center">Carregando...</div>';
        const response = await fetch('data/methodology.json');
        const data = await response.json();

        if (pageTitle) pageTitle.textContent = data.title;
        if (pageSubtitle) pageSubtitle.textContent = data.subtitle || 'Framework Educacional';

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

                const subSections = section.sub_sections
                    ? await Promise.all(section.sub_sections.map(async (sub) => ({
                        ...sub,
                        body: window.marked.parse(await fetchText(sub.markdown_path))
                    })))
                    : null;

                return {
                    id: safeId(section.id),
                    title: section.title ? String(section.title) : '',
                    body: window.marked.parse(markdown),
                    subSections
                };
            })
        );

        const sectionMap = new Map(sections.map((section) => [section.id, section]));

        contentDiv.innerHTML = '<div id="methodology-content" class="markdown-body fade-in"></div>';
        const methodologyContent = document.getElementById('methodology-content');

        const setActiveStep = (stepId, subStepId = null) => {
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
                window.hljs.highlightElement(block);
            });

            addCodeCopyButtons(methodologyContent, copyWithFeedback);
            initExamplesSimulation();
            initPromptCustomizers(methodologyContent);
        };

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

export async function loadStepContent({
    stepId,
    contentDiv,
    initExamplesSimulation,
    initPromptCustomizers,
    copyWithFeedback
}) {
    try {
        contentDiv.innerHTML = '<div class="text-center text-slate-500">Carregando...</div>';
        const stepMapping = {
            contextualizar: 'visao-geral',
            estruturar: 'templates',
            iterar: 'exemplos',
            referencias: 'referencias'
        };

        const sectionId = stepMapping[stepId] || stepId;
        const response = await fetch('data/methodology.json');
        const data = await response.json();
        const section = data.sections?.find(s => s.id === sectionId);

        if (!section) {
            contentDiv.innerHTML = '<div class="section"><p class="error">Conteúdo não encontrado.</p></div>';
            return;
        }

        const markdown = section.markdown_path
            ? await fetchText(section.markdown_path)
            : (section.content || '');

        const html = window.marked.parse(markdown);
        const title = section.title ? `<h2>${escapeHtml(section.title)}</h2>` : '';

        contentDiv.innerHTML = `<div class="section mb-8">${title}${html}</div>`;

        document.querySelectorAll('pre code').forEach((block) => {
            window.hljs.highlightElement(block);
        });

        addCodeCopyButtons(contentDiv, copyWithFeedback);
        initExamplesSimulation();
        initPromptCustomizers(contentDiv);
    } catch (error) {
        console.error('Error loading step content:', error);
        contentDiv.innerHTML = '<p class="error">Erro ao carregar conteúdo.</p>';
    }
}
