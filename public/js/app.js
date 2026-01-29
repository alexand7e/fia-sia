import { initDarkMode } from './modules/ui/theme.js';
import { initMobileMenu, closeMobileMenu } from './modules/ui/mobileMenu.js';
import { mountSidebar } from './modules/ui/sidebar.js';
import { initSidebarNavigation, autoExpandGroup } from './modules/ui/sidebar-navigation.js';
import { initPromptCustomizers } from './modules/ui/promptCustomizer.js';
import { initExamplesSimulation } from './modules/ui/examples.js';
import { loadPrompts } from './modules/ui/promptsLibrary.js';
import { initMyPrompts, renderMyPrompts, addMyPrompt, promptIdentity, readMyPrompts } from './modules/ui/myPrompts.js';
import { loadStepContent } from './modules/ui/methodology.js';
import { copyWithFeedback } from './modules/utils/clipboard.js';
import router from './modules/router.js';

const contentDiv = document.getElementById('content');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const roadmapDiv = document.getElementById('roadmap');
let navTabs = [];
let navTabsMobile = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await mountSidebar();
    } catch (error) {
        console.error(error);
        // Show visual error feedback
        const sidebarContainer = document.getElementById('sidebar');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = `
                <div class="p-6 text-center">
                    <span class="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                    <p class="text-sm text-slate-600 dark:text-slate-400">Erro ao carregar menu</p>
                </div>
            `;
            sidebarContainer.className = 'flex w-72 flex-col bg-sidebar-light dark:bg-sidebar-dark border-r border-slate-200 dark:border-slate-800 h-full flex-shrink-0 z-20 shadow-sm';
        }
    }

    navTabs = Array.from(document.querySelectorAll('.nav-btn'));
    navTabsMobile = Array.from(document.querySelectorAll('.nav-btn-mobile'));

    initDarkMode();
    initMobileMenu();
    configureMarkdown();
    initViewToggle();
    initStepCards();

    // Setup router
    setupRouter();

    // Setup navigation click handlers
    setupNavigation();

    // Initialize sidebar navigation (expandable groups)
    initSidebarNavigation();
});

