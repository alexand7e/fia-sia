import { initDarkMode } from './modules/ui/theme.js';
import { initMobileMenu, closeMobileMenu } from './modules/ui/mobileMenu.js';
import { mountSidebar } from './modules/ui/sidebar.js';
import { initSidebarNavigation, autoExpandGroup } from './modules/ui/sidebar-navigation.js';
import { initPromptCustomizers } from './modules/ui/promptCustomizer.js';
import { initEspecificarCustomizer } from './modules/ui/especificarCustomizer.js';
import { initExamplesSimulation } from './modules/ui/examples.js';
import { loadPrompts } from './modules/ui/promptsLibrary.js';
import { initMyPrompts, renderMyPrompts, addMyPrompt, promptIdentity, readMyPrompts } from './modules/ui/myPrompts.js';
import { loadStepContent } from './modules/ui/methodology.js';
import { copyWithFeedback } from './modules/utils/clipboard.js';
import router from './modules/router.js';
import llmClient from './modules/services/llm-client.js';
import teacherProfileHome from './modules/ui/teacherProfileHome.js';


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

    // Initialize LLM Client with reCAPTCHA configuration from server
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.recaptchaSiteKey) {
                llmClient.initRecaptcha(data.data.recaptchaSiteKey);
            } else {
                console.error('Failed to load reCAPTCHA configuration');
            }
        })
        .catch(error => console.error('Error loading config:', error));

    //Setup router
    setupRouter();

    // Initialize sidebar navigation (expandable groups)
    initSidebarNavigation();

    // Setup navigation click handlers
    setupNavigation();

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
    // Normalize route - treat both / and /dashboard as the same
    const normalizedRoute = (route === '/' || route === '/dashboard') ? '/dashboard' : route;

    // Map routes to tab names (optional helpers, but stricter logic relies on data-route mostly)
    const routeToTab = {
        '/dashboard': 'dashboard',
        '/prompts': 'prompts',
        '/meus-prompts': 'my-prompts',
        '/recursos': 'recursos',
        '/config': 'config',
        '/privacidade': 'privacidade',
        '/contato': 'contato',
        '/apoio/estruturar': 'apoio', // Example of grouping if needed
        '/apoio/iterar': 'apoio',
        '/apoio/referencias': 'apoio',
        '/prompts/especificar': 'prompts',
        '/prompts/validar': 'prompts'
    };

    const targetTab = routeToTab[normalizedRoute];

    const updateTab = (tab) => {
        const tabRoute = tab.dataset.route;
        const tabName = tab.dataset.tab;

        let isActive = false;

        // 1. Exact route match (Highest priority)
        if (tabRoute && tabRoute === normalizedRoute) {
            isActive = true;
        }
        // 2. Tab name match (if route maps to a tab)
        else if (targetTab && tabName && tabName === targetTab) {
            isActive = true;
        }
        // 3. Special case: Dashboard
        else if (normalizedRoute === '/dashboard' && (tabRoute === '/dashboard' || tabName === 'dashboard')) {
            isActive = true;
        }

        tab.classList.toggle('active', isActive);

        // Debug
        // if (isActive) console.log('Active tab:', tabRoute || tabName);
    };

    navTabs.forEach(updateTab);
    navTabsMobile.forEach(updateTab);
}

async function loadHomePage() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    // Check if already loaded
    if (contentArea.dataset.currentView === 'home') {
        contentArea.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('pages/home.html');
        if (!response.ok) throw new Error('Falha ao carregar home.');

        const html = await response.text();
        contentArea.innerHTML = html;
        contentArea.style.display = 'block';
        contentArea.dataset.currentView = 'home';

        // Re-initialize any dynamic components if needed (e.g. icons, event listeners)
        // For now, HTML structure handles existing interactions (details/summary)
    } catch (error) {
        console.error('Erro ao carregar Dashboard:', error);
        contentArea.innerHTML = '<p class="text-red-500 text-center p-8">Erro ao carregar o painel inicial.</p>';
        contentArea.style.display = 'block';
    }
}