function configureMarkdown() {
    if (!window.marked || !window.hljs) return;
    window.marked.setOptions({
        highlight: function (code, lang) {
            const language = window.hljs.getLanguage(lang) ? lang : 'plaintext';
            return window.hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-'
    });
}

function initViewToggle() {
    const viewApoio = document.getElementById('view-apoio');
    const viewEspecificar = document.getElementById('view-especificar');
    const apoioView = document.getElementById('apoio-view');
    const especificarView = document.getElementById('especificar-view');

    if (viewApoio) {
        viewApoio.addEventListener('change', () => {
            if (viewApoio.checked) {
                router.navigateTo('/dashboard');
            }
        });
    }

    if (viewEspecificar) {
        viewEspecificar.addEventListener('change', () => {
            if (viewEspecificar.checked) {
                router.navigateTo('/prompts');
            }
        });
    }
}

function initStepCards() {
    const stepCards = document.querySelectorAll('.step-card');
    stepCards.forEach(card => {
        card.addEventListener('click', () => {
            const step = card.dataset.step;
            const especificarView = document.getElementById('especificar-view');
            const apoioView = document.getElementById('apoio-view');
            const viewEspecificar = document.getElementById('view-especificar');

            if (viewEspecificar) viewEspecificar.checked = true;
            apoioView?.classList.add('hidden');
            especificarView?.classList.remove('hidden');
            loadStepContent({
                stepId: step,
                contentDiv,
                initExamplesSimulation,
                initPromptCustomizers,
                copyWithFeedback
            });
        });
    });
}

function initPromptCards() {
    const promptCards = document.querySelectorAll('.prompt-card');
    promptCards.forEach(card => {
        card.addEventListener('click', () => {
            const promptType = card.dataset.promptType;
            loadPromptContent(promptType);
        });
    });
}

function showPromptCards() {
    const promptCardsView = document.getElementById('prompts-cards-view');
    const promptContentView = document.getElementById('prompts-content-view');

    promptCardsView?.classList.remove('hidden');
    promptContentView?.classList.add('hidden');

    if (!window.promptCardsInitialized) {
        initPromptCards();
        window.promptCardsInitialized = true;
    }
}

function setActiveNav(route) {
    // Map routes to tab names
    const routeToTab = {
        '/dashboard': 'methodology',
        '/': 'methodology',
        '/prompts': 'prompts',
        '/meus-prompts': 'my-prompts',
        '/recursos': 'recursos',
        '/config': 'config'
    };

    const tabName = routeToTab[route] || 'methodology';

    navTabs.forEach(tab => {
        const isActive = tab.dataset.tab === tabName || tab.dataset.route === route;
        tab.classList.toggle('active', isActive);
    });

    navTabsMobile.forEach(tab => {
        const isActive = tab.dataset.tab === tabName || tab.dataset.route === route;
        tab.classList.toggle('active', isActive);
    });
}

function showView(viewName) {
    const dashboardView = document.getElementById('dashboard-view');
    const myPromptsView = document.getElementById('my-prompts-view');
    const recursosView = document.getElementById('recursos-view');
    const contentArea = document.getElementById('content-area');

    // Hide all views first
    dashboardView?.classList.add('hidden');
    myPromptsView?.classList.add('hidden');
    recursosView?.classList.add('hidden');
    if (contentArea) contentArea.style.display = 'none';

    // Show the requested view
    switch (viewName) {
        case 'dashboard':
            dashboardView?.classList.remove('hidden');
            break;
        case 'my-prompts':
            myPromptsView?.classList.remove('hidden');
            initMyPrompts();
            renderMyPrompts();
            break;
        case 'recursos':
            recursosView?.classList.remove('hidden');
            loadRecursosPage();
            break;
        case 'content':
            // Show content-area for dynamically loaded pages
            if (contentArea) contentArea.style.display = 'block';
            break;
        case 'config':
            // Redirect to construindo page or show placeholder
            if (contentArea) {
                contentArea.style.display = 'block';
                loadConstruindoPage();
            }
            break;
    }
}

function showDashboard() {
    showView('dashboard');
}

function showMyPrompts() {
    showView('my-prompts');
}

async function loadPromptContent(promptType) {
    try {
        const promptCardsView = document.getElementById('prompts-cards-view');
        const promptContentView = document.getElementById('prompts-content-view');

        promptCardsView?.classList.add('hidden');
        promptContentView?.classList.remove('hidden');

        if (promptType === 'especificar' || promptType === 'validar') {
            // Only pass elements that exist
            const params = {};
            if (contentDiv) params.contentDiv = contentDiv;
            if (pageTitle) params.pageTitle = pageTitle;
            if (pageSubtitle) params.pageSubtitle = pageSubtitle;
            if (roadmapDiv) params.roadmapDiv = roadmapDiv;

            await loadPrompts({
                ...params,
                addMyPrompt,
                promptIdentity,
                readMyPrompts
            });
        }
    } catch (error) {
        console.error('Error loading prompt content:', error);
        if (contentDiv) {
            contentDiv.innerHTML = '<p class="error">Erro ao carregar prompts.</p>';
        }
    }
}

// Control header visibility based on route
function updatePageHeader(route) {
    const pageHeader = document.getElementById('page-header');
    const viewToggle = document.getElementById('view-toggle');

    // Show header and toggle only on /dashboard and /prompts
    const showHeader = route === '/dashboard' || route === '/' || route === '/prompts';

    if (pageHeader) {
        pageHeader.style.display = showHeader ? 'block' : 'none';
    }

    if (viewToggle) {
        viewToggle.style.display = showHeader ? 'block' : 'none';
    }
}

// Load recursos page
async function loadRecursosPage() {
    const recursosView = document.getElementById('recursos-view');
    if (!recursosView) return;

    // Check if already loaded
    if (recursosView.dataset.loaded === 'true') return;

    const recursosHTML = `
        <div class="mb-8">
            <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Recursos de IA
            </h3>
            <p class="text-slate-600 dark:text-slate-400">
                Escolha a ferramenta de IA que melhor se adequa às suas necessidades
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Google Gemini -->
            <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer"
                class="recurso-card group bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 no-underline">
                <div class="flex items-start gap-4 mb-4">
                    <div class="recurso-logo bg-blue-50 dark:bg-blue-900/20" style="background-color: rgba(66, 133, 244, 0.1);">
                        <span class="text-2xl">✨</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Google Gemini
                        </h4>
                        <div class="flex gap-2 flex-wrap">
                            <span class="recurso-tag free">Gratuito</span>
                            <span class="recurso-tag api">API</span>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Modelo de IA multimodal do Google com capacidades avançadas de texto, imagem e código
                </p>
            </a>

            <!-- DeepSeek -->
            <a href="https://www.deepseek.com" target="_blank" rel="noopener noreferrer"
                class="recurso-card group bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 no-underline">
                <div class="flex items-start gap-4 mb-4">
                    <div class="recurso-logo bg-purple-50 dark:bg-purple-900/20">
                        <span class="text-2xl">🧠</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            DeepSeek
                        </h4>
                        <div class="flex gap-2 flex-wrap">
                            <span class="recurso-tag free">Gratuito</span>
                            <span class="recurso-tag" style="background: #f3e8ff; color: #6b21a8;">Open Source</span>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    IA de código aberto com foco em raciocínio avançado e programação
                </p>
            </a>

            <!-- ChatGPT -->
            <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer"
                class="recurso-card group bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 no-underline">
                <div class="flex items-start gap-4 mb-4">
                    <div class="recurso-logo bg-green-50 dark:bg-green-900/20">
                        <span class="text-2xl">💬</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            ChatGPT
                        </h4>
                        <div class="flex gap-2 flex-wrap">
                            <span class="recurso-tag paid">Freemium</span>
                            <span class="recurso-tag api">API</span>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Assistente de IA conversacional da OpenAI, líder em processamento de linguagem natural
                </p>
            </a>

            <!-- Google AI Studio -->
            <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer"
                class="recurso-card group bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 no-underline">
                <div class="flex items-start gap-4 mb-4">
                    <div class="recurso-logo bg-red-50 dark:bg-red-900/20">
                        <span class="text-2xl">🔬</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            Google AI Studio
                        </h4>
                        <div class="flex gap-2 flex-wrap">
                            <span class="recurso-tag free">Gratuito</span>
                            <span class="recurso-tag" style="background: #dbeafe; color: #1e40af;">Dev</span>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Plataforma para desenvolver e experimentar com modelos Gemini
                </p>
            </a>

            <!-- Claude -->
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer"
                class="recurso-card group bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 no-underline">
                <div class="flex items-start gap-4 mb-4">
                    <div class="recurso-logo bg-amber-50 dark:bg-amber-900/20">
                        <span class="text-2xl">🤖</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            Claude
                        </h4>
                        <div class="flex gap-2 flex-wrap">
                            <span class="recurso-tag paid">Freemium</span>
                            <span class="recurso-tag api">API</span>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    IA da Anthropic focada em segurança, precisão e conversas longas
                </p>
            </a>

            <!-- Microsoft Copilot -->
            <a href="https://copilot.microsoft.com" target="_blank" rel="noopener noreferrer"
                class="recurso-card group bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 no-underline">
                <div class="flex items-start gap-4 mb-4">
                    <div class="recurso-logo bg-sky-50 dark:bg-sky-900/20">
                        <span class="text-2xl">🚀</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            Microsoft Copilot
                        </h4>
                        <div class="flex gap-2 flex-wrap">
                            <span class="recurso-tag paid">Freemium</span>
                            <span class="recurso-tag" style="background: #e0e7ff; color: #3730a3;">Integrado</span>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Assistente de IA integrado ao ecossistema Microsoft (Office, Windows, Edge)
                </p>
            </a>

            <!-- Perplexity -->
            <a href="https://www.perplexity.ai" target="_blank" rel="noopener noreferrer"
                class="recurso-card group bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 no-underline">
                <div class="flex items-start gap-4 mb-4">
                    <div class="recurso-logo bg-cyan-50 dark:bg-cyan-900/20">
                        <span class="text-2xl">🔍</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            Perplexity
                        </h4>
                        <div class="flex gap-2 flex-wrap">
                            <span class="recurso-tag paid">Freemium</span>
                            <span class="recurso-tag" style="background: #cffafe; color: #155e75;">Busca</span>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Motor de busca com IA que fornece respostas precisas com fontes citadas
                </p>
            </a>

            <!-- Meta AI -->
            <a href="https://www.meta.ai" target="_blank" rel="noopener noreferrer"
                class="recurso-card group bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 no-underline">
                <div class="flex items-start gap-4 mb-4">
                    <div class="recurso-logo bg-indigo-50 dark:bg-indigo-900/20">
                        <span class="text-2xl">🌐</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            Meta AI
                        </h4>
                        <div class="flex gap-2 flex-wrap">
                            <span class="recurso-tag free">Gratuito</span>
                            <span class="recurso-tag" style="background: #e0e7ff; color: #4338ca;">Social</span>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Assistente de IA da Meta com integração nas redes sociais Facebook, Instagram e WhatsApp
                </p>
            </a>
        </div>
    `;

    recursosView.innerHTML = recursosHTML;
    recursosView.dataset.loaded = 'true';
}

// Load Apoio pages dynamically
async function loadApoioPage(pageName) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
        console.error('Content area not found');
        return;
    }

    // Hide all other views
    showView('content');

    try {
        const response = await fetch(`pages/apoio/${pageName}.html`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const html = await response.text();
        contentArea.innerHTML = html;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error(`Erro ao carregar página ${pageName}:`, error);
        contentArea.innerHTML = `
            <div class="p-8 text-center">
                <span class="material-symbols-outlined text-4xl text-red-500 mb-4 block">error</span>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Erro ao carregar página</h3>
                <p class="text-slate-600 dark:text-slate-400 mb-6">Não foi possível carregar o conteúdo de ${pageName}</p>
                <a href="#/dashboard" class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium inline-block">
                    Voltar ao Dashboard
                </a>
            </div>
        `;
    }
}

// Load Prompts pages (placeholders for now)
async function loadPromptsPage(pageName) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    // Hide all other views
    showView('content');

    const titles = {
        'especificar': 'Especificar Prompts',
        'validar': 'Validar Prompts'
    };

    const descriptions = {
        'especificar': 'Crie e especifique prompts personalizados para suas necessidades pedagógicas.',
        'validar': 'Valide e teste seus prompts para garantir a qualidade das respostas.'
    };

    contentArea.innerHTML = `
        <div class="p-8">
            <div class="mb-8">
                <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    ${titles[pageName] || 'Prompts'}
                </h2>
                <p class="text-lg text-slate-600 dark:text-slate-400">
                    ${descriptions[pageName] || 'Página em construção...'}
                </p>
            </div>
            
            <div class="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 text-center">
                <span class="material-symbols-outlined text-6xl text-primary mb-4 block animate-pulse">
                    construction
                </span>
                <p class="text-slate-600 dark:text-slate-400 mb-6">
                    Esta funcionalidade está em desenvolvimento e estará disponível em breve.
                </p>
                <div class="flex gap-4 justify-center">
                    <a href="#/dashboard" class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                        Voltar ao Dashboard
                    </a>
                    <a href="#/recursos" class="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium">
                        Ver Recursos
                    </a>
                </div>
            </div>
        </div>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load construindo page
async function loadConstruindoPage() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    // Hide all other views
    showView('content');

    try {
        const response = await fetch('pages/construindo.html');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const html = await response.text();
        contentArea.innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Erro ao carregar página construindo:', error);
        // Fallback inline
        contentArea.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[60vh] p-8">
                <span class="material-symbols-outlined text-8xl text-primary mb-8 animate-bounce">
                    construction
                </span>
                <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-4 text-center">
                    Página em Construção
                </h2>
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-8 text-center max-w-md">
                    Esta funcionalidade estará disponível em breve!
                </p>
                <a href="#/dashboard" class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2">
                    <span class="material-symbols-outlined">arrow_back</span>
                    Voltar ao Dashboard
                </a>
            </div>
        `;
    }
}