function showView(viewName) {
    const dashboardView = document.getElementById('dashboard-view'); // Kept for legacy reference or fallback
    const myPromptsView = document.getElementById('my-prompts-view');
    const recursosView = document.getElementById('recursos-view');
    const contentArea = document.getElementById('content-area');

    // Hide all legacy views
    if (dashboardView) dashboardView.classList.add('hidden');
    myPromptsView?.classList.add('hidden');
    recursosView?.classList.add('hidden');

    // Default hiding content area unless it's a dynamic page
    if (contentArea) contentArea.style.display = 'none';

    // Show the requested view
    switch (viewName) {
        case 'dashboard':
            loadHomePage();
            break;
        case 'prompts':
            // Prompts feature is under construction
            if (contentArea) {
                contentArea.style.display = 'block';
                loadConstruindoPage();
            }
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
// Load Recursos Page
async function loadRecursosPage() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    if (typeof showView === 'function') {
        showView('content');
    }

    try {
        const response = await fetch('pages/recursos.html');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const html = await response.text();
        contentArea.innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Erro ao carregar Recursos:', error);
        contentArea.innerHTML = `
            <div class="p-8 text-center">
                <span class="material-symbols-outlined text-4xl text-red-500 mb-4 block">error</span>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Erro ao carregar Recursos</h3>
                <p class="text-slate-600 dark:text-slate-400">Não foi possível carregar a lista de recursos.</p>
            </div>
        `;
    }
}

// Load Privacidade Page
async function loadPrivacidadePage() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    if (typeof showView === 'function') {
        showView('content');
    }

    try {
        const response = await fetch('pages/privacidade.html');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const html = await response.text();
        contentArea.innerHTML = html;

        // Execute scripts inside the loaded HTML (e.g. for clearAllData)
        const scripts = contentArea.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Erro ao carregar Privacidade:', error);
        contentArea.innerHTML = `
             <div class="p-8 text-center">
                <span class="material-symbols-outlined text-4xl text-red-500 mb-4 block">error</span>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Erro ao carregar Política de Privacidade</h3>
                <p class="text-slate-600 dark:text-slate-400">Não foi possível carregar o conteúdo.</p>
            </div>
        `;
    }
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


// Load Dashboard/Home Page
async function loadDashboardPage() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    // Use common view logic to show content area and hide others
    // Assuming showView('content') or similar handles visibility of content-area vs others
    // If showView handles specific IDs, we might need to be careful.
    // Based on loadConstruindoPage, showView('content') is used.
    if (typeof showView === 'function') {
        showView('content');
    }

    try {
        const response = await fetch('pages/home.html');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const html = await response.text();
        contentArea.innerHTML = html;

        // Initialize teacher profile form
        setTimeout(() => {
            teacherProfileHome.init();
        }, 100);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Erro ao carregar Dashboard:', error);
        contentArea.innerHTML = `
            <div class="p-8 text-center">
                <span class="material-symbols-outlined text-4xl text-red-500 mb-4 block">error</span>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Erro ao carregar Dashboard</h3>
                <p class="text-slate-600 dark:text-slate-400">Não foi possível carregar o conteúdo inicial.</p>
            </div>
        `;
    }
}

// Load Prompts Pages (Especificar, Validar)
async function loadPromptsPage(pageType) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    // Hide all other views directly
    const dashboardView = document.getElementById('dashboard-view');
    const myPromptsView = document.getElementById('my-prompts-view');
    const recursosView = document.getElementById('recursos-view');

    if (dashboardView) dashboardView.classList.add('hidden');
    if (myPromptsView) myPromptsView.classList.add('hidden');
    if (recursosView) recursosView.classList.add('hidden');

    try {
        const response = await fetch(`pages/prompts/${pageType}.html`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const html = await response.text();
        contentArea.innerHTML = html;
        contentArea.style.display = 'block';

        // Initialize the customizer for especificar page
        if (pageType === 'especificar') {
            // Wait for DOM to be ready
            setTimeout(() => {
                initEspecificarCustomizer();
            }, 100);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error(`Erro ao carregar página ${pageType}:`, error);
        contentArea.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[60vh] p-8">
                <span class="material-symbols-outlined text-8xl text-red-500 mb-8">
                    error
                </span>
                <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-4 text-center">
                    Erro ao Carregar Página
                </h2>
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-8 text-center max-w-md">
                    Não foi possível carregar a página "${pageType}". Tente novamente mais tarde.
                </p>
                <a href="#/dashboard" class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2">
                    <span class="material-symbols-outlined">arrow_back</span>
                    Voltar ao Dashboard
                </a>
            </div>
        `;
        contentArea.style.display = 'block';
    }
}

/**
 * Hide teacher profile container (shown only on dashboard)
 */
function hideTeacherProfile() {
    const profileContainer = document.getElementById('teacher-profile-container');
    if (profileContainer) {
        profileContainer.classList.add('hidden');
    }
}

// Load Contato Page
async function loadContatoPage() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    if (typeof showView === 'function') {
        showView('content');
    }

    try {
        const response = await fetch('pages/contato.html');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const html = await response.text();
        contentArea.innerHTML = html;

        // Execute scripts inside the loaded HTML
        const scripts = contentArea.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Erro ao carregar Contato:', error);
        contentArea.innerHTML = `
             <div class="p-8 text-center">
                <span class="material-symbols-outlined text-4xl text-red-500 mb-4 block">error</span>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Erro ao carregar Página de Contato</h3>
                <p class="text-slate-600 dark:text-slate-400">Não foi possível carregar o formulário.</p>
            </div>
        `;
    }
}

// Router setup
function setupRouter() {
    // Define routes
    router.defineRoute('/dashboard', () => {
        loadDashboardPage();
        setActiveNav('/dashboard');
    });

    router.defineRoute('/', () => {
        loadDashboardPage();
        setActiveNav('/dashboard'); // Use /dashboard for consistency
    });

    router.defineRoute('/prompts', () => {
        hideTeacherProfile();
        showView('prompts');
        setActiveNav('/prompts');
    });

    router.defineRoute('/meus-prompts', () => {
        hideTeacherProfile();
        showView('my-prompts');
        setActiveNav('/meus-prompts');
    });

    router.defineRoute('/recursos', () => {
        // hideTeacherProfile is handled by loadRecursosPage switching view
        loadRecursosPage();
        setActiveNav('/recursos');
    });

    router.defineRoute('/privacidade', () => {
        loadPrivacidadePage();
        setActiveNav('/privacidade');
    });

    router.defineRoute('/contato', () => {
        loadContatoPage();
        setActiveNav('/contato');
    });

    router.defineRoute('/config', () => {
        loadPrivacidadePage();
        setActiveNav('/privacidade'); // Optional: if sidebar checks this
    });

    router.defineRoute('/config', () => {
        hideTeacherProfile();
        showView('config');
        setActiveNav('/config');
    });

    // Apoio routes
    router.defineRoute('/apoio/contextualizar', () => {
        hideTeacherProfile();
        loadApoioPage('contextualizar');
        setActiveNav('/apoio/contextualizar');
    });

    router.defineRoute('/apoio/estruturar', () => {
        hideTeacherProfile();
        loadApoioPage('estruturar');
        setActiveNav('/apoio/estruturar');
    });

    router.defineRoute('/apoio/iterar', () => {
        hideTeacherProfile();
        loadApoioPage('iterar');
        setActiveNav('/apoio/iterar');
    });

    router.defineRoute('/apoio/referencias', () => {
        hideTeacherProfile();
        loadApoioPage('referencias');
        setActiveNav('/apoio/referencias');
    });

    // Prompts routes
    router.defineRoute('/prompts/especificar', () => {
        hideTeacherProfile();
        loadPromptsPage('especificar');
        setActiveNav('/prompts/especificar');
    });

    router.defineRoute('/prompts/validar', () => {
        hideTeacherProfile();
        loadPromptsPage('validar');
        setActiveNav('/prompts/validar');
    });

    // Construindo route
    router.defineRoute('/construindo', () => {
        hideTeacherProfile();
        loadConstruindoPage();
        setActiveNav('/construindo');
    });

    // Set after route change hook to close mobile menu, update header, and auto-expand groups
    router.setAfterRouteChange((route) => {
        closeMobileMenu();
        updatePageHeader(route);
        autoExpandGroup(route);
        // Scroll to top on every route change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Force handle initial route
    router.handleRouteChange();
}

// Navigation setup
function setupNavigation() {
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
        // Ignore clicks on group toggles
        if (e.target.closest('.nav-group-toggle')) return;

        const navLink = e.target.closest('[data-route]');
        if (navLink) {
            if (navLink.tagName === 'BUTTON') return;
            e.preventDefault();
            e.stopPropagation();
            const route = navLink.dataset.route;
            if (route) router.navigateTo(route);
        }
    });
}