// Router setup
function setupRouter() {
    // Define routes
    router.defineRoute('/dashboard', () => {
        showView('dashboard');
        setActiveNav('/dashboard');
    });

    router.defineRoute('/', () => {
        showView('dashboard');
        setActiveNav('/dashboard');
    });

    router.defineRoute('/prompts', () => {
        showView('prompts');
        setActiveNav('/prompts');
    });

    router.defineRoute('/meus-prompts', () => {
        showView('my-prompts');
        setActiveNav('/meus-prompts');
    });

    router.defineRoute('/recursos', () => {
        showView('recursos');
        setActiveNav('/recursos');
    });

    router.defineRoute('/config', () => {
        showView('config');
        setActiveNav('/config');
    });

    // Apoio routes
    router.defineRoute('/apoio/contextualizar', () => {
        loadApoioPage('contextualizar');
        setActiveNav('/apoio/contextualizar');
    });

    router.defineRoute('/apoio/estruturar', () => {
        loadApoioPage('estruturar');
        setActiveNav('/apoio/estruturar');
    });

    router.defineRoute('/apoio/iterar', () => {
        loadApoioPage('iterar');
        setActiveNav('/apoio/iterar');
    });

    router.defineRoute('/apoio/referencias', () => {
        loadApoioPage('referencias');
        setActiveNav('/apoio/referencias');
    });

    // Prompts routes
    router.defineRoute('/prompts/especificar', () => {
        loadPromptsPage('especificar');
        setActiveNav('/prompts/especificar');
    });

    router.defineRoute('/prompts/validar', () => {
        loadPromptsPage('validar');
        setActiveNav('/prompts/validar');
    });

    // Construindo route
    router.defineRoute('/construindo', () => {
        loadConstruindoPage();
        setActiveNav('/construindo');
    });

    // Set after route change hook to close mobile menu, update header, and auto-expand groups
    router.setAfterRouteChange((route) => {
        closeMobileMenu();
        updatePageHeader(route);
        autoExpandGroup(route);
    });
}

// Navigation setup
function setupNavigation() {
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
        const navLink = e.target.closest('[data-route]');
        if (navLink) {
            e.preventDefault();
            const route = navLink.dataset.route;
            router.navigateTo(route);
        }
    });
}
